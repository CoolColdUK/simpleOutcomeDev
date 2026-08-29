/**
 * Purpose: max-use space invites, usage audit rows, admin/owner invite management.
 * Affects: public.space_invite; public.space_invite_use; invite RPCs; public.update_space.
 */

-- replace single_use/permanent with a use cap and a short code prefix for the list UI
alter table public.space_invite
  add column max_uses integer,
  add column use_count integer not null default 0,
  add column token_prefix text;

update public.space_invite
set
  max_uses = case when mode = 'single_use' then 1 else 9999 end,
  use_count = case when consumed_at is not null then 1 else 0 end,
  token_prefix = left(encode(token_hash, 'hex'), 8);

alter table public.space_invite
  alter column max_uses set not null,
  alter column token_prefix set not null;

alter table public.space_invite
  add constraint space_invite_max_uses_check check (max_uses >= 1 and max_uses <= 9999);

alter table public.space_invite
  add constraint space_invite_use_count_check check (use_count >= 0 and use_count <= max_uses);

alter table public.space_invite
  add constraint space_invite_token_prefix_length_check check (char_length(token_prefix) = 8);

alter table public.space_invite
  drop constraint space_invite_mode_check;

alter table public.space_invite
  drop column mode;

comment on column public.space_invite.max_uses is 'maximum successful joins allowed for this invite; 1 to 9999.';
comment on column public.space_invite.use_count is 'successful joins recorded for this invite.';
comment on column public.space_invite.token_prefix is 'first 8 hex characters of the invite token for admin lists.';

-- audit who redeemed which invite
create table public.space_invite_use (
  id uuid not null default gen_random_uuid(),
  invite_id uuid not null,
  space_id uuid not null,
  user_id uuid not null,
  used_at timestamp with time zone not null default now(),
  constraint space_invite_use_pkey primary key (id),
  constraint space_invite_use_invite_id_fkey foreign key (invite_id) references public.space_invite (id) on delete cascade,
  constraint space_invite_use_space_id_fkey foreign key (space_id) references public.space (id) on delete cascade,
  constraint space_invite_use_user_id_fkey foreign key (user_id) references public.profile (id) on delete cascade,
  constraint space_invite_use_invite_user_unique unique (invite_id, user_id)
);

comment on table public.space_invite_use is 'one row per user who joined a space with a given invite.';

create index space_invite_use_invite_id_idx on public.space_invite_use (invite_id);
create index space_invite_use_space_id_idx on public.space_invite_use (space_id);
create index space_invite_use_user_id_idx on public.space_invite_use (user_id);

alter table public.space_invite_use enable row level security;

drop policy if exists space_invite_select_authenticated on public.space_invite;

create policy space_invite_select_authenticated on public.space_invite
  for select to authenticated
  using (app_private.is_space_admin_or_owner(space_id));

create policy space_invite_use_select_authenticated on public.space_invite_use
  for select to authenticated
  using (app_private.is_space_admin_or_owner(space_id));

create policy space_invite_use_select_anon_denied on public.space_invite_use
  for select to anon
  using (false);

grant select on public.space_invite_use to authenticated;

-- owners and admins may update space name and description
create or replace function public.update_space(p_space_id uuid, p_name text, p_description text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not app_private.is_space_admin_or_owner(p_space_id) then
    raise exception 'not allowed to update space';
  end if;
  update public.space
  set
    name = trim(p_name),
    description = nullif(trim(p_description), '')
  where id = p_space_id;
  if not found then
    raise exception 'space not found';
  end if;
end;
$$;

comment on function public.update_space(uuid, text, text) is 'space owner or admin updates name and description.';

drop function if exists public.create_space_invite(uuid, text, timestamp with time zone);

create function public.create_space_invite(p_space_id uuid, p_expires_in_days integer, p_max_uses integer)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_token text;
begin
  if not app_private.is_space_admin_or_owner(p_space_id) then
    raise exception 'not allowed to create invite';
  end if;
  if p_expires_in_days is null or p_expires_in_days < 1 or p_expires_in_days > 90 then
    raise exception 'expires in days must be between 1 and 90';
  end if;
  if p_max_uses is null or p_max_uses < 1 or p_max_uses > 9999 then
    raise exception 'max uses must be between 1 and 9999';
  end if;
  v_token := encode(extensions.gen_random_bytes(32), 'hex');
  insert into public.space_invite (space_id, token_hash, token_prefix, max_uses, expires_at, created_by)
  values (
    p_space_id,
    app_private.hash_invite_token(v_token),
    left(v_token, 8),
    p_max_uses,
    now() + make_interval(days => p_expires_in_days),
    (select auth.uid())
  );
  return v_token;
end;
$$;

comment on function public.create_space_invite(uuid, integer, integer) is 'space owner or admin creates a time-limited invite link with a use cap.';

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
  if not app_private.is_space_admin_or_owner(v_space_id) then
    raise exception 'not allowed to disable invite';
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
  if not app_private.is_space_admin_or_owner(v_space_id) then
    raise exception 'not allowed to delete invite';
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
  v_uses integer;
begin
  v_uid := (select auth.uid());
  if v_uid is null then
    raise exception 'not authenticated';
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
    from public.space_member as sm
    where sm.space_id = v_invite.space_id
      and sm.user_id = v_uid
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
  values (v_invite.space_id, v_uid, 'space_user');
  insert into public.space_invite_use (invite_id, space_id, user_id)
  values (v_invite.id, v_invite.space_id, v_uid);
  update public.space_invite
  set
    use_count = v_uses + 1,
    consumed_at = case when v_uses + 1 >= max_uses then now() else consumed_at end
  where id = v_invite.id;
  return v_invite.space_id;
end;
$$;

comment on function public.join_space_with_invite(text) is 'joins the caller to the space and records invite use.';

create function public.list_space_invites(
  p_space_id uuid,
  p_status text,
  p_limit integer,
  p_offset integer
)
returns table (
  id uuid,
  token_prefix text,
  expires_at timestamp with time zone,
  max_uses integer,
  use_count integer,
  created_at timestamp with time zone,
  disabled_at timestamp with time zone,
  consumed_at timestamp with time zone,
  invite_status text,
  total_count bigint
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not app_private.is_space_admin_or_owner(p_space_id) then
    raise exception 'not allowed to list invites';
  end if;
  if p_status is null or p_status not in ('all', 'active', 'expired', 'exhausted', 'disabled') then
    raise exception 'invalid invite status filter';
  end if;
  if p_limit is null or p_limit < 1 or p_limit > 10 then
    raise exception 'limit must be between 1 and 10';
  end if;
  if p_offset is null or p_offset < 0 then
    raise exception 'offset must be zero or more';
  end if;
  return query
  with
    classified as (
      select
        si.id,
        si.token_prefix,
        si.expires_at,
        si.max_uses,
        si.use_count,
        si.created_at,
        si.disabled_at,
        si.consumed_at,
        case
          when si.disabled_at is not null then 'disabled'
          when si.expires_at is not null and si.expires_at <= now() then 'expired'
          when si.use_count >= si.max_uses then 'exhausted'
          else 'active'
        end as invite_status
      from public.space_invite as si
      where si.space_id = p_space_id
    ),
    filtered as (
      select *
      from classified
      where p_status = 'all' or classified.invite_status = p_status
    )
  select
    filtered.id,
    filtered.token_prefix,
    filtered.expires_at,
    filtered.max_uses,
    filtered.use_count,
    filtered.created_at,
    filtered.disabled_at,
    filtered.consumed_at,
    filtered.invite_status,
    (select count(*) from filtered) as total_count
  from filtered
  order by filtered.created_at desc
  limit p_limit
  offset p_offset;
end;
$$;

comment on function public.list_space_invites(uuid, text, integer, integer) is 'paginated invite list for space owners and admins.';

grant execute on function public.create_space_invite(uuid, integer, integer) to authenticated;
grant execute on function public.list_space_invites(uuid, text, integer, integer) to authenticated;

revoke execute on function public.create_space_invite(uuid, integer, integer) from anon, public;
revoke execute on function public.list_space_invites(uuid, text, integer, integer) from anon, public;
