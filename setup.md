# Setup

Node **26** (`nvm use` from the repo root). Then `npm install`.

Apps import `@so/model` from `dist`, so build it before a dev server or a production build:

```bash
npm run build:model
```

`@so/component` is the same for the main app: `npm run build:component` before `npm run dev:web` if the icons or primitives are missing.

## Main app (`packages/web`)

Copy [packages/web/env.example](packages/web/env.example) to `packages/web/.env.local`.

| Name | Local | Production |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Required. Supabase → Project Settings → API. | GitHub secret. The **Create Vercel project** workflow copies it onto the Vercel project. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Required. Same API page. The anon key, not the secret. | GitHub secret. Copied onto the Vercel project with the URL. |
| `NEXT_PUBLIC_WEB_URL` | Optional. Defaults to `https://simpleoutcome.dev`. Used for SEO, sitemap, and robots. | GitHub secret `NEXT_PUBLIC_WEB_URL`, copied onto Vercel when you sync env. |
| `SUPABASE_SECRET_KEY` | Required for `/api/mcp` and the agent REST routes. Not required to sign in and use the app. Server only. Do not prefix with `NEXT_PUBLIC_`. | GitHub secret. **Production** writes it to the Vercel project as a sensitive production env var. |
| `NEXT_PUBLIC_APP_VERSION` | Optional. | Set by the Production workflow. |
| `NEXT_PUBLIC_GIT_COMMIT` | Optional. | Set by the Production workflow. |

```bash
npm run dev:web
```

The app is at `http://localhost:3000`.

## Client sites (`packages/sites`)

Copy [packages/sites/env.example](packages/sites/env.example) to `packages/sites/.env.local`.

Leave the Supabase pair empty to use the three bundled demos. Open `http://newbeauty.localhost:3001`, `http://soniasnails.localhost:3001`, or `http://lkbaesthetics.localhost:3001`. Preset previews use the same fallback, for example `http://preview-home-studio.localhost:3001`.

Set both Supabase values, or neither. One of them throws at startup.

```bash
npm run dev:sites
```

The sites app is at port **3001**.

| Name | Local | Sites production |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Empty for file demos. Required to load `public.site`. | GitHub secret. Injected at build. Do not set it on the Vercel sites project. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same as the URL. | GitHub secret. Injected at build. Do not set it on the Vercel sites project. |
| `NEXT_PUBLIC_SITES_ROOT_DOMAIN` | Optional. Defaults to `simpleoutcome.dev`. | GitHub variable. Required. Use `simpleoutcome.dev`. |
| `NEXT_PUBLIC_SITES_SALES_EMAIL` | Optional. Defaults to `info@simpleoutcome.dev`. The page does not render this address. | GitHub variable `SITES_SALES_EMAIL`. Empty becomes `info@simpleoutcome.dev`. Must be an email when set. |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Empty skips the Turnstile widget. A submit then fails with “Confirm you are a person”. | GitHub variable. Required. Cloudflare Turnstile site key. |
| `SUPABASE_SECRET_KEY` | Required to send a **live** enquiry (reads `site_contact`). Demos do not read that table. Server only. | GitHub secret. Required. Injected at build. Do not set it on the Vercel sites project. |
| `RESEND_API_KEY` | Empty: submit returns “This form is not available right now.” after Turnstile passes. | GitHub secret. Required. |
| `TURNSTILE_SECRET_KEY` | Empty is a configuration error once a token is posted. Server only. | GitHub secret. Required. |
| `UPSTASH_REDIS_REST_URL` | Leave all three rate-limit values empty to use the in-memory limit (5 per IP and 30 per site each hour, lost on restart). | GitHub secret. Required. Upstash Redis REST URL. |
| `UPSTASH_REDIS_REST_TOKEN` | Set together with the URL and the pepper, or leave all three empty. A partial set fails closed. | GitHub secret. Required. |
| `SITES_IP_HASH_PEPPER` | Same. Any non-empty string is enough locally. | GitHub secret. Required. |

Resend must accept `Website enquiry via Simple Outcome <info@simpleoutcome.dev>`. Verify `info@simpleoutcome.dev` on the domain `simpleoutcome.dev` in Resend before a real send.

Do not put server secrets in `NEXT_PUBLIC_` names. Sites production reads them from GitHub and writes `.vercel/.env.production.local` during the build. It fails if any required value is empty, and it does not print the values.

## Site SEO

No extra environment variable. The main app’s `NEXT_PUBLIC_WEB_URL` is only for `packages/web`.

Indexing follows the request host and `public.site.custom_domain`:

- `*.localhost` and `*.simpleoutcome.dev` (`NEXT_PUBLIC_SITES_ROOT_DOMAIN`) are `noindex, nofollow`. The sitemap is empty, `robots.txt` does not link it, and the page has no JSON-LD. `*.simpleoutcome.dev` also sends `X-Robots-Tag: noindex, nofollow`.
- A live site on the client’s own domain is `index, follow`. The canonical URL is `https://{custom_domain}/`. The sitemap is that homepage, and `robots.txt` links it. The page includes one `BeautySalon` JSON-LD block.
- If a row already has `custom_domain`, a leftover `*.simpleoutcome.dev` host canonicals to that domain and stays `noindex`.

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

Migrations live in `supabase/migrations`. Production applies them with **Actions → Production** (`supabase db push`). Do not run that push from a laptop against production.

Local, with the Supabase CLI:

```bash
supabase db reset
```

That applies every migration, including:

- `20261112120000_api_key_kind_and_secret.sql` — API key type (`scoped` / `full`) and the revealable secret. Apply this before creating a key that can be shown again.
- `20261112130000_site_contact.sql` — `site.messages_enabled`, private `site_contact`, and the enquiry counter. A Supabase-backed site 404s on load until this is applied, because the page selects `messages_enabled`.

After the first Production migrate, confirm in the Supabase dashboard:

- **Database → Extensions → moddatetime**
- **Storage → pod-private** (private, 5MB, jpeg/png)

Do not enable Realtime or `uuid-ossp`.

A live salon gets a row in `public.site_contact` (`delivery_email`) from the SQL editor. The anon key cannot read it. `messages_enabled = false` hides the form. Demos email `info@simpleoutcome.dev` and do not need a `site_contact` row.

## GitHub Actions

Create the Vercel projects once, with no Git connection: **Create Vercel project**, then **Create Vercel sites project**. Deploy with **Production** and **Sites production**.

| Kind | Name | Used by |
| --- | --- | --- |
| Secret | `VERCEL_TOKEN` | Both deploys. https://vercel.com/account/tokens |
| Secret | `GH_PAT` | Checkout and npm on GitHub Actions. |
| Variable | `VERCEL_ORG_ID` | Both Vercel projects. |
| Variable | `VERCEL_PROJECT_ID_PRODUCTION` | Main app. |
| Variable | `VERCEL_PROJECT_ID_SITES` | Sites app. |
| Secret | `SUPABASE_ACCESS_TOKEN` | Production `db push`. Dashboard → Account → Access Tokens. |
| Secret | `SUPABASE_PRODUCTION_DB_PASSWORD` | Production `db push`. |
| Variable | `SUPABASE_PRODUCTION_PROJECT_REF` | The ref in `https://<ref>.supabase.co`. |
| Secret | `NEXT_PUBLIC_SUPABASE_URL` | Both apps. |
| Secret | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Both apps. |
| Secret | `NEXT_PUBLIC_WEB_URL` | Main app, when syncing Vercel env. |
| Secret | `SUPABASE_SECRET_KEY` | Main app (copied to Vercel) and sites (build inject). |
| Variable | `NEXT_PUBLIC_SITES_ROOT_DOMAIN` | Sites. |
| Variable | `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Sites. |
| Variable | `SITES_SALES_EMAIL` | Sites. Optional. |
| Secret | `RESEND_API_KEY` | Sites. |
| Secret | `TURNSTILE_SECRET_KEY` | Sites. |
| Secret | `UPSTASH_REDIS_REST_URL` | Sites. |
| Secret | `UPSTASH_REDIS_REST_TOKEN` | Sites. |
| Secret | `SITES_IP_HASH_PEPPER` | Sites. |
