/*
 * Purpose: store an optional card icon in pod-private storage.
 * Affects: public.todo_card.icon_path
 */

alter table public.todo_card
  add column icon_path text;

comment on column public.todo_card.icon_path is
  'object path in the pod-private bucket for the card icon; null when unset.';

alter table public.todo_card
  add constraint todo_card_icon_path_not_blank check (
    icon_path is null or char_length(trim(icon_path)) > 0
  );
