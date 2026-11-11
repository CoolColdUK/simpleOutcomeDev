# Salon site SEO — plan

**Status:** Draft. Plan only. Do not implement from this pull request until Matthew approves the open questions at the bottom.

**Repo:** [CoolColdUK/simpleOutcomeDev](https://github.com/CoolColdUK/simpleOutcomeDev)

Each salon site should describe itself to search engines and link previews. Demo hosts on `*.simpleoutcome.dev` stay `noindex`. A live site on the client’s own domain is indexable, and its canonical URL is that domain so a leftover subdomain does not compete.

This is the sites app (`packages/sites`) and the site document in `@so/model`. One Vercel project still serves every host. The page is rendered per request (`force-dynamic`).

---

## What the app does today

Checked on `develop`:

- `packages/sites/app/layout.tsx` sets a static title `Site` and `<html lang="en">`.
- `generateMetadata` in `app/page.tsx` sets `title` to `businessName`, `description` to `footer.text`, and `robots` to `noindex, nofollow` when the host is a `*.simpleoutcome.dev` subdomain, a local host, the row is missing, or `status` is `demo`. A live custom domain gets `index, follow`.
- `app/robots.ts` returns `disallow: /` for demo subdomains, local hosts, unknown hosts, a missing row, and `status = demo`. A live custom domain gets `allow: /`. It does not advertise a sitemap.
- `proxy.ts` sets `X-Robots-Tag: noindex, nofollow` on demo subdomains. Its matcher skips `robots.txt`, so that route is not rewritten to `/`. `sitemap.xml` is not excluded, so a sitemap route would be rewritten to the page until the matcher changes.
- There is no canonical URL, no Open Graph or Twitter card, no JSON-LD, and no `seo` object on the document.
- The hero is the only `<h1>` (`SiteSectionHero`). Other section titles are `<h2>`. The 404 and error pages have their own `<h1>`, which is correct because they replace the page.
- Photos are not images yet. `SiteMedia` is a label plus a CSS gradient. The label is visible text, not an `alt` attribute. Fonts are the theme’s system stacks (`Georgia`, `Verdana`, and the other preset stacks). No web font is downloaded.

The footer line on the three demos says the page is a sample and that photographs are placeholders. Using that string as the meta description would publish that sentence in Google. The new description should not default to the footer.

---

## `seo` on the document

Add an optional `seo` object on the site document in `@so/model` (valibot, strict). `schemaVersion` stays `1`. Old rows with no `seo` key still parse. Empty strings are treated as missing.

| Field | Notes |
| --- | --- |
| `title` | Optional. Falls back to `businessName`. |
| `description` | Optional. Falls back to the derived sentence below. Max about 160 characters after trim. |
| `locale` | Optional. Default `en-GB`. v1 only allows `en-GB`. |
| `ogImageUrl` | Optional `https` URL. Omitted from the tags when empty. A gradient is not an image URL. |
| `geo` | Optional `{latitude, longitude}`. Both numbers, or neither. Only when someone has typed them. The app does not geocode. |

Canonical host is not a free-text field in the JSON. It is `public.site.custom_domain` when that column is set. That keeps one source for the live domain.

### Defaults when fields are empty

- Title: `businessName`.
- Description: `"{businessName} in {area}. {up to three service names}."` Area comes from `hoursLocation.address.area` for `street-and-area`, or from the last non-postcode line of a `full` address. Service names come from the first `services` section, skipping prices that say “Not published”. If there is no area, drop the “in …” part. If there are no services, use the about section’s first sentence, trimmed. Do not use `footer.text`.
- Locale: `en-GB`. The root layout sets `<html lang="en-GB">` from the document (the layout has to read the host; it is dynamic, same as the page).
- Open Graph and Twitter: `title` and `description` as above, `type` `website`, `locale` `en_GB`. `og:image` and `twitter:image` only when `ogImageUrl` is set. Image alt is the title.

Presets and the three demos can omit `seo` and rely on the defaults. A Jest test checks the derived description for a home-studio document and checks that a footer full of the word “sample” is not the description.

---

## Metadata per host

`generateMetadata` keeps the host rules it has now, and adds:

- `title`, `description`, `openGraph`, `twitter` from the `seo` block and the defaults.
- `alternates.canonical`: `https://{custom_domain}/` when `custom_domain` is set. That includes a `*.simpleoutcome.dev` host whose row already has a custom domain, so the subdomain does not compete. When `custom_domain` is null, omit the canonical tag. Demo hosts stay `noindex` either way.
- `robots` unchanged: `noindex, nofollow` for every `*.simpleoutcome.dev` host, local host, missing row, and `status = demo`. `index, follow` only for a live site on its custom domain.
- `metadataBase` is the canonical origin when there is a custom domain, otherwise the request origin. Relative image URLs are not used in v1.

`proxy.ts` keeps `X-Robots-Tag: noindex, nofollow` for demo subdomains. A live custom domain does not get that header.

---

## JSON-LD

On an indexable page, one `<script type="application/ld+json">` block. `@type` is `BeautySalon` (a `LocalBusiness`). Demo and other `noindex` hosts omit the block, so a sample page does not become a rich result.

| Property | Source |
| --- | --- |
| `name` | `businessName` |
| `url` | The canonical `https://{custom_domain}/` |
| `description` | The same description as the meta tag |
| `image` | `ogImageUrl` when set |
| `telephone` | The first contact channel with `kind: "phone"`, the `tel:` href. Omit when there is no public phone. |
| `address` | See below. |
| `openingHoursSpecification` | Only for an hours row the parser understands: one weekday or a Monday–Friday style range, and one `HH:MM–HH:MM` span. Other rows stay on the page and are left out of the JSON so a bad parse is not published. |
| `priceRange` | Omitted in v1 unless every listed price is a plain `£` amount. Then the lowest and highest become a range such as `£5–£33`. “Not published” and “from £30” mean the field is omitted. |
| `sameAs` | `booking.href` when it is `https`, plus any Instagram channel `https` URL. |
| `geo` | `seo.geo` when both numbers are present. Otherwise omit. Do not call a geocoder. |

### Home-based salons

`address.kind = street-and-area` (New Beauty, LKB Aesthetics) does not put a street or a house number in the JSON-LD. `addressLocality` is the `area` string (for example “Hightown, Southampton”). `addressCountry` is `GB`. `streetAddress` is absent. The visible page can still show the street name without a house number, as it does today. The structured data is the stricter of the two.

`address.kind = full` (Sonia’s Nails UK, a shop) may include the published lines as `streetAddress` plus locality. A house number that is already on the public page may be in the JSON-LD.

---

## Sitemap and robots

Add `app/sitemap.ts`, dynamic, one URL per host.

- Live custom domain: `https://{custom_domain}/` only. `changeFrequency: monthly`.
- Any `noindex` host, including every `*.simpleoutcome.dev` demo: an empty sitemap.
- `app/robots.ts` adds `sitemap: https://{host}/sitemap.xml` only on the allow response. Disallow responses do not point at a sitemap.
- `proxy.ts` matcher excludes `sitemap.xml` the same way it excludes `robots.txt`, so the rewrite to `/` does not swallow the file.

There is no blog and no per-section URL. The sitemap is the homepage.

---

## Page quality

- One `<h1>`: the hero title (or the quote, for a quote hero). Section titles stay `<h2>`. Do not add a second `<h1>` for the business name in the header.
- `SiteMedia.label` is the alt text. When a real `<img>` replaces the gradient, that label is the `alt`, and the image has `width` and `height` (or a fixed aspect box) so the layout does not jump. v1 has no remote images and does not add `next/image` remote patterns.
- Fonts stay the system stacks already on the theme. This work does not add a downloaded font.
- The description and the JSON-LD are in the server render, not injected after load.

---

## Tests

In `@so/model` Jest:

- A document with no `seo` still parses.
- An empty description falls back to business name, area, and service names, and does not use the footer.
- `street-and-area` JSON-LD input has no street and no house number.
- A `full` address may include the street line.
- A price list that says “Not published” does not produce `priceRange`.
- `ogImageUrl` must be `https` when present.

No Playwright in this phase.

---

## Out of scope

- Google Business Profile, analytics, and a sitemap index across salons.
- Geocoding, map embeds, and inventing coordinates.
- Real photo uploads. `ogImageUrl` is a URL someone pastes in SQL until uploads exist.
- Changing `noindex` on `*.simpleoutcome.dev`. That rule stays.
- Deploying this plan.

---

## Open questions for Matthew

1. **Canonical when there is no custom domain.** Recommended default: omit the tag. Demos are `noindex`. When `custom_domain` is set, every host for that row, including a leftover subdomain, canonicals to `https://{custom_domain}/`, and the subdomain stays `noindex`.
2. **Description fallback.** Recommended default: business name, area, and up to three service names. Do not use the footer, because the demos’ footer says the page is a sample.
3. **Open Graph image.** Recommended default: no `og:image` until `seo.ogImageUrl` is an `https` URL. Do not screenshot the gradient.
4. **JSON-LD on demos.** Recommended default: omit it on every `noindex` host. Emit `BeautySalon` only on a live custom domain.
5. **Home address in the structured data.** Recommended default: area only for `street-and-area`. No street and no house number. A shop with `kind: full` may include the published street line.
6. **Hours in the structured data.** Recommended default: emit a day only when the text is one weekday (or a simple weekday range) and one `HH:MM–HH:MM` span. Leave anything else out of the JSON rather than guessing.
7. **priceRange.** Recommended default: omit it unless every price on the page is a plain pound amount. Sonia’s “Not published” rows and “from £30” mean no `priceRange`.
8. **Locale.** Recommended default: `en-GB` for every site, and `<html lang="en-GB">`.
9. **Sitemap.** Recommended default: one URL, the homepage, and only on an indexable custom domain. `robots.txt` links to it only in that case.
