/*
 * Purpose: add a user-editable display name, lock username after first set.
 * Affects: public.profile, public.update_profile_username, public.update_profile_display_name.
 */

-- display name is optional public-facing text; not unique and not used for lookup.
alter table public.profile
  add column display_name text;

alter table public.profile
  add constraint profile_display_name_length_check check (
    display_name is null
    or char_length(display_name) between 1 and 80
  );

comment on column public.profile.display_name is 'optional display name; username remains the unique handle.';

-- username may be set once; later calls are rejected.
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
  if exists (
    select 1
    from public.profile
    where id = v_uid
      and username is not null
  ) then
    raise exception 'username cannot be changed';
  end if;
  update public.profile
  set
    username = p_username,
    username_normalized = lower(p_username),
    updated_at = now()
  where id = v_uid;
end;
$$;

-- caller may only update their own display name (empty string clears it).
create or replace function public.update_profile_display_name(p_display_name text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_name text;
begin
  v_uid := (select auth.uid());
  if v_uid is null then
    raise exception 'not authenticated';
  end if;
  v_name := nullif(trim(p_display_name), '');
  if v_name is not null and char_length(v_name) > 80 then
    raise exception 'display name too long';
  end if;
  update public.profile
  set
    display_name = v_name,
    updated_at = now()
  where id = v_uid;
end;
$$;

grant execute on function public.update_profile_display_name(text) to authenticated;
revoke execute on function public.update_profile_display_name(text) from anon, public;
