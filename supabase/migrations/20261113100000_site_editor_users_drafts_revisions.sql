-- Site editor users, sessions, drafts, revisions, and API keys.
-- Separate from auth.users / public.profile. Anon and authenticated have no grants on editor tables.

-- ---------------------------------------------------------------------------
-- site status: draft | demo | live | archived
-- ---------------------------------------------------------------------------

alter table public.site
  drop constraint site_status_check;

alter table public.site
  add constraint site_status_check check (status in ('draft', 'demo', 'live', 'archived'));

comment on column public.site.status is
  'demo: seeded sample. draft: working copy only on the slug host. live: custom domain serves the latest revision. archived: custom domain 404s.';

drop policy site_select_public on public.site;

create policy site_select_public on public.site
  for select to anon, authenticated
  using (status = 'demo');

-- ---------------------------------------------------------------------------
-- site_user
-- ---------------------------------------------------------------------------

create table public.site_user (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  password_hash text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint site_user_email_lower check (email = lower(email)),
  constraint site_user_email_format check (email ~ '^[^\s@]+@[^\s@]+\.[^\s@]+$'),
  constraint site_user_email_unique unique (email)
);

comment on table public.site_user is
  'Site editor login. Email is the username. password_hash is null until the first reset. Not auth.users.';

create trigger site_user_set_updated_at
  before update on public.site_user
  for each row execute function extensions.moddatetime('updated_at');

alter table public.site_user enable row level security;

revoke all on table public.site_user from public, anon, authenticated;
grant all on table public.site_user to service_role;

-- ---------------------------------------------------------------------------
-- site.owner_id
-- ---------------------------------------------------------------------------

alter table public.site
  add column owner_id uuid references public.site_user (id) on delete set null;

create index site_owner_id_idx on public.site (owner_id);

comment on column public.site.owner_id is 'site_user who owns this site. Null for seeded demos.';

-- ---------------------------------------------------------------------------
-- site_session
-- ---------------------------------------------------------------------------

create table public.site_session (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null,
  user_id uuid not null references public.site_user (id) on delete cascade,
  impersonator_id uuid references public.site_user (id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  constraint site_session_token_hash_unique unique (token_hash),
  constraint site_session_impersonator_diff check (
    impersonator_id is null or impersonator_id <> user_id
  )
);

comment on table public.site_session is
  'Hashed cookie session for the admin host. impersonator_id is the admin when switched into user_id.';

create index site_session_user_id_idx on public.site_session (user_id);
create index site_session_expires_at_idx on public.site_session (expires_at);

alter table public.site_session enable row level security;

revoke all on table public.site_session from public, anon, authenticated;
grant all on table public.site_session to service_role;

-- ---------------------------------------------------------------------------
-- site_password_reset
-- ---------------------------------------------------------------------------

create table public.site_password_reset (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null,
  user_id uuid not null references public.site_user (id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  constraint site_password_reset_token_hash_unique unique (token_hash)
);

comment on table public.site_password_reset is
  'Hashed single-use reset token. Raw token only in the email link. Expires in one hour.';

create index site_password_reset_user_id_idx on public.site_password_reset (user_id);
create index site_password_reset_expires_at_idx on public.site_password_reset (expires_at);

alter table public.site_password_reset enable row level security;

revoke all on table public.site_password_reset from public, anon, authenticated;
grant all on table public.site_password_reset to service_role;

-- ---------------------------------------------------------------------------
-- site_api_key
-- ---------------------------------------------------------------------------

create table public.site_api_key (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null,
  user_id uuid not null references public.site_user (id) on delete cascade,
  label text not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  constraint site_api_key_token_hash_unique unique (token_hash),
  constraint site_api_key_label_not_blank check (char_length(trim(label)) > 0)
);

comment on table public.site_api_key is
  'Hashed site MCP API key. Only is_admin users. Secret shown once. Not the main app api_key table.';

create index site_api_key_user_id_idx on public.site_api_key (user_id);

alter table public.site_api_key enable row level security;

revoke all on table public.site_api_key from public, anon, authenticated;
grant all on table public.site_api_key to service_role;

-- ---------------------------------------------------------------------------
-- site_draft
-- ---------------------------------------------------------------------------

create table public.site_draft (
  site_id uuid primary key references public.site (id) on delete cascade,
  document jsonb not null,
  updated_at timestamptz not null default now(),
  constraint site_draft_document_object check (
    jsonb_typeof(document) = 'object'
    and document->>'schemaVersion' = '1'
  )
);

comment on table public.site_draft is
  'Working copy for a client site. Served on the slug subdomain. Anon has no grant.';

create trigger site_draft_set_updated_at
  before update on public.site_draft
  for each row execute function extensions.moddatetime('updated_at');

alter table public.site_draft enable row level security;

revoke all on table public.site_draft from public, anon, authenticated;
grant all on table public.site_draft to service_role;

-- ---------------------------------------------------------------------------
-- site_revision
-- ---------------------------------------------------------------------------

create table public.site_revision (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.site (id) on delete cascade,
  version_number integer not null,
  document jsonb not null,
  published_at timestamptz not null default now(),
  published_by uuid not null references public.site_user (id),
  constraint site_revision_site_version_unique unique (site_id, version_number),
  constraint site_revision_version_positive check (version_number >= 1),
  constraint site_revision_document_object check (
    jsonb_typeof(document) = 'object'
    and document->>'schemaVersion' = '1'
  )
);

comment on table public.site_revision is
  'Immutable publish snapshot. Custom domain serves the latest when site.status is live.';

create index site_revision_site_id_idx on public.site_revision (site_id, version_number desc);

alter table public.site_revision enable row level security;

revoke all on table public.site_revision from public, anon, authenticated;
grant all on table public.site_revision to service_role;
