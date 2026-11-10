# Multi-site salon websites — plan

**Status:** Draft for Matthew’s review. This file is the whole change. No app, schema, or migration code until this plan is approved. Implementation then continues on this same pull request.

**Repo:** [CoolColdUK/simpleOutcomeDev](https://github.com/CoolColdUK/simpleOutcomeDev)

A separate Next.js app in this monorepo serves many small-business websites from one deployment. The hostname picks the site. Each site is a JSON document: a theme plus an ordered list of sections. The first niche is Southampton salons and nail studios. We publish prospect demos on `*.simpleoutcome.dev` subdomains, then point the client’s own domain at the same app and mark the row live when they pay.

The visual reference is the attached archive of 10 HTML mockups (`01-clean-studio` through `10-neighbourhood-salon`), their preview PNGs, and `gen.py`. That archive stays out of git. Implementation transcribes each mock into a preset document; it does not serve the HTML files.

---

## Fit against this repo

Checked against `develop` (monorepo at Lerna `packages/*`, Next.js 16 in `packages/web`, Supabase migrations under `supabase/migrations`, production deploy in `.github/workflows/production.yml`).

| Agreed direction | What the repo actually does | Plan |
| --- | --- | --- |
| Own app folder, separate Vercel project | Workspaces and Lerna are both `packages/*`. There is no `apps/` tree. | New package `packages/sites` (`@so/sites`). Adding `apps/sites` would also mean editing the workspace and Lerna globs, which is a structural change this feature does not need. |
| Do not move the existing app | `packages/web` is the SimpleOutcome app. | No route, layout, or dependency changes in `packages/web`. |
| Resolve the site from the hostname with middleware / rewrite | `packages/web` is Next.js `^16.3.1`. In Next 16 the `middleware.ts` file convention is deprecated and renamed to `proxy.ts` (Node.js runtime). | `packages/sites/proxy.ts` reads the `Host` header and rewrites internally. The page loads the row. |
| Validate site JSON with a schema (zod was the example) | Shared schemas live in `@so/model` and use **valibot** (`valibot` ^1.5). Zod is not a dependency. | Valibot schema in `@so/model`, with unit tests. No new validation library. |
| One new table in the existing Supabase, with RLS, using the existing migration setup | Tables are singular (`pod`, `space`, `profile`). RLS is on everywhere. `anon` is denied on app tables. `extensions.moddatetime` is already the `updated_at` trigger. Production applies SQL only via **Actions → Production** (`supabase db push`). | New table `public.site`. New migration only. No new extension, no Realtime, no storage bucket. |
| Demos seeded from files as well as the database | Local reset runs migrations, not a separate seed step. | Preset and demo documents are TypeScript in `@so/model`. The migration inserts the same three demo documents. Local dev can render those bundled documents when Supabase env is unset. Production reads the database only. |
| Deploy | Production is **not** Vercel’s Git integration. `.github/workflows/create-vercel-project.yml` creates a project with **no Git connection**, root `packages/web`, and writes `VERCEL_PROJECT_ID_PRODUCTION`. `production.yml` then `vercel pull && vercel build --prod && vercel deploy --prebuilt --prod`. A comment in that workflow says to disable Git auto-deploy. | A **new** workflow deploys `packages/sites` to a **new** Vercel project. Do not connect Git. Do not reuse the create-project workflow as it stands: a successful run overwrites `VERCEL_PROJECT_ID_PRODUCTION`. |
| CI must pass before merge | `.github/workflows/ci.yml` on pull requests (including drafts): `npm ci`, `npm run lint` (`lerna exec` in every package), `npm test` (`lerna run test`), then separate builds of model, component, and web. | The new package must have a `lint` script or root lint fails. Schema tests ride along in `@so/model`. CI gains a sites build step during implementation. |

UI stack of the main app is Chakra UI v3 (`@so/component` is the shared primitives). The salon mocks are per-preset colour, type, and layout systems (system font stacks and flat CSS in `gen.py`). The sites app will **not** take a dependency on Chakra or `@so/component`. Theme JSON becomes CSS variables; sections are plain React. A Chakra upgrade in the main app then cannot restyle a client site.

---

## Decisions this plan proposes

1. **Package** `packages/sites`, npm name `@so/sites`, Next.js App Router, React 19, TypeScript 6, Node 26. Same major versions as `packages/web`.
2. **Shared code** in `@so/model` (`src/site/`): document schema, preset documents, the three demo documents, and a pure host parser. Named exports via `src/site/index.ts` and the package `index.ts`. The Next app keeps app conventions: default exports, no `index.ts` barrels, import by path.
3. **Rendering model.** One public page. `proxy.ts` does not call Supabase (Next’s proxy guidance is to keep it free of shared app modules). It normalises the host, rewrites `/` to an internal route, and sets a request header the page reads. The server component loads one row and renders sections in array order.
4. **Table name** `site` (singular, same as the rest of the schema).
5. **Document is the source of what visitors see.** Column `preset` records which mock the row started from. Later edits change `document` only. Presets are not a live template link.
6. **Writes in this phase are SQL only** (the seed migration, then further migrations or a dashboard SQL edit). No admin UI and no drag-and-drop editor. The sites Vercel project does **not** receive `SUPABASE_SECRET_KEY`. The anon key plus a public-read RLS policy is enough to render.
7. **Demo chrome is a function of the hostname and status**, not a section in the JSON. A future editor cannot accidentally delete the sample label or turn indexing on for a subdomain.
8. **Images in this phase are placeholders** (label + CSS gradient), matching the mocks. The schema allows a URL later. No Supabase Storage bucket, and no copying of real photographs.
9. **No map SDK and no contact form.** Hours and location are text, plus an optional outbound maps link. Contact is phone, email, WhatsApp, and Instagram links. Booking is an outbound link (Fresha or an existing booking page).
10. **Main app deploy and sites deploy stay independent.** A sites migration still ships through the existing Production workflow’s `supabase db push`, because that is the only migration path. The sites *build* does not.

---

## Hostname behaviour

Root domain is an env value, default `simpleoutcome.dev`. Parser lives in `@so/model` so it is unit-tested.

| Request host | Result |
| --- | --- |
| `newbeauty.simpleoutcome.dev` | Slug `newbeauty` |
| `newbeauty.localhost:3000` | Slug `newbeauty` (local) |
| `soniasnails.co.uk` (example) | Custom domain lookup |
| `simpleoutcome.dev`, `www.simpleoutcome.dev` | 404 from this app. The apex stays on the existing Vercel project. |
| `*.vercel.app` | 404. Preview URLs are not a way to reach a client site. |
| Anything else unmatched | 404. The page does not list other sites. |

Normalisation: lowercase, strip a trailing dot, strip the port. Slug charset: lowercase letters, digits, single hyphens, max 63 characters.

**Demo rule.** A host under `simpleoutcome.dev` is always treated as a demo, even if a row were marked `live` by mistake. Sample badge and `noindex` stay on. Going live means a custom domain plus `status = live`.

**Live rule.** Custom domain and `status = live`: no sample badge, pages may be indexed. Custom domain and `status = demo`: still a sample (badge and `noindex`) so a domain can be attached before the client is ready.

Unknown slug or unknown custom domain: 404, not a fallback preset.

---

## Site document

`schemaVersion` is `1`. Valibot objects are strict (unknown keys fail). A bad document fails the render with a 500-style error page that does not dump the JSON, and the server logs the validation issues. The public page never trusts the jsonb blob without parsing it.

```text
{
  schemaVersion: 1,
  businessName: string,
  theme: {
    background, foreground, accent, buttonForeground, cardBackground: css colour,
    headingFont, bodyFont: css font-family stack,
    uppercaseHeadings: boolean,
    heroBackground: css background or "none",
    radiusPx: number
  },
  booking: { label: string, href: string, provider: "fresha" | "url" },
  nav: { links: { label: string, sectionId: string }[] },
  sections: { id: string, type: string, props: object }[],
  footer: { text: string }
}
```

Editor-oriented constraints (no editor is built now):

- `id` is unique inside the document and stable so a later editor can key drag-and-drop.
- Array order is render order.
- `type` is a closed union. A new section type is a schema change, not free-form JSON.
- Caps, so one row cannot grow without bound: 40 sections, strings limited (titles short, body text a few thousand characters), at most 24 items in a list section.
- `nav.links[].sectionId` must match a section `id`.
- Colours are hex (`#rgb` or `#rrggbb`). Fonts are the system stacks from the mocks (Georgia, Helvetica Neue, Arial, Arial Black, Verdana, Trebuchet MS, Impact). No Google Fonts download in this phase.
- `booking.href` is `http` or `https` only.

`footer` stays on the document rather than in `sections`, same as `nav` and `theme`. The renderer always paints nav, then sections, then footer. A later editor can still edit footer fields; it should not be able to drop the footer into the middle of the page.

### Section types

Props below are the v1 set. Every design in the archive is one theme plus a sequence of these types.

| `type` | Role | Props |
| --- | --- | --- |
| `hero` | First screen | `layout`: `split`, `center`, `statement`, `band`, or `quote`. `eyebrow`, `title`, optional `body`. Optional `primaryCta` / `secondaryCta`: `{ label, target }` where target is `booking` or a `sectionId`. Optional `media` placeholder `{ label, background }`. `quote` layout also has `quote` and `attribution`. |
| `highlights` | Short benefit or trust cards | `items`: `{ title, body }[]` |
| `services` | Prices | `title`. `presentation`: `rows`, `cards`, or `grouped`. Items `{ name, detail, price }`. Grouped adds `{ label, items }[]` (the Hair / Nails / Lashes tabs in design 07). |
| `about` | Owner story | `eyebrow`, `title`, `body`, optional `media` |
| `gallery` | Work grid | optional `title`, `items`: `{ label, background }[]` |
| `reviews` | Quotes | optional `title`, `items`: `{ quote, attribution, stars }[]` with `stars` from 1 to 5 |
| `bookingCta` | Band that uses the document booking link | `title`, optional `body` |
| `hoursLocation` | Hours, address, map placeholder | `title`, `addressLines[]`, `hours`: `{ days, hours }[]`, optional `note`, optional `mapsUrl`, `showMapPlaceholder` |
| `contact` | Click-out details | `title`, `channels`: `{ kind: phone \| email \| whatsapp \| instagram, label, href }[]` |
| `faq` | Questions | `title`, `items`: `{ question, answer }[]`. Answers are visible text, not a JS-only disclosure, so the page still works without client interactivity. An accordion can enhance it. |
| `team` | People grid (design 07) | `title`, `members`: `{ name, role, media }[]` |
| `splitCta` | Two offers side by side (design 09) | `items` (exactly two): `{ title, body, ctaLabel, href, media }` |

Placeholder `background` is a CSS gradient or a flat colour, as in the mocks. There is no `<img>` until a later phase adds `{ kind: "url", src }` beside `{ kind: "placeholder", label, background }`. The v1 schema is the placeholder variant only, with the object shape already a tagged union so the URL variant can be added without renaming fields.

Courses in design 09 are a `services` section titled “Upcoming courses”, not a separate type.

---

## Presets

`preset` column values match these ids. Theme fields are taken from `gen.py` (background, foreground, accent, button foreground, heading font, body font, uppercase, card colour, hero gradient).

Section sequences below match the mocks, including the sections those mocks leave out. Nav links in the HTML point at Gallery / About / Find us even when that mock has no such block. Preset nav links only to sections that exist.

| Preset id | Mock | `businessName` in the preset | Sections, in order |
| --- | --- | --- | --- |
| `clean-studio` | 01 | Lumen Nail Studio | hero `split`, services “Prices” |
| `soft-luxury` | 02 | Maison Rose Beauty | hero `center`, about, services “Treatments” |
| `portfolio-first` | 03 | Polished by Ava | hero `statement`, gallery (6), bookingCta |
| `home-studio` | 04 | The Garden Room Beauty | hero `split`, highlights (3), services “Treatments and prices” |
| `bold-nail-bar` | 05 | CANDY CLAW | hero `band`, services `cards`, gallery (4) |
| `clinic-professional` | 06 | Clearline Aesthetics | hero `split`, highlights (4), faq |
| `hair-beauty-menu` | 07 | Halo Hair & Beauty | hero `band`, services `grouped`, team |
| `review-led` | 08 | Glow & Go Beauty | hero `quote`, reviews, services “Popular treatments” |
| `courses-treatments` | 09 | Atelier Nails Academy | hero `center` (no CTAs), splitCta (2), services “Upcoming courses” |
| `neighbourhood-salon` | 10 | Portswood Nails & Beauty | hero `split`, hoursLocation, services “Prices” |

Shared chrome on every preset: nav (logo = `businessName`, text links, booking button using `booking.label`) and footer `{businessName} · Sample design by Simple Outcome · Fictional business and placeholder content`. Copy, prices, and “Sample review” attributions stay the fictional mock copy. Booking `href` on the untouched presets is a placeholder `https://www.fresha.com/` with `provider: "fresha"`, replaced per real site when a real URL exists.

---

## First three demos

All three use preset `home-studio` and `status = demo`. Names are the prospect names. Everything else is fictional placeholder content: no real photos, no copied reviews, no real street address, no real price list. Prices and benefit lines can follow the Garden Room mock so the page looks finished, with the business name swapped.

| Prospect | Slug and demo host | `businessName` |
| --- | --- | --- |
| New Beauty | `newbeauty.simpleoutcome.dev` | New Beauty |
| Sonia's Nails UK | `soniasnails.simpleoutcome.dev` | Sonia's Nails UK |
| LKB Aesthetics | `lkbaesthetics.simpleoutcome.dev` | LKB Aesthetics |

The apostrophe stays in the visible name only. The hostname has none.

Demo treatment on these hosts:

- Fixed corner label **SAMPLE**, same idea as the mock’s black badge (the mock text is `SAMPLE DESIGN · <PRESET NAME>`). The prospect demos say **SAMPLE** only, so the corner does not say “HOME STUDIO” on a page titled New Beauty.
- Footer keeps the “Sample design by Simple Outcome · placeholder content” line.
- `robots` metadata `noindex, nofollow`.
- `app/robots.ts` returns `disallow: /` for demo hosts.
- `proxy.ts` sets the response header `X-Robots-Tag: noindex, nofollow` for every host under `simpleoutcome.dev`, which does not need a database read.

---

## Database

One new migration under `supabase/migrations/`, timestamped after the latest file on `develop`. It does not edit earlier migrations.

### Table `public.site`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` primary key | `gen_random_uuid()` |
| `slug` | `text` not null | Unique. Check constraint matches the slug charset above. |
| `custom_domain` | `text` | Unique, nullable. Lowercase host, no port, no scheme. |
| `status` | `text` not null | Check `status in ('demo', 'live')`. Default `demo`. |
| `preset` | `text` not null | One of the ten ids. |
| `document` | `jsonb` not null | Parsed by the app. A check constraint only asserts `jsonb_typeof(document) = 'object'` and `document->>'schemaVersion' = '1'`. Valibot stays in the app. |
| `created_at` | `timestamptz` not null | `default now()` |
| `updated_at` | `timestamptz` not null | `default now()`, trigger `extensions.moddatetime('updated_at')` |

Indexes: the two unique constraints are the lookup indexes. Add a check that `custom_domain` is null or it does not end with `.simpleoutcome.dev` (demo hosts are slugs, not custom domains).

### RLS

This table is the opposite of `pod` / `profile`: visitors are anonymous, and the pages are meant to be public.

- Enable RLS.
- `grant select` on `public.site` to `anon` and `authenticated`.
- No `insert` / `update` / `delete` grants for `anon` or `authenticated`.
- Policy `site_select_public` for `select` to `anon, authenticated` using `true`. Both statuses are publicly readable; “demo” is a presentation flag, not a secret. A 404 for an unknown host is “no row”, not a hidden row.
- No write policies. The service role bypasses RLS, but this app never uses that key. Migrations run as the database owner and can insert.
- Do not add the table to the pod feature catalog, API-key grants, or MCP. These rows are not pods.

### Seed

The migration inserts the three demo rows. Document bodies are the `@so/model` demo constants, copied into the SQL in the same implementation change. A model test asserts each demo document parses and that each slug is `newbeauty`, `soniasnails`, and `lkbaesthetics`.

Local `supabase db reset` applies the same migration, so a separate seed script is unnecessary.

**File fallback, local only.** If `NEXT_PUBLIC_SUPABASE_URL` is unset, the app may render a bundled demo when the host’s slug is one of those three. Production (URL is set) never uses the fallback: a missing row is a 404, including when Supabase is down. That avoids showing a baked-in demo over a real outage on a client domain.

---

## App shape (`packages/sites`)

Additive package. `outputFileTracingRoot` points at the repo root, same reason as `packages/web/next.config.mjs`: `@so/model` lives outside the app directory.

Suggested files (concrete paths, still to be written after approval):

- `package.json` — scripts `dev`, `build:prod` (`next build`), `lint` (eslint, same scope style as `packages/web`), `clean:dist`, `clean:node`. No `test` script. Application tests are out of scope; schema and host-parser tests live in `@so/model`.
- `proxy.ts` — host header in, rewrite, demo `X-Robots-Tag`. Matcher skips `_next/static`, `_next/image`, and favicon.
- `app/layout.tsx` — html shell, theme CSS variables applied per site in the page rather than the root layout (the layout does not know the host’s theme on its own if we keep data loading in the page).
- `app/page.tsx` — read the host header, load the row, parse with the valibot schema, render nav, sections, footer, sample badge.
- `app/robots.ts` — dynamic, demo hosts disallow all.
- `components/SiteSection*.tsx` — one file per section type, `ParentChild` naming from the project rules (`SiteSectionHero`, and so on).
- `lib/site/loadSiteForHost.ts` — the Supabase read. Server-only. Selects `slug, custom_domain, status, preset, document`.
- `env.example` — variables below.

Rendering is dynamic (`force-dynamic` or an equivalent uncached fetch). A SQL update then shows up without a redeploy. Caching and on-demand revalidation wait until the editor exists and there is something to invalidate.

Unknown section types do not reach the renderer if validation is strict. The section component map is still exhaustive TypeScript (`satisfies Record<SiteSectionType, Component>`).

Dependencies: `next`, `react`, `react-dom`, `@so/model`, `@supabase/supabase-js`, `dayjs` only if a timestamp is formatted (not required for v1 pages). Dev: `typescript`, `eslint`, `eslint-config-next`, types. No Chakra, no Emotion, no new npm packages beyond that set.

Root `package.json` gains `build:sites` (build `@so/model`, then build `@so/sites`). It does **not** fold that into the existing `build` script, which Production uses as the model/component/web pipeline.

---

## Deployment and CI

### How the main app deploys today

GitHub Actions, workflow_dispatch, workflow name **Production**. It lints, tests, bumps the Lerna version, pushes Supabase migrations, then prebuilds and deploys `packages/web` using `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID_PRODUCTION`. The Vercel project is created once by **Create Vercel project**, with no GitHub connection.

Vercel Git integration is not used, and should not be turned on for the sites project either. A Git-connected project would deploy on every push to `develop`, including unrelated app work, which is the failure mode this split is meant to avoid.

### New workflow, yes

Add `.github/workflows/sites-production.yml`, workflow_dispatch only:

1. Checkout, Node 26, `npm ci` (same private `@coolcolduk` registry setup as Production).
2. Require `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and a **new** variable `VERCEL_PROJECT_ID_SITES`.
3. `npm run build:model`.
4. `vercel pull --environment=production`, `vercel build --prod`, `vercel deploy --prebuilt --prod`, with `VERCEL_PROJECT_ID` set to the sites project id.
5. Do not bump Lerna, do not push migrations, do not deploy `packages/web`.

Add a one-shot `.github/workflows/create-vercel-sites-project.yml` (or a clearly separate input on a copy of the existing workflow) that:

- Creates or updates a project named `simple-outcome-sites`.
- Sets framework Next.js, `rootDirectory` `packages/sites`, `sourceFilesOutsideRootDirectory` true (the app imports `@so/model` from outside that directory).
- Does not connect a Git repository.
- Writes `VERCEL_PROJECT_ID_SITES` only. It must not set `VERCEL_PROJECT_ID_PRODUCTION`.

The existing `create-vercel-project.yml` stays pointed at `packages/web`.

### CI

During implementation, extend `.github/workflows/ci.yml` with a **Build sites** step after the model build, using dummy public env (a dummy Supabase URL and anon key, `NEXT_PUBLIC_SITES_ROOT_DOMAIN=simpleoutcome.dev`). `next build` is the typecheck for the app.

`npm run lint` already runs in every workspace via `lerna exec`. `packages/sites` therefore needs a `lint` script in the same change that adds the package, or CI fails.

`npm test` already runs `@so/model` Jest. New exported schema and host-parser functions get unit tests there (valid preset, rejected unknown section, broken nav id, each demo slug, host parser cases including apex, port, and custom domain). No Playwright and no `packages/sites` unit tests in this phase.

CI already runs on draft pull requests (`opened`, `synchronize`, `reopened`, `ready_for_review`). It must be green before merge. This plan-only pull request does not change CI and should stay green on its own.

### Order on the day it ships

1. Merge this pull request to `develop`.
2. Run **Production** so `supabase db push` creates `site` and the three rows. `deploy_vercel` can stay on; that deploys the main app, which this feature does not change.
3. Run **Create Vercel sites project** once.
4. Set the sites project env (checklist below).
5. Run **Sites production**.
6. Attach the three domains (Vercel and Namecheap).
7. Open each demo: sample badge visible, view-source or response header shows `noindex`, unknown host 404s, `https://simpleoutcome.dev` still serves the main app.

---

## Manual setup Matthew does

Code and workflows do not change Namecheap, and they cannot create the Vercel project until the token and org id already used by Production are in GitHub. Tick these off by hand:

- [ ] Confirm the existing Vercel team (the one in `VERCEL_ORG_ID`) is on **Vercel Pro**. Client sites are commercial use. Hobby is the wrong plan for this project. Pro is also the plan that would be required if we later wanted a wildcard domain; this design does **not** use a wildcard.
- [ ] Confirm Namecheap has **no** wildcard record for `*.simpleoutcome.dev`. Each demo is its own record.
- [ ] Confirm the apex `simpleoutcome.dev` and `www` stay on the **existing** Vercel project. Do not add the apex to `simple-outcome-sites`.
- [ ] Run **Create Vercel sites project** (after the workflow exists on `develop`). Check the run summary: project `simple-outcome-sites`, root `packages/sites`, Git not connected, GitHub variable `VERCEL_PROJECT_ID_SITES` set. `VERCEL_PROJECT_ID_PRODUCTION` unchanged.
- [ ] On that Vercel project, set production env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (same Supabase project as the main app), `NEXT_PUBLIC_SITES_ROOT_DOMAIN` = `simpleoutcome.dev`. Do **not** set `SUPABASE_SECRET_KEY`.
- [ ] Run **Production** once so the `site` migration is applied. Confirm the three rows in the Supabase table editor.
- [ ] Run **Sites production** and open the deployment URL. It should 404 (no client site on `*.vercel.app`).
- [ ] For each of `newbeauty`, `soniasnails`, `lkbaesthetics`:
  - [ ] Vercel project → Domains → add `<slug>.simpleoutcome.dev`.
  - [ ] Namecheap → Advanced DNS → CNAME. Host is the slug. Target is **the value Vercel shows** for that domain (do not assume a fixed `cname.vercel-dns.com` if the UI shows a different target). DNS only. Not “URL redirect” and not domain forwarding.
  - [ ] Wait until Vercel shows the certificate as issued.
  - [ ] Load `https://<slug>.simpleoutcome.dev` and confirm the prospect name, the SAMPLE badge, and `noindex`.
- [ ] When a client pays: they set DNS at their registrar to the records Vercel shows. Subdomains are a CNAME. An apex (`example.co.uk`) is usually an A record (Vercel shows the address), because a CNAME at the apex is not valid at every registrar. Not forwarding. Add the domain on **this same** Vercel project, set `custom_domain`, set `status` to `live`. The sample badge and `noindex` come off only then.
- [ ] Keep Git disconnected on the sites project so a push to `develop` does not deploy client sites.

---

## Implementation steps

After this plan is approved, the work lands on this same pull request in this order. Each step should leave CI green.

1. **Model.** `packages/model/src/site/`: valibot schema, types, ten presets, three demo documents, host parser. Export from the package index. Jest tests for the cases listed under CI.
2. **Migration.** `public.site`, RLS, grants, moddatetime trigger, three inserts.
3. **App shell.** `packages/sites` package, env example, proxy rewrite, 404 for unknown hosts, dynamic render of one parsed document. Root `build:sites` script. Dev fallback only when Supabase env is unset.
4. **Sections.** The twelve section components and theme CSS variables, transcribed from the ten mocks. Preset pages match the section sequences in the table above.
5. **Demo and live presentation.** SAMPLE badge, footer, metadata robots, dynamic `robots.ts`, `X-Robots-Tag` on `*.simpleoutcome.dev`.
6. **CI and deploy workflows.** Sites build step in `ci.yml`. `sites-production.yml`. `create-vercel-sites-project.yml`. README deploy section gets a short pointer at this plan (the manual checklist stays here, not a second copy).
7. **Self-check before marking the PR ready.** `npm test` covers the new model exports. `npm run lint` and the sites build pass. `packages/web` has no behaviour diff. Matthew runs the manual checklist after merge; the PR description records that those DNS and Vercel clicks are still his.

---

## Out of scope

- Drag-and-drop editor, auth for editing, and any write UI.
- Image upload, Supabase Storage, and `next/image` remote patterns.
- Contact form and any new messages table.
- Map SDK, booking engine, payments, and Fresha API.
- Wildcard DNS, moving Namecheap to Vercel nameservers, and moving `simpleoutcome.dev` onto the sites project.
- Internationalisation, blog, and extra niches beyond a document that happens to use the same sections.
- Playwright, preview deployments per pull request, and connecting the Git repository to Vercel.
- Restyling `packages/web`.

---

## Risks

- **Apex domain collision.** Adding `simpleoutcome.dev` to the sites project would take the main site off its current project. The checklist forbids that. The host parser 404s the apex even if it is attached by mistake.
- **Create-project workflow foot-gun.** The existing workflow writes `VERCEL_PROJECT_ID_PRODUCTION`. The sites workflow must use a different variable name.
- **`lerna exec` lint.** A package without a `lint` script fails the whole CI job.
- **Document drift.** SQL inserts duplicate the TypeScript demos. They are committed in one change; later copy edits go through a new migration (or dashboard SQL) until an editor exists. The bundled file fallback must not run in production.
- **Public JSON.** RLS lets anyone with the anon key read every site document. That is acceptable only while documents are public marketing content. Do not put private notes, inbox mail, or tokens in `document`.
- **Dynamic render cost.** One uncached server render per request is fine for a handful of demos. Revisit if the project grows past what a single Node render can absorb.
- **Namecheap target.** Vercel’s CNAME target is shown per domain. Hard-coding an old target is a failed certificate, not an app bug.

---

## Open questions for Matthew

1. **Prospect demos vs the short mock.** Design 04 is hero, three highlights, and a price list. The three demos are specified as that preset with placeholder content, so the plan keeps them to those sections. Should New Beauty, Sonia’s Nails UK, and LKB Aesthetics instead add gallery, reviews, booking, hours, and contact (same theme, extra sections) so the sales demo looks more complete?
2. **Real public facts.** This plan uses the real business names and fictional prices, reviews, and addresses. If you want a real Fresha URL, a real menu, or a real street address on a demo, say which fields are allowed to be real. Photos stay placeholders either way.
3. **Table name `site`.** You said `sites`. The rest of the database is singular (`pod`, `space`). The plan uses `site`. Say if you want the plural name anyway.
4. **Valibot and no Chakra.** Both match the repo better than zod and Chakra for this app. Confirm, or say if the sites app should use Chakra after all.
5. **Indexing once live.** Plan: live custom domains are indexable; every `*.simpleoutcome.dev` host stays `noindex`. Confirm.
6. **Who may flip `status` and edit JSON before an editor exists.** Plan: you, via a migration or the Supabase SQL editor. No one else, and the sites app has no service-role key. Confirm.
7. **Demo badge wording.** Plan: corner text `SAMPLE`. The mocks say `SAMPLE DESIGN · HOME STUDIO`. Which should the prospect demos use?
