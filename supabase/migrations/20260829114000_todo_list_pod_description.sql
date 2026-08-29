/**
 * Purpose: pod description; todo board tables; private image bucket; moddatetime.
 * Affects: public.pod; public.todo_column; public.todo_card; public.todo_card_comment;
 *          public.create_pod; public.update_pod; storage.buckets; storage.objects;
 *          app_private helpers; extensions.moddatetime.
 */

create extension if not exists moddatetime with schema extensions;

-- optional description on the pod instance
alter table public.pod
  add column description text;

alter table public.pod
  add constraint pod_description_length_check
  check (description is null or char_length(description) <= 500);

comment on column public.pod.description is 'optional short description of this pod instance; blank stored as null.';

drop function if exists public.create_pod(uuid, text, text, text);

create function public.create_pod(
  p_space_id uuid,
  p_feature text,
  p_name text,
  p_visibility text,
  p_description text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_uid uuid;
begin
  v_uid := (select auth.uid());
  if not app_private.is_space_admin_or_owner(p_space_id) then
    raise exception 'not allowed to create pod';
  end if;
  if p_feature not in ('todo_list', 'shopping_list') then
    raise exception 'invalid feature';
  end if;
  if p_visibility not in ('open', 'request', 'private') then
    raise exception 'invalid visibility';
  end if;
  insert into public.pod (space_id, feature, name, visibility, description, created_by)
  values (
    p_space_id,
    p_feature,
    nullif(trim(p_name), ''),
    p_visibility,
    nullif(trim(p_description), ''),
    v_uid
  )
  returning id into v_id;
  insert into public.pod_member (pod_id, user_id, role)
  values (v_id, v_uid, 'pod_owner');
  return v_id;
end;
$$;

comment on function public.create_pod(uuid, text, text, text, text) is 'space owner or admin creates a pod and becomes pod_owner.';

drop function if exists public.update_pod(uuid, text, text);

create function public.update_pod(
  p_pod_id uuid,
  p_name text,
  p_visibility text,
  p_description text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not app_private.can_manage_pod(p_pod_id) then
    raise exception 'not allowed to update pod';
  end if;
  if p_visibility not in ('open', 'request', 'private') then
    raise exception 'invalid visibility';
  end if;
  update public.pod
  set
    name = nullif(trim(p_name), ''),
    visibility = p_visibility,
    description = nullif(trim(p_description), ''),
    updated_at = now()
  where id = p_pod_id;
end;
$$;

comment on function public.update_pod(uuid, text, text, text) is 'pod owner or space owner updates name, visibility, and description.';

grant execute on function public.create_pod(uuid, text, text, text, text) to authenticated;
grant execute on function public.update_pod(uuid, text, text, text) to authenticated;
revoke execute on function public.create_pod(uuid, text, text, text, text) from anon, public;
revoke execute on function public.update_pod(uuid, text, text, text) from anon, public;

-- board access: members and space owner (not merely viewers of an open pod)
create function app_private.can_read_todo_pod(p_pod_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select app_private.is_pod_member(p_pod_id)
    or app_private.is_space_owner(app_private.pod_space_id(p_pod_id));
$$;

create function app_private.can_manage_todo_columns(p_pod_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select app_private.is_pod_owner_or_admin(p_pod_id)
    or app_private.is_space_owner(app_private.pod_space_id(p_pod_id));
$$;

create function app_private.can_manage_todo_cards(p_pod_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select app_private.can_read_todo_pod(p_pod_id);
$$;

create table public.todo_column (
  id uuid primary key default gen_random_uuid(),
  pod_id uuid not null references public.pod (id) on delete cascade,
  title text not null,
  sort_order integer not null default 0,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint todo_column_title_not_blank check (char_length(trim(title)) > 0)
);

comment on table public.todo_column is 'kanban column for a todo_list pod; archive is not a row here.';

create table public.todo_card (
  id uuid primary key default gen_random_uuid(),
  pod_id uuid not null references public.pod (id) on delete cascade,
  column_id uuid references public.todo_column (id) on delete set null,
  title text not null,
  description text not null default '',
  due_at date,
  tags text[] not null default '{}',
  assignee_user_id uuid references public.profile (id) on delete set null,
  sort_order integer not null default 0,
  created_by uuid not null references auth.users (id),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint todo_card_title_not_blank check (char_length(trim(title)) > 0)
);

comment on table public.todo_card is 'todo card; column_id null means archived.';

create table public.todo_card_comment (
  id uuid primary key default gen_random_uuid(),
  pod_id uuid not null references public.pod (id) on delete cascade,
  card_id uuid not null references public.todo_card (id) on delete cascade,
  body text not null,
  created_by uuid not null references auth.users (id),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint todo_card_comment_body_not_blank check (char_length(trim(body)) > 0)
);

comment on table public.todo_card_comment is 'comment on a todo card; same pod isolation as the card.';

create index todo_column_pod_id_sort_idx on public.todo_column (pod_id, sort_order);
create index todo_card_pod_id_column_id_sort_idx on public.todo_card (pod_id, column_id, sort_order);
create index todo_card_comment_card_id_idx on public.todo_card_comment (card_id, created_at);

create trigger todo_column_set_updated_at
  before update on public.todo_column
  for each row execute function extensions.moddatetime('updated_at');

create trigger todo_card_set_updated_at
  before update on public.todo_card
  for each row execute function extensions.moddatetime('updated_at');

create trigger todo_card_comment_set_updated_at
  before update on public.todo_card_comment
  for each row execute function extensions.moddatetime('updated_at');

create function app_private.todo_card_enforce_invariants()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' and new.pod_id is distinct from old.pod_id then
    raise exception 'pod_id is immutable';
  end if;
  if new.column_id is not null then
    if not exists (
      select 1
      from public.todo_column c
      where c.id = new.column_id
        and c.pod_id = new.pod_id
    ) then
      raise exception 'column must belong to the same pod';
    end if;
  end if;
  if new.assignee_user_id is not null then
    if not exists (
      select 1
      from public.pod_member pm
      where pm.pod_id = new.pod_id
        and pm.user_id = new.assignee_user_id
    ) then
      raise exception 'assignee must be a pod member';
    end if;
  end if;
  return new;
end;
$$;

create trigger todo_card_enforce_invariants
  before insert or update on public.todo_card
  for each row execute function app_private.todo_card_enforce_invariants();

create function app_private.todo_card_comment_enforce_invariants()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' and new.pod_id is distinct from old.pod_id then
    raise exception 'pod_id is immutable';
  end if;
  if tg_op = 'UPDATE' and new.card_id is distinct from old.card_id then
    raise exception 'card_id is immutable';
  end if;
  if not exists (
    select 1
    from public.todo_card c
    where c.id = new.card_id
      and c.pod_id = new.pod_id
  ) then
    raise exception 'comment must belong to a card in the same pod';
  end if;
  return new;
end;
$$;

create trigger todo_card_comment_enforce_invariants
  before insert or update on public.todo_card_comment
  for each row execute function app_private.todo_card_comment_enforce_invariants();

create function app_private.todo_column_immutable_pod()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.pod_id is distinct from old.pod_id then
    raise exception 'pod_id is immutable';
  end if;
  return new;
end;
$$;

create trigger todo_column_immutable_pod
  before update on public.todo_column
  for each row execute function app_private.todo_column_immutable_pod();

alter table public.todo_column enable row level security;
alter table public.todo_card enable row level security;
alter table public.todo_card_comment enable row level security;

create policy todo_column_select_authenticated on public.todo_column
  for select to authenticated
  using (app_private.can_read_todo_pod(pod_id));

create policy todo_column_select_anon_denied on public.todo_column
  for select to anon using (false);

create policy todo_column_insert_authenticated on public.todo_column
  for insert to authenticated
  with check (app_private.can_manage_todo_columns(pod_id));

create policy todo_column_insert_anon_denied on public.todo_column
  for insert to anon with check (false);

create policy todo_column_update_authenticated on public.todo_column
  for update to authenticated
  using (app_private.can_manage_todo_columns(pod_id))
  with check (app_private.can_manage_todo_columns(pod_id));

create policy todo_column_update_anon_denied on public.todo_column
  for update to anon using (false);

create policy todo_column_delete_authenticated on public.todo_column
  for delete to authenticated
  using (app_private.can_manage_todo_columns(pod_id));

create policy todo_column_delete_anon_denied on public.todo_column
  for delete to anon using (false);

create policy todo_card_select_authenticated on public.todo_card
  for select to authenticated
  using (app_private.can_read_todo_pod(pod_id));

create policy todo_card_select_anon_denied on public.todo_card
  for select to anon using (false);

create policy todo_card_insert_authenticated on public.todo_card
  for insert to authenticated
  with check (
    app_private.can_manage_todo_cards(pod_id)
    and created_by = (select auth.uid())
  );

create policy todo_card_insert_anon_denied on public.todo_card
  for insert to anon with check (false);

create policy todo_card_update_authenticated on public.todo_card
  for update to authenticated
  using (app_private.can_manage_todo_cards(pod_id))
  with check (app_private.can_manage_todo_cards(pod_id));

create policy todo_card_update_anon_denied on public.todo_card
  for update to anon using (false);

create policy todo_card_delete_authenticated on public.todo_card
  for delete to authenticated
  using (app_private.can_manage_todo_cards(pod_id));

create policy todo_card_delete_anon_denied on public.todo_card
  for delete to anon using (false);

create policy todo_card_comment_select_authenticated on public.todo_card_comment
  for select to authenticated
  using (app_private.can_read_todo_pod(pod_id));

create policy todo_card_comment_select_anon_denied on public.todo_card_comment
  for select to anon using (false);

create policy todo_card_comment_insert_authenticated on public.todo_card_comment
  for insert to authenticated
  with check (
    app_private.can_manage_todo_cards(pod_id)
    and created_by = (select auth.uid())
  );

create policy todo_card_comment_insert_anon_denied on public.todo_card_comment
  for insert to anon with check (false);

create policy todo_card_comment_update_authenticated on public.todo_card_comment
  for update to authenticated
  using (
    app_private.can_manage_todo_cards(pod_id)
    and created_by = (select auth.uid())
  )
  with check (
    app_private.can_manage_todo_cards(pod_id)
    and created_by = (select auth.uid())
  );

create policy todo_card_comment_update_anon_denied on public.todo_card_comment
  for update to anon using (false);

create policy todo_card_comment_delete_authenticated on public.todo_card_comment
  for delete to authenticated
  using (
    app_private.can_manage_todo_cards(pod_id)
    and (
      created_by = (select auth.uid())
      or app_private.can_manage_todo_columns(pod_id)
    )
  );

create policy todo_card_comment_delete_anon_denied on public.todo_card_comment
  for delete to anon using (false);

grant select, insert, update, delete on public.todo_column to authenticated;
grant select, insert, update, delete on public.todo_card to authenticated;
grant select, insert, update, delete on public.todo_card_comment to authenticated;
revoke all on public.todo_column from anon, public;
revoke all on public.todo_card from anon, public;
revoke all on public.todo_card_comment from anon, public;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'pod-private',
  'pod-private',
  false,
  5242880,
  array['image/jpeg', 'image/png']
)
on conflict (id) do nothing;

create function app_private.pod_id_from_storage_object_name(p_name text)
returns uuid
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_seg text;
begin
  v_seg := split_part(p_name, '/', 1);
  if v_seg is null or v_seg !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return null;
  end if;
  return v_seg::uuid;
end;
$$;

create policy pod_private_objects_select_authenticated on storage.objects
  for select to authenticated
  using (
    bucket_id = 'pod-private'
    and app_private.can_read_todo_pod(app_private.pod_id_from_storage_object_name(name))
  );

create policy pod_private_objects_insert_authenticated on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'pod-private'
    and app_private.can_manage_todo_cards(app_private.pod_id_from_storage_object_name(name))
  );

create policy pod_private_objects_update_authenticated on storage.objects
  for update to authenticated
  using (
    bucket_id = 'pod-private'
    and app_private.can_manage_todo_cards(app_private.pod_id_from_storage_object_name(name))
  )
  with check (
    bucket_id = 'pod-private'
    and app_private.can_manage_todo_cards(app_private.pod_id_from_storage_object_name(name))
  );

create policy pod_private_objects_delete_authenticated on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'pod-private'
    and app_private.can_manage_todo_cards(app_private.pod_id_from_storage_object_name(name))
  );
