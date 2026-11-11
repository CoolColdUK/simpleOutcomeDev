# Salon site contact form — plan

**Status:** Draft. Plan only. Matthew has decided the v1 rules below. Do not implement from this pull request until the open questions at the bottom are settled.

**Repo:** [CoolColdUK/simpleOutcomeDev](https://github.com/CoolColdUK/simpleOutcomeDev)

A visitor on a salon site can send a message to that salon. The salon's delivery email never appears in the page, the HTML, the public site JSON, or the public Supabase API. Simple Outcome does not keep a copy of the message.

This sits on the sites app from the multi-site plan (`packages/sites`, `public.site`, valibot in `@so/model`). One Vercel project still serves every demo and every live site. The form posts to the sites app. It does not call `packages/web`.

The form is part of the standard £39/month care plan. There is no paid feature flag and no second price.

---

## Decided for v1

- Send with Resend, called with `fetch`. No new npm package. No row is written for the message. There is no `site_message` table and no cleanup job.
- From: `Website enquiry via Simple Outcome <info@simpleoutcome.dev>`, after that address is verified in Resend on the domain `simpleoutcome.dev`.
- Reply-To: the visitor's address.
- To: the salon's address in `public.site_contact` (no anon read). Demos go to `info@simpleoutcome.dev` instead.
- The per-site switch `public.site.messages_enabled` stays.
- “Make this yours” on a demo opens this same form. That lead is emailed to `info@simpleoutcome.dev` and is not stored.
- A short notice next to the form says the message is emailed to the salon, not stored by us, and used only to reply. There is no marketing opt-in, because nothing is stored.
- Honeypot, Cloudflare Turnstile, and a rate limit stay. The rate-limit store is an open question below.
- A full reply relay is later, not v1.

---

## What is public today

`public.site` is readable by `anon` and `authenticated` (`site_select_public`). The `document` jsonb is the public API. A contact channel of `kind: "email"` is a `mailto:` link in that JSON and in the HTML. `parseSiteDocument` currently requires `mailto:` for that kind. No preset and none of the three demos use it. Sonia's Nails UK publishes a phone number. New Beauty and LKB Aesthetics have an empty channel list.

The sales banner on a demo opens a panel with £450 setup, £39/month, and a `mailto:` to the sales address. This plan replaces that mailto with the contact form.

The main app's `POST /api/contact` validates with `contactRequestSchema` and logs the name and email. It does not store or send anything. The salon form does not reuse that route.

---

## Included in the £39/month plan

The form is included in the care plan. Code does not check Stripe and does not hide the form behind a paid flag.

A per-site switch turns it on or off: `public.site.messages_enabled boolean not null default true`. The anon key may read it. It is not a secret. `false` hides the page section and the “Make this yours” form, and the route refuses the post. Matthew sets the column in SQL. Existing rows default to on.

---

## Where the delivery email lives

Not in `public.site.document`. Not in a column the anon key can select.

### `public.site_contact`

One row per site. The owner's delivery address. This is the only new table in v1, unless the optional counter below is approved.

| Column | Type | Notes |
| --- | --- | --- |
| `site_id` | `uuid` primary key | References `public.site(id)` on delete cascade. |
| `delivery_email` | `text` not null | Check it contains `@` and no spaces. |
| `created_at` | `timestamptz` not null | `default now()` |
| `updated_at` | `timestamptz` not null | `default now()`, `extensions.moddatetime('updated_at')` |

RLS on. No policies. `revoke all` from `anon` and `authenticated`. No `grant`. PostgREST then has nothing to expose. Matthew inserts the row in the SQL editor. The sites server reads it with the service key and does not send that value to the browser.

There is no `site_message` table. The handler does not insert the name, email, or message.

### Why the server uses the service key

The route reads `delivery_email` with `SUPABASE_SECRET_KEY`. The anon key cannot select `site_contact`. The service role bypasses RLS, so the handler must be the only caller, and it selects that one column for the site it already resolved from the host.

The key can read and write the whole Supabase project. The handler uses it only for this read (and for the optional counter, if that question is accepted). The key is never `NEXT_PUBLIC_`, never sent to the browser, and never logged. The page reads `messages_enabled` from `public.site` with the anon key, so rendering the form does not need the service key.

---

## Who sees which address

| Step | Visitor | Salon | Simple Outcome |
| --- | --- | --- | --- |
| The form on the page | Sees no salon address and no `info@simpleoutcome.dev`. The HTML and the public JSON do not contain them. | — | — |
| The email Resend sends | Does not receive this first email. | Sees From `Website enquiry via Simple Outcome <info@simpleoutcome.dev>`, Reply-To set to the visitor, and the visitor's address in the body. | The message passes through Resend. We do not store a copy. |
| The salon presses Reply | Sees the salon's own From address on that reply. | Their mail program sends from their own mailbox. | — |
| A bounce or an auto-reply | — | Their host sends it to the original From. | It arrives at `info@simpleoutcome.dev`, because that is the From address. |

The salon's address is never in the page, the HTML, or the public JSON. A full relay, which would also hide the salon address after they reply, stays later.

Auto-replies and bounces from salon inboxes land in `info@simpleoutcome.dev`. That inbox should be watched. v1 does not add a separate bounce address.

Because the message is not stored, a bounce or a spam filter at the salon is the end of that enquiry. There is no copy to resend. The visitor has already been told it was sent only if Resend accepted it. Matthew checks the Resend logs (the dashboard, searched by the message id) when `info@` receives a bounce or a salon says the message never arrived.

---

## Form in the site document

New section type `contactForm` in the valibot schema in `@so/model`. Props: `title`, optional `intro`, `submitLabel`. No email field, no recipient, no placeholder that could hold an address.

The existing `contact` section stays for a published phone, WhatsApp, or Instagram link. Remove `email` from the channel `kind` picklist and delete the `mailto:` branch in `parseSiteDocument`. A document that still has `kind: "email"` fails validation and the page 404s rather than rendering the address. Phone numbers that the salon already publishes stay. That last point is still an open question.

Demos gain a `contactForm` section in a new migration when this is implemented. The three current seed rows are not edited in place. `messages_enabled` defaults to true.

Nav may link to the form section id. The section is one column on a phone. Inputs use at least 16px type so iOS does not zoom. The submit control is at least 44px tall. Labels stay visible. Errors sit with the field. The same 375px and 1280px checks as the rest of the sites app: no horizontal scroll. The sales panel uses the same form.

Next to the form, on a live site:

> Your message is emailed to the salon. Simple Outcome does not store it. It is used only so the salon can reply.

On a demo:

> This is a sample. Your message is emailed to Simple Outcome, not the salon. It is not stored.

There is no second checkbox and no marketing opt-in.

---

## Submission path

`POST` route handler at `packages/sites/app/api/site-message/route.ts`. A client component posts the form. The browser does not send a site id that we trust: the handler resolves the site from the request host with `resolveSiteHost`, the same way the page does.

Order:

1. Parse with a new valibot schema in `@so/model`: name 1–80, email, message 1–2000, honeypot string empty, Turnstile token 1–2048 characters.
2. If the honeypot is filled, respond `{ok: true}` and do not send. The bot learns nothing.
3. Verify the Turnstile token with Cloudflare `siteverify`. Reject when it fails.
4. Load the public site row, including `messages_enabled`. Unknown host is 404. `messages_enabled = false` refuses the post.
5. Apply the rate limit (below). When limited, `429` and a short message.
6. Choose the recipient. Live: `site_contact.delivery_email`. Demo: `info@simpleoutcome.dev`, and do not read `site_contact` for delivery. A live site with no `site_contact` row refuses the post. The response does not include the address.
7. Send with Resend. The visitor sees “Message sent.” only after Resend accepts the email (a success response that includes a message id). A demo success line says Simple Outcome has the message. If Resend refuses it, the form stays up with a generic error and the visitor can retry. The name, address, and message are not written to Postgres.

Validation errors name the field (“Enter an email”). Server failures use one sentence and do not include JSON from Supabase or Resend.

Pure helpers in `@so/model` choose the recipient. Tests assert a demo recipient is `info@simpleoutcome.dev` even when a delivery email is passed in, and that a live recipient is absent when the private row is missing.

---

## Delivery

**Resend**, `POST https://api.resend.com/emails`. Matthew verifies `simpleoutcome.dev` in Resend and adds the DNS records Resend shows, in Namecheap. That is separate from the demo CNAMEs. `info@simpleoutcome.dev` must be a verified sender.

- From: `Website enquiry via Simple Outcome <info@simpleoutcome.dev>`
- To: the recipient from the rule above
- Reply-To: the visitor's email
- Subject: `Message from <name> via <business name>` for a live enquiry. `New lead from <name> via <business name>` for a demo.
- Text body: the message, the visitor's email, and the site slug. The salon address is not in the body.

**Reply-To trade-off.** The visitor does not see the salon address on the page or in the first email. When the owner presses Reply, their own mail program sends from their mailbox, and the visitor then sees that address. A full relay stays later.

**Bounces and auto-replies.** Mail servers send those to the From address, so they arrive at `info@simpleoutcome.dev`. A bounce, or the salon’s spam filter, drops the enquiry: we have no stored copy to send again. Check Resend’s logs with the message id. The recommended log is an open question below: keep that id, the site id, and the time, and nothing about the person.

---

## Demo mode and “Make this yours”

The existing panel keeps the £450 setup and £39/month lines. The contact control opens this same form, not a `mailto:`. Submitting it emails `info@simpleoutcome.dev` and stores nothing. The form section on the demo page uses the same component and the same recipient. A sample site does not email the salon.

`messages_enabled = false` hides the section and the panel form on demos and on live sites.

---

## Spam and abuse

- Honeypot: a field named `company_website`, visually off-screen, not `type="hidden"`. Filled means pretend success.
- Cloudflare Turnstile. The site key is public (`NEXT_PUBLIC_TURNSTILE_SITE_KEY`). The secret stays on the server. Verify before send.
- Length limits are in the valibot schema above.
- Rate limit without a message table. Recommended approach: **Upstash Redis**, called with `fetch` (REST), no SDK. A key per site and hashed IP, and a key per site, each with a one-hour TTL. Limits stay 5 per IP-hash per site per hour and 30 per site per hour. The value stored is a counter, not the message, the name, or the email. The IP is hashed with `SITES_IP_HASH_PEPPER` before it is used in the key. This works across Vercel serverless isolates. An in-memory counter does not: a new isolate starts at zero, so it is only a local-dev fallback when the Upstash env is unset. Vercel KV is the same Redis product; calling Upstash directly avoids a Vercel paid upgrade. This choice is an open question.
- No keyword filter in v1.

---

## Privacy notice

Next to the form, the short text in the form section above. It says the message is emailed to the salon (or, on a demo, to Simple Outcome), that Simple Outcome does not store it, and that it is used only to reply.

There is no stored-message controller/processor write-up in v1, because we do not keep the message. The salon receives the email in their own inbox and handles it from there. Resend carries the message in order to send it. We do not add a database copy.

A `/privacy` page is not required for v1 if the notice sits next to the form. Do not add a marketing opt-in.

---

## Optional monthly counter

**Open question.** Recommended: yes, include a counter with no personal data, so a later “you got N enquiries” email is a small query.

Table `public.site_enquiry_month`:

| Column | Type | Notes |
| --- | --- | --- |
| `site_id` | `uuid` | References `public.site(id)` on delete cascade. |
| `month` | `date` | First day of the calendar month in Europe/London. |
| `count` | `integer` not null | Default 0. |

Primary key `(site_id, month)`. After a successful live send, the handler increments that row. Demo leads are not counted, because they are not salon enquiries. The row holds no name, email, message, or IP. RLS on, no anon grant. The monthly email that would read it is out of scope.

If this question is declined, v1 sends mail and stores nothing at all.

---

## Env and GitHub Actions

Same pattern as Sites production: `vercel pull`, then overwrite keys in `.vercel/.env.production.local`, then build. The workflow fails with `::error::` when a required value is empty. Values are not printed.

| Name | GitHub | In the build | Required |
| --- | --- | --- | --- |
| `SUPABASE_SECRET_KEY` | Secret (already used by Production) | Server only. Not `NEXT_PUBLIC_`. | Yes, to read `site_contact` |
| `RESEND_API_KEY` | New secret | Server only | Yes |
| `TURNSTILE_SECRET_KEY` | New secret | Server only | Yes |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | New variable | Inlined in the browser widget | Yes |
| `UPSTASH_REDIS_REST_URL` | New secret | Server only | Only if the Upstash rate limit is accepted |
| `UPSTASH_REDIS_REST_TOKEN` | New secret | Server only | Only if the Upstash rate limit is accepted |
| `SITES_IP_HASH_PEPPER` | New secret | Server only | Only if the Upstash rate limit is accepted |

Do not set these on the Vercel project. Do not put secrets in the client bundle.

Local `packages/sites/env.example` lists the names with empty values. Local dev without Resend shows a configuration error on submit and does not print a salon address.

---

## Tests

In `@so/model` Jest:

- A `contactForm` section parses.
- `kind: "email"` is rejected, if that question is accepted.
- Submission schema rejects an empty message and a message over 2000 characters.
- Demo recipient is `info@simpleoutcome.dev` even when a delivery email is passed in.
- Live recipient is the delivery email, and is absent when the live row has none.
- `messages_enabled = false` means the form is not offered.

No Playwright in this phase. Layout check at 375px and 1280px, including the sales panel form, is part of the implementation self-check.

---

## Later, not in v1

- Storing messages, a 12-month delete job, and a marketing opt-in.
- An inbox in the main SimpleOutcome app.
- The monthly “you got N enquiries” email. The counter, if accepted, is the only v1 piece of that.
- A full reply relay.
- A narrower database role than the service key.

---

## Out of scope

- Editing sites in a UI. Matthew still inserts `site_contact` and flips `messages_enabled` with SQL.
- File uploads on the form.
- A paid add-on or feature flag for the form.
- Changing `packages/web` contact stub.
- Deploying this plan. The pull request is the document only.

---

## Open questions for Matthew

1. **Monthly counter.** Recommended default: add `public.site_enquiry_month` (`site_id`, `month`, `count`) and increment it after a successful live send. No name, email, message, or IP. Demo leads are not counted. The email that announces the count is later. Decline this and v1 stores nothing.
2. **Rate limit without a message table.** Recommended default: Upstash Redis via `fetch`, one-hour TTL, 5 per hashed IP per site and 30 per site. In-memory is local dev only. Decline this and v1 keeps honeypot and Turnstile without a cross-request limit.
3. **Service key.** Recommended default: the route reads `site_contact` with the existing `SUPABASE_SECRET_KEY`, passed through Sites production into the server env only. It is not a `NEXT_PUBLIC_` variable and it is not set in the Vercel dashboard.
4. **Published phone numbers.** Recommended default: keep phone, WhatsApp, and Instagram channels. Reject `kind: "email"` so a mailto link cannot be stored in the public document.
5. **Resend message ids.** Recommended default: after Resend accepts a send, store `site_id`, the Resend message id, and the time. No name, email, or message body. That id is what you look up in the Resend logs when a bounce arrives or a salon says nothing came. Decline the table and the id is only in the server log until that log expires. Either way, the visitor sees success only after Resend accepts the email.
