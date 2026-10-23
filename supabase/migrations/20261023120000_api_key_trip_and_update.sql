/**
 * Purpose: accept trip_planning pod grants on API keys; allow owners to update name and permissions.
 * Affects: app_private.api_key_pod_grant_ok; public.update_api_key.
 */

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
  if p_feature not in ('todo_list', 'shopping_list', 'financial_planning', 'trip_planning') then
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
    if p_feature = 'trip_planning' and v_key <> 'trip' then
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
  if jsonb_exists(p_body, 'trip') and not app_private.api_key_action_list_ok(p_body->'trip') then
    return false;
  end if;
  return true;
end;
$$;

create function public.update_api_key(
  p_id uuid,
  p_name text,
  p_permissions jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_name text;
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
    where key not in ('profile', 'pods', 'spaces')
  ) then
    raise exception 'invalid permissions';
  end if;
  if jsonb_exists(p_permissions, 'profile') and not app_private.api_key_profile_ok(p_permissions->'profile') then
    raise exception 'invalid profile grant';
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
      from jsonb_each(p_permissions->'pods') as pod_grant(pod_id, body)
      join public.pod p on p.id = pod_grant.pod_id::uuid
      where not app_private.api_key_pod_grant_ok(p.feature, pod_grant.body)
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
      from jsonb_each(p_permissions->'spaces') as space_grant(space_id, body)
      where not app_private.api_key_space_grant_ok(space_grant.body)
    ) then
      raise exception 'invalid space grant';
    end if;
  end if;

  update public.api_key
  set name = v_name,
      permissions = p_permissions
  where id = p_id
    and owner_user_id = v_uid
    and status = 'active';
  if not found then
    raise exception 'api key not found';
  end if;
end;
$$;

comment on function public.update_api_key(uuid, text, jsonb) is 'key owner updates name and permissions on an active API key. secret is unchanged.';

revoke all on function public.update_api_key(uuid, text, jsonb) from public, anon;
grant execute on function public.update_api_key(uuid, text, jsonb) to authenticated;
