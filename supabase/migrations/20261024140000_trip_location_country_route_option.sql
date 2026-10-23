-- Location country + type; route option price, duration, linked transport means.

alter table public.tp_location
  add column if not exists country char(2),
  add column if not exists location_type text not null default 'other';

alter table public.tp_location drop constraint if exists tp_location_country_format;

alter table public.tp_location
  add constraint tp_location_country_format check (country is null or country ~ '^[A-Z]{2}$');

alter table public.tp_location drop constraint if exists tp_location_type_check;

alter table public.tp_location
  add constraint tp_location_type_check check (
    location_type in ('station', 'accommodation', 'restaurant', 'shop', 'attraction', 'office', 'other')
  );

alter table public.tp_route
  add column if not exists cost_amount numeric,
  add column if not exists cost_currency text,
  add column if not exists duration_minutes integer,
  add column if not exists transport_lib_id uuid references public.tp_transport_lib (id) on delete set null;

alter table public.tp_route drop constraint if exists tp_route_duration_positive;

alter table public.tp_route
  add constraint tp_route_duration_positive check (duration_minutes is null or duration_minutes >= 0);

create index if not exists tp_route_transport_lib_id_idx on public.tp_route (transport_lib_id);

-- Single-route travels: copy journey fields onto the lone route option.
update public.tp_route r
set
  cost_amount = a.cost_amount,
  cost_currency = a.cost_currency,
  duration_minutes = a.duration_minutes
from public.tp_action a
where r.action_id = a.id
  and a.kind = 'travel'
  and (select count(*) from public.tp_route r2 where r2.action_id = a.id) = 1
  and r.cost_amount is null
  and (a.cost_amount is not null or a.cost_currency is not null or a.duration_minutes is not null);

update public.tp_route r
set
  cost_amount = coalesce(r.cost_amount, at.cost_amount),
  cost_currency = coalesce(r.cost_currency, at.cost_currency),
  duration_minutes = coalesce(r.duration_minutes, at.duration_minutes),
  transport_lib_id = coalesce(r.transport_lib_id, at.transport_lib_id)
from public.tp_action a
join public.tp_action_transport at on at.action_id = a.id
where r.action_id = a.id
  and a.kind = 'travel'
  and (select count(*) from public.tp_route r2 where r2.action_id = a.id) = 1
  and (select count(*) from public.tp_action_transport at2 where at2.action_id = a.id) = 1;
