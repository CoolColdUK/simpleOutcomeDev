/**
 * Remove undeveloped shopping_list pod feature from catalog and API key validation.
 * Matthew confirmed no shopping_list pods exist in production.
 */

alter table public.pod drop constraint pod_feature_check;
alter table public.pod add constraint pod_feature_check
  check (feature in ('todo_list', 'financial_planning', 'trip_planning'));

create or replace function app_private.api_key_pod_grant_ok(p_feature text, p_body jsonb)
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
  if p_feature not in ('todo_list', 'financial_planning', 'trip_planning') then
    return false;
  end if;
  for v_key in
    select jsonb_object_keys(p_body)
  loop
    if p_feature = 'todo_list' and v_key <> 'todo' then
      return false;
    end if;
    if p_feature = 'financial_planning' and v_key <> 'fp' then
      return false;
    end if;
    if p_feature = 'trip_planning' and v_key <> 'trip' then
      return false;
    end if;
  end loop;
  if jsonb_exists(p_body, 'todo') and not app_private.api_key_action_list_ok(p_body->'todo') then
    return false;
  end if;
  if jsonb_exists(p_body, 'fp') and not app_private.api_key_fp_grant_ok(p_body->'fp') then
    return false;
  end if;
  if jsonb_exists(p_body, 'trip') and not app_private.api_key_action_list_ok(p_body->'trip') then
    return false;
  end if;
  return true;
end;
$$;

drop function if exists public.create_pod(uuid, text, text, text, text);

create function public.create_pod(
  p_space_id uuid,
  p_feature text,
  p_name text,
  p_visibility text,
  p_description text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_uid uuid;
begin
  v_uid := (select auth.uid());
  if not app_private.is_space_admin_or_owner(p_space_id) then
    raise exception 'not allowed to create pod';
  end if;
  if p_feature not in ('todo_list', 'financial_planning', 'trip_planning') then
    raise exception 'invalid feature';
  end if;
  if p_visibility not in ('open', 'request', 'private') then
    raise exception 'invalid visibility';
  end if;
  insert into public.pod (space_id, feature, name, visibility, description, created_by)
  values (
    p_space_id,
    p_feature,
    nullif(trim(p_name), ''),
    p_visibility,
    nullif(trim(p_description), ''),
    v_uid
  )
  returning id into v_id;
  insert into public.pod_member (pod_id, user_id, role)
  values (v_id, v_uid, 'pod_owner');
  return v_id;
end;
$$;

grant execute on function public.create_pod(uuid, text, text, text, text) to authenticated;
revoke execute on function public.create_pod(uuid, text, text, text, text) from anon, public;

create or replace function public.create_agent_pod(
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
  if p_feature not in ('todo_list', 'financial_planning', 'trip_planning') then
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
