-- Files and images belonging to a client, shared by every site that client owns.

create table public.site_asset (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.site_user (id) on delete cascade,
  name text not null,
  content_type text not null,
  byte_size integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint site_asset_name_format check (name ~ '^[a-z0-9]+(-[a-z0-9]+)*\.[a-z0-9]{2,8}$'),
  constraint site_asset_name_length check (char_length(name) <= 80),
  constraint site_asset_byte_size check (byte_size > 0 and byte_size <= 5242880),
  constraint site_asset_owner_name unique (owner_id, name)
);

comment on table public.site_asset is
  'A client file. name is the public SEO path under /assets/. Bytes live in the site-private bucket at owner_id/id.';

create trigger site_asset_set_updated_at
  before update on public.site_asset
  for each row execute function extensions.moddatetime('updated_at');

alter table public.site_asset enable row level security;

revoke all on table public.site_asset from public, anon, authenticated;
grant all on table public.site_asset to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'site-private',
  'site-private',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf', 'text/plain', 'text/markdown']
)
on conflict (id) do nothing;
