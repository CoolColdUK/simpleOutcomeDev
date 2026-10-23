-- Reusable trip locations, transport library, activity/travel links.
-- Migrates tp_activity_place → tp_location + tp_action_location.

create table public.tp_location (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.tp_trip (id) on delete cascade,
  name text not null,
  address text,
  maps_url text,
  notes text,
  sort_order integer not null default 0,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint tp_location_name_not_blank check (char_length(trim(name)) > 0)
);

create index tp_location_trip_id_idx on public.tp_location (trip_id);

create trigger tp_location_set_updated_at before update on public.tp_location
  for each row execute function extensions.moddatetime('updated_at');

create table public.tp_action_location (
  id uuid primary key default gen_random_uuid(),
  action_id uuid not null references public.tp_action (id) on delete cascade,
  location_id uuid not null references public.tp_location (id) on delete cascade,
  sort_order integer not null default 0,
  created_at timestamp with time zone not null default now(),
  constraint tp_action_location_unique unique (action_id, location_id)
);

create index tp_action_location_action_id_idx on public.tp_action_location (action_id);
create index tp_action_location_location_id_idx on public.tp_action_location (location_id);

create table public.tp_transport_lib (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.tp_trip (id) on delete cascade,
  label text not null,
  mode text not null default 'other',
  duration_minutes integer,
  cost_amount numeric,
  cost_currency text,
  from_location_id uuid references public.tp_location (id) on delete set null,
  to_location_id uuid references public.tp_location (id) on delete set null,
  notes text,
  sort_order integer not null default 0,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint tp_transport_lib_label_not_blank check (char_length(trim(label)) > 0),
  constraint tp_transport_lib_mode_check check (
    mode in ('flight', 'train', 'coach', 'bus', 'car', 'ferry', 'walk', 'other')
  ),
  constraint tp_transport_lib_duration_positive check (duration_minutes is null or duration_minutes >= 0)
);

create index tp_transport_lib_trip_id_idx on public.tp_transport_lib (trip_id);
create index tp_transport_lib_from_location_id_idx on public.tp_transport_lib (from_location_id);
create index tp_transport_lib_to_location_id_idx on public.tp_transport_lib (to_location_id);

create trigger tp_transport_lib_set_updated_at before update on public.tp_transport_lib
  for each row execute function extensions.moddatetime('updated_at');

create table public.tp_action_transport (
  id uuid primary key default gen_random_uuid(),
  action_id uuid not null references public.tp_action (id) on delete cascade,
  transport_lib_id uuid not null references public.tp_transport_lib (id) on delete cascade,
  sort_order integer not null default 0,
  created_at timestamp with time zone not null default now(),
  constraint tp_action_transport_unique unique (action_id, transport_lib_id)
);

create index tp_action_transport_action_id_idx on public.tp_action_transport (action_id);
create index tp_action_transport_lib_id_idx on public.tp_action_transport (transport_lib_id);

alter table public.tp_action
  add column if not exists from_location_id uuid references public.tp_location (id) on delete set null,
  add column if not exists to_location_id uuid references public.tp_location (id) on delete set null,
  add column if not exists duration_minutes integer,
  add constraint tp_action_duration_positive check (duration_minutes is null or duration_minutes >= 0);

create index tp_action_from_location_id_idx on public.tp_action (from_location_id);
create index tp_action_to_location_id_idx on public.tp_action (to_location_id);

alter table public.tp_transport
  add column if not exists transport_lib_id uuid references public.tp_transport_lib (id) on delete set null,
  add column if not exists from_location_id uuid references public.tp_location (id) on delete set null,
  add column if not exists to_location_id uuid references public.tp_location (id) on delete set null,
  add column if not exists duration_minutes integer,
  add constraint tp_transport_duration_positive check (duration_minutes is null or duration_minutes >= 0);

create index tp_transport_transport_lib_id_idx on public.tp_transport (transport_lib_id);
create index tp_transport_from_location_id_idx on public.tp_transport (from_location_id);
create index tp_transport_to_location_id_idx on public.tp_transport (to_location_id);

-- Migrate activity places → locations (dedupe per trip by name + maps_url)
insert into public.tp_location (trip_id, name, maps_url, sort_order)
select a.trip_id, p.place_text, p.maps_url, min(p.sort_order)
from public.tp_activity_place p
join public.tp_action a on a.id = p.action_id
group by a.trip_id, p.place_text, p.maps_url;

insert into public.tp_action_location (action_id, location_id, sort_order)
select p.action_id, l.id, p.sort_order
from public.tp_activity_place p
join public.tp_action a on a.id = p.action_id
join public.tp_location l
  on l.trip_id = a.trip_id
  and l.name = p.place_text
  and coalesce(l.maps_url, '') = coalesce(p.maps_url, '');

drop table public.tp_activity_place;

alter table public.tp_location enable row level security;
alter table public.tp_action_location enable row level security;
alter table public.tp_transport_lib enable row level security;
alter table public.tp_action_transport enable row level security;

create policy tp_location_all on public.tp_location for all to authenticated
  using (app_private.can_read_tp_pod(app_private.tp_pod_id_from_trip(trip_id)))
  with check (app_private.can_write_tp_pod(app_private.tp_pod_id_from_trip(trip_id)));

create policy tp_action_location_all on public.tp_action_location for all to authenticated
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

create policy tp_transport_lib_all on public.tp_transport_lib for all to authenticated
  using (app_private.can_read_tp_pod(app_private.tp_pod_id_from_trip(trip_id)))
  with check (app_private.can_write_tp_pod(app_private.tp_pod_id_from_trip(trip_id)));

create policy tp_action_transport_all on public.tp_action_transport for all to authenticated
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

grant select, insert, update, delete on public.tp_location to authenticated;
grant select, insert, update, delete on public.tp_action_location to authenticated;
grant select, insert, update, delete on public.tp_transport_lib to authenticated;
grant select, insert, update, delete on public.tp_action_transport to authenticated;

grant all on table public.tp_location to service_role;
grant all on table public.tp_action_location to service_role;
grant all on table public.tp_transport_lib to service_role;
grant all on table public.tp_action_transport to service_role;
