/*
 * Purpose: store todo due time and completion.
 * Affects: public.todo_card.due_at, public.todo_card.completed_at
 */

-- Existing date-only due values become midnight UTC.
alter table public.todo_card
  alter column due_at type timestamp with time zone
  using case
    when due_at is null then null
    else timezone('utc', due_at::timestamp)
  end;

alter table public.todo_card
  add column completed_at timestamp with time zone;

comment on column public.todo_card.due_at is 'optional due instant in utc.';
comment on column public.todo_card.completed_at is 'when set, the card is complete.';
