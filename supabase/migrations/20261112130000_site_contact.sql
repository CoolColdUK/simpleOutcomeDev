-- Salon contact form. The delivery address is not readable by the anon key.
-- Affects: public.site; public.site_contact; public.site_enquiry_month; public.site_enquiry_send; public.record_site_enquiry.

alter table public.site
  add column messages_enabled boolean not null default true;

comment on column public.site.messages_enabled is 'When false, the contact form is hidden and the post is refused. The anon key may read it.';

create table public.site_contact (
  site_id uuid primary key references public.site (id) on delete cascade,
  delivery_email text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint site_contact_delivery_email_check check (
    position('@' in delivery_email) > 1
    and position(' ' in delivery_email) = 0
    and char_length(delivery_email) <= 200
  )
);

comment on table public.site_contact is 'Private salon inbox for website enquiries. No anon or authenticated grant.';

create trigger site_contact_set_updated_at
  before update on public.site_contact
  for each row execute function extensions.moddatetime('updated_at');

alter table public.site_contact enable row level security;

revoke all on table public.site_contact from public, anon, authenticated;
grant all on table public.site_contact to service_role;

create table public.site_enquiry_month (
  site_id uuid not null references public.site (id) on delete cascade,
  month date not null,
  count integer not null default 0,
  primary key (site_id, month),
  constraint site_enquiry_month_first_day check (extract(day from month) = 1),
  constraint site_enquiry_month_count_check check (count >= 0)
);

comment on table public.site_enquiry_month is 'Count of live enquiries per London calendar month. No name, email, message, or IP.';

alter table public.site_enquiry_month enable row level security;

revoke all on table public.site_enquiry_month from public, anon, authenticated;
grant all on table public.site_enquiry_month to service_role;

create table public.site_enquiry_send (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.site (id) on delete cascade,
  resend_id text not null,
  created_at timestamptz not null default now(),
  constraint site_enquiry_send_resend_id_check check (char_length(resend_id) between 1 and 120)
);

comment on table public.site_enquiry_send is 'Resend message id and time for a sent enquiry. No name, email, or message body.';

create index site_enquiry_send_site_id_idx on public.site_enquiry_send (site_id, created_at desc);

alter table public.site_enquiry_send enable row level security;

revoke all on table public.site_enquiry_send from public, anon, authenticated;
grant all on table public.site_enquiry_send to service_role;

create function public.record_site_enquiry(
  p_site_id uuid,
  p_month date,
  p_resend_id text,
  p_count boolean
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if p_site_id is null or p_month is null or p_resend_id is null or p_count is null then
    raise exception 'invalid enquiry record';
  end if;
  if extract(day from p_month) <> 1 then
    raise exception 'invalid enquiry record';
  end if;
  if char_length(p_resend_id) < 1 or char_length(p_resend_id) > 120 then
    raise exception 'invalid enquiry record';
  end if;
  if p_count then
    insert into public.site_enquiry_month (site_id, month, count)
    values (p_site_id, p_month, 1)
    on conflict (site_id, month)
    do update set count = public.site_enquiry_month.count + 1;
  end if;
  insert into public.site_enquiry_send (site_id, resend_id)
  values (p_site_id, p_resend_id);
end;
$$;

comment on function public.record_site_enquiry(uuid, date, text, boolean) is 'After Resend accepts a send, store the message id. Count live enquiries only.';

revoke all on function public.record_site_enquiry(uuid, date, text, boolean) from public, anon, authenticated;
grant execute on function public.record_site_enquiry(uuid, date, text, boolean) to service_role;

update public.site as site
set document = jsonb_set(
  jsonb_set(
    site.document,
    '{sections}',
    site.document->'sections' || $form$[{"id":"message","type":"contactForm","props":{"title":"Send a message","intro":"Ask a question and we will reply by email.","submitLabel":"Send message"}}]$form$::jsonb
  ),
  '{nav,links}',
  site.document->'nav'->'links' || '[{"label":"Message","sectionId":"message"}]'::jsonb
)
where site.slug in ('newbeauty', 'soniasnails', 'lkbaesthetics')
  and not exists (
    select 1
    from jsonb_array_elements(site.document->'sections') as section
    where section->>'id' = 'message'
  );
