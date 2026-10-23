-- Per-instance done flags on trip day cards, location links, transport instances, and route steps.

alter table public.tp_action
  add column if not exists done boolean not null default false;

alter table public.tp_action_location
  add column if not exists done boolean not null default false;

alter table public.tp_action_transport
  add column if not exists done boolean not null default false;

alter table public.tp_transport
  add column if not exists done boolean not null default false;
