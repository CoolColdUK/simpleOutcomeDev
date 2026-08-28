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
| `/packages/model` | Shared types and valibot schemas (`@so/model`) |

## 3. Conventions

- Shared domain logic belongs in `packages/model`.
- No app-level `index.ts` barrels; import by concrete path.
- Packages use `index.ts` as the public API (named exports only).
- New I/O helpers: `{action}{Service}{Resource}` (e.g. `createDbContactMessage`).
- Prefer `undefined` over `null`. Prefer `dayjs` for dates.
- Do not run lint/build unless requested (except when verifying a stack change).

## 4. Env

Copy [packages/web/env.example](packages/web/env.example) to `packages/web/.env.local`.

Required: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Optional: `NEXT_PUBLIC_WEB_URL`.

## 5. Deploy

Production only: GitHub Actions **Production**. That workflow applies `supabase/migrations` (`supabase db push`) then deploys the prebuilt Next.js app to Vercel. Do not import the GitHub repo into Vercel, and do not apply migrations from a local CLI for production.

**Supabase (required when `deploy_supabase` is on, the default):**

| Kind | Name | Purpose |
| --- | --- | --- |
| Secret | `SUPABASE_ACCESS_TOKEN` | Personal access token from Supabase Dashboard → Account → Access Tokens |
| Secret | `SUPABASE_PRODUCTION_DB_PASSWORD` | Database password for the production project |
| Variable | `SUPABASE_PRODUCTION_PROJECT_REF` | Project ref (the subdomain in `https://<ref>.supabase.co`) |

**First-time Vercel project:** add secret `VERCEL_TOKEN`, then run **Actions → Create Vercel project**. That creates the Vercel project (root `packages/web`, no Git). Copy `VERCEL_ORG_ID` (Vercel team id, `team_…`) and `VERCEL_PROJECT_ID_PRODUCTION` from the job summary into GitHub **Settings → Secrets and variables → Actions → Variables**. Auto-writing those variables needs a GitHub PAT with **Variables: write** (classic `repo` scope); a packages-only `GH_PAT` will get HTTP 401 and can be ignored.
