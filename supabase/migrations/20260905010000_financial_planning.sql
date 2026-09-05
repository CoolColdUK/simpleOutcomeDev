/**
 * Purpose: financial_planning feature kind; fp ledger tables; RLS; import RPCs.
 * Affects: public.pod; public.create_pod; public.fp_setting; public.fp_account;
 *          public.fp_category; public.fp_parser; public.fp_import; public.fp_import_file;
 *          public.fp_transaction; app_private.fp_*.
 */

alter table public.pod
  drop constraint pod_feature_check;

alter table public.pod
  add constraint pod_feature_check
  check (feature in ('todo_list', 'shopping_list', 'financial_planning'));

drop function if exists public.create_pod(uuid, text, text, text, text);

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
  if p_feature not in ('todo_list', 'shopping_list', 'financial_planning') then
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

grant execute on function public.create_pod(uuid, text, text, text, text) to authenticated;
revoke execute on function public.create_pod(uuid, text, text, text, text) from anon, public;

create function app_private.fp_default_permission()
returns jsonb
language sql
immutable
as $$
  select '{
    "pod_user": {
      "account": ["read", "create", "update"],
      "category": ["read", "create", "update"],
      "transaction": ["read", "create", "update"],
      "parser": ["read"],
      "import": ["read"],
      "bill_split": ["create", "update"],
      "settings": ["read"],
      "delete_all": []
    },
    "pod_admin": {
      "account": ["read", "create", "update", "delete"],
      "category": ["read", "create", "update", "delete"],
      "transaction": ["read", "create", "update", "delete"],
      "parser": ["read", "create", "update", "delete"],
      "import": ["read", "create", "delete"],
      "bill_split": ["create", "update"],
      "settings": ["read"],
      "delete_all": []
    },
    "pod_owner": {
      "account": ["read", "create", "update", "delete"],
      "category": ["read", "create", "update", "delete"],
      "transaction": ["read", "create", "update", "delete"],
      "parser": ["read", "create", "update", "delete"],
      "import": ["read", "create", "delete"],
      "bill_split": ["create", "update", "delete"],
      "settings": ["read", "update"],
      "delete_all": ["create"]
    }
  }'::jsonb;
$$;

create table public.fp_setting (
  pod_id uuid primary key references public.pod (id) on delete cascade,
  currency text not null default 'GBP',
  permission jsonb not null default app_private.fp_default_permission(),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint fp_setting_currency_not_blank check (char_length(trim(currency)) >= 3)
);

comment on table public.fp_setting is 'per-pod currency and crud permission matrix for financial_planning.';

create function app_private.fp_effective_role(p_pod_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select case
    when app_private.is_space_owner(app_private.pod_space_id(p_pod_id)) then 'pod_owner'
    else app_private.pod_role(p_pod_id)
  end;
$$;

create function app_private.fp_can(p_pod_id uuid, p_resource text, p_action text)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_role text;
  v_perm jsonb;
  v_actions jsonb;
begin
  v_role := app_private.fp_effective_role(p_pod_id);
  if v_role is null or v_role = '' then
    return false;
  end if;
  select s.permission into v_perm
  from public.fp_setting s
  where s.pod_id = p_pod_id;
  if v_perm is null then
    v_perm := app_private.fp_default_permission();
  end if;
  v_actions := v_perm -> v_role -> p_resource;
  if v_actions is null or jsonb_typeof(v_actions) <> 'array' then
    v_actions := app_private.fp_default_permission() -> v_role -> p_resource;
  end if;
  if v_actions is null then
    return false;
  end if;
  return v_actions ? p_action;
end;
$$;

create function app_private.fp_on_pod_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.feature = 'financial_planning' then
    insert into public.fp_setting (pod_id, permission)
    values (new.id, app_private.fp_default_permission());
  end if;
  return new;
end;
$$;

create trigger fp_on_pod_insert
  after insert on public.pod
  for each row execute function app_private.fp_on_pod_insert();

create table public.fp_account (
  id uuid primary key default gen_random_uuid(),
  pod_id uuid not null references public.pod (id) on delete cascade,
  name text not null,
  kind text not null default 'current',
  opening_fund numeric not null default 0,
  archived boolean not null default false,
  notes text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint fp_account_name_not_blank check (char_length(trim(name)) > 0),
  constraint fp_account_kind_check check (kind in ('current', 'savings', 'credit_card', 'cash', 'other')),
  constraint fp_account_pod_name_unique unique (pod_id, name)
);

comment on table public.fp_account is 'bank or cash account for a financial_planning pod; balance is derived.';

create table public.fp_category (
  id uuid primary key default gen_random_uuid(),
  pod_id uuid not null references public.pod (id) on delete cascade,
  name text not null,
  direction text not null,
  budget_amount numeric,
  budget_period text,
  favourite boolean not null default false,
  sort_order integer not null default 0,
  colour text,
  filters jsonb not null default '[]'::jsonb,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint fp_category_name_not_blank check (char_length(trim(name)) > 0),
  constraint fp_category_direction_check check (direction in ('transfer', 'income', 'expense', 'saving')),
  constraint fp_category_budget_period_check check (budget_period is null or budget_period in ('monthly', 'yearly')),
  constraint fp_category_budget_pair_check check (
    (budget_amount is null and budget_period is null)
    or (budget_amount is not null and budget_period is not null)
  ),
  constraint fp_category_pod_name_unique unique (pod_id, name)
);

comment on table public.fp_category is 'purpose of a transaction; uncategorised is category_id null.';

create table public.fp_parser (
  id uuid primary key default gen_random_uuid(),
  pod_id uuid not null references public.pod (id) on delete cascade,
  name text not null,
  identifier text,
  has_header boolean not null default true,
  skip_rows integer not null default 0,
  delimiter text not null default ',',
  column_map jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint fp_parser_name_not_blank check (char_length(trim(name)) > 0),
  constraint fp_parser_delimiter_len check (char_length(delimiter) = 1),
  constraint fp_parser_skip_rows_check check (skip_rows >= 0)
);

comment on table public.fp_parser is 'csv column map; not linked to an account.';

create table public.fp_import (
  id uuid primary key default gen_random_uuid(),
  pod_id uuid not null references public.pod (id) on delete cascade,
  parser_id uuid references public.fp_parser (id) on delete set null,
  account_id uuid not null references public.fp_account (id) on delete restrict,
  created_by uuid not null references auth.users (id),
  created_at timestamp with time zone not null default now(),
  undone_at timestamp with time zone
);

comment on table public.fp_import is 'import batch report; undone_at set when transactions are removed.';

create table public.fp_import_file (
  id uuid primary key default gen_random_uuid(),
  import_id uuid not null references public.fp_import (id) on delete cascade,
  pod_id uuid not null references public.pod (id) on delete cascade,
  file_name text not null,
  content_sha256 text not null,
  parsed integer not null default 0,
  created_count integer not null default 0,
  duplicate_skipped integer not null default 0,
  failed integer not null default 0,
  errors jsonb not null default '[]'::jsonb,
  created_at timestamp with time zone not null default now()
);

comment on table public.fp_import_file is 'per-file import report including content hash.';

create table public.fp_transaction (
  id uuid primary key default gen_random_uuid(),
  pod_id uuid not null references public.pod (id) on delete cascade,
  account_id uuid not null references public.fp_account (id) on delete restrict,
  posted_date date not null,
  posted_time time,
  amount numeric not null,
  description text not null default '',
  recipient text not null default '',
  notes text not null default '',
  external_id text,
  category_id uuid references public.fp_category (id) on delete set null,
  confirmed boolean not null default true,
  parser_id uuid references public.fp_parser (id) on delete set null,
  import_id uuid references public.fp_import (id) on delete set null,
  archived boolean not null default false,
  parent_id uuid references public.fp_transaction (id) on delete restrict,
  split_portion_count integer,
  split_recurrence text,
  created_by uuid not null references auth.users (id),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint fp_transaction_split_recurrence_check check (
    split_recurrence is null or split_recurrence in ('monthly')
  ),
  constraint fp_transaction_split_portion_check check (
    split_portion_count is null or split_portion_count >= 2
  )
);

comment on table public.fp_transaction is 'ledger row; children are allocations and are excluded from account balance.';

create index fp_account_pod_id_idx on public.fp_account (pod_id);
create index fp_category_pod_id_sort_idx on public.fp_category (pod_id, sort_order);
create index fp_parser_pod_id_idx on public.fp_parser (pod_id);
create index fp_import_pod_id_idx on public.fp_import (pod_id, created_at desc);
create index fp_import_file_pod_sha_idx on public.fp_import_file (pod_id, content_sha256);
create index fp_transaction_pod_date_idx on public.fp_transaction (pod_id, posted_date);
create index fp_transaction_account_date_idx on public.fp_transaction (account_id, posted_date);
create index fp_transaction_account_external_idx on public.fp_transaction (account_id, external_id)
  where external_id is not null;
create index fp_transaction_parent_id_idx on public.fp_transaction (parent_id);
create index fp_transaction_import_id_idx on public.fp_transaction (import_id);
create index fp_transaction_archived_idx on public.fp_transaction (pod_id, archived);

create trigger fp_setting_set_updated_at
  before update on public.fp_setting
  for each row execute function extensions.moddatetime('updated_at');

create trigger fp_account_set_updated_at
  before update on public.fp_account
  for each row execute function extensions.moddatetime('updated_at');

create trigger fp_category_set_updated_at
  before update on public.fp_category
  for each row execute function extensions.moddatetime('updated_at');

create trigger fp_parser_set_updated_at
  before update on public.fp_parser
  for each row execute function extensions.moddatetime('updated_at');

create trigger fp_transaction_set_updated_at
  before update on public.fp_transaction
  for each row execute function extensions.moddatetime('updated_at');

create function app_private.fp_transaction_enforce_invariants()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_account_pod uuid;
  v_parent_account uuid;
  v_parent_parent uuid;
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
  if new.category_id is not null and not exists (
    select 1 from public.fp_category c where c.id = new.category_id and c.pod_id = new.pod_id
  ) then
    raise exception 'category must belong to the same pod';
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

create trigger fp_transaction_enforce_invariants
  before insert or update on public.fp_transaction
  for each row execute function app_private.fp_transaction_enforce_invariants();

alter table public.fp_setting enable row level security;
alter table public.fp_account enable row level security;
alter table public.fp_category enable row level security;
alter table public.fp_parser enable row level security;
alter table public.fp_import enable row level security;
alter table public.fp_import_file enable row level security;
alter table public.fp_transaction enable row level security;

create policy fp_setting_select on public.fp_setting
  for select to authenticated
  using (app_private.fp_can(pod_id, 'transaction', 'read'));
create policy fp_setting_update on public.fp_setting
  for update to authenticated
  using (app_private.fp_can(pod_id, 'settings', 'update'))
  with check (app_private.fp_can(pod_id, 'settings', 'update'));
create policy fp_setting_anon_select on public.fp_setting for select to anon using (false);
create policy fp_setting_anon_update on public.fp_setting for update to anon using (false);

create policy fp_account_select on public.fp_account
  for select to authenticated
  using (app_private.fp_can(pod_id, 'transaction', 'read'));
create policy fp_account_insert on public.fp_account
  for insert to authenticated
  with check (app_private.fp_can(pod_id, 'account', 'create'));
create policy fp_account_update on public.fp_account
  for update to authenticated
  using (app_private.fp_can(pod_id, 'account', 'update'))
  with check (app_private.fp_can(pod_id, 'account', 'update'));
create policy fp_account_delete on public.fp_account
  for delete to authenticated
  using (app_private.fp_can(pod_id, 'account', 'delete'));
create policy fp_account_anon_select on public.fp_account for select to anon using (false);
create policy fp_account_anon_insert on public.fp_account for insert to anon with check (false);
create policy fp_account_anon_update on public.fp_account for update to anon using (false);
create policy fp_account_anon_delete on public.fp_account for delete to anon using (false);

create policy fp_category_select on public.fp_category
  for select to authenticated
  using (app_private.fp_can(pod_id, 'transaction', 'read'));
create policy fp_category_insert on public.fp_category
  for insert to authenticated
  with check (app_private.fp_can(pod_id, 'category', 'create'));
create policy fp_category_update on public.fp_category
  for update to authenticated
  using (app_private.fp_can(pod_id, 'category', 'update'))
  with check (app_private.fp_can(pod_id, 'category', 'update'));
create policy fp_category_delete on public.fp_category
  for delete to authenticated
  using (app_private.fp_can(pod_id, 'category', 'delete'));
create policy fp_category_anon_select on public.fp_category for select to anon using (false);
create policy fp_category_anon_insert on public.fp_category for insert to anon with check (false);
create policy fp_category_anon_update on public.fp_category for update to anon using (false);
create policy fp_category_anon_delete on public.fp_category for delete to anon using (false);

create policy fp_parser_select on public.fp_parser
  for select to authenticated
  using (app_private.fp_can(pod_id, 'transaction', 'read'));
create policy fp_parser_insert on public.fp_parser
  for insert to authenticated
  with check (app_private.fp_can(pod_id, 'parser', 'create'));
create policy fp_parser_update on public.fp_parser
  for update to authenticated
  using (app_private.fp_can(pod_id, 'parser', 'update'))
  with check (app_private.fp_can(pod_id, 'parser', 'update'));
create policy fp_parser_delete on public.fp_parser
  for delete to authenticated
  using (app_private.fp_can(pod_id, 'parser', 'delete'));
create policy fp_parser_anon_select on public.fp_parser for select to anon using (false);
create policy fp_parser_anon_insert on public.fp_parser for insert to anon with check (false);
create policy fp_parser_anon_update on public.fp_parser for update to anon using (false);
create policy fp_parser_anon_delete on public.fp_parser for delete to anon using (false);

create policy fp_import_select on public.fp_import
  for select to authenticated
  using (app_private.fp_can(pod_id, 'transaction', 'read'));
create policy fp_import_anon_select on public.fp_import for select to anon using (false);

create policy fp_import_file_select on public.fp_import_file
  for select to authenticated
  using (app_private.fp_can(pod_id, 'transaction', 'read'));
create policy fp_import_file_anon_select on public.fp_import_file for select to anon using (false);

create policy fp_transaction_select on public.fp_transaction
  for select to authenticated
  using (app_private.fp_can(pod_id, 'transaction', 'read'));
create policy fp_transaction_insert on public.fp_transaction
  for insert to authenticated
  with check (
    created_by = (select auth.uid())
    and (
      (parent_id is null and app_private.fp_can(pod_id, 'transaction', 'create'))
      or (parent_id is not null and app_private.fp_can(pod_id, 'bill_split', 'create'))
    )
  );
create policy fp_transaction_update on public.fp_transaction
  for update to authenticated
  using (
    (parent_id is null and app_private.fp_can(pod_id, 'transaction', 'update'))
    or (parent_id is not null and app_private.fp_can(pod_id, 'bill_split', 'update'))
  )
  with check (
    (parent_id is null and app_private.fp_can(pod_id, 'transaction', 'update'))
    or (parent_id is not null and app_private.fp_can(pod_id, 'bill_split', 'update'))
  );
create policy fp_transaction_delete on public.fp_transaction
  for delete to authenticated
  using (
    (parent_id is null and app_private.fp_can(pod_id, 'transaction', 'delete'))
    or (parent_id is not null and (
      app_private.fp_can(pod_id, 'bill_split', 'delete')
      or app_private.fp_can(pod_id, 'transaction', 'delete')
    ))
  );
create policy fp_transaction_anon_select on public.fp_transaction for select to anon using (false);
create policy fp_transaction_anon_insert on public.fp_transaction for insert to anon with check (false);
create policy fp_transaction_anon_update on public.fp_transaction for update to anon using (false);
create policy fp_transaction_anon_delete on public.fp_transaction for delete to anon using (false);

grant select, insert, update, delete on public.fp_setting to authenticated;
grant select, insert, update, delete on public.fp_account to authenticated;
grant select, insert, update, delete on public.fp_category to authenticated;
grant select, insert, update, delete on public.fp_parser to authenticated;
grant select on public.fp_import to authenticated;
grant select on public.fp_import_file to authenticated;
grant select, insert, update, delete on public.fp_transaction to authenticated;
revoke all on public.fp_setting from anon, public;
revoke all on public.fp_account from anon, public;
revoke all on public.fp_category from anon, public;
revoke all on public.fp_parser from anon, public;
revoke all on public.fp_import from anon, public;
revoke all on public.fp_import_file from anon, public;
revoke all on public.fp_transaction from anon, public;

create function app_private.fp_is_duplicate(
  p_account_id uuid,
  p_posted_date date,
  p_posted_time time,
  p_amount numeric,
  p_description text,
  p_recipient text,
  p_external_id text
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.fp_transaction t
    where t.account_id = p_account_id
      and t.archived = false
      and t.parent_id is null
      and (
        (p_external_id is not null and t.external_id = p_external_id)
        or (
          p_external_id is null
          and t.posted_date = p_posted_date
          and t.amount = p_amount
          and t.description = p_description
          and t.recipient = p_recipient
          and (
            p_posted_time is null
            or t.posted_time is null
            or t.posted_time = p_posted_time
          )
        )
      )
  );
$$;

create function public.create_fp_import(
  p_pod_id uuid,
  p_parser_id uuid,
  p_account_id uuid,
  p_files jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_import_id uuid;
  v_file jsonb;
  v_file_id uuid;
  v_row jsonb;
  v_parsed int;
  v_created int;
  v_dup int;
  v_failed int;
  v_errors jsonb;
  v_date date;
  v_time time;
  v_amount numeric;
  v_desc text;
  v_recip text;
  v_ext text;
  v_notes text;
  v_idx int;
begin
  v_uid := (select auth.uid());
  if not app_private.fp_can(p_pod_id, 'import', 'create') then
    raise exception 'not allowed to import';
  end if;
  if not exists (
    select 1 from public.fp_account a where a.id = p_account_id and a.pod_id = p_pod_id
  ) then
    raise exception 'account not in pod';
  end if;
  if p_parser_id is not null and not exists (
    select 1 from public.fp_parser p where p.id = p_parser_id and p.pod_id = p_pod_id
  ) then
    raise exception 'parser not in pod';
  end if;

  insert into public.fp_import (pod_id, parser_id, account_id, created_by)
  values (p_pod_id, p_parser_id, p_account_id, v_uid)
  returning id into v_import_id;

  for v_file in select * from jsonb_array_elements(p_files)
  loop
    v_parsed := 0;
    v_created := 0;
    v_dup := 0;
    v_failed := 0;
    v_errors := '[]'::jsonb;
    v_idx := 0;

    insert into public.fp_import_file (
      import_id, pod_id, file_name, content_sha256
    )
    values (
      v_import_id,
      p_pod_id,
      coalesce(v_file ->> 'file_name', 'file.csv'),
      coalesce(v_file ->> 'content_sha256', '')
    )
    returning id into v_file_id;

    for v_row in select * from jsonb_array_elements(coalesce(v_file -> 'rows', '[]'::jsonb))
    loop
      v_idx := v_idx + 1;
      v_parsed := v_parsed + 1;
      begin
        v_date := (v_row ->> 'posted_date')::date;
        v_time := nullif(v_row ->> 'posted_time', '')::time;
        v_amount := (v_row ->> 'amount')::numeric;
        v_desc := coalesce(v_row ->> 'description', '');
        v_recip := coalesce(v_row ->> 'recipient', '');
        v_ext := nullif(v_row ->> 'external_id', '');
        v_notes := coalesce(v_row ->> 'notes', '');
        if app_private.fp_is_duplicate(
          p_account_id, v_date, v_time, v_amount, v_desc, v_recip, v_ext
        ) then
          v_dup := v_dup + 1;
        else
          insert into public.fp_transaction (
            pod_id, account_id, posted_date, posted_time, amount, description, recipient,
            notes, external_id, parser_id, import_id, created_by
          )
          values (
            p_pod_id, p_account_id, v_date, v_time, v_amount, v_desc, v_recip,
            v_notes, v_ext, p_parser_id, v_import_id, v_uid
          );
          v_created := v_created + 1;
        end if;
      exception
        when others then
          v_failed := v_failed + 1;
          v_errors := v_errors || jsonb_build_array(jsonb_build_object(
            'rowIndex', v_idx,
            'message', sqlerrm
          ));
      end;
    end loop;

    update public.fp_import_file
    set
      parsed = v_parsed,
      created_count = v_created,
      duplicate_skipped = v_dup,
      failed = v_failed,
      errors = v_errors
    where id = v_file_id;
  end loop;

  return v_import_id;
end;
$$;

comment on function public.create_fp_import(uuid, uuid, uuid, jsonb) is 'atomic csv import with same-account duplicate skip.';

create function public.undo_fp_import(p_import_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pod uuid;
begin
  select i.pod_id into v_pod
  from public.fp_import i
  where i.id = p_import_id;
  if v_pod is null then
    raise exception 'import not found';
  end if;
  if not app_private.fp_can(v_pod, 'import', 'delete') then
    raise exception 'not allowed to undo import';
  end if;
  if exists (select 1 from public.fp_import i where i.id = p_import_id and i.undone_at is not null) then
    raise exception 'import already undone';
  end if;

  delete from public.fp_transaction c
  using public.fp_transaction p
  where c.parent_id = p.id
    and p.import_id = p_import_id;

  delete from public.fp_transaction
  where import_id = p_import_id;

  update public.fp_import
  set undone_at = now()
  where id = p_import_id;
end;
$$;

create function public.delete_all_fp_transactions(p_pod_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not app_private.fp_can(p_pod_id, 'delete_all', 'create') then
    raise exception 'not allowed to delete all transactions';
  end if;
  delete from public.fp_transaction
  where pod_id = p_pod_id
    and parent_id is not null;
  delete from public.fp_transaction
  where pod_id = p_pod_id;
end;
$$;

create function public.sum_fp_account_balance(p_account_id uuid)
returns numeric
language sql
stable
security definer
set search_path = public
as $$
  select a.opening_fund + coalesce((
    select sum(t.amount)
    from public.fp_transaction t
    where t.account_id = a.id
      and t.archived = false
      and t.parent_id is null
  ), 0)
  from public.fp_account a
  where a.id = p_account_id
    and app_private.fp_can(a.pod_id, 'transaction', 'read');
$$;

grant execute on function public.create_fp_import(uuid, uuid, uuid, jsonb) to authenticated;
grant execute on function public.undo_fp_import(uuid) to authenticated;
grant execute on function public.delete_all_fp_transactions(uuid) to authenticated;
grant execute on function public.sum_fp_account_balance(uuid) to authenticated;
revoke execute on function public.create_fp_import(uuid, uuid, uuid, jsonb) from anon, public;
revoke execute on function public.undo_fp_import(uuid) from anon, public;
revoke execute on function public.delete_all_fp_transactions(uuid) from anon, public;
revoke execute on function public.sum_fp_account_balance(uuid) from anon, public;
