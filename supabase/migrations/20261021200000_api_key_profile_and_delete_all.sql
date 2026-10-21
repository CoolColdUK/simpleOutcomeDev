/**
 * Purpose: allow profile grants and fp delete_all create on user-scoped API keys.
 * Affects: app_private.api_key_fp_grant_ok, app_private.api_key_profile_ok, public.create_api_key.
 */

create or replace function app_private.api_key_fp_grant_ok(p_value jsonb)
returns boolean
language plpgsql
immutable
as $$
declare
  v_resource text;
  v_actions jsonb;
  v_action text;
begin
  if p_value is null or jsonb_typeof(p_value) <> 'object' then
    return false;
  end if;
  for v_resource, v_actions in
    select key, value from jsonb_each(p_value)
  loop
    if v_resource not in ('account', 'category', 'transaction', 'parser', 'import', 'bill_split', 'settings', 'delete_all') then
      return false;
    end if;
    if not app_private.api_key_action_list_ok(v_actions) then
      return false;
    end if;
    if v_resource = 'delete_all' then
      for v_action in
        select value from jsonb_array_elements_text(v_actions)
      loop
        if v_action <> 'create' then
          return false;
        end if;
      end loop;
    end if;
  end loop;
  return true;
end;
$$;

create function app_private.api_key_profile_ok(p_value jsonb)
returns boolean
language plpgsql
immutable
as $$
declare
  v_action text;
begin
  if p_value is null or jsonb_typeof(p_value) <> 'array' then
    return false;
  end if;
  if not app_private.api_key_action_list_ok(p_value) then
    return false;
  end if;
  for v_action in
    select value from jsonb_array_elements_text(p_value)
  loop
    if v_action not in ('read', 'update') then
      return false;
    end if;
  end loop;
  return true;
end;
$$;

revoke all on function app_private.api_key_profile_ok(jsonb) from public, anon, authenticated;

create or replace function public.create_api_key(
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
