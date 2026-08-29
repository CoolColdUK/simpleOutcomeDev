/**
 * Purpose: add optional space description; allow owners to set it on create and update.
 * Affects: public.space.description; public.create_space; public.update_space.
 */

-- optional description shown on space cards and space home
alter table public.space
  add column description text;

alter table public.space
  add constraint space_description_length_check
  check (description is null or char_length(description) <= 500);

comment on column public.space.description is 'optional short description of the space; blank stored as null.';

-- create_space gains p_description; drop old one-arg signature
drop function if exists public.create_space(text);

create function public.create_space(p_name text, p_description text default null)
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
  insert into public.space (name, description)
  values (trim(p_name), nullif(trim(p_description), ''))
  returning id into v_id;
  insert into public.space_member (space_id, user_id, role)
  values (v_id, v_uid, 'space_owner');
  return v_id;
end;
$$;

comment on function public.create_space(text, text) is 'authenticated user creates a space and becomes space_owner.';

-- owners can set name and description after create
create function public.update_space(p_space_id uuid, p_name text, p_description text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not app_private.is_space_owner(p_space_id) then
    raise exception 'not space owner';
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

comment on function public.update_space(uuid, text, text) is 'space owner updates name and description.';

grant execute on function public.create_space(text, text) to authenticated;
grant execute on function public.update_space(uuid, text, text) to authenticated;

revoke execute on function public.create_space(text, text) from anon, public;
revoke execute on function public.update_space(uuid, text, text) from anon, public;
