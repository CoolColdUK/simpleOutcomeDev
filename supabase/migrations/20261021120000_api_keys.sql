/**
 * Purpose: space-scoped API keys for REST and hosted MCP.
 * Affects: public.api_key; create_api_key; revoke_api_key.
 */

create table public.api_key (
  id uuid not null default gen_random_uuid(),
  space_id uuid not null,
  owner_user_id uuid not null,
  name text not null,
  key_prefix text not null,
  secret_hash text not null,
  pod_ids uuid[] not null default '{}',
  permissions jsonb not null,
  status text not null default 'active',
  expires_at timestamp with time zone,
  last_used_at timestamp with time zone,
  revoked_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  constraint api_key_pkey primary key (id),
  constraint api_key_space_id_fkey foreign key (space_id) references public.space (id) on delete cascade,
  constraint api_key_owner_user_id_fkey foreign key (owner_user_id) references public.profile (id) on delete cascade,
  constraint api_key_name_not_blank check (char_length(trim(name)) > 0),
  constraint api_key_name_length_check check (char_length(name) <= 80),
  constraint api_key_prefix_unique unique (key_prefix),
  constraint api_key_prefix_format_check check (key_prefix ~ '^so_[0-9a-f]{24}$'),
  constraint api_key_secret_hash_format_check check (secret_hash ~ '^[0-9a-f]{64}$'),
  constraint api_key_status_check check (status in ('active', 'revoked')),
  constraint api_key_permissions_object_check check (jsonb_typeof(permissions) = 'object'),
  constraint api_key_permissions_size_check check (octet_length(permissions::text) <= 8000)
);

comment on table public.api_key is 'space-scoped API key. plaintext secret is returned once from create_api_key and only the sha256 hash is stored.';

create index api_key_owner_space_idx on public.api_key (owner_user_id, space_id);
create index api_key_space_id_idx on public.api_key (space_id);

alter table public.api_key enable row level security;

create policy api_key_select_owner on public.api_key
  for select to authenticated
  using (owner_user_id = (select auth.uid()));

create policy api_key_select_anon_denied on public.api_key
  for select to anon
  using (false);

revoke all on table public.api_key from public, anon, authenticated;
grant select (
  id,
  space_id,
  owner_user_id,
  name,
  key_prefix,
  pod_ids,
  permissions,
  status,
  expires_at,
  last_used_at,
  revoked_at,
  created_at
) on table public.api_key to authenticated;
grant all on table public.api_key to service_role;

create function public.create_api_key(
  p_space_id uuid,
  p_name text,
  p_pod_ids uuid[],
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
  v_pod_ids uuid[];
begin
  v_uid := (select auth.uid());
  if v_uid is null then
    raise exception 'not authenticated';
  end if;
  if not exists (
    select 1 from public.space_member sm
    where sm.space_id = p_space_id and sm.user_id = v_uid
  ) then
    raise exception 'not a space member';
  end if;
  v_name := trim(p_name);
  if v_name is null or char_length(v_name) < 1 or char_length(v_name) > 80 then
    raise exception 'name must be 1 to 80 characters';
  end if;
  if p_permissions is null or jsonb_typeof(p_permissions) <> 'object' or octet_length(p_permissions::text) > 8000 then
    raise exception 'invalid permissions';
  end if;
  select coalesce(array_agg(distinct pid), array[]::uuid[])
  into v_pod_ids
  from unnest(coalesce(p_pod_ids, array[]::uuid[])) as pid;
  if exists (
    select 1
    from unnest(v_pod_ids) as pid
    where not exists (
      select 1 from public.pod p
      where p.id = pid and p.space_id = p_space_id
    )
  ) then
    raise exception 'pod is not in this space';
  end if;
  v_prefix := 'so_' || encode(extensions.gen_random_bytes(12), 'hex');
  v_secret := v_prefix || '_' || encode(extensions.gen_random_bytes(24), 'hex');
  v_hash := encode(extensions.digest(convert_to(v_secret, 'UTF8'), 'sha256'), 'hex');
  insert into public.api_key (
    space_id,
    owner_user_id,
    name,
    key_prefix,
    secret_hash,
    pod_ids,
    permissions,
    expires_at
  ) values (
    p_space_id,
    v_uid,
    v_name,
    v_prefix,
    v_hash,
    v_pod_ids,
    p_permissions,
    p_expires_at
  )
  returning id into v_id;
  return jsonb_build_object('id', v_id, 'secret', v_secret, 'prefix', v_prefix);
end;
$$;

comment on function public.create_api_key(uuid, text, uuid[], jsonb, timestamp with time zone) is 'member creates a space-scoped API key. returns the plaintext secret once.';

create function public.revoke_api_key(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
begin
  v_uid := (select auth.uid());
  if v_uid is null then
    raise exception 'not authenticated';
  end if;
  update public.api_key
  set status = 'revoked',
      revoked_at = now()
  where id = p_id
    and owner_user_id = v_uid
    and status = 'active';
  if not found then
    raise exception 'api key not found';
  end if;
end;
$$;

comment on function public.revoke_api_key(uuid) is 'key owner revokes an active API key. later calls fail.';

revoke all on function public.create_api_key(uuid, text, uuid[], jsonb, timestamp with time zone) from public, anon;
grant execute on function public.create_api_key(uuid, text, uuid[], jsonb, timestamp with time zone) to authenticated;

revoke all on function public.revoke_api_key(uuid) from public, anon;
grant execute on function public.revoke_api_key(uuid) to authenticated;

create function public.create_agent_space_invite(
  p_space_id uuid,
  p_token text,
  p_max_uses integer,
  p_expires_at timestamp with time zone,
  p_created_by uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if p_token is null or p_token !~ '^[0-9a-f]{64}$' then
    raise exception 'invalid token';
  end if;
  if p_max_uses is null or p_max_uses < 1 or p_max_uses > 9999 then
    raise exception 'max uses must be between 1 and 9999';
  end if;
  if not exists (
    select 1 from public.space_member sm
    where sm.space_id = p_space_id and sm.user_id = p_created_by
  ) then
    raise exception 'not a space member';
  end if;
  insert into public.space_invite (space_id, token_hash, token_prefix, max_uses, expires_at, created_by)
  values (
    p_space_id,
    app_private.hash_invite_token(p_token),
    left(p_token, 8),
    p_max_uses,
    p_expires_at,
    p_created_by
  )
  returning id into v_id;
  return v_id;
end;
$$;

comment on function public.create_agent_space_invite(uuid, text, integer, timestamp with time zone, uuid) is 'service-role helper. stores an invite with the same token hash as create_space_invite. agent authz runs first.';

revoke all on function public.create_agent_space_invite(uuid, text, integer, timestamp with time zone, uuid) from public, anon, authenticated;
grant execute on function public.create_agent_space_invite(uuid, text, integer, timestamp with time zone, uuid) to service_role;
