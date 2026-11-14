# Setup

Node **26** (`nvm use` from the repo root). Then `npm install`.

Apps import `@so/model` from `dist`, so build it before a dev server or a production build:

```bash
npm run build:model
```

`@so/component` is the same for the main app: `npm run build:component` before `npm run dev:web` if the icons or primitives are missing.

## Main app (`packages/web`)

Copy [packages/web/env.example](packages/web/env.example) to `packages/web/.env.local`.

Local dev uses the **staging** Supabase project. Put that project's URL, anon key, and secret key in `.env.local`. Leave production keys on GitHub only.

| Name | Local | Production |
| --- | --- | --- |
| `SUPABASE_PROJECT_REF` | Required. Staging project ref. The API URL is `https://<ref>.supabase.co`. | GitHub variable `SUPABASE_PROJECT_REF_PROD`. Workflows build `NEXT_PUBLIC_SUPABASE_URL` from it. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Required. Staging anon key, not the secret. | GitHub variable `NEXT_PUBLIC_SUPABASE_ANON_KEY_PROD`. |
| `NEXT_PUBLIC_SITES_ROOT_DOMAIN` | Staging root domain, for example `stage.simpleoutcome.dev`. The site URL is `https://` plus this domain. | GitHub variable `NEXT_PUBLIC_SITES_ROOT_DOMAIN_PROD`. |
| `SUPABASE_SECRET_KEY` | Staging secret key. Required for `/api/mcp` and the agent REST routes. Server only. Do not prefix with `NEXT_PUBLIC_`. | GitHub secret `SUPABASE_SECRET_KEY_PROD`. **Production** writes it to the production Vercel project as `SUPABASE_SECRET_KEY`. |
| `NEXT_PUBLIC_APP_VERSION` | Optional. | Set by the Production workflow. |
| `NEXT_PUBLIC_GIT_COMMIT` | Optional. | Set by the Production workflow. |

```bash
npm run dev:web
```

The app is at `http://localhost:3000`.

## Client sites (`packages/sites`)

Copy [packages/sites/env.example](packages/sites/env.example) to `packages/sites/.env.local`.

Leave the Supabase pair empty to use the three bundled demos. Open `http://newbeauty.localhost:3001`, `http://soniasnails.localhost:3001`, or `http://lkbaesthetics.localhost:3001`. Preset previews use the same fallback, for example `http://preview-home-studio.localhost:3001`.

To use the admin and live drafts locally, set the **same staging** URL, anon key, and secret key as `packages/web/.env.local`. Set both Supabase values, or neither. One of them throws at startup. `SUPABASE_SECRET_KEY` is required to load a client draft on the slug host, to serve a published snapshot on a custom domain, and for the admin editor. Keep `NEXT_PUBLIC_SITES_ROOT_DOMAIN=simpleoutcome.dev` locally so `admin.localhost` stays the editor. Turnstile, Resend, and Upstash can stay empty on your machine.

```bash
npm run dev:sites
```

The sites app is at port **3001**.

### Site admin (`admin.simpleoutcome.dev`)

Open `http://admin.localhost:3001` locally. Production is `https://admin.simpleoutcome.dev` on the same sites Vercel project.

Site logins use `public.site_user`, not Supabase Auth. Insert the first admin once after the migration:

```sql
insert into public.site_user (email, is_admin)
values ('you@example.com', true);
```

That user signs in with Forgot password, sets a password from the emailed link, then can create users and sites in the admin UI. The slug host (`something.simpleoutcome.dev`) shows the working draft. The client’s own domain shows only a version a person published.

### Sites MCP

Admins create a key under **API keys**. Call `https://admin.simpleoutcome.dev/api/mcp/sites` with `Authorization: Bearer <secret>` (same feature split as main-app `/api/mcp/book`). Tools: `sites_list_components`, `sites_list_sites`, `sites_get_draft`, `sites_create_site`, `sites_update_draft`. They do not publish.

| Name | Local | Sites production |
| --- | --- | --- |
| `SUPABASE_PROJECT_REF` | Empty for file demos. Staging ref. The API URL is `https://<ref>.supabase.co`. | GitHub variable `SUPABASE_PROJECT_REF_PROD`. Injected at build, and `NEXT_PUBLIC_SUPABASE_URL` is built from it. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same as the URL. | GitHub variable `NEXT_PUBLIC_SUPABASE_ANON_KEY_PROD`. Injected at build as `NEXT_PUBLIC_SUPABASE_ANON_KEY`. |
| `NEXT_PUBLIC_SITES_ROOT_DOMAIN` | Optional. Defaults to `simpleoutcome.dev`. | GitHub variable `NEXT_PUBLIC_SITES_ROOT_DOMAIN_PROD`. Required. `simpleoutcome.dev`. |
| `NEXT_PUBLIC_SITES_SALES_EMAIL` | Optional. Defaults to `info@simpleoutcome.dev`. The page does not render this address. | GitHub variable `NEXT_PUBLIC_SITES_SALES_EMAIL`. Shared by production and staging. Empty becomes `info@simpleoutcome.dev`. Must be an email when set. |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Empty skips the Turnstile widget. A submit then fails with “Confirm you are a person”. | GitHub variable. Required. Cloudflare Turnstile site key. |
| `SUPABASE_SECRET_KEY` | Required for admin, drafts, published custom domains, and live enquiries. Server only. | GitHub secret `SUPABASE_SECRET_KEY_PROD`. **Sites production** copies it to the Vercel sites project as `SUPABASE_SECRET_KEY` and injects it at build. |
| `RESEND_API_KEY` | Empty: submit returns “This form is not available right now.” after Turnstile passes. | GitHub secret. Synced to Vercel sites (runtime) and injected at build. |
| `TURNSTILE_SECRET_KEY` | Empty is a configuration error once a token is posted. Server only. | GitHub secret. Synced to Vercel sites and injected at build. |
| `UPSTASH_REDIS_REST_URL` | Leave all three rate-limit values empty to use the in-memory limit (5 per IP and 30 per site each hour, lost on restart). | GitHub variable. Synced to Vercel sites and injected at build. |
| `UPSTASH_REDIS_REST_TOKEN` | Set together with the URL and the pepper, or leave all three empty. A partial set fails closed. | GitHub secret. Synced to Vercel sites and injected at build. |
| `SITES_IP_HASH_PEPPER` | Same. Any non-empty string is enough locally. | GitHub secret. Synced to Vercel sites and injected at build. |

Resend must accept `Website enquiry via Simple Outcome <info@simpleoutcome.dev>`. Verify `info@simpleoutcome.dev` on the domain `simpleoutcome.dev` in Resend before a real send.

Do not put server secrets in `NEXT_PUBLIC_` names. Sites production syncs server env onto the Vercel sites project (so API routes can read them at runtime), then also writes `.vercel/.env.production.local` for the build. It fails if any required value is empty, and it does not print the values.

## Site SEO

No extra environment variable. The main app’s site URL is `https://` plus `NEXT_PUBLIC_SITES_ROOT_DOMAIN`.

Indexing follows the request host:

- `*.localhost` and `*.simpleoutcome.dev` (`NEXT_PUBLIC_SITES_ROOT_DOMAIN`) are `noindex, nofollow`. They serve the working draft (or a seeded demo). The sitemap is empty, `robots.txt` does not link it, and the page has no JSON-LD. `*.simpleoutcome.dev` also sends `X-Robots-Tag: noindex, nofollow`. The canonical URL is the request host itself.
- A live site on the client’s own domain is `index, follow`. That host serves the latest published revision only. The canonical URL is that host. The sitemap is that homepage, and `robots.txt` links it. The page includes one `BeautySalon` JSON-LD block.
- `admin.simpleoutcome.dev` / `admin.localhost` is the editor and stays `noindex`.

`custom_domain` is the column, not a field in the document. Optional `document.seo` (strict, `schemaVersion` stays `1`; empty strings count as missing):

| Field | When empty |
| --- | --- |
| `title` | `businessName` |
| `description` | Business name, area, and up to three service names. Not `footer.text`. Max 160 characters. |
| `locale` | `en-GB`. v1 allows only `en-GB`, and `<html lang>` is `en-GB`. |
| `ogImageUrl` | No `og:image`. When set, it must be `https`. |
| `googleBusinessProfileUrl` | Left out of `sameAs`. When set, it must be `https`. |
| `geo` | Omitted. Both `latitude` and `longitude`, or neither. The app does not geocode. |

Paste `ogImageUrl` in SQL until photo uploads exist. Point the client’s domain at the sites Vercel project. There is no sitemap index across salons.

## Database

Migrations live in `supabase/migrations`. **Actions → Staging** applies them to the staging Supabase project. **Actions → Production** applies them to production. Do not run that push from a laptop against either hosted project.

Local, with the Supabase CLI:

```bash
supabase db reset
```

That applies every migration, including:

- `20261112120000_api_key_kind_and_secret.sql` — API key type (`scoped` / `full`) and the revealable secret. Apply this before creating a key that can be shown again.
- `20261112130000_site_contact.sql` — `site.messages_enabled`, private `site_contact`, and the enquiry counter. A Supabase-backed site 404s on load until this is applied, because the page selects `messages_enabled`.
- `20261113100000_site_editor_users_drafts_revisions.sql` — `site_user`, sessions, drafts, revisions, site API keys, and draft/live/archived status.
- `20261114090000_site_service_role_grants.sql` — service_role write grants on `public.site` (admins create sites for owners).

After the first Production migrate, confirm in the Supabase dashboard:

- **Database → Extensions → moddatetime**
- **Storage → pod-private** (private, 5MB, jpeg/png)

Do not enable Realtime or `uuid-ossp`.

A live salon gets a row in `public.site_contact` (`delivery_email`) from the SQL editor. The anon key cannot read it. `messages_enabled = false` hides the form. Demos email `info@simpleoutcome.dev` and do not need a `site_contact` row.

## GitHub Actions

Create the production Vercel projects once, with no Git connection: **Create Vercel project**, then **Create Vercel sites project**. Deploy with **Production** and **Sites production**.

Staging is **Actions → Staging** (migrations + main app) and **Actions → Sites staging**. Neither bumps a version or publishes a GitHub release. Each targets a separate Vercel project's production environment, so the workflow still uses `--prod`. GitHub holds the staging values (`*_STAGE`). The workflows inject them for that build and that deployment. They do not call `vercel env add`, so the staging Vercel project settings stay empty. Create the projects with env sync off. Do not re-run the create-project workflows with **Write VERCEL_PROJECT_ID_*** left on: that overwrites the production project ids. Create `simple-outcome-stage` and `simple-outcome-sites-stage` in the Vercel dashboard (no Git), or run those workflows with that write switch off and `sync_env` off, then copy the printed project id into `VERCEL_PROJECT_ID_STAGE` and `VERCEL_PROJECT_ID_SITES_STAGE`.

Point `stage.simpleoutcome.dev` at the staging web project. Point `*.stage.simpleoutcome.dev` (including `admin.stage.simpleoutcome.dev`) at the staging sites project. After the first Staging migrate, confirm `moddatetime` and bucket `pod-private` on the **staging** project, and insert the first `site_user` there.

| Kind | Name | Used by |
| --- | --- | --- |
| Secret | `VERCEL_TOKEN` | Both deploys. https://vercel.com/account/tokens |
| Secret | `GH_PAT` | Checkout and npm on GitHub Actions. |
| Variable | `VERCEL_ORG_ID` | Both Vercel projects. |
| Variable | `VERCEL_PROJECT_ID_PRODUCTION` | Main app. |
| Variable | `VERCEL_PROJECT_ID_SITES` | Sites app. |
| Secret | `SUPABASE_ACCESS_TOKEN` | Production and staging `db push`. Dashboard → Account → Access Tokens. |
| Secret | `SUPABASE_DB_PASSWORD_PROD` | Production `db push`. Passed to `supabase link` as the database password. |
| Variable | `SUPABASE_PROJECT_REF_PROD` | Production project ref. Passed to `supabase link`. `NEXT_PUBLIC_SUPABASE_URL` is `https://<ref>.supabase.co`. |
| Variable | `NEXT_PUBLIC_SUPABASE_ANON_KEY_PROD` | Both apps. Mapped to `NEXT_PUBLIC_SUPABASE_ANON_KEY`. |
| Secret | `SUPABASE_SECRET_KEY_PROD` | Main app and sites. Mapped to `SUPABASE_SECRET_KEY`. |
| Variable | `NEXT_PUBLIC_SITES_ROOT_DOMAIN_PROD` | Sites. Mapped to `NEXT_PUBLIC_SITES_ROOT_DOMAIN`. |
| Variable | `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Sites. Shared by production and staging. |
| Variable | `NEXT_PUBLIC_SITES_SALES_EMAIL` | Sites. Optional. Shared by production and staging. |
| Secret | `RESEND_API_KEY` | Sites. Shared by production and staging. |
| Secret | `TURNSTILE_SECRET_KEY` | Sites. Shared by production and staging. |
| Variable | `UPSTASH_REDIS_REST_URL` | Sites. Shared by production and staging. |
| Secret | `UPSTASH_REDIS_REST_TOKEN` | Sites. Shared by production and staging. |
| Secret | `SITES_IP_HASH_PEPPER` | Sites. Shared by production and staging. |

A GitHub name with no `_PROD` or `_STAGE` suffix is shared by production and staging. Suffixed names are mapped to the unsuffixed name the app reads. Add the staging hostnames on the Turnstile widget. Set these on GitHub only.

| Kind | Name | Used by |
| --- | --- | --- |
| Secret | `SUPABASE_DB_PASSWORD_STAGE` | Staging `db push`. Database password of the staging project. |
| Variable | `SUPABASE_PROJECT_REF_STAGE` | Staging project ref. Passed to `supabase link`. `NEXT_PUBLIC_SUPABASE_URL` is `https://<ref>.supabase.co`. |
| Variable | `VERCEL_PROJECT_ID_STAGE` | Staging main app. |
| Variable | `VERCEL_PROJECT_ID_SITES_STAGE` | Staging sites app. |
| Variable | `NEXT_PUBLIC_SUPABASE_ANON_KEY_STAGE` | Mapped to `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Same anon key as local `.env.local`. |
| Secret | `SUPABASE_SECRET_KEY_STAGE` | Mapped to `SUPABASE_SECRET_KEY`. Same secret as local `.env.local`. |
| Variable | `NEXT_PUBLIC_SITES_ROOT_DOMAIN_STAGE` | Mapped to `NEXT_PUBLIC_SITES_ROOT_DOMAIN`. `stage.simpleoutcome.dev`. |

Local `.env.local` keeps the unprefixed names the apps read. Fill both files from the staging project:

```
SUPABASE_PROJECT_REF=<staging project ref>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<staging anon key>
SUPABASE_SECRET_KEY=<staging secret key>
NEXT_PUBLIC_SITES_ROOT_DOMAIN=stage.simpleoutcome.dev
```

The Supabase URL is `https://<ref>.supabase.co`. The web URL is `https://stage.simpleoutcome.dev`. Do not commit either file.
