/**
 * Purpose: store the API key secret for owner reveal, and record scoped vs full access.
 * Affects: public.api_key; public.create_api_key; public.update_api_key.
 */

alter table public.api_key
  add column kind text not null default 'scoped',
  add column secret text;

alter table public.api_key
  add constraint api_key_kind_check check (kind in ('scoped', 'full')),
  add constraint api_key_secret_format_check check (secret is null or secret ~ '^so_[0-9a-f]{24}_[0-9a-f]{48}$');

comment on column public.api_key.kind is 'scoped uses the stored permission matrix. full grants every action the owner role allows, including resources added later.';
comment on column public.api_key.secret is 'plaintext secret so the owner can reveal it in settings. sha256 remains in secret_hash for authentication.';

grant select (kind, secret) on table public.api_key to authenticated;

create function app_private.assert_api_key_permissions(p_permissions jsonb)
returns void
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_uuid_pattern text := '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$';
begin
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
end;
$$;

revoke all on function app_private.assert_api_key_permissions(jsonb) from public, anon, authenticated;

drop function public.create_api_key(text, jsonb, timestamp with time zone);

create function public.create_api_key(
  p_name text,
  p_permissions jsonb,
  p_expires_at timestamp with time zone default null,
  p_kind text default 'scoped'
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
  v_permissions jsonb;
begin
  v_uid := (select auth.uid());
  if v_uid is null then
    raise exception 'not authenticated';
  end if;
  v_name := trim(p_name);
  if v_name is null or char_length(v_name) < 1 or char_length(v_name) > 80 then
    raise exception 'name must be 1 to 80 characters';
  end if;
  if p_kind is null or p_kind not in ('scoped', 'full') then
    raise exception 'invalid api key kind';
  end if;
  if p_kind = 'full' then
    v_permissions := '{}'::jsonb;
  else
    perform app_private.assert_api_key_permissions(p_permissions);
    v_permissions := p_permissions;
  end if;

  v_prefix := 'so_' || encode(extensions.gen_random_bytes(12), 'hex');
  v_secret := v_prefix || '_' || encode(extensions.gen_random_bytes(24), 'hex');
  v_hash := encode(extensions.digest(convert_to(v_secret, 'UTF8'), 'sha256'), 'hex');
  insert into public.api_key (
    owner_user_id,
    name,
    key_prefix,
    secret_hash,
    secret,
    permissions,
    kind,
    expires_at
  ) values (
    v_uid,
    v_name,
    v_prefix,
    v_hash,
    v_secret,
    v_permissions,
    p_kind,
    p_expires_at
  )
  returning id into v_id;
  return jsonb_build_object('id', v_id, 'secret', v_secret, 'prefix', v_prefix);
end;
$$;

comment on function public.create_api_key(text, jsonb, timestamp with time zone, text) is 'owner creates a user-scoped API key. stores the secret so the owner can reveal it later. full keys follow the owner role, including access gained later.';

revoke all on function public.create_api_key(text, jsonb, timestamp with time zone, text) from public, anon;
grant execute on function public.create_api_key(text, jsonb, timestamp with time zone, text) to authenticated;

drop function public.update_api_key(uuid, text, jsonb);

create function public.update_api_key(
  p_id uuid,
  p_name text,
  p_permissions jsonb,
  p_kind text default 'scoped'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_name text;
  v_permissions jsonb;
begin
  v_uid := (select auth.uid());
  if v_uid is null then
    raise exception 'not authenticated';
  end if;
  v_name := trim(p_name);
  if v_name is null or char_length(v_name) < 1 or char_length(v_name) > 80 then
    raise exception 'name must be 1 to 80 characters';
  end if;
  if p_kind is null or p_kind not in ('scoped', 'full') then
    raise exception 'invalid api key kind';
  end if;
  if p_kind = 'full' then
    v_permissions := '{}'::jsonb;
  else
    perform app_private.assert_api_key_permissions(p_permissions);
    v_permissions := p_permissions;
  end if;

  update public.api_key
  set name = v_name,
      permissions = v_permissions,
      kind = p_kind
  where id = p_id
    and owner_user_id = v_uid
    and status = 'active';
  if not found then
    raise exception 'api key not found';
  end if;
end;
$$;

comment on function public.update_api_key(uuid, text, jsonb, text) is 'key owner updates name, kind, and permissions on an active API key. secret is unchanged. full keys store an empty matrix.';

revoke all on function public.update_api_key(uuid, text, jsonb, text) from public, anon;
grant execute on function public.update_api_key(uuid, text, jsonb, text) to authenticated;
