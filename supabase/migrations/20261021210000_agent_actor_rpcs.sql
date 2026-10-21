/**
 * Purpose: service-role helpers for hosted agent calls that cannot use auth.uid().
 * Affects: public.create_agent_space, public.create_agent_pod, public.join_agent_space_with_invite,
 *          public.create_agent_fp_import, public.undo_agent_fp_import, public.delete_agent_all_fp_transactions.
 */

create function public.create_agent_space(p_actor uuid, p_name text, p_description text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_name text;
begin
  if p_actor is null then
    raise exception 'not allowed';
  end if;
  v_name := trim(p_name);
  if v_name is null or char_length(v_name) < 1 or char_length(v_name) > 80 then
    raise exception 'invalid name';
  end if;
  if p_description is not null and char_length(trim(p_description)) > 500 then
    raise exception 'invalid description';
  end if;
  insert into public.space (name, description)
  values (v_name, nullif(trim(p_description), ''))
  returning id into v_id;
  insert into public.space_member (space_id, user_id, role)
  values (v_id, p_actor, 'space_owner');
  return v_id;
end;
$$;

comment on function public.create_agent_space(uuid, text, text) is
  'service-role helper. creates a space owned by p_actor. the new space is not added to the API key.';

create function public.create_agent_pod(
  p_actor uuid,
  p_space_id uuid,
  p_feature text,
  p_name text,
  p_visibility text,
  p_description text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if not exists (
    select 1
    from public.space_member sm
    where sm.space_id = p_space_id
      and sm.user_id = p_actor
      and sm.role in ('space_owner', 'space_admin')
  ) then
    raise exception 'not allowed to create pod';
  end if;
  if p_feature not in ('todo_list', 'shopping_list', 'financial_planning') then
    raise exception 'invalid feature';
  end if;
  if p_visibility not in ('open', 'request', 'private') then
    raise exception 'invalid visibility';
  end if;
  if p_description is not null and char_length(trim(p_description)) > 500 then
    raise exception 'invalid description';
  end if;
  insert into public.pod (space_id, feature, name, visibility, description, created_by)
  values (
    p_space_id,
    p_feature,
    nullif(trim(p_name), ''),
    p_visibility,
    nullif(trim(p_description), ''),
    p_actor
  )
  returning id into v_id;
  insert into public.pod_member (pod_id, user_id, role)
  values (v_id, p_actor, 'pod_owner');
  return v_id;
end;
$$;

comment on function public.create_agent_pod(uuid, uuid, text, text, text, text) is
  'service-role helper. space admin creates a pod and becomes pod_owner. agent authz runs first.';

create function public.join_agent_space_with_invite(p_actor uuid, p_token text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite public.space_invite%rowtype;
  v_uses integer;
begin
  if p_actor is null then
    raise exception 'not allowed';
  end if;
  select * into v_invite
  from public.space_invite
  where token_hash = app_private.hash_invite_token(p_token)
  for update;
  if not found then
    raise exception 'invalid invite';
  end if;
  if v_invite.disabled_at is not null then
    raise exception 'invite disabled';
  end if;
  if v_invite.expires_at is not null and v_invite.expires_at <= now() then
    raise exception 'invite expired';
  end if;
  if exists (
    select 1
    from public.space_member sm
    where sm.space_id = v_invite.space_id
      and sm.user_id = p_actor
  ) then
    return v_invite.space_id;
  end if;
  select count(*)::integer into v_uses
  from public.space_invite_use
  where invite_id = v_invite.id;
  if v_uses >= v_invite.max_uses then
    raise exception 'invite already used';
  end if;
  insert into public.space_member (space_id, user_id, role)
  values (v_invite.space_id, p_actor, 'space_user');
  insert into public.space_invite_use (invite_id, space_id, user_id)
  values (v_invite.id, v_invite.space_id, p_actor);
  update public.space_invite
  set
    use_count = v_uses + 1,
    consumed_at = case when v_uses + 1 >= max_uses then now() else consumed_at end
  where id = v_invite.id;
  return v_invite.space_id;
end;
$$;

comment on function public.join_agent_space_with_invite(uuid, text) is
  'service-role helper. joins p_actor with the same rules as join_space_with_invite.';

create function public.create_agent_fp_import(
  p_actor uuid,
  p_pod_id uuid,
  p_parser_id uuid,
  p_account_id uuid,
  p_files jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_import_id uuid;
  v_file jsonb;
  v_file_id uuid;
  v_row jsonb;
  v_parsed int;
  v_created int;
  v_dup int;
  v_failed int;
  v_errors jsonb;
  v_date date;
  v_time time;
  v_amount numeric;
  v_desc text;
  v_recip text;
  v_ext text;
  v_notes text;
  v_idx int;
  v_file_line int;
begin
  if not exists (
    select 1 from public.fp_account a where a.id = p_account_id and a.pod_id = p_pod_id
  ) then
    raise exception 'account not in pod';
  end if;
  if p_parser_id is not null and not exists (
    select 1 from public.fp_parser p where p.id = p_parser_id and p.pod_id = p_pod_id
  ) then
    raise exception 'parser not in pod';
  end if;

  insert into public.fp_import (pod_id, parser_id, account_id, created_by)
  values (p_pod_id, p_parser_id, p_account_id, p_actor)
  returning id into v_import_id;

  for v_file in select * from jsonb_array_elements(p_files)
  loop
    v_parsed := coalesce((v_file ->> 'parsed')::int, 0);
    v_created := 0;
    v_dup := 0;
    v_errors := coalesce(v_file -> 'logs', '[]'::jsonb);
    if jsonb_typeof(v_errors) <> 'array' then
      v_errors := '[]'::jsonb;
    end if;
    select count(*)::int
    into v_failed
    from jsonb_array_elements(v_errors) e
    where e->>'kind' = 'parse';
    v_idx := 0;

    insert into public.fp_import_file (import_id, pod_id, file_name, content_sha256)
    values (
      v_import_id,
      p_pod_id,
      coalesce(v_file ->> 'file_name', 'file.csv'),
      coalesce(v_file ->> 'content_sha256', '')
    )
    returning id into v_file_id;

    for v_row in select * from jsonb_array_elements(coalesce(v_file -> 'rows', '[]'::jsonb))
    loop
      v_idx := coalesce(nullif(v_row ->> 'row_index', '')::int, v_idx + 1);
      v_file_line := nullif(v_row ->> 'file_line', '')::int;
      if v_parsed < v_idx then
        v_parsed := v_idx;
      end if;
      begin
        v_date := (v_row ->> 'posted_date')::date;
        v_time := nullif(v_row ->> 'posted_time', '')::time;
        v_amount := (v_row ->> 'amount')::numeric;
        v_desc := coalesce(v_row ->> 'description', '');
        v_recip := coalesce(v_row ->> 'recipient', '');
        v_ext := nullif(v_row ->> 'external_id', '');
        v_notes := coalesce(v_row ->> 'notes', '');
        if app_private.fp_is_duplicate(
          p_account_id, v_date, v_time, v_amount, v_desc, v_recip, v_ext, v_import_id
        ) then
          v_dup := v_dup + 1;
          v_errors := v_errors || jsonb_build_array(jsonb_strip_nulls(jsonb_build_object(
            'kind', 'duplicate',
            'rowIndex', v_idx,
            'fileLine', v_file_line,
            'message', 'Skipped: already exists on this account from a previous import or entry.'
          )));
        else
          insert into public.fp_transaction (
            pod_id, account_id, posted_date, posted_time, amount, description, recipient,
            notes, external_id, parser_id, import_id, created_by
          )
          values (
            p_pod_id, p_account_id, v_date, v_time, v_amount, v_desc, v_recip,
            v_notes, v_ext, p_parser_id, v_import_id, p_actor
          );
          v_created := v_created + 1;
        end if;
      exception
        when others then
          v_failed := v_failed + 1;
          v_errors := v_errors || jsonb_build_array(jsonb_strip_nulls(jsonb_build_object(
            'kind', 'error',
            'rowIndex', v_idx,
            'fileLine', v_file_line,
            'message', sqlerrm
          )));
      end;
    end loop;

    if v_parsed = 0 then
      v_parsed := v_created + v_dup + v_failed;
    end if;

    update public.fp_import_file
    set
      parsed = v_parsed,
      created_count = v_created,
      duplicate_skipped = v_dup,
      failed = v_failed,
      errors = v_errors
    where id = v_file_id;
  end loop;

  return v_import_id;
end;
$$;

comment on function public.create_agent_fp_import(uuid, uuid, uuid, uuid, jsonb) is
  'service-role helper. same import rules as create_fp_import, with an explicit actor. agent authz runs first.';

create function public.undo_agent_fp_import(p_pod_id uuid, p_import_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pod uuid;
begin
  select i.pod_id into v_pod
  from public.fp_import i
  where i.id = p_import_id;
  if v_pod is null or v_pod <> p_pod_id then
    raise exception 'import not found';
  end if;
  if exists (select 1 from public.fp_import i where i.id = p_import_id and i.undone_at is not null) then
    raise exception 'import already undone';
  end if;
  delete from public.fp_transaction c
  using public.fp_transaction p
  where c.parent_id = p.id
    and p.import_id = p_import_id;
  delete from public.fp_transaction
  where import_id = p_import_id;
  update public.fp_import
  set undone_at = now()
  where id = p_import_id;
end;
$$;

comment on function public.undo_agent_fp_import(uuid, uuid) is
  'service-role helper. undoes an import in the authorized pod.';

create function public.delete_agent_all_fp_transactions(p_pod_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.fp_transaction
  where pod_id = p_pod_id
    and parent_id is not null;
  delete from public.fp_transaction
  where pod_id = p_pod_id;
end;
$$;

comment on function public.delete_agent_all_fp_transactions(uuid) is
  'service-role helper. deletes every transaction in the pod. agent authz requires delete_all create.';

revoke all on function public.create_agent_space(uuid, text, text) from public, anon, authenticated;
revoke all on function public.create_agent_pod(uuid, uuid, text, text, text, text) from public, anon, authenticated;
revoke all on function public.join_agent_space_with_invite(uuid, text) from public, anon, authenticated;
revoke all on function public.create_agent_fp_import(uuid, uuid, uuid, uuid, jsonb) from public, anon, authenticated;
revoke all on function public.undo_agent_fp_import(uuid, uuid) from public, anon, authenticated;
revoke all on function public.delete_agent_all_fp_transactions(uuid) from public, anon, authenticated;

grant execute on function public.create_agent_space(uuid, text, text) to service_role;
grant execute on function public.create_agent_pod(uuid, uuid, text, text, text, text) to service_role;
grant execute on function public.join_agent_space_with_invite(uuid, text) to service_role;
grant execute on function public.create_agent_fp_import(uuid, uuid, uuid, uuid, jsonb) to service_role;
grant execute on function public.undo_agent_fp_import(uuid, uuid) to service_role;
grant execute on function public.delete_agent_all_fp_transactions(uuid) to service_role;
