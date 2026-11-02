-- Trip plan lock, per-activity lock, optional action-kind card background colours.

alter table public.tp_trip
  add column if not exists locked boolean not null default false;

alter table public.tp_action
  add column if not exists locked boolean not null default false;

alter table public.tp_setting
  add column if not exists action_kind_colors jsonb;
