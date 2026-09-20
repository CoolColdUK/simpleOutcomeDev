-- Optional two-level category groups: is_group folders; leaves may set parent_id.

alter table public.fp_category
  add column is_group boolean not null default false,
  add column parent_id uuid references public.fp_category (id) on delete set null;

comment on column public.fp_category.is_group is 'true = grouping folder only; transactions must not use this category.';
comment on column public.fp_category.parent_id is 'optional group for a leaf; must reference an is_group category in the same pod.';

alter table public.fp_category
  add constraint fp_category_group_shape_check check (
    (
      is_group = false
    )
    or (
      is_group = true
      and parent_id is null
      and budget_amount is null
      and budget_period is null
      and filters = '[]'::jsonb
    )
  );

create index fp_category_parent_id_idx on public.fp_category (parent_id)
  where parent_id is not null;

create function app_private.fp_category_enforce_parent()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_parent public.fp_category%rowtype;
begin
  if new.parent_id is null then
    return new;
  end if;
  if new.is_group then
    raise exception 'group categories cannot have a parent';
  end if;
  if new.parent_id = new.id then
    raise exception 'category cannot be its own parent';
  end if;
  select * into v_parent
  from public.fp_category
  where id = new.parent_id;
  if v_parent.id is null then
    raise exception 'parent category not found';
  end if;
  if v_parent.pod_id is distinct from new.pod_id then
    raise exception 'parent category must belong to the same pod';
  end if;
  if not v_parent.is_group then
    raise exception 'parent category must be a group';
  end if;
  if v_parent.parent_id is not null then
    raise exception 'category nesting deeper than two levels is not allowed';
  end if;
  return new;
end;
$$;

create trigger fp_category_enforce_parent
  before insert or update on public.fp_category
  for each row execute function app_private.fp_category_enforce_parent();

create or replace function app_private.fp_transaction_enforce_invariants()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_account_pod uuid;
  v_parent_account uuid;
  v_parent_parent uuid;
  v_category_is_group boolean;
begin
  if tg_op = 'UPDATE' and new.pod_id is distinct from old.pod_id then
    raise exception 'pod_id is immutable';
  end if;
  select a.pod_id into v_account_pod
  from public.fp_account a
  where a.id = new.account_id;
  if v_account_pod is null or v_account_pod is distinct from new.pod_id then
    raise exception 'account must belong to the same pod';
  end if;
  if new.category_id is not null then
    select c.is_group into v_category_is_group
    from public.fp_category c
    where c.id = new.category_id and c.pod_id = new.pod_id;
    if v_category_is_group is null then
      raise exception 'category must belong to the same pod';
    end if;
    if v_category_is_group then
      raise exception 'transactions cannot use a group category';
    end if;
  end if;
  if new.parent_id is not null then
    if new.parent_id = new.id then
      raise exception 'transaction cannot be its own parent';
    end if;
    select t.account_id, t.parent_id into v_parent_account, v_parent_parent
    from public.fp_transaction t
    where t.id = new.parent_id;
    if v_parent_account is null then
      raise exception 'parent transaction not found';
    end if;
    if v_parent_parent is not null then
      raise exception 'nested splits are not allowed';
    end if;
    if v_parent_account is distinct from new.account_id then
      raise exception 'child must use the parent account';
    end if;
  end if;
  return new;
end;
$$;
