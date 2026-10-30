-- Transport-library importance for travel day-card alerts.
-- Importance stays on the library row and is resolved through transport_lib_id.

alter table public.tp_transport_lib
  add column if not exists important boolean not null default false,
  add column if not exists important_reason text;

alter table public.tp_transport_lib
  drop constraint if exists tp_transport_lib_important_reason_len;

alter table public.tp_transport_lib
  add constraint tp_transport_lib_important_reason_len
  check (important_reason is null or char_length(important_reason) <= 500);
