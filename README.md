# SimpleOutcome

Marketing site and personal app shell. Monorepo: `packages/web` (Next.js) and `packages/model`.

## Local

1. Node 24 (`nvm use`).
2. Copy `packages/web/env.example` to `packages/web/.env.local` and set Supabase URL + anon key.
3. `npm install`
4. `npm run build:model && npm run dev:web`

## Deploy

Production is GitHub Actions → Vercel (workflow **Production**). See `AGENTS.md`.
