# Project Instructions

## 1. Technology Stack

- Language: **TypeScript (strict)**
- Backend: **Supabase** (Auth, Postgres, RLS)
- Frontend (`packages/web`): **Next.js (App Router)** + **React** + **Chakra UI v3**, deployed on **Vercel**
- Monorepo: **npm workspaces** + **Lerna**

## 2. Packages

| Path | Role |
| --- | --- |
| `/packages/web` | Next.js app (`@so/web`) |
| `/packages/sites` | Client sites + admin editor (`@so/sites`) |
| `/packages/model` | Shared types and valibot schemas (`@so/model`) |
| `/packages/component` | Shared UI primitives and SVG icons (`@so/component`) |

## 3. Conventions

- Shared domain logic belongs in `packages/model`.
- No app-level `index.ts` barrels; import by concrete path.
- Packages use `index.ts` as the public API (named exports only).
- New I/O helpers: `{action}{Service}{Resource}` (e.g. `createDbContactMessage`).
- Prefer `undefined` over `null`. Prefer `dayjs` for dates.
- Do not run lint/build unless requested (except when verifying a stack change).

## 4. Env

Copy [packages/web/env.example](packages/web/env.example) to `packages/web/.env.local`.

Required: `SUPABASE_PROJECT_REF`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`. The Supabase URL is `https://<ref>.supabase.co`. The web URL is `https://$NEXT_PUBLIC_SITES_ROOT_DOMAIN`.

## 5. Deploy

GitHub Actions **Staging** pushes `supabase/migrations` to the staging Supabase project and deploys `packages/web` as a Vercel preview, then aliases `NEXT_PUBLIC_SITES_ROOT_DOMAIN_STAGE` (for example `stage.simpleoutcome.dev`) onto that deployment. **Sites staging** deploys `packages/sites` with `--prod` on the staging sites project so `*.stage.simpleoutcome.dev` stays on that project. **Production** and **Sites production** deploy to production. Do not import the GitHub repo into Vercel, and do not apply migrations from a local CLI for staging or production. Local `.env.local` uses the staging Supabase URL, anon key, and secret key.

**Supabase (required when `deploy_supabase` is on, the default):**

| Kind | Name | Purpose |
| --- | --- | --- |
| Secret | `SUPABASE_ACCESS_TOKEN` | Personal access token from Supabase Dashboard → Account → Access Tokens |
| Secret | `SUPABASE_DB_PASSWORD_PROD` | Database password for the production project. Passed to `supabase link` as the database password. |
| Variable | `SUPABASE_PROJECT_REF_PROD` | Production project ref. Passed to `supabase link`. The API URL is `https://<ref>.supabase.co`. |
| Secret | `SUPABASE_DB_PASSWORD_STAGE` | Database password for the staging project. Passed to `supabase link` as the database password. |
| Variable | `SUPABASE_PROJECT_REF_STAGE` | Staging project ref. Passed to `supabase link`. The API URL is `https://<ref>.supabase.co`. |
| Secret | `SUPABASE_SECRET_KEY_STAGE` | Staging service role key. Local `.env.local` uses this value as `SUPABASE_SECRET_KEY`. Staging Vercel projects stay empty; GitHub supplies env per deployment. |

## 6. Todo list (after first feature migration)

After Production `db push`, confirm Dashboard **Database → Extensions → moddatetime** and **Storage → pod-private** (private, 5MB, jpeg/png). No new Vercel env vars. Do not enable Realtime or `uuid-ossp`. Local: `supabase db reset` so the migration applies.
