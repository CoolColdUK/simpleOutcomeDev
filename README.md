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
3. **Actions → Staging** to migrate the staging Supabase project and deploy there. **Actions → Production** does the same for production. Each run has checkboxes for migrations, the main app, and client sites. All three default to on.
4. Local `.env.local` uses the staging Supabase URL, anon key, and secret key. See [setup.md](setup.md).

Client sites (`packages/sites`) use their own Vercel projects. See [plan/feature/salon-sites.md](plan/feature/salon-sites.md): **Actions → Create Vercel sites project** once, then check **Deploy sites** on **Staging** or **Production**. Do not connect Git. Those workflows take env from GitHub ([setup.md](setup.md)). The manual checklist in that plan names the three demo CNAMEs.

Env vars, local database, and GitHub Actions are in [setup.md](setup.md). See `AGENTS.md`.

Todo list storage: after production migrate, confirm `moddatetime` and bucket `pod-private` in the Supabase dashboard.
