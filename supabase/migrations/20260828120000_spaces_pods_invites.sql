/**
 * Purpose: profiles, spaces, invites, pods, membership, join requests, RLS, and RPCs.
 * Affects: new schema app_private; public profile, space, space_member, space_invite, pod, pod_member, pod_join_request.
 */

create extension if not exists pgcrypto with schema extensions;

create schema if not exists app_private;

revoke all on schema app_private from public;
revoke all on schema app_private from anon;
revoke all on schema app_private from authenticated;

grant usage on schema app_private to postgres, service_role;

-- ---------------------------------------------------------------------------
-- tables
-- ---------------------------------------------------------------------------

create table public.profile (
  id uuid not null,
  username text,
  username_normalized text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint profile_pkey primary key (id),
  constraint profile_id_fkey foreign key (id) references auth.users (id) on delete cascade,
  constraint profile_username_format_check check (
    username is null
    or username ~ '^[A-Za-z0-9_]{3,24}$'
  ),
  constraint profile_username_normalized_matches_check check (
    username_normalized is not distinct from lower(username)
  ),
  constraint profile_username_normalized_unique unique (username_normalized)
);

comment on table public.profile is 'user profile; unique username handle when set.';

create table public.space (
  id uuid not null default gen_random_uuid(),
  name text not null,
  created_at timestamp with time zone not null default now(),
  constraint space_pkey primary key (id),
  constraint space_name_not_blank check (char_length(trim(name)) > 0)
);

comment on table public.space is 'group of users; default name My space.';

create table public.space_member (
  space_id uuid not null,
  user_id uuid not null,
  role text not null,
  created_at timestamp with time zone not null default now(),
  constraint space_member_pkey primary key (space_id, user_id),
  constraint space_member_space_id_fkey foreign key (space_id) references public.space (id) on delete cascade,
  constraint space_member_user_id_fkey foreign key (user_id) references public.profile (id) on delete cascade,
  constraint space_member_role_check check (role in ('space_owner', 'space_admin', 'space_user'))
);

create index space_member_user_id_idx on public.space_member (user_id);

create table public.space_invite (
  id uuid not null default gen_random_uuid(),
  space_id uuid not null,
  token_hash bytea not null,
  mode text not null,
  expires_at timestamp with time zone,
  created_by uuid not null,
  created_at timestamp with time zone not null default now(),
  disabled_at timestamp with time zone,
  consumed_at timestamp with time zone,
  constraint space_invite_pkey primary key (id),
  constraint space_invite_space_id_fkey foreign key (space_id) references public.space (id) on delete cascade,
  constraint space_invite_created_by_fkey foreign key (created_by) references public.profile (id),
  constraint space_invite_token_hash_unique unique (token_hash),
  constraint space_invite_mode_check check (mode in ('single_use', 'permanent'))
);

create index space_invite_space_id_idx on public.space_invite (space_id);

create table public.pod (
  id uuid not null default gen_random_uuid(),
  space_id uuid not null,
  feature text not null,
  name text,
  visibility text not null,
  status text not null default 'active',
  created_by uuid not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint pod_pkey primary key (id),
  constraint pod_space_id_fkey foreign key (space_id) references public.space (id) on delete cascade,
  constraint pod_created_by_fkey foreign key (created_by) references public.profile (id),
  constraint pod_feature_check check (feature in ('todo_list', 'shopping_list')),
  constraint pod_visibility_check check (visibility in ('open', 'request', 'private')),
  constraint pod_status_check check (status in ('active', 'archived'))
);

create index pod_space_id_idx on public.pod (space_id);

create table public.pod_member (
  pod_id uuid not null,
  user_id uuid not null,
  role text not null,
  created_at timestamp with time zone not null default now(),
  constraint pod_member_pkey primary key (pod_id, user_id),
  constraint pod_member_pod_id_fkey foreign key (pod_id) references public.pod (id) on delete cascade,
  constraint pod_member_user_id_fkey foreign key (user_id) references public.profile (id) on delete cascade,
  constraint pod_member_role_check check (role in ('pod_owner', 'pod_admin', 'pod_user'))
);

create index pod_member_user_id_idx on public.pod_member (user_id);

create table public.pod_join_request (
  id uuid not null default gen_random_uuid(),
  pod_id uuid not null,
  user_id uuid not null,
  status text not null default 'pending',
  created_at timestamp with time zone not null default now(),
  resolved_at timestamp with time zone,
  constraint pod_join_request_pkey primary key (id),
  constraint pod_join_request_pod_id_fkey foreign key (pod_id) references public.pod (id) on delete cascade,
  constraint pod_join_request_user_id_fkey foreign key (user_id) references public.profile (id) on delete cascade,
  constraint pod_join_request_status_check check (status in ('pending', 'approved', 'denied')),
  constraint pod_join_request_pending_unique unique (pod_id, user_id)
);

create index pod_join_request_pod_id_idx on public.pod_join_request (pod_id);

-- ---------------------------------------------------------------------------
-- private helpers
-- ---------------------------------------------------------------------------

create or replace function app_private.hash_invite_token(p_token text)
returns bytea
language sql
immutable
as $$
  select extensions.digest(convert_to(p_token, 'UTF8'), 'sha256');
$$;

create or replace function app_private.is_space_member(p_space_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.space_member sm
    where sm.space_id = p_space_id
      and sm.user_id = (select auth.uid())
  );
$$;

create or replace function app_private.space_role(p_space_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select sm.role
  from public.space_member sm
  where sm.space_id = p_space_id
    and sm.user_id = (select auth.uid());
$$;

create or replace function app_private.is_space_owner(p_space_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select app_private.space_role(p_space_id) = 'space_owner';
$$;

create or replace function app_private.is_space_admin_or_owner(p_space_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select app_private.space_role(p_space_id) in ('space_owner', 'space_admin');
$$;

create or replace function app_private.pod_role(p_pod_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select pm.role
  from public.pod_member pm
  where pm.pod_id = p_pod_id
    and pm.user_id = (select auth.uid());
$$;

create or replace function app_private.is_pod_owner(p_pod_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select app_private.pod_role(p_pod_id) = 'pod_owner';
$$;

create or replace function app_private.is_pod_owner_or_admin(p_pod_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select app_private.pod_role(p_pod_id) in ('pod_owner', 'pod_admin');
$$;

create or replace function app_private.is_pod_member(p_pod_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.pod_member pm
    where pm.pod_id = p_pod_id
      and pm.user_id = (select auth.uid())
  );
$$;

create or replace function app_private.pod_space_id(p_pod_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select p.space_id from public.pod p where p.id = p_pod_id;
$$;

create or replace function app_private.can_manage_pod(p_pod_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select app_private.is_pod_owner(p_pod_id)
    or app_private.is_space_owner(app_private.pod_space_id(p_pod_id));
$$;

create or replace function app_private.can_approve_pod_join(p_pod_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select app_private.is_pod_owner_or_admin(p_pod_id)
    or app_private.is_space_owner(app_private.pod_space_id(p_pod_id));
$$;

create or replace function app_private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_space_id uuid;
begin
  insert into public.profile (id) values (new.id);
  insert into public.space (name) values ('My space') returning id into v_space_id;
  insert into public.space_member (space_id, user_id, role)
  values (v_space_id, new.id, 'space_owner');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function app_private.handle_new_user();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.profile enable row level security;
alter table public.space enable row level security;
alter table public.space_member enable row level security;
alter table public.space_invite enable row level security;
alter table public.pod enable row level security;
alter table public.pod_member enable row level security;
alter table public.pod_join_request enable row level security;

create policy profile_select_authenticated on public.profile
  for select to authenticated
  using (
    id = (select auth.uid())
    or exists (
      select 1
      from public.space_member mine
      join public.space_member theirs on theirs.space_id = mine.space_id
      where mine.user_id = (select auth.uid())
        and theirs.user_id = profile.id
    )
  );

create policy profile_select_anon_denied on public.profile
  for select to anon using (false);

create policy space_select_authenticated on public.space
  for select to authenticated
  using (app_private.is_space_member(id));

create policy space_member_select_authenticated on public.space_member
  for select to authenticated
  using (app_private.is_space_member(space_id));

create policy space_invite_select_authenticated on public.space_invite
  for select to authenticated
  using (app_private.is_space_owner(space_id));

create policy pod_select_authenticated on public.pod
  for select to authenticated
  using (
    (
      status = 'active'
      and (
        app_private.is_space_owner(space_id)
        or app_private.is_pod_member(id)
        or (
          visibility in ('open', 'request')
          and app_private.is_space_member(space_id)
        )
      )
    )
    or (
      status = 'archived'
      and (
        app_private.is_space_owner(space_id)
        or app_private.is_pod_owner(id)
      )
    )
  );

create policy pod_member_select_authenticated on public.pod_member
  for select to authenticated
  using (
    app_private.is_pod_member(pod_id)
    or app_private.is_space_owner(app_private.pod_space_id(pod_id))
    or app_private.is_pod_owner_or_admin(pod_id)
  );

create policy pod_join_request_select_authenticated on public.pod_join_request
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or app_private.can_approve_pod_join(pod_id)
  );

-- writes go through RPCs (no insert/update/delete policies for authenticated)

-- ---------------------------------------------------------------------------
-- RPCs
-- ---------------------------------------------------------------------------

create or replace function public.create_space(p_name text)
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
  if v_uid is null then
    raise exception 'not authenticated';
  end if;
  insert into public.space (name) values (trim(p_name)) returning id into v_id;
  insert into public.space_member (space_id, user_id, role)
  values (v_id, v_uid, 'space_owner');
  return v_id;
end;
$$;

create or replace function public.update_profile_username(p_username text)
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
  update public.profile
  set
    username = p_username,
    username_normalized = lower(p_username),
    updated_at = now()
  where id = v_uid;
end;
$$;

create or replace function public.update_space_member_role(p_space_id uuid, p_user_id uuid, p_role text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not app_private.is_space_owner(p_space_id) then
    raise exception 'not space owner';
  end if;
  if p_role not in ('space_admin', 'space_user') then
    raise exception 'invalid role';
  end if;
  if p_user_id = (select auth.uid()) then
    raise exception 'cannot change own space role';
  end if;
  update public.space_member
  set role = p_role
  where space_id = p_space_id
    and user_id = p_user_id
    and role <> 'space_owner';
  if not found then
    raise exception 'member not found or is space owner';
  end if;
end;
$$;

create or replace function public.create_space_invite(p_space_id uuid, p_mode text, p_expires_at timestamp with time zone)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_token text;
begin
  if not app_private.is_space_owner(p_space_id) then
    raise exception 'not space owner';
  end if;
  if p_mode not in ('single_use', 'permanent') then
    raise exception 'invalid mode';
  end if;
  v_token := encode(extensions.gen_random_bytes(32), 'hex');
  insert into public.space_invite (space_id, token_hash, mode, expires_at, created_by)
  values (
    p_space_id,
    app_private.hash_invite_token(v_token),
    p_mode,
    p_expires_at,
    (select auth.uid())
  );
  return v_token;
end;
$$;

create or replace function public.disable_space_invite(p_invite_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_space_id uuid;
begin
  select space_id into v_space_id from public.space_invite where id = p_invite_id;
  if v_space_id is null then
    raise exception 'invite not found';
  end if;
  if not app_private.is_space_owner(v_space_id) then
    raise exception 'not space owner';
  end if;
  update public.space_invite
  set disabled_at = now()
  where id = p_invite_id
    and disabled_at is null;
end;
$$;

create or replace function public.delete_space_invite(p_invite_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_space_id uuid;
begin
  select space_id into v_space_id from public.space_invite where id = p_invite_id;
  if v_space_id is null then
    raise exception 'invite not found';
  end if;
  if not app_private.is_space_owner(v_space_id) then
    raise exception 'not space owner';
  end if;
  delete from public.space_invite where id = p_invite_id;
end;
$$;

create or replace function public.join_space_with_invite(p_token text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite public.space_invite%rowtype;
  v_uid uuid;
begin
  v_uid := (select auth.uid());
  if v_uid is null then
    raise exception 'not authenticated';
  end if;
  select * into v_invite
  from public.space_invite
  where token_hash = app_private.hash_invite_token(p_token);
  if not found then
    raise exception 'invalid invite';
  end if;
  if v_invite.disabled_at is not null then
    raise exception 'invite disabled';
  end if;
  if v_invite.expires_at is not null and v_invite.expires_at <= now() then
    raise exception 'invite expired';
  end if;
  if v_invite.mode = 'single_use' and v_invite.consumed_at is not null then
    raise exception 'invite already used';
  end if;
  insert into public.space_member (space_id, user_id, role)
  values (v_invite.space_id, v_uid, 'space_user')
  on conflict (space_id, user_id) do nothing;
  if v_invite.mode = 'single_use' then
    update public.space_invite
    set consumed_at = now()
    where id = v_invite.id
      and consumed_at is null;
  end if;
  return v_invite.space_id;
end;
$$;

create or replace function public.create_pod(p_space_id uuid, p_feature text, p_name text, p_visibility text)
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
  if p_feature not in ('todo_list', 'shopping_list') then
    raise exception 'invalid feature';
  end if;
  if p_visibility not in ('open', 'request', 'private') then
    raise exception 'invalid visibility';
  end if;
  insert into public.pod (space_id, feature, name, visibility, created_by)
  values (p_space_id, p_feature, nullif(trim(p_name), ''), p_visibility, v_uid)
  returning id into v_id;
  insert into public.pod_member (pod_id, user_id, role)
  values (v_id, v_uid, 'pod_owner');
  return v_id;
end;
$$;

create or replace function public.update_pod(
  p_pod_id uuid,
  p_name text,
  p_visibility text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not app_private.can_manage_pod(p_pod_id) then
    raise exception 'not allowed to update pod';
  end if;
  if p_visibility not in ('open', 'request', 'private') then
    raise exception 'invalid visibility';
  end if;
  update public.pod
  set
    name = nullif(trim(p_name), ''),
    visibility = p_visibility,
    updated_at = now()
  where id = p_pod_id;
end;
$$;

create or replace function public.set_pod_status(p_pod_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_status not in ('active', 'archived') then
    raise exception 'invalid status';
  end if;
  if not app_private.can_manage_pod(p_pod_id) then
    raise exception 'not allowed to archive pod';
  end if;
  update public.pod
  set status = p_status, updated_at = now()
  where id = p_pod_id;
end;
$$;

create or replace function public.delete_pod(p_pod_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not app_private.is_space_owner(app_private.pod_space_id(p_pod_id)) then
    raise exception 'not space owner';
  end if;
  delete from public.pod where id = p_pod_id;
end;
$$;

create or replace function public.join_open_pod(p_pod_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pod public.pod%rowtype;
  v_uid uuid;
begin
  v_uid := (select auth.uid());
  select * into v_pod from public.pod where id = p_pod_id;
  if not found then
    raise exception 'pod not found';
  end if;
  if v_pod.status <> 'active' or v_pod.visibility <> 'open' then
    raise exception 'pod is not open';
  end if;
  if not app_private.is_space_member(v_pod.space_id) then
    raise exception 'not a space member';
  end if;
  insert into public.pod_member (pod_id, user_id, role)
  values (p_pod_id, v_uid, 'pod_user')
  on conflict (pod_id, user_id) do nothing;
end;
$$;

create or replace function public.create_pod_join_request(p_pod_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pod public.pod%rowtype;
  v_uid uuid;
  v_id uuid;
begin
  v_uid := (select auth.uid());
  select * into v_pod from public.pod where id = p_pod_id;
  if not found then
    raise exception 'pod not found';
  end if;
  if v_pod.status <> 'active' or v_pod.visibility <> 'request' then
    raise exception 'pod does not accept requests';
  end if;
  if not app_private.is_space_member(v_pod.space_id) then
    raise exception 'not a space member';
  end if;
  if app_private.is_pod_member(p_pod_id) then
    raise exception 'already a member';
  end if;
  insert into public.pod_join_request (pod_id, user_id, status)
  values (p_pod_id, v_uid, 'pending')
  on conflict (pod_id, user_id) do update
    set status = 'pending', resolved_at = null
    where public.pod_join_request.status = 'denied'
  returning id into v_id;
  if v_id is null then
    select id into v_id
    from public.pod_join_request
    where pod_id = p_pod_id and user_id = v_uid;
  end if;
  return v_id;
end;
$$;

create or replace function public.approve_pod_join_request(p_request_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_req public.pod_join_request%rowtype;
begin
  select * into v_req from public.pod_join_request where id = p_request_id;
  if not found then
    raise exception 'request not found';
  end if;
  if not app_private.can_approve_pod_join(v_req.pod_id) then
    raise exception 'not allowed to approve';
  end if;
  if v_req.status <> 'pending' then
    raise exception 'request is not pending';
  end if;
  insert into public.pod_member (pod_id, user_id, role)
  values (v_req.pod_id, v_req.user_id, 'pod_user')
  on conflict (pod_id, user_id) do nothing;
  update public.pod_join_request
  set status = 'approved', resolved_at = now()
  where id = p_request_id;
end;
$$;

create or replace function public.deny_pod_join_request(p_request_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_req public.pod_join_request%rowtype;
begin
  select * into v_req from public.pod_join_request where id = p_request_id;
  if not found then
    raise exception 'request not found';
  end if;
  if not app_private.can_approve_pod_join(v_req.pod_id) then
    raise exception 'not allowed to deny';
  end if;
  update public.pod_join_request
  set status = 'denied', resolved_at = now()
  where id = p_request_id;
end;
$$;

create or replace function public.add_pod_member_by_username(p_pod_id uuid, p_username text, p_role text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_space_id uuid;
  v_user_id uuid;
begin
  if p_role not in ('pod_admin', 'pod_user') then
    raise exception 'invalid role';
  end if;
  if not app_private.is_pod_owner_or_admin(p_pod_id)
     and not app_private.is_space_owner(app_private.pod_space_id(p_pod_id)) then
    raise exception 'not allowed to add member';
  end if;
  if p_role = 'pod_admin' and not app_private.is_pod_owner(p_pod_id)
     and not app_private.is_space_owner(app_private.pod_space_id(p_pod_id)) then
    raise exception 'only pod owner can assign pod admin';
  end if;
  v_space_id := app_private.pod_space_id(p_pod_id);
  select p.id into v_user_id
  from public.profile p
  where p.username_normalized = lower(p_username);
  if v_user_id is null then
    raise exception 'user not found';
  end if;
  if not exists (
    select 1 from public.space_member sm
    where sm.space_id = v_space_id and sm.user_id = v_user_id
  ) then
    raise exception 'user is not in this space';
  end if;
  insert into public.pod_member (pod_id, user_id, role)
  values (p_pod_id, v_user_id, p_role)
  on conflict (pod_id, user_id) do update
    set role = excluded.role
    where public.pod_member.role <> 'pod_owner';
end;
$$;

create or replace function public.update_pod_member_role(p_pod_id uuid, p_user_id uuid, p_role text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_role not in ('pod_admin', 'pod_user') then
    raise exception 'invalid role';
  end if;
  if not app_private.is_pod_owner(p_pod_id)
     and not app_private.is_space_owner(app_private.pod_space_id(p_pod_id)) then
    raise exception 'not allowed';
  end if;
  update public.pod_member
  set role = p_role
  where pod_id = p_pod_id
    and user_id = p_user_id
    and role <> 'pod_owner';
  if not found then
    raise exception 'member not found or is pod owner';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- grants
-- ---------------------------------------------------------------------------

grant usage on schema public to anon, authenticated;

grant select on public.profile to authenticated;
grant select on public.space to authenticated;
grant select on public.space_member to authenticated;
grant select on public.space_invite to authenticated;
grant select on public.pod to authenticated;
grant select on public.pod_member to authenticated;
grant select on public.pod_join_request to authenticated;

grant execute on function public.create_space(text) to authenticated;
grant execute on function public.update_profile_username(text) to authenticated;
grant execute on function public.update_space_member_role(uuid, uuid, text) to authenticated;
grant execute on function public.create_space_invite(uuid, text, timestamp with time zone) to authenticated;
grant execute on function public.disable_space_invite(uuid) to authenticated;
grant execute on function public.delete_space_invite(uuid) to authenticated;
grant execute on function public.join_space_with_invite(text) to authenticated;
grant execute on function public.create_pod(uuid, text, text, text) to authenticated;
grant execute on function public.update_pod(uuid, text, text) to authenticated;
grant execute on function public.set_pod_status(uuid, text) to authenticated;
grant execute on function public.delete_pod(uuid) to authenticated;
grant execute on function public.join_open_pod(uuid) to authenticated;
grant execute on function public.create_pod_join_request(uuid) to authenticated;
grant execute on function public.approve_pod_join_request(uuid) to authenticated;
grant execute on function public.deny_pod_join_request(uuid) to authenticated;
grant execute on function public.add_pod_member_by_username(uuid, text, text) to authenticated;
grant execute on function public.update_pod_member_role(uuid, uuid, text) to authenticated;

revoke execute on function public.create_space(text) from anon, public;
revoke execute on function public.update_profile_username(text) from anon, public;
revoke execute on function public.join_space_with_invite(text) from anon, public;

-- backfill existing auth users
insert into public.profile (id)
select u.id from auth.users u
where not exists (select 1 from public.profile p where p.id = u.id);

do $$
declare
  r record;
  v_space_id uuid;
begin
  for r in
    select u.id
    from auth.users u
    where not exists (
      select 1 from public.space_member sm where sm.user_id = u.id
    )
  loop
    insert into public.space (name) values ('My space') returning id into v_space_id;
    insert into public.space_member (space_id, user_id, role)
    values (v_space_id, r.id, 'space_owner');
  end loop;
end;
$$;
