/**
 * Purpose: user-scoped API keys. Revoke active first-slice keys and drop space scope.
 * Affects: public.api_key; create_api_key.
 */

update public.api_key
set status = 'revoked',
    revoked_at = coalesce(revoked_at, now())
where status = 'active';

drop function public.create_api_key(uuid, text, uuid[], jsonb, timestamp with time zone);

drop index if exists public.api_key_owner_space_idx;
drop index if exists public.api_key_space_id_idx;

alter table public.api_key
  drop constraint api_key_space_id_fkey,
  drop column space_id,
  drop column pod_ids;

create index api_key_owner_user_id_idx on public.api_key (owner_user_id);

comment on table public.api_key is 'user-scoped API key. plaintext secret is returned once from create_api_key and only the sha256 hash is stored.';

revoke all on table public.api_key from public, anon, authenticated;
grant select (
  id,
  owner_user_id,
  name,
  key_prefix,
  permissions,
  status,
  expires_at,
  last_used_at,
  revoked_at,
  created_at
) on table public.api_key to authenticated;
grant all on table public.api_key to service_role;

create function app_private.api_key_action_list_ok(p_value jsonb)
returns boolean
language plpgsql
immutable
as $$
begin
  if p_value is null or jsonb_typeof(p_value) <> 'array' then
    return false;
  end if;
  return not exists (
    select 1
    from jsonb_array_elements_text(p_value) as action
    where action not in ('create', 'read', 'update', 'delete')
  );
end;
$$;

create function app_private.api_key_fp_grant_ok(p_value jsonb)
returns boolean
language plpgsql
immutable
as $$
declare
  v_resource text;
  v_actions jsonb;
begin
  if p_value is null or jsonb_typeof(p_value) <> 'object' then
    return false;
  end if;
  for v_resource, v_actions in
    select key, value from jsonb_each(p_value)
  loop
    if v_resource not in ('account', 'category', 'transaction', 'parser', 'import', 'bill_split', 'settings') then
      return false;
    end if;
    if not app_private.api_key_action_list_ok(v_actions) then
      return false;
    end if;
  end loop;
  return true;
end;
$$;

create function app_private.api_key_pod_grant_ok(p_feature text, p_body jsonb)
returns boolean
language plpgsql
immutable
as $$
declare
  v_key text;
begin
  if p_body is null or jsonb_typeof(p_body) <> 'object' then
    return false;
  end if;
  if p_feature not in ('todo_list', 'shopping_list', 'financial_planning') then
    return false;
  end if;
  for v_key in
    select jsonb_object_keys(p_body)
  loop
    if p_feature = 'todo_list' and v_key <> 'todo' then
      return false;
    end if;
    if p_feature = 'shopping_list' and v_key <> 'shopping' then
      return false;
    end if;
    if p_feature = 'financial_planning' and v_key <> 'fp' then
      return false;
    end if;
  end loop;
  if jsonb_exists(p_body, 'todo') and not app_private.api_key_action_list_ok(p_body->'todo') then
    return false;
  end if;
  if jsonb_exists(p_body, 'shopping') and not app_private.api_key_action_list_ok(p_body->'shopping') then
    return false;
  end if;
  if jsonb_exists(p_body, 'fp') and not app_private.api_key_fp_grant_ok(p_body->'fp') then
    return false;
  end if;
  return true;
end;
$$;

create function app_private.api_key_space_grant_ok(p_body jsonb)
returns boolean
language plpgsql
immutable
as $$
declare
  v_key text;
begin
  if p_body is null or jsonb_typeof(p_body) <> 'object' then
    return false;
  end if;
  for v_key in
    select jsonb_object_keys(p_body)
  loop
    if v_key not in ('space', 'group') then
      return false;
    end if;
  end loop;
  if jsonb_exists(p_body, 'space') and not app_private.api_key_action_list_ok(p_body->'space') then
    return false;
  end if;
  if jsonb_exists(p_body, 'group') and not app_private.api_key_action_list_ok(p_body->'group') then
    return false;
  end if;
  return true;
end;
$$;

create function app_private.caller_can_grant_api_pod(p_pod_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.pod p
    join public.space_member sm
      on sm.space_id = p.space_id
     and sm.user_id = (select auth.uid())
    where p.id = p_pod_id
      and p.status = 'active'
      and (
        sm.role = 'space_owner'
        or exists (
          select 1
          from public.pod_member pm
          where pm.pod_id = p.id
            and pm.user_id = (select auth.uid())
        )
      )
  );
$$;

revoke all on function app_private.api_key_action_list_ok(jsonb) from public, anon, authenticated;
revoke all on function app_private.api_key_fp_grant_ok(jsonb) from public, anon, authenticated;
revoke all on function app_private.api_key_pod_grant_ok(text, jsonb) from public, anon, authenticated;
revoke all on function app_private.api_key_space_grant_ok(jsonb) from public, anon, authenticated;
revoke all on function app_private.caller_can_grant_api_pod(uuid) from public, anon, authenticated;

create function public.create_api_key(
  p_name text,
  p_permissions jsonb,
  p_expires_at timestamp with time zone default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_name text;
  v_prefix text;
  v_secret text;
  v_hash text;
  v_id uuid;
  v_uuid_pattern text := '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$';
begin
  v_uid := (select auth.uid());
  if v_uid is null then
    raise exception 'not authenticated';
  end if;
  v_name := trim(p_name);
  if v_name is null or char_length(v_name) < 1 or char_length(v_name) > 80 then
    raise exception 'name must be 1 to 80 characters';
  end if;
  if p_permissions is null or jsonb_typeof(p_permissions) <> 'object' or octet_length(p_permissions::text) > 8000 then
    raise exception 'invalid permissions';
  end if;
  if exists (
    select 1
    from jsonb_object_keys(p_permissions) as key
    where key not in ('pods', 'spaces')
  ) then
    raise exception 'invalid permissions';
  end if;

  if jsonb_exists(p_permissions, 'pods') then
    if jsonb_typeof(p_permissions->'pods') <> 'object' then
      raise exception 'invalid per-pod grant';
    end if;
    if exists (
      select 1
      from jsonb_object_keys(p_permissions->'pods') as pod_id
      where pod_id !~* v_uuid_pattern
    ) then
      raise exception 'pod grant id is not a uuid';
    end if;
    if exists (
      select 1
      from jsonb_object_keys(p_permissions->'pods') as pod_id
      where not app_private.caller_can_grant_api_pod(pod_id::uuid)
    ) then
      raise exception 'pod is not accessible';
    end if;
    if exists (
      select 1
      from jsonb_each(p_permissions->'pods') as grant(pod_id, body)
      join public.pod p on p.id = grant.pod_id::uuid
      where not app_private.api_key_pod_grant_ok(p.feature, grant.body)
    ) then
      raise exception 'invalid per-pod grant';
    end if;
  end if;

  if jsonb_exists(p_permissions, 'spaces') then
    if jsonb_typeof(p_permissions->'spaces') <> 'object' then
      raise exception 'invalid space grant';
    end if;
    if exists (
      select 1
      from jsonb_object_keys(p_permissions->'spaces') as space_id
      where space_id !~* v_uuid_pattern
    ) then
      raise exception 'space grant id is not a uuid';
    end if;
    if exists (
      select 1
      from jsonb_object_keys(p_permissions->'spaces') as space_id
      where not app_private.is_space_member(space_id::uuid)
    ) then
      raise exception 'space is not accessible';
    end if;
    if exists (
      select 1
      from jsonb_each(p_permissions->'spaces') as grant(space_id, body)
      where not app_private.api_key_space_grant_ok(grant.body)
    ) then
      raise exception 'invalid space grant';
    end if;
  end if;

  v_prefix := 'so_' || encode(extensions.gen_random_bytes(12), 'hex');
  v_secret := v_prefix || '_' || encode(extensions.gen_random_bytes(24), 'hex');
  v_hash := encode(extensions.digest(convert_to(v_secret, 'UTF8'), 'sha256'), 'hex');
  insert into public.api_key (
    owner_user_id,
    name,
    key_prefix,
    secret_hash,
    permissions,
    expires_at
  ) values (
    v_uid,
    v_name,
    v_prefix,
    v_hash,
    p_permissions,
    p_expires_at
  )
  returning id into v_id;
  return jsonb_build_object('id', v_id, 'secret', v_secret, 'prefix', v_prefix);
end;
$$;

comment on function public.create_api_key(text, jsonb, timestamp with time zone) is 'owner creates a user-scoped API key. returns the plaintext secret once. active first-slice keys are revoked by this migration.';

revoke all on function public.create_api_key(text, jsonb, timestamp with time zone) from public, anon;
grant execute on function public.create_api_key(text, jsonb, timestamp with time zone) to authenticated;
