/*
  purpose: do not treat identical rows from the same import as duplicates (e.g. two toll crossings the same day).
  affected: app_private.fp_is_duplicate, public.create_fp_import
*/

create or replace function app_private.fp_is_duplicate(
  p_account_id uuid,
  p_posted_date date,
  p_posted_time time,
  p_amount numeric,
  p_description text,
  p_recipient text,
  p_external_id text,
  p_exclude_import_id uuid
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
      and t.import_id is distinct from p_exclude_import_id
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

comment on function app_private.fp_is_duplicate(uuid, date, time, numeric, text, text, text, uuid) is
  'true when a matching non-archived parent already exists on the account outside the excluded import.';

create or replace function public.create_fp_import(
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
  v_file_line int;
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
    v_parsed := coalesce((v_file ->> 'parsed')::int, 0);
    v_created := 0;
    v_dup := 0;
    v_errors := coalesce(v_file -> 'logs', '[]'::jsonb);
    if jsonb_typeof(v_errors) <> 'array' then
      v_errors := '[]'::jsonb;
    end if;
    select count(*)::int
    into v_failed
    from jsonb_array_elements(v_errors) e
    where e->>'kind' = 'parse';
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
      v_idx := coalesce(nullif(v_row ->> 'row_index', '')::int, v_idx + 1);
      v_file_line := nullif(v_row ->> 'file_line', '')::int;
      if v_parsed < v_idx then
        v_parsed := v_idx;
      end if;
      begin
        v_date := (v_row ->> 'posted_date')::date;
        v_time := nullif(v_row ->> 'posted_time', '')::time;
        v_amount := (v_row ->> 'amount')::numeric;
        v_desc := coalesce(v_row ->> 'description', '');
        v_recip := coalesce(v_row ->> 'recipient', '');
        v_ext := nullif(v_row ->> 'external_id', '');
        v_notes := coalesce(v_row ->> 'notes', '');
        if app_private.fp_is_duplicate(
          p_account_id, v_date, v_time, v_amount, v_desc, v_recip, v_ext, v_import_id
        ) then
          v_dup := v_dup + 1;
          v_errors := v_errors || jsonb_build_array(jsonb_strip_nulls(jsonb_build_object(
            'kind', 'duplicate',
            'rowIndex', v_idx,
            'fileLine', v_file_line,
            'message', 'Skipped: already exists on this account from a previous import or entry.'
          )));
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
          v_errors := v_errors || jsonb_build_array(jsonb_strip_nulls(jsonb_build_object(
            'kind', 'error',
            'rowIndex', v_idx,
            'fileLine', v_file_line,
            'message', sqlerrm
          )));
      end;
    end loop;

    if v_parsed = 0 then
      v_parsed := v_created + v_dup + v_failed;
    end if;

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

drop function if exists app_private.fp_is_duplicate(uuid, date, time, numeric, text, text, text);

comment on function public.create_fp_import(uuid, uuid, uuid, jsonb) is
  'atomic csv import; skips duplicates from other imports only so same-file repeats are all stored.';
