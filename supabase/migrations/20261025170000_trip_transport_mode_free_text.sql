-- Free-text transport library mode; step mode may copy custom strings from the library.

alter table public.tp_transport_lib
  drop constraint if exists tp_transport_lib_mode_check;

alter table public.tp_transport
  drop constraint if exists tp_transport_mode_check;
