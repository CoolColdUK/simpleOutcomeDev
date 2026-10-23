-- Location contact/hours; travel transport instance overrides; optional transport-lib mode.

alter table public.tp_location
  add column if not exists open_time time,
  add column if not exists close_time time,
  add column if not exists website text,
  add column if not exists email text,
  add column if not exists phone text;

alter table public.tp_action_transport
  add column if not exists duration_minutes integer,
  add column if not exists cost_amount numeric,
  add column if not exists cost_currency text,
  add column if not exists from_location_id uuid references public.tp_location (id) on delete set null,
  add column if not exists to_location_id uuid references public.tp_location (id) on delete set null;

alter table public.tp_action_transport
  drop constraint if exists tp_action_transport_duration_positive;

alter table public.tp_action_transport
  add constraint tp_action_transport_duration_positive check (duration_minutes is null or duration_minutes >= 0);

create index if not exists tp_action_transport_from_location_id_idx on public.tp_action_transport (from_location_id);
create index if not exists tp_action_transport_to_location_id_idx on public.tp_action_transport (to_location_id);

alter table public.tp_transport_lib alter column mode drop not null;
alter table public.tp_transport_lib alter column mode drop default;

alter table public.tp_transport_lib drop constraint if exists tp_transport_lib_mode_check;

alter table public.tp_transport_lib
  add constraint tp_transport_lib_mode_check check (
    mode is null
    or mode in ('flight', 'train', 'coach', 'bus', 'car', 'ferry', 'walk', 'other')
  );
