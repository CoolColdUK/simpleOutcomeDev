/**
 * Purpose: book pod feature; bk_* tables; RLS; pod catalog; pod-private WebP MIME; book pod bootstrap.
 */

-- feature catalog
alter table public.pod drop constraint pod_feature_check;
alter table public.pod add constraint pod_feature_check
  check (feature in ('todo_list', 'financial_planning', 'trip_planning', 'book'));

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
  if p_feature not in ('todo_list', 'financial_planning', 'trip_planning', 'book') then
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
    if p_feature = 'book' and v_key <> 'book' then
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
  if jsonb_exists(p_body, 'book') and not app_private.api_key_action_list_ok(p_body->'book') then
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
  if p_feature not in ('todo_list', 'financial_planning', 'trip_planning', 'book') then
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
  if p_feature not in ('todo_list', 'financial_planning', 'trip_planning', 'book') then
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

-- access helpers
create function app_private.can_read_book_pod(p_pod_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select app_private.is_pod_member(p_pod_id)
    or app_private.is_space_owner(app_private.pod_space_id(p_pod_id));
$$;

create function app_private.can_write_book_pod(p_pod_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select app_private.is_pod_writer(p_pod_id);
$$;

-- tables
create table public.bk_book (
  pod_id uuid primary key references public.pod (id) on delete cascade,
  subtitle text not null default '',
  summary_md text not null default '',
  cover_storage_path text,
  offline_bundle_version integer not null default 1,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

comment on table public.bk_book is 'One book per book pod: subtitle, summary, cover path.';

create table public.bk_outline_entry (
  id uuid primary key default gen_random_uuid(),
  pod_id uuid not null references public.pod (id) on delete cascade,
  kind text not null check (kind in ('chapter', 'note')),
  sort_order integer not null,
  chapter_number integer,
  note_number integer,
  title text not null default '',
  summary_md text not null default '',
  content_md text not null default '',
  status text check (status is null or status in ('outline', 'draft', 'done')),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  unique (pod_id, sort_order),
  constraint bk_outline_chapter_status check (
    (kind = 'chapter' and status is not null)
    or (kind = 'note' and status is null)
  )
);

create table public.bk_asset_type (
  id uuid primary key default gen_random_uuid(),
  pod_id uuid not null references public.pod (id) on delete cascade,
  slug text not null,
  label text not null,
  sort_order integer not null default 0,
  is_system boolean not null default false,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  unique (pod_id, slug)
);

create table public.bk_asset (
  id uuid primary key default gen_random_uuid(),
  pod_id uuid not null references public.pod (id) on delete cascade,
  asset_type_id uuid not null references public.bk_asset_type (id) on delete restrict,
  name text not null default '',
  description_md text not null default '',
  sort_order integer not null default 0,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table public.bk_asset_image (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.bk_asset (id) on delete cascade,
  pod_id uuid not null references public.pod (id) on delete cascade,
  storage_path text not null,
  sort_order integer not null default 0,
  caption text,
  created_at timestamp with time zone not null default now()
);

create function app_private.bk_bump_offline_version(p_pod_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.bk_book
  set offline_bundle_version = offline_bundle_version + 1
  where pod_id = p_pod_id;
$$;

create function public.bk_renumber_outline(p_pod_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row record;
  v_chapter int := 0;
  v_note int := 0;
begin
  for v_row in
  select id, kind
  from public.bk_outline_entry
  where pod_id = p_pod_id
  order by sort_order asc, created_at asc
  loop
    if v_row.kind = 'chapter' then
      v_chapter := v_chapter + 1;
      update public.bk_outline_entry
      set chapter_number = v_chapter, note_number = null
      where id = v_row.id;
    else
      v_note := v_note + 1;
      update public.bk_outline_entry
      set note_number = v_note, chapter_number = null
      where id = v_row.id;
    end if;
  end loop;
end;
$$;

grant execute on function public.bk_renumber_outline(uuid) to authenticated;

create function app_private.bk_seed_pod(p_pod_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.bk_book (pod_id) values (p_pod_id);
  insert into public.bk_asset_type (pod_id, slug, label, sort_order, is_system) values
    (p_pod_id, 'characters', 'Characters', 0, true),
    (p_pod_id, 'items', 'Items', 1, true),
    (p_pod_id, 'locations', 'Locations', 2, true);
end;
$$;

create function app_private.bk_on_pod_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.feature = 'book' then
    perform app_private.bk_seed_pod(new.id);
  end if;
  return new;
end;
$$;

create trigger bk_on_pod_insert
  after insert on public.pod
  for each row execute function app_private.bk_on_pod_insert();

create trigger bk_book_set_updated_at before update on public.bk_book
  for each row execute function extensions.moddatetime('updated_at');
create trigger bk_outline_set_updated_at before update on public.bk_outline_entry
  for each row execute function extensions.moddatetime('updated_at');
create trigger bk_asset_type_set_updated_at before update on public.bk_asset_type
  for each row execute function extensions.moddatetime('updated_at');
create trigger bk_asset_set_updated_at before update on public.bk_asset
  for each row execute function extensions.moddatetime('updated_at');

create function app_private.bk_outline_bump()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform app_private.bk_bump_offline_version(coalesce(new.pod_id, old.pod_id));
  return coalesce(new, old);
end;
$$;

create trigger bk_outline_bump_version
  after insert or update or delete on public.bk_outline_entry
  for each row execute function app_private.bk_outline_bump();

create trigger bk_asset_bump_version
  after insert or update or delete on public.bk_asset
  for each row execute function app_private.bk_outline_bump();

create trigger bk_asset_image_bump_version
  after insert or delete on public.bk_asset_image
  for each row execute function app_private.bk_outline_bump();

-- RLS
alter table public.bk_book enable row level security;
alter table public.bk_outline_entry enable row level security;
alter table public.bk_asset_type enable row level security;
alter table public.bk_asset enable row level security;
alter table public.bk_asset_image enable row level security;

create policy bk_book_select on public.bk_book for select to authenticated
  using (app_private.can_read_book_pod(pod_id));
create policy bk_book_update on public.bk_book for update to authenticated
  using (app_private.can_write_book_pod(pod_id)) with check (app_private.can_write_book_pod(pod_id));

create policy bk_outline_all on public.bk_outline_entry for all to authenticated
  using (app_private.can_read_book_pod(pod_id))
  with check (app_private.can_write_book_pod(pod_id));

create policy bk_asset_type_all on public.bk_asset_type for all to authenticated
  using (app_private.can_read_book_pod(pod_id))
  with check (app_private.can_write_book_pod(pod_id));

create policy bk_asset_all on public.bk_asset for all to authenticated
  using (app_private.can_read_book_pod(pod_id))
  with check (app_private.can_write_book_pod(pod_id));

create policy bk_asset_image_all on public.bk_asset_image for all to authenticated
  using (app_private.can_read_book_pod(pod_id))
  with check (app_private.can_write_book_pod(pod_id));

grant select, insert, update, delete on public.bk_book to authenticated;
grant select, insert, update, delete on public.bk_outline_entry to authenticated;
grant select, insert, update, delete on public.bk_asset_type to authenticated;
grant select, insert, update, delete on public.bk_asset to authenticated;
grant select, insert, update, delete on public.bk_asset_image to authenticated;

grant all on table public.bk_book to service_role;
grant all on table public.bk_outline_entry to service_role;
grant all on table public.bk_asset_type to service_role;
grant all on table public.bk_asset to service_role;
grant all on table public.bk_asset_image to service_role;

-- storage: allow WebP for book images (keep PDF for trip)
update storage.buckets
set allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
where id = 'pod-private';
