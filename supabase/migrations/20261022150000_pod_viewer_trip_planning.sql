-- Purpose: pod_viewer role; trip_planning feature; tp_* tables; RLS; storage MIME for PDF.
-- Affects: public.pod, public.pod_member, public.create_pod, todo card write checks, fp_default_permission,
--          pod-private bucket, new tp_* tables.

-- pod_viewer role
alter table public.pod_member drop constraint pod_member_role_check;
alter table public.pod_member add constraint pod_member_role_check
  check (role in ('pod_owner', 'pod_admin', 'pod_user', 'pod_viewer'));

create or replace function app_private.is_pod_writer(p_pod_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select app_private.is_space_owner(app_private.pod_space_id(p_pod_id))
    or app_private.pod_role(p_pod_id) in ('pod_owner', 'pod_admin', 'pod_user');
$$;

create or replace function app_private.can_manage_todo_cards(p_pod_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select app_private.is_pod_writer(p_pod_id);
$$;

create or replace function app_private.fp_default_permission()
returns jsonb
language sql
immutable
as $$
  select '{
    "pod_viewer": {
      "account": ["read"],
      "category": ["read"],
      "transaction": ["read"],
      "parser": ["read"],
      "import": ["read"],
      "bill_split": [],
      "settings": ["read"],
      "delete_all": []
    },
    "pod_user": {
      "account": ["read", "create", "update"],
      "category": ["read", "create", "update"],
      "transaction": ["read", "create", "update"],
      "parser": ["read"],
      "import": ["read"],
      "bill_split": ["create", "update"],
      "settings": ["read"],
      "delete_all": []
    },
    "pod_admin": {
      "account": ["read", "create", "update", "delete"],
      "category": ["read", "create", "update", "delete"],
      "transaction": ["read", "create", "update", "delete"],
      "parser": ["read", "create", "update", "delete"],
      "import": ["read", "create", "delete"],
      "bill_split": ["create", "update"],
      "settings": ["read"],
      "delete_all": []
    },
    "pod_owner": {
      "account": ["read", "create", "update", "delete"],
      "category": ["read", "create", "update", "delete"],
      "transaction": ["read", "create", "update", "delete"],
      "parser": ["read", "create", "update", "delete"],
      "import": ["read", "create", "delete"],
      "bill_split": ["create", "update", "delete"],
      "settings": ["read", "update"],
      "delete_all": ["create"]
    }
  }'::jsonb;
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
  if p_role not in ('pod_admin', 'pod_user', 'pod_viewer') then
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
  if p_role not in ('pod_admin', 'pod_user', 'pod_viewer') then
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

-- trip_planning catalog
alter table public.pod drop constraint pod_feature_check;
alter table public.pod add constraint pod_feature_check
  check (feature in ('todo_list', 'shopping_list', 'financial_planning', 'trip_planning'));

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
  if p_feature not in ('todo_list', 'shopping_list', 'financial_planning', 'trip_planning') then
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

create function app_private.can_read_tp_pod(p_pod_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select app_private.is_pod_member(p_pod_id)
    or app_private.is_space_owner(app_private.pod_space_id(p_pod_id));
$$;

create function app_private.can_write_tp_pod(p_pod_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select app_private.is_pod_writer(p_pod_id);
$$;

create table public.tp_setting (
  pod_id uuid primary key references public.pod (id) on delete cascade,
  default_currency text not null default 'GBP',
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint tp_setting_currency_not_blank check (char_length(trim(default_currency)) >= 3)
);

create table public.tp_trip (
  id uuid primary key default gen_random_uuid(),
  pod_id uuid not null unique references public.pod (id) on delete cascade,
  title text not null,
  timezone text not null default 'UTC',
  start_date date not null,
  end_date date not null,
  status text not null default 'draft',
  budget_amount numeric,
  budget_currency text,
  maps_url text,
  notes text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint tp_trip_title_not_blank check (char_length(trim(title)) > 0),
  constraint tp_trip_status_check check (status in ('draft', 'active', 'done', 'archived')),
  constraint tp_trip_dates_check check (end_date >= start_date)
);

create table public.tp_destination (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.tp_trip (id) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  maps_url text,
  timezone_hint text,
  important_info text,
  active_start_date date,
  active_end_date date,
  notes text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint tp_destination_name_not_blank check (char_length(trim(name)) > 0)
);

create table public.tp_day (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.tp_trip (id) on delete cascade,
  day_index integer not null,
  calendar_date date not null,
  day_title text,
  day_notes text,
  primary_destination_id uuid references public.tp_destination (id) on delete set null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint tp_day_trip_index_unique unique (trip_id, day_index),
  constraint tp_day_trip_date_unique unique (trip_id, calendar_date)
);

create table public.tp_day_destination (
  day_id uuid not null references public.tp_day (id) on delete cascade,
  destination_id uuid not null references public.tp_destination (id) on delete cascade,
  primary key (day_id, destination_id)
);

create table public.tp_action (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.tp_trip (id) on delete cascade,
  anchor_day_id uuid references public.tp_day (id) on delete set null,
  kind text not null,
  title text not null,
  place_text text,
  maps_url text,
  destination_id uuid references public.tp_destination (id) on delete set null,
  from_place text,
  to_place text,
  from_destination_id uuid references public.tp_destination (id) on delete set null,
  to_destination_id uuid references public.tp_destination (id) on delete set null,
  from_maps_url text,
  to_maps_url text,
  check_in_at timestamp with time zone,
  check_out_at timestamp with time zone,
  check_in_timezone text,
  check_out_timezone text,
  start_time time without time zone,
  end_time time without time zone,
  cost_amount numeric,
  cost_currency text,
  booking_ref text,
  url text,
  notes text,
  selected_route_id uuid,
  sort_order integer not null default 0,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint tp_action_kind_check check (kind in ('travel', 'stay', 'activity', 'note')),
  constraint tp_action_title_not_blank check (char_length(trim(title)) > 0)
);

create table public.tp_route (
  id uuid primary key default gen_random_uuid(),
  action_id uuid not null references public.tp_action (id) on delete cascade,
  name text not null,
  is_selected boolean not null default false,
  notes text,
  sort_order integer not null default 0,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint tp_route_name_not_blank check (char_length(trim(name)) > 0)
);

alter table public.tp_action
  add constraint tp_action_selected_route_id_fkey
  foreign key (selected_route_id) references public.tp_route (id) on delete set null;

create table public.tp_transport (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references public.tp_route (id) on delete cascade,
  mode text not null default 'other',
  from_place text,
  to_place text,
  depart_at timestamp with time zone,
  arrive_at timestamp with time zone,
  depart_timezone text,
  arrive_timezone text,
  cost_amount numeric,
  cost_currency text,
  booking_ref text,
  url text,
  notes text,
  sort_order integer not null default 0,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint tp_transport_mode_check check (
    mode in ('flight', 'train', 'coach', 'bus', 'car', 'ferry', 'walk', 'other')
  )
);

create table public.tp_attachment (
  id uuid primary key default gen_random_uuid(),
  pod_id uuid not null references public.pod (id) on delete cascade,
  trip_id uuid not null references public.tp_trip (id) on delete cascade,
  transport_id uuid references public.tp_transport (id) on delete cascade,
  destination_id uuid references public.tp_destination (id) on delete cascade,
  storage_path text not null,
  file_name text not null,
  mime_type text not null,
  byte_size integer not null,
  uploaded_by uuid not null references public.profile (id) on delete cascade,
  created_at timestamp with time zone not null default now(),
  constraint tp_attachment_parent_check check (
    (transport_id is not null and destination_id is null)
    or (transport_id is null and destination_id is not null)
  )
);

create function app_private.tp_pod_id_from_trip(p_trip_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select t.pod_id from public.tp_trip t where t.id = p_trip_id;
$$;

create function app_private.tp_on_pod_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.feature = 'trip_planning' then
    insert into public.tp_setting (pod_id) values (new.id);
  end if;
  return new;
end;
$$;

create trigger tp_on_pod_insert
  after insert on public.pod
  for each row execute function app_private.tp_on_pod_insert();

create trigger tp_setting_set_updated_at before update on public.tp_setting
  for each row execute function moddatetime(updated_at);
create trigger tp_trip_set_updated_at before update on public.tp_trip
  for each row execute function moddatetime(updated_at);
create trigger tp_destination_set_updated_at before update on public.tp_destination
  for each row execute function moddatetime(updated_at);
create trigger tp_day_set_updated_at before update on public.tp_day
  for each row execute function moddatetime(updated_at);
create trigger tp_action_set_updated_at before update on public.tp_action
  for each row execute function moddatetime(updated_at);
create trigger tp_route_set_updated_at before update on public.tp_route
  for each row execute function moddatetime(updated_at);
create trigger tp_transport_set_updated_at before update on public.tp_transport
  for each row execute function moddatetime(updated_at);

alter table public.tp_setting enable row level security;
alter table public.tp_trip enable row level security;
alter table public.tp_destination enable row level security;
alter table public.tp_day enable row level security;
alter table public.tp_day_destination enable row level security;
alter table public.tp_action enable row level security;
alter table public.tp_route enable row level security;
alter table public.tp_transport enable row level security;
alter table public.tp_attachment enable row level security;

create policy tp_setting_select on public.tp_setting for select to authenticated
  using (app_private.can_read_tp_pod(pod_id));
create policy tp_setting_update on public.tp_setting for update to authenticated
  using (app_private.can_write_tp_pod(pod_id)) with check (app_private.can_write_tp_pod(pod_id));

create policy tp_trip_select on public.tp_trip for select to authenticated
  using (app_private.can_read_tp_pod(pod_id));
create policy tp_trip_insert on public.tp_trip for insert to authenticated
  with check (app_private.can_write_tp_pod(pod_id));
create policy tp_trip_update on public.tp_trip for update to authenticated
  using (app_private.can_write_tp_pod(pod_id)) with check (app_private.can_write_tp_pod(pod_id));
create policy tp_trip_delete on public.tp_trip for delete to authenticated
  using (app_private.can_write_tp_pod(pod_id));

create policy tp_destination_all on public.tp_destination for all to authenticated
  using (app_private.can_read_tp_pod(app_private.tp_pod_id_from_trip(trip_id)))
  with check (app_private.can_write_tp_pod(app_private.tp_pod_id_from_trip(trip_id)));

create policy tp_day_all on public.tp_day for all to authenticated
  using (app_private.can_read_tp_pod(app_private.tp_pod_id_from_trip(trip_id)))
  with check (app_private.can_write_tp_pod(app_private.tp_pod_id_from_trip(trip_id)));

create policy tp_day_destination_all on public.tp_day_destination for all to authenticated
  using (
    exists (
      select 1 from public.tp_day d
      where d.id = day_id
        and app_private.can_read_tp_pod(app_private.tp_pod_id_from_trip(d.trip_id))
    )
  )
  with check (
    exists (
      select 1 from public.tp_day d
      where d.id = day_id
        and app_private.can_write_tp_pod(app_private.tp_pod_id_from_trip(d.trip_id))
    )
  );

create policy tp_action_all on public.tp_action for all to authenticated
  using (app_private.can_read_tp_pod(app_private.tp_pod_id_from_trip(trip_id)))
  with check (app_private.can_write_tp_pod(app_private.tp_pod_id_from_trip(trip_id)));

create policy tp_route_all on public.tp_route for all to authenticated
  using (
    exists (
      select 1 from public.tp_action a
      where a.id = action_id
        and app_private.can_read_tp_pod(app_private.tp_pod_id_from_trip(a.trip_id))
    )
  )
  with check (
    exists (
      select 1 from public.tp_action a
      where a.id = action_id
        and app_private.can_write_tp_pod(app_private.tp_pod_id_from_trip(a.trip_id))
    )
  );

create policy tp_transport_all on public.tp_transport for all to authenticated
  using (
    exists (
      select 1 from public.tp_route r
      join public.tp_action a on a.id = r.action_id
      where r.id = route_id
        and app_private.can_read_tp_pod(app_private.tp_pod_id_from_trip(a.trip_id))
    )
  )
  with check (
    exists (
      select 1 from public.tp_route r
      join public.tp_action a on a.id = r.action_id
      where r.id = route_id
        and app_private.can_write_tp_pod(app_private.tp_pod_id_from_trip(a.trip_id))
    )
  );

create policy tp_attachment_all on public.tp_attachment for all to authenticated
  using (app_private.can_read_tp_pod(pod_id))
  with check (app_private.can_write_tp_pod(pod_id));

grant select, insert, update, delete on public.tp_setting to authenticated;
grant select, insert, update, delete on public.tp_trip to authenticated;
grant select, insert, update, delete on public.tp_destination to authenticated;
grant select, insert, update, delete on public.tp_day to authenticated;
grant select, insert, update, delete on public.tp_day_destination to authenticated;
grant select, insert, update, delete on public.tp_action to authenticated;
grant select, insert, update, delete on public.tp_route to authenticated;
grant select, insert, update, delete on public.tp_transport to authenticated;
grant select, insert, update, delete on public.tp_attachment to authenticated;

grant all on table public.tp_setting to service_role;
grant all on table public.tp_trip to service_role;
grant all on table public.tp_destination to service_role;
grant all on table public.tp_day to service_role;
grant all on table public.tp_day_destination to service_role;
grant all on table public.tp_action to service_role;
grant all on table public.tp_route to service_role;
grant all on table public.tp_transport to service_role;
grant all on table public.tp_attachment to service_role;

update storage.buckets
set allowed_mime_types = array['image/jpeg', 'image/png', 'application/pdf']
where id = 'pod-private';

create or replace function app_private.can_write_pod_private_storage(p_pod_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select app_private.is_pod_writer(p_pod_id);
$$;

drop policy if exists pod_private_objects_insert_authenticated on storage.objects;
create policy pod_private_objects_insert_authenticated on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'pod-private'
    and app_private.can_write_pod_private_storage(app_private.pod_id_from_storage_object_name(name))
  );

drop policy if exists pod_private_objects_update_authenticated on storage.objects;
create policy pod_private_objects_update_authenticated on storage.objects
  for update to authenticated
  using (
    bucket_id = 'pod-private'
    and app_private.can_write_pod_private_storage(app_private.pod_id_from_storage_object_name(name))
  )
  with check (
    bucket_id = 'pod-private'
    and app_private.can_write_pod_private_storage(app_private.pod_id_from_storage_object_name(name))
  );

drop policy if exists pod_private_objects_delete_authenticated on storage.objects;
create policy pod_private_objects_delete_authenticated on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'pod-private'
    and app_private.can_write_pod_private_storage(app_private.pod_id_from_storage_object_name(name))
  );
