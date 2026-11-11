# Salon site contact form — plan

**Status:** Draft. Plan only. Do not implement from this pull request until Matthew approves the open questions at the bottom. The decisions under “Decided” are already settled.

**Repo:** [CoolColdUK/simpleOutcomeDev](https://github.com/CoolColdUK/simpleOutcomeDev)

A visitor on a salon site can send a message to that salon. The salon's delivery email never appears in the page, the HTML, the public site JSON, or the public Supabase API.

This sits on the sites app from the multi-site plan (`packages/sites`, `public.site`, valibot in `@so/model`). One Vercel project still serves every demo and every live site. The form posts to the sites app. It does not call `packages/web`.

The form is part of the standard £39/month care plan. There is no paid feature flag and no second price.

---

## What is public today

`public.site` is readable by `anon` and `authenticated` (`site_select_public`). The `document` jsonb is the public API. A contact channel of `kind: "email"` is a `mailto:` link in that JSON and in the HTML. `parseSiteDocument` currently requires `mailto:` for that kind. No preset and none of the three demos use it. Sonia's Nails UK publishes a phone number. New Beauty and LKB Aesthetics have an empty channel list.

The sales banner on a demo opens a panel with £450 setup, £39/month, and a `mailto:` to the sales address. This plan replaces that mailto with the contact form.

The main app's `POST /api/contact` validates with `contactRequestSchema` and logs the name and email. It does not store or send anything. The salon form does not reuse that route.

---

## Included in the £39/month plan

The form is included in the care plan. Code does not check Stripe and does not hide the form behind a paid flag.

A per-site switch turns it on or off: `public.site.messages_enabled boolean not null default true`. The anon key may read it. It is not a secret. `false` hides the page section and the “Make this yours” form, and the route answers that messages are not available, without inserting a row. Matthew sets the column in SQL. Existing rows default to on.

---

## Where the delivery email lives

Not in `public.site.document`. Not in a column the anon key can select.

### `public.site_contact`

One row per site. The owner's delivery address.

| Column | Type | Notes |
| --- | --- | --- |
| `site_id` | `uuid` primary key | References `public.site(id)` on delete cascade. |
| `delivery_email` | `text` not null | Check it contains `@` and no spaces. |
| `created_at` | `timestamptz` not null | `default now()` |
| `updated_at` | `timestamptz` not null | `default now()`, `extensions.moddatetime('updated_at')` |

RLS on. No policies. `revoke all` from `anon` and `authenticated`. No `grant`. PostgREST then has nothing to expose. Matthew inserts the row in the SQL editor (same as editing `site` today). The sites server reads it with the service key.

### `public.site_message`

One row per submission.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` primary key | `gen_random_uuid()` |
| `site_id` | `uuid` not null | References `public.site(id)` on delete cascade. |
| `purpose` | `text` not null | `enquiry` (a visitor writing to the salon) or `sales_lead` (a demo “Make this yours” submission). |
| `visitor_name` | `text` not null | |
| `visitor_email` | `text` not null | |
| `body` | `text` not null | |
| `marketing_opt_in` | `boolean` not null | Default `false`. See data protection. |
| `ip_hash` | `text` not null | SHA-256 of the client IP and a server pepper. The raw IP is not stored. |
| `status` | `text` not null | `received`, `emailed`, or `failed`. Default `received`. |
| `created_at` | `timestamptz` not null | `default now()` |

RLS on. No policies. `revoke all` from `anon` and `authenticated`. No `grant`. Indexes on `(site_id, created_at)`, `(site_id, purpose, created_at)`, and `(site_id, ip_hash, created_at)`.

### Enquiry count

A later monthly “you got N enquiries” email is out of scope. The count is queryable now so that email is a small query when it is built.

View `public.site_enquiry_count` with `site_id` and `enquiry_count`. It counts `site_message` rows where `purpose = 'enquiry'`. `sales_lead` rows are excluded, so the salon email does not count Simple Outcome’s own leads. Revoke select on the view from `anon` and `authenticated`. Matthew, or a later job with the service key, runs:

```sql
select enquiry_count
from public.site_enquiry_count
where site_id = '<uuid>';
```

Sales leads are the same table filtered with `purpose = 'sales_lead'`. No email is sent for either count in this work.

### Why the server uses the service key

Recommended write path: the sites route handler inserts with `SUPABASE_SECRET_KEY`. The service role bypasses RLS. The handler is the only place that checks Turnstile, the honeypot, and the rate limit.

An insert policy for `anon` would let a client post straight to PostgREST and skip those checks. A policy also cannot keep `delivery_email` hidden while still letting the browser insert. So there is no anon insert policy and no anon select policy.

The service key can read and write the whole Supabase project, not only these two tables. The handler selects `delivery_email` for the site it already resolved, and inserts one `site_message`. It does not use the key for anything else. The key is never `NEXT_PUBLIC_`, never sent to the browser, and never logged. This revises the earlier “no Supabase secret on the sites project” rule for the server runtime only. The anon key still cannot read `site_contact` or `site_message`.

A narrower database role (insert on `site_message`, select on `site_contact` only) is safer and is a later hardening step, not v1. The repo already has one server secret and no custom-role setup.

The page reads `messages_enabled` from `public.site` with the anon key. It does not need the service key to decide whether to show the form.

---

## Form in the site document

New section type `contactForm` in the valibot schema in `@so/model`. Props: `title`, optional `intro`, `submitLabel`. No email field, no recipient, no placeholder that could hold an address.

The existing `contact` section stays for a published phone, WhatsApp, or Instagram link. Remove `email` from the channel `kind` picklist and delete the `mailto:` branch in `parseSiteDocument`. A document that still has `kind: "email"` fails validation and the page 404s rather than rendering the address. Phone numbers that the salon already publishes stay.

Demos gain a `contactForm` section in a new migration when this is implemented. The three current seed rows are not edited in place. `messages_enabled` defaults to true on those rows.

Nav may link to the form section id. The section is one column on a phone. Inputs use at least 16px type so iOS does not zoom. The submit control is at least 44px tall. Labels stay visible. Errors sit with the field. The same 375px and 1280px checks as the rest of the sites app: no horizontal scroll. The sales panel uses the same form and the same checks.

The per-site notice sits next to the form. Wording is under data protection.

---

## Submission path

`POST` route handler at `packages/sites/app/api/site-message/route.ts`. A client component posts `FormData` or JSON. The browser does not send a site id that we trust: the handler resolves the site from the request host with `resolveSiteHost`, the same way the page does. A body that names a different slug is ignored.

Order:

1. Parse with a new valibot schema in `@so/model`: name 1–80, email, message 1–2000, `consent: true`, `marketingOptIn` boolean, honeypot string empty, Turnstile token 1–2048 characters.
2. If the honeypot is filled, respond `{ok: true}` and do not store or send. The bot learns nothing.
3. Verify the Turnstile token with Cloudflare `siteverify`. Reject when it fails.
4. Load the public site row (slug or custom domain), including `messages_enabled`. Unknown host is 404. `messages_enabled = false` returns that messages are not available and does not insert.
5. Choose the recipient and `purpose` (demo rule below). A live site with no `site_contact` row returns a generic “messages are not available” and does not insert.
6. Rate limit (below). When limited, `429` and a short message.
7. Insert `site_message` with status `received`.
8. Send the email. On success, set status `emailed`. On failure, set status `failed` and return a generic error so the visitor can retry. The stored row is the record of the failure.
9. Replace the form with “Message sent. They will reply by email.” Do not echo the salon address in that sentence. A demo success line says Simple Outcome has the message.

Validation errors name the field (“Enter an email”). Server failures use one sentence and do not include JSON from Supabase or the email provider. The page stays usable with JavaScript: the form is a normal post that shows the result on the same page.

Pure helpers live in `@so/model` so the existing Jest run covers them: recipient choice, purpose, and whether a count is over the limit. Tests assert a demo recipient is the sales inbox and `purpose` is `sales_lead`, and that the helper does not return `delivery_email` when status is `demo`.

---

## Delivery

**Resend**, called with `fetch`. No new npm package. Free tier is 3,000 emails a month and 100 a day, which covers these forms. Matthew verifies the domain `simpleoutcome.dev` in Resend and adds the DNS records Resend shows, in Namecheap, on the existing domain. That is separate from the demo CNAMEs.

- From: `Simple Outcome <notifications@simpleoutcome.dev>`
- To: the address from the recipient rule
- Reply-To: the visitor's email
- Subject: `Message from <name> via <business name>` for an enquiry. `New lead from <name> via <business name>` for a sales lead.
- Text body: the message, the visitor's email, and the site slug. The salon address is not in the body. The body does not start a marketing list.

**Reply-To trade-off.** The visitor does not see the salon address on the page or in the first email (that email is From our domain). When the owner presses Reply, their own mail program sends from their mailbox, and the visitor then sees that address. That is acceptable for v1. A full relay (both directions through a token address on `simpleoutcome.dev`) would keep the salon address hidden after a reply. It needs inbound mail, thread ids, and a second spam surface. Build it only if a salon asks.

---

## Demo mode and “Make this yours”

When `site.status` is `demo`, do not read `site_contact` for delivery. Send to `info@simpleoutcome.dev` and store `purpose = 'sales_lead'`.

The existing “Make this yours” panel keeps the £450 setup and £39/month lines. The contact control in that panel opens this same form, not a `mailto:`. Submitting it stores a lead and emails Matthew’s sales inbox, so a salon owner’s interest is captured. The form section on the demo page uses the same component, the same recipient, and the same `sales_lead` purpose. A sample site does not email the salon.

The form shows:

> This is a sample. Your message goes to Simple Outcome, not the salon.

A `site_contact` row on a demo is ignored, so a prospect is not emailed before they buy. Live sites never use the sales inbox as a fallback. If the private row is missing on a live site, the form is unavailable. `messages_enabled = false` hides the section and the panel form on demos and on live sites.

---

## Spam and abuse

- Honeypot: a field named `company_website`, visually off-screen, not `type="hidden"`. Filled means pretend success.
- Cloudflare Turnstile. The site key is public (`NEXT_PUBLIC_TURNSTILE_SITE_KEY`). The secret stays on the server. Verify before insert.
- Rate limit, counted from `site_message` with the service key: 5 rows per `ip_hash` per site in the last hour, and 30 rows per site in the last hour. Inserts that fail the limit are not stored.
- Length limits are in the valibot schema above.
- No keyword filter in v1.

---

## Data protection

For a stored enquiry (`purpose = 'enquiry'`), the salon is the controller and Simple Outcome is the processor. The salon decides to receive messages about the business. Simple Outcome hosts the form, stores the row, and sends the email so the salon can reply. A written processor agreement is a paper step when a client pays, not a code change in v1.

For a demo `sales_lead`, the salon does not receive the message. Simple Outcome is the controller of that lead. The notice says so.

Next to the form, a short notice names that site’s business. It is not only a link away. It states:

- What is collected: name, email, message, and a hash of the IP used to limit spam.
- Why: to pass the enquiry on so it can be replied to.
- Who sees it: the salon, and Simple Outcome as processor. On a demo, only Simple Outcome.
- How long: 12 months, then the row is deleted.
- Use: the enquiry is used only to reply. It is not used for marketing unless the visitor ticks a separate opt-in.

The reply consent checkbox is required and is not pre-ticked. The marketing opt-in is a second checkbox, off by default, stored as `marketing_opt_in`. v1 does not send marketing email. A later mailer may email only rows where that flag is true.

A fuller `/privacy` page on the sites app repeats the same points for every host. There is no privacy page in the repo today. The form links to `/privacy` as well as showing the short notice. `proxy.ts` allows that path. The page is `noindex` on `*.simpleoutcome.dev`, same as the rest of those hosts.

Retention is 12 months from `created_at`. A scheduled cleanup deletes the whole row (name, email, body, hash, purpose, and opt-in together). v1 adds a GitHub Actions workflow on a monthly schedule that runs:

```sql
delete from public.site_message
where created_at < now() - interval '12 months';
```

It uses the same production database credentials as the Production workflow. It does not enable `pg_cron`. The notice states 12 months.

The IP is stored only as a hash with a pepper (`SITES_IP_HASH_PEPPER`). The pepper is a repository secret. Losing the pepper only breaks the rate-limit identity; it does not reveal IPs.

---

## Env and GitHub Actions

Same pattern as Sites production after the GitHub-env change: `vercel pull`, then overwrite keys in `.vercel/.env.production.local`, then build. The workflow fails with `::error::` when a required value is empty. Values are not printed.

| Name | GitHub | In the build | Required |
| --- | --- | --- | --- |
| `SUPABASE_SECRET_KEY` | Secret (already used by Production) | Server only. Not `NEXT_PUBLIC_`. | Yes |
| `RESEND_API_KEY` | New secret | Server only | Yes |
| `TURNSTILE_SECRET_KEY` | New secret | Server only | Yes |
| `SITES_IP_HASH_PEPPER` | New secret | Server only | Yes |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | New variable | Inlined in the browser widget | Yes |

Do not set these on the Vercel project. Do not put the service key, Resend key, Turnstile secret, or pepper in the client bundle. The existing public build env (Supabase URL, anon key, root domain, sales email) stays as it is.

Local `packages/sites/env.example` lists the names with empty values. Local dev without the secrets shows the form and a configuration error on submit, and does not fall back to printing a salon address.

`npm run build:sites` in CI gets a dummy Turnstile site key so the client bundle still builds. The route is not called in CI.

The monthly delete workflow is separate from Sites production. It does not deploy the app.

---

## Tests

In `@so/model` Jest:

- A `contactForm` section parses.
- `kind: "email"` is rejected.
- Submission schema rejects a missing consent, an empty message, and a message over 2000 characters. A missing marketing opt-in fails the schema; `false` is valid.
- Demo recipient is `info@simpleoutcome.dev` and purpose is `sales_lead`, even when a delivery email is passed in.
- Live recipient is the delivery email and purpose is `enquiry`. The recipient is absent when the live row has no delivery email.
- `messages_enabled = false` means the form is not offered.
- Rate-limit helper: 5 in an hour for one hash is over the limit; 4 is not; 30 for the site is over the limit.
- The enquiry-count helper counts `enquiry` rows and ignores `sales_lead` rows.

No Playwright in this phase. Layout check at 375px and 1280px, including the sales panel form, is part of the implementation self-check.

---

## Later, not in v1

An inbox in the main SimpleOutcome app: a signed-in owner sees `site_message` rows for their site. That needs a link from a user to a site, which does not exist yet (Matthew is the only editor). When it is built, it reads through the main app's server with the service key or a new authenticated policy. It still does not grant `anon` select.

A monthly “you got N enquiries” email, using `site_enquiry_count`. The view is in v1. The email is not.

A full reply relay, and a narrower database role, are the other follow-ups.

---

## Out of scope

- Editing sites in a UI. Matthew still inserts `site_contact` and flips `messages_enabled` with SQL.
- File uploads on the form.
- A paid add-on or feature flag for the form. It is included in the £39/month plan.
- Sending marketing email, even when `marketing_opt_in` is true. The column is stored for later.
- Changing `packages/web` contact stub, except to leave it alone.
- Deploying this plan. The pull request is the document only.

---

## Decided

1. On a demo, “Make this yours” opens this contact form and delivers to `info@simpleoutcome.dev`. The row is a `sales_lead`.
2. For a stored enquiry, the salon is the controller and Simple Outcome is the processor. The notice next to the form says what is collected, why, who sees it, and that it is kept for 12 months. Enquiries are used only to reply. Marketing needs a separate opt-in, which v1 only stores.
3. Stored messages are deleted after 12 months by a monthly scheduled workflow.
4. `site_enquiry_count` makes a per-site enquiry count one query. The monthly email that would use it is later.
5. The form is included in the £39/month plan. The only switch is `site.messages_enabled`. There is no paid feature flag.

---

## Open questions for Matthew

1. **Email provider.** Recommended default: Resend, via `fetch`, From `notifications@simpleoutcome.dev`, after you add the DNS records Resend shows. No new npm package.
2. **Tables.** Recommended default: `public.site_contact` for the delivery address and `public.site_message` for submissions. Neither is readable by the anon key. The on/off switch is `public.site.messages_enabled`, which the anon key can read.
3. **How the insert happens.** Recommended default: the sites route uses the existing `SUPABASE_SECRET_KEY`. No anon insert policy. The key can access the whole database; the route only reads one delivery address and inserts one message.
4. **Reply path.** Recommended default: Reply-To the visitor. A direct reply reveals the salon address to that visitor. A full relay waits until a salon asks for it.
5. **Spam checks.** Recommended default: honeypot, Cloudflare Turnstile, 5 messages per IP-hash per site per hour, 30 per site per hour, and the length limits above.
6. **Published phone numbers.** Recommended default: keep phone, WhatsApp, and Instagram channels. Reject `kind: "email"` so a mailto link cannot be stored in the public document.
7. **Secret on the sites deployment.** Recommended default: pass `SUPABASE_SECRET_KEY` through Sites production into the server env only, using the same GitHub overwrite as the public build env. It is not a `NEXT_PUBLIC_` variable and it is not set in the Vercel dashboard. This is a change from “no Supabase secret on the sites project”, limited to the server.
