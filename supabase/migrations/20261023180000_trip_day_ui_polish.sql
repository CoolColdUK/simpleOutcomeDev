-- Trip day UI polish: route selection repair, activity places

-- 1. Sync is_selected from selected_route_id where set
update public.tp_route r
set is_selected = (r.id = a.selected_route_id)
from public.tp_action a
where a.id = r.action_id
  and a.selected_route_id is not null;

-- 2. Actions with null selected_route_id but route flags: pick one keeper per action
with keepers as (
  select a.id as action_id,
    (
      select r.id
      from public.tp_route r
      where r.action_id = a.id
        and r.is_selected
      order by r.sort_order, r.id
      limit 1
    ) as keeper_id
  from public.tp_action a
  where a.selected_route_id is null
    and exists (
      select 1
      from public.tp_route r2
      where r2.action_id = a.id
        and r2.is_selected
    )
)
update public.tp_route r
set is_selected = (r.id = k.keeper_id)
from keepers k
where r.action_id = k.action_id
  and k.keeper_id is not null;

with keepers as (
  select a.id as action_id,
    (
      select r.id
      from public.tp_route r
      where r.action_id = a.id
        and r.is_selected
      order by r.sort_order, r.id
      limit 1
    ) as keeper_id
  from public.tp_action a
  where a.selected_route_id is null
    and exists (
      select 1
      from public.tp_route r2
      where r2.action_id = a.id
        and r2.is_selected
    )
)
update public.tp_action a
set selected_route_id = k.keeper_id
from keepers k
where a.id = k.action_id
  and k.keeper_id is not null;

create unique index if not exists tp_route_one_selected_per_action
  on public.tp_route (action_id)
  where is_selected;

create table public.tp_activity_place (
  id uuid primary key default gen_random_uuid(),
  action_id uuid not null references public.tp_action (id) on delete cascade,
  place_text text not null,
  maps_url text,
  notes text,
  sort_order integer not null default 0,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint tp_activity_place_text_not_blank check (char_length(trim(place_text)) > 0)
);

create trigger tp_activity_place_set_updated_at before update on public.tp_activity_place
  for each row execute function extensions.moddatetime('updated_at');

alter table public.tp_activity_place enable row level security;

create policy tp_activity_place_all on public.tp_activity_place for all to authenticated
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

grant select, insert, update, delete on public.tp_activity_place to authenticated;
grant all on table public.tp_activity_place to service_role;
