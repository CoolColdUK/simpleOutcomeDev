-- Purpose: bootstrap tp_trip (and day strip) for trip_planning pods; backfill existing pods.

create or replace function app_private.tp_on_pod_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_trip_id uuid;
  v_start date := (timezone('utc', now()))::date;
begin
  if new.feature = 'trip_planning' then
    insert into public.tp_setting (pod_id) values (new.id);

    insert into public.tp_trip (pod_id, title, timezone, start_date, end_date, status)
    values (
      new.id,
      coalesce(nullif(trim(new.name), ''), 'Trip'),
      'UTC',
      v_start,
      v_start,
      'draft'
    )
    returning id into v_trip_id;

    insert into public.tp_day (trip_id, day_index, calendar_date)
    values (v_trip_id, 0, v_start);
  end if;
  return new;
end;
$$;

insert into public.tp_setting (pod_id)
select p.id
from public.pod p
where p.feature = 'trip_planning'
  and not exists (select 1 from public.tp_setting s where s.pod_id = p.id);

with inserted as (
  insert into public.tp_trip (pod_id, title, timezone, start_date, end_date, status)
  select
    p.id,
    coalesce(nullif(trim(p.name), ''), 'Trip'),
    'UTC',
    (timezone('utc', now()))::date,
    (timezone('utc', now()))::date,
    'draft'
  from public.pod p
  where p.feature = 'trip_planning'
    and not exists (select 1 from public.tp_trip t where t.pod_id = p.id)
  returning id, start_date
)
insert into public.tp_day (trip_id, day_index, calendar_date)
select i.id, 0, i.start_date
from inserted i
where not exists (select 1 from public.tp_day d where d.trip_id = i.id);

insert into public.tp_day (trip_id, day_index, calendar_date)
select t.id, 0, t.start_date
from public.tp_trip t
join public.pod p on p.id = t.pod_id
where p.feature = 'trip_planning'
  and not exists (select 1 from public.tp_day d where d.trip_id = t.id);
