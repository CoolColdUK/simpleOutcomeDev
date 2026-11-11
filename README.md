# SimpleOutcome

Marketing site and personal app shell. Monorepo: `packages/web` (Next.js), `packages/sites` (client websites), and `packages/model`.

## Local

1. Node 26 (`nvm use`).
2. Copy `packages/web/env.example` to `packages/web/.env.local` and set Supabase URL + anon key.
3. `npm install`
4. `npm run build:model && npm run dev:web`

## Deploy

1. GitHub secret `VERCEL_TOKEN` (https://vercel.com/account/tokens).
2. **Actions → Create Vercel project** (once; no Git import).
3. **Actions → Production** to build and deploy the main app and apply Supabase migrations.

Client sites (`packages/sites`) deploy separately. See [plan/feature/salon-sites.md](plan/feature/salon-sites.md): one Vercel project, **Actions → Create Vercel sites project**, then **Actions → Sites production**. Do not connect Git. Sites production takes `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITES_ROOT_DOMAIN`, and optional `SITES_SALES_EMAIL` from GitHub. Do not set those on the Vercel project. The manual checklist in that plan names the three demo CNAMEs.

See `AGENTS.md`.

Todo list storage: after production migrate, confirm `moddatetime` and bucket `pod-private` in the Supabase dashboard.
