# Multi-site salon websites — plan

**Status:** Draft for Matthew’s review. Provisional answers are recorded at the bottom and are not a formal approval. This file is the whole product change. No app, schema, or migration code until this plan is approved. Implementation then continues on this same pull request.

**Repo:** [CoolColdUK/simpleOutcomeDev](https://github.com/CoolColdUK/simpleOutcomeDev)

A separate Next.js app in this monorepo serves many small-business websites. **One** Vercel project serves every demo and every live client site. The hostname picks the row. The sites app reads that row from Supabase itself (anon key, read-only). It does not call an API on the main SimpleOutcome app, so client sites stay up when that app is down. Shared code is a workspace package (`@so/model`), linked at build time, not a runtime hop through `packages/web`.

Each site is a JSON document: a theme plus an ordered list of sections. Layout is mobile-first. The first niche is Southampton salons and nail studios. We publish prospect demos on `*.simpleoutcome.dev` subdomains, then point the client’s own domain at the same project and mark the row live when they pay.

The visual reference is the attached archive of 10 HTML mockups (`01-clean-studio` through `10-neighbourhood-salon`), their preview PNGs, and `gen.py`. That archive stays out of git. Implementation transcribes each mock into a preset document; it does not serve the HTML files.

---

## Fit against this repo

Checked against `develop` after merging PR #35 (monorepo at Lerna `packages/*`, Next.js 16 in `packages/web`, latest migration `supabase/migrations/20261111200000_book_asset_type_other.sql`, production deploy in `.github/workflows/production.yml`). That merge did not touch deploy, CI, or the package layout this plan depends on.

| Agreed direction | What the repo actually does | Plan |
| --- | --- | --- |
| Own app folder, separate Vercel project | Workspaces and Lerna are both `packages/*`. There is no `apps/` tree. | New package `packages/sites` (`@so/sites`). Adding `apps/sites` would also mean editing the workspace and Lerna globs, which is a structural change this feature does not need. |
| Do not move the existing app | `packages/web` is the SimpleOutcome app. | No route, layout, or dependency changes in `packages/web`. |
| Resolve the site from the hostname with middleware / rewrite | `packages/web` is Next.js `^16.3.1`. In Next 16 the `middleware.ts` file convention is deprecated and renamed to `proxy.ts` (Node.js runtime). | `packages/sites/proxy.ts` reads the `Host` header and rewrites internally. The page loads the row. |
| Validate site JSON with a schema (zod was the example) | Shared schemas live in `@so/model` and use **valibot** (`valibot` ^1.5). Zod is not a dependency. | Valibot schema in `@so/model`, with unit tests. No new validation library. |
| One new table in the existing Supabase, with RLS, using the existing migration setup | Tables are singular (`pod`, `space`, `profile`). RLS is on everywhere. `anon` is denied on app tables. `extensions.moddatetime` is already the `updated_at` trigger. Production applies SQL only via **Actions → Production** (`supabase db push`). | New table `public.site`. New migration only. No new extension, no Realtime, no storage bucket. |
| Demos seeded from files as well as the database | Local reset runs migrations, not a separate seed step. | Preset and demo documents are TypeScript in `@so/model`. The migration inserts the same three demo documents. Local dev can render those bundled documents when Supabase env is unset. Production reads the database only. |
| Deploy | Production is **not** Vercel’s Git integration. `.github/workflows/create-vercel-project.yml` creates a project with **no Git connection**, root `packages/web`, and writes `VERCEL_PROJECT_ID_PRODUCTION`. `production.yml` then `vercel pull && vercel build --prod && vercel deploy --prebuilt --prod`. A comment in that workflow says to disable Git auto-deploy. | A **new** workflow deploys `packages/sites` to **one** new Vercel project. That single project hosts every demo subdomain and every live client domain. Do not connect Git. Do not create a project per client. Do not reuse the create-project workflow as it stands: a successful run overwrites `VERCEL_PROJECT_ID_PRODUCTION`. |
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
7. **Demo chrome is a function of `status`**, not a section in the JSON. A sales banner (below) renders only when `status = demo`. A future editor cannot delete it from the document or turn indexing on for a `*.simpleoutcome.dev` host.
8. **Images in this phase are placeholders** (label + CSS gradient), matching the mocks. The schema allows a URL later. No Supabase Storage bucket, and no copying of real photographs. Real public name, prices, and Fresha link are allowed on the three demos (provisional, below).
9. **No map SDK and no contact form.** Hours and location are text, plus an optional outbound maps link. Contact is phone, email, WhatsApp, and Instagram links. Booking is an outbound link (Fresha or an existing booking page).
10. **One sites deployment, independent of the main app.** All demos and all live client sites are hostnames on the same Vercel project. The sites server reads `public.site` with the Supabase anon key. It never calls `packages/web`. A sites migration still ships through the existing Production workflow’s `supabase db push`, because that is the only migration path. The sites *build* does not run inside that workflow.
11. **Mobile-first.** Every section and every preset is designed for a phone first and checked at about 375px wide. Desktop layout is a wider enhancement of that phone layout. The HTML mocks are 1280px desktop pictures; they set colour, type, and section order, not a fixed canvas to copy onto a phone.

---

## One project, direct Supabase read

```text
Browser  →  hostname
        →  Vercel project simple-outcome-sites  (packages/sites)
        →  Supabase public.site  (anon select)
```

- Adding a demo or a client is a domain on **this** project plus a row in `site`. It is not a new Vercel project.
- `loadSiteForHost` uses `@supabase/supabase-js` on the server. The only shared runtime dependency is the built `@so/model` package (schema, presets, host parser), imported like any other workspace package.
- No request goes to simpleoutcome.dev’s app, its `/api` routes, or MCP. A failed deploy of `packages/web` does not remove DNS for client domains and does not stop this app.
- Supabase is still in the path. If Supabase is down, sites cannot load a row. Production does not fall back to a file baked into the deploy.
- The sites project does not get `SUPABASE_SECRET_KEY`. Writes stay in SQL, done by Matthew.

---

## Mobile-first

Base CSS is the phone layout. Wider layouts use `min-width` media queries. Nothing in a section may assume the 1280px artboard from `gen.py`.

Acceptance criteria, checked in a browser before this work is called done. Width is 375px (a typical phone) and, separately, about 1280px (the mock width, so the desktop composition is still recognisable). Check every preset and all three prospect demos.

- The document has the viewport width set to the device width. Next.js does this by default; do not override it with a fixed layout width.
- At 375px there is no horizontal scrolling on the page, the nav, any section, the sales banner, or the sales panel.
- Body text is at least 16px. Headings wrap inside the screen. Long business names and prices stay visible.
- Tap targets for nav links, the booking control, contact links, the banner button, and the panel’s close control are at least 44px on the short side.
- The nav can be used without hover. On a phone the links collapse into a control that opens and closes; they are not clipped off the side of the screen.
- Multi-column blocks (highlights, gallery, review cards, team, split offers, card-style prices) are one column at 375px. A second column is allowed only when both columns still fit without horizontal scroll.
- A price row wraps or stacks so the service name and the price are both on screen.
- Split heroes stack: text first, placeholder media under it, both at full content width. Quote text wraps.
- Opening hours and address lines wrap. The map placeholder is `max-width: 100%`.
- The sales banner is in normal flow at the top of the page (not a fixed corner badge). At 375px the sentence and the button stack. The panel fits the viewport, scrolls inside itself if the copy is taller than the screen, and does not add horizontal scroll.
- Placeholder blocks never use a fixed pixel width wider than the viewport.
- At about 1280px, presets still show the side-by-side hero, grids, and price rows from the mocks. That wider layout must not be required for the page to make sense.

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

**Demo host rule.** A host under `simpleoutcome.dev` is always `noindex`, even if a row were marked `live` by mistake. Going live for real means a custom domain plus `status = live`.

**Banner rule.** The sales banner renders only when `status = demo`. A custom domain that is still `demo` keeps the banner and stays `noindex`. A custom domain with `status = live` has no banner and may be indexed.

**Live rule.** Custom domain and `status = live`: no sales banner, pages may be indexed.

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
| `hoursLocation` | Hours, address, map placeholder | `title`, `address` (see below), `hours`: `{ days, hours }[]`, optional `note`, optional `mapsUrl`, `showMapPlaceholder` |
| `contact` | Click-out details | `title`, `channels`: `{ kind: phone \| email \| whatsapp \| instagram, label, href }[]` |
| `faq` | Questions | `title`, `items`: `{ question, answer }[]`. Answers are visible text, not a JS-only disclosure, so the page still works without client interactivity. An accordion can enhance it. |
| `team` | People grid (design 07) | `title`, `members`: `{ name, role, media }[]` |
| `splitCta` | Two offers side by side (design 09) | `items` (exactly two): `{ title, body, ctaLabel, href, media }` |

Placeholder `background` is a CSS gradient or a flat colour, as in the mocks. There is no `<img>` until a later phase adds `{ kind: "url", src }` beside `{ kind: "placeholder", label, background }`. The v1 schema is the placeholder variant only, with the object shape already a tagged union so the URL variant can be added without renaming fields.

Courses in design 09 are a `services` section titled “Upcoming courses”, not a separate type.

`hoursLocation.address` is a tagged union:

- `{ kind: "street-and-area", street, area }` — street name and neighbourhood or district only. No house number field. Used for home-based businesses.
- `{ kind: "full", lines }` — a published shop address, which may include a street number.

The renderer prints street-and-area as “{street}, {area}”. It has no slot for a house number, so a SQL edit cannot tuck one into a first line by accident unless someone switches the kind to `full`.

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

All three use the Home Studio **theme** (colours, fonts, card colour, hero gradient from preset `home-studio`), `preset = home-studio`, and `status = demo`. The section list is the fuller sales page, not the short mock. Proposed content rules (not a formal approval yet; see the last section):

- Real public business name, real public prices, and the real Fresha booking link.
- Placeholder photos only (gradient plus a label). No copied photographs.
- Reviews stay clearly sample quotes, not scraped client reviews.
- New Beauty and LKB Aesthetics are home-based: address kind `street-and-area` only. Never a house number.
- Sonia's Nails UK is not in that home-based pair. A published shop address may use kind `full`, including a street number, when Matthew supplies one. Do not invent a house number.

| Prospect | Slug and demo host | `businessName` | Address kind |
| --- | --- | --- | --- |
| New Beauty | `newbeauty.simpleoutcome.dev` | New Beauty | `street-and-area` |
| Sonia's Nails UK | `soniasnails.simpleoutcome.dev` | Sonia's Nails UK | `full` only if a shop address is supplied |
| LKB Aesthetics | `lkbaesthetics.simpleoutcome.dev` | LKB Aesthetics | `street-and-area` |

The apostrophe stays in the visible name only. The hostname has none.

Section order for these three documents:

1. `hero` (`split`, Home Studio layout)
2. `about`
3. `services` (rows, title “Treatments and prices”)
4. `gallery`
5. `reviews`
6. `bookingCta` (the document `booking.href` is the Fresha link, `provider: "fresha"`)
7. `hoursLocation`
8. `contact`

Nav links point at those section ids. Highlights from the short mock are not on these three pages.

Indexing and robots on these hosts:

- `robots` metadata `noindex, nofollow` because `status = demo`.
- `app/robots.ts` returns `disallow: /` for demo hosts.
- `proxy.ts` sets the response header `X-Robots-Tag: noindex, nofollow` for every host under `simpleoutcome.dev`, which does not need a database read.

### Sales banner

Replaces the plain SAMPLE corner badge. Rendered only when `status = demo`. Live pages do not include the banner or the price panel in the HTML.

- Full-width bar at the top of the page, in normal flow.
- Text: `Sample made for <Business> by Simple Outcome`, with `<Business>` the document `businessName`.
- Button: `Make this yours`. It opens a small panel (a dialog).
- Panel copy: setup **£450**, care plan **£39/month**, and a contact link. Those two prices are constants in the sites app, not fields on the site document, so a JSON edit cannot drop them off a demo.
- The contact link defaults to `mailto:info@simpleoutcome.dev`. Override with env `SITES_SALES_EMAIL` (server-read, default `info@simpleoutcome.dev`). The checklist sets it on the one sites project, so every demo shares it.
- The panel closes with a visible control and with Escape. Focus moves to the panel when it opens and back to the button when it closes.
- The same mobile-first rules apply: at 375px the bar stacks, and the panel fits the screen.

Footer on demos keeps a short line that the photographs are placeholders. It does not repeat the price. The price lives only in the panel.

---

## Database

One new migration under `supabase/migrations/`, timestamped after `20261111200000_book_asset_type_other.sql` (latest on `develop` at this update). It does not edit earlier migrations.

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
- `app/page.tsx` — read the host header, load the row from Supabase, parse with the valibot schema, render the sales banner when `status = demo`, then nav, sections, and footer.
- `app/robots.ts` — dynamic, demo hosts disallow all.
- `components/SiteSalesBanner.tsx` — banner plus panel. Omitted entirely when status is live.
- `components/SiteSection*.tsx` — one file per section type, `ParentChild` naming from the project rules (`SiteSectionHero`, and so on). Phone layout is the default in each file.
- `lib/site/loadSiteForHost.ts` — the direct Supabase read. Server-only. Selects `slug, custom_domain, status, preset, document`. No call into `packages/web`.
- `env.example` — `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITES_ROOT_DOMAIN`, optional `SITES_SALES_EMAIL`.

Rendering is dynamic (`force-dynamic` or an equivalent uncached fetch). A SQL update then shows up without a redeploy. Caching and on-demand revalidation wait until the editor exists and there is something to invalidate.

Unknown section types do not reach the renderer if validation is strict. The section component map is still exhaustive TypeScript (`satisfies Record<SiteSectionType, Component>`).

Dependencies: `next`, `react`, `react-dom`, `@so/model`, `@supabase/supabase-js`, `dayjs` only if a timestamp is formatted (not required for v1 pages). Dev: `typescript`, `eslint`, `eslint-config-next`, types. No Chakra, no Emotion, no new npm packages beyond that set.

Root `package.json` gains `build:sites` (build `@so/model`, then build `@so/sites`). It does **not** fold that into the existing `build` script, which Production uses as the model/component/web pipeline.

---

## Deployment and CI

### How the main app deploys today

GitHub Actions, workflow_dispatch, workflow name **Production**. It lints, tests, bumps the Lerna version, pushes Supabase migrations, then prebuilds and deploys `packages/web` using `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID_PRODUCTION`. The Vercel project is created once by **Create Vercel project**, with no GitHub connection.

Vercel Git integration is not used, and should not be turned on for the sites project either. A Git-connected project would deploy on every push to `develop`, including unrelated app work, which is the failure mode this split is meant to avoid.

### One Vercel project for every site

Project name `simple-outcome-sites`. Root directory `packages/sites`. Every demo subdomain and every client domain is a domain on this project. There is no project per salon. The main SimpleOutcome project (`packages/web`, `VERCEL_PROJECT_ID_PRODUCTION`) is a different project and does not serve these hostnames.

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
7. Open each demo at about 375px wide and at desktop width: sales banner visible, “Make this yours” opens the £450 / £39 panel, response header shows `noindex`, no horizontal scroll, unknown host 404s, `https://simpleoutcome.dev` still serves the main app.

---

## Manual setup Matthew does

Code and workflows do not change Namecheap, and they cannot create the Vercel project until the token and org id already used by Production are in GitHub. Tick these off by hand:

- [ ] Confirm the existing Vercel team (the one in `VERCEL_ORG_ID`) is on **Vercel Pro**. Client sites are commercial use. Hobby is the wrong plan for this project. Pro is also the plan that would be required if we later wanted a wildcard domain; this design does **not** use a wildcard.
- [ ] Confirm Namecheap has **no** wildcard record for `*.simpleoutcome.dev`. Each demo is its own record.
- [ ] Confirm the apex `simpleoutcome.dev` and `www` stay on the **existing** Vercel project. Do not add the apex to `simple-outcome-sites`.
- [ ] Run **Create Vercel sites project** (after the workflow exists on `develop`). Check the run summary: project `simple-outcome-sites`, root `packages/sites`, Git not connected, GitHub variable `VERCEL_PROJECT_ID_SITES` set. `VERCEL_PROJECT_ID_PRODUCTION` unchanged.
- [ ] On that **one** Vercel project, set production env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (same Supabase project as the main app; the sites app reads with this anon key), `NEXT_PUBLIC_SITES_ROOT_DOMAIN` = `simpleoutcome.dev`. Optional `SITES_SALES_EMAIL` (default `info@simpleoutcome.dev`). Do **not** set `SUPABASE_SECRET_KEY`. Do **not** point the sites app at a URL of the main app.
- [ ] Run **Production** once so the `site` migration is applied. Confirm the three rows in the Supabase table editor.
- [ ] Run **Sites production** and open the deployment URL. It should 404 (no client site on `*.vercel.app`).
- [ ] For each of `newbeauty`, `soniasnails`, `lkbaesthetics`:
  - [ ] Vercel project → Domains → add `<slug>.simpleoutcome.dev`.
  - [ ] Namecheap → Advanced DNS → CNAME. Host is the slug. Target is **the value Vercel shows** for that domain (do not assume a fixed `cname.vercel-dns.com` if the UI shows a different target). DNS only. Not “URL redirect” and not domain forwarding.
  - [ ] Wait until Vercel shows the certificate as issued.
  - [ ] Load `https://<slug>.simpleoutcome.dev` on a phone-width window (~375px) and at desktop width. Confirm the prospect name, the sales banner (“Sample made for … by Simple Outcome”), the panel prices, and `noindex`. Confirm the page does not scroll sideways.
- [ ] When a client pays: they set DNS at their registrar to the records Vercel shows. Subdomains are a CNAME. An apex (`example.co.uk`) is usually an A record (Vercel shows the address), because a CNAME at the apex is not valid at every registrar. Not forwarding. Add the domain on **this same** Vercel project (not a new project), set `custom_domain`, set `status` to `live`. The sales banner comes off because status is live. `noindex` comes off only for that custom domain. The demo subdomain, if it is still attached, stays `noindex`.
- [ ] Keep Git disconnected on the sites project so a push to `develop` does not deploy client sites.

---

## Implementation steps

After this plan is approved, the work lands on this same pull request in this order. Each step should leave CI green.

1. **Model.** `packages/model/src/site/`: valibot schema, types, ten presets, three demo documents, host parser. Export from the package index. Jest tests for the cases listed under CI.
2. **Migration.** `public.site`, RLS, grants, moddatetime trigger, three inserts.
3. **App shell.** `packages/sites` package, env example, proxy rewrite, 404 for unknown hosts, dynamic render of one parsed document. Root `build:sites` script. Dev fallback only when Supabase env is unset.
4. **Sections, mobile-first.** The twelve section components and theme CSS variables, transcribed from the ten mocks for colour and order. Base styles are the 375px layout; `min-width` queries add the desktop composition. Preset documents match the section sequences in the preset table. The three demos use the longer section list in the Home Studio theme.
5. **Demo and live presentation.** Sales banner and panel (demo status only), footer, metadata robots, dynamic `robots.ts`, `X-Robots-Tag` on `*.simpleoutcome.dev`. `SITES_SALES_EMAIL` defaults to `info@simpleoutcome.dev`.
6. **CI and deploy workflows.** Sites build step in `ci.yml`. `sites-production.yml`. `create-vercel-sites-project.yml`. README deploy section gets a short pointer at this plan (the manual checklist stays here, not a second copy).
7. **Self-check before marking the PR ready.** `npm test` covers the new model exports. `npm run lint` and the sites build pass. `packages/web` has no behaviour diff. Each preset and each of the three demos is opened at about 375px and at about 1280px against the mobile-first acceptance criteria (no horizontal scroll, stacked columns, banner and panel usable). Matthew runs the manual checklist after merge; the PR description records that those DNS and Vercel clicks are still his.

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
- **House number on a home studio.** Kind `street-and-area` has no house-number field. Switching a home-based row to `full` would publish a number. Seed SQL for New Beauty and LKB Aesthetics uses `street-and-area` only.
- **Banner prices in the client.** The panel is public on every demo. That is intentional. Do not put a private phone number or inbox other than the sales address into the banner.

---

## Provisional answers

Matthew has not formally approved this plan. The answers below are **proposed**. They are what implementation will follow unless he changes them in this pull request.

| # | Topic | Proposed |
| --- | --- | --- |
| 1 | Demo sections | The three demos use the full set — hero, about, services and prices, gallery, reviews, booking CTA, hours and location, contact — in the Home Studio theme. The short mock 04 stays the `home-studio` preset document for the library. |
| 2 | What may be real | Real public business name, real public prices, and the real Fresha booking link. Photos are placeholders only. |
| 3 | Home address | New Beauty and LKB Aesthetics show street and area only, never a house number (`address.kind = street-and-area`). |
| 4 | Table name | `site`. |
| 5 | Validation and UI kit | Valibot in `@so/model`. No Chakra in the sites app. |
| 6 | Indexing | Custom client domains are indexable once `status = live`. Every `*.simpleoutcome.dev` host is `noindex`. |
| 7 | Who edits | Matthew is the only editor for now, via SQL (migration or the Supabase SQL editor). No Supabase secret key on the sites project. |
| 8 | Demo chrome | A sales banner, not a plain SAMPLE badge: “Sample made for &lt;Business&gt; by Simple Outcome”, button “Make this yours”, panel with £450 setup, £39/month care plan, and a contact link defaulting to info@simpleoutcome.dev (`SITES_SALES_EMAIL`). Shown only when `status = demo`. |

Nothing else is blocking. Formal approval is still the gate before implementation.
