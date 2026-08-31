/*
 * Purpose: allow username changes at most once every 30 days.
 * Affects: public.profile.username_changed_at, public.update_profile_username
 */

alter table public.profile
  add column username_changed_at timestamp with time zone;

comment on column public.profile.username_changed_at is
  'when the unique username handle was last set; next change is allowed after 30 days.';

-- existing handles start their cooldown from the last profile update.
update public.profile
set username_changed_at = updated_at
where username is not null
  and username_changed_at is null;

-- first set is always allowed. later changes require 30 days since username_changed_at.
-- same handle (case-insensitive) is a no-op and does not reset the cooldown.
create or replace function public.update_profile_username(p_username text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_current text;
  v_changed_at timestamp with time zone;
begin
  v_uid := (select auth.uid());
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  select p.username, p.username_changed_at
    into v_current, v_changed_at
  from public.profile p
  where p.id = v_uid;

  if v_current is not null and lower(v_current) = lower(p_username) then
    return;
  end if;

  if v_current is not null
    and v_changed_at is not null
    and v_changed_at > (now() - interval '30 days')
  then
    raise exception 'username can only be changed once every 30 days';
  end if;

  update public.profile
  set
    username = p_username,
    username_normalized = lower(p_username),
    username_changed_at = now(),
    updated_at = now()
  where id = v_uid;
end;
$$;
