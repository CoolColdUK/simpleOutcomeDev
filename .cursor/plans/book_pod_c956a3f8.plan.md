---
name: Book pod
overview: Add a `book` pod kind — one pod per book with markdown everywhere, interleaved chapters and notes, drag-drop outline, asset library, reading view, paste-to-upload images, MCP/REST agents, optional offline read cache, and EPUB export path for KDP.
todos:
  - id: plan-approval
    content: Matthew approves this plan (no implementation until then)
    status: pending
  - id: migration-book-schema
    content: "Migration: book feature kind, bk_* tables, RLS, storage paths, create_pod; extend pod-private policies"
    status: pending
  - id: model-book
    content: "@so/model book schemas, renumber helpers, soimg path builders, tests"
    status: pending
  - id: web-api-book
    content: lib/api/db/book/*, storage upload/resolve, reorder RPC or serial updates
    status: pending
  - id: ui-book
    content: Book workspace, outline DnD, accordion header, asset library, markdown editors, reading routes
    status: pending
  - id: mcp-rest-book
    content: Agent adapters, POST /api/mcp/book, REST routes, API key grant `book`
    status: pending
  - id: offline-v1
    content: Download-for-offline manifest + IndexedDB; SW read-only cache hook (phased)
    status: pending
  - id: export-epub
    content: EPUB 3 export job/route (post-v1 or late v1 — see phasing)
    status: pending
isProject: true
---

# Book pod — implementation plan (plan-only)

**Repo:** [CoolColdUK/simpleOutcomeDev](https://github.com/CoolColdUK/simpleOutcomeDev)  
**Status:** Awaiting Matthew approval — implementation lands on branch `cursor/book-pod-plan-c956` after approval (per workflow).  
**Related:** [api-mcp.md](../plan/feature/api-mcp.md), [trip-planning.md](../plan/feature/trip-planning.md), [todo_list_kanban_213294b6.plan.md](./todo_list_kanban_213294b6.plan.md), [so_app_spaces_pwa_188a72d7.plan.md](./so_app_spaces_pwa_188a72d7.plan.md)

---

## Summary (Matthew’s requirements)

| Area | Requirement |
| --- | --- |
| Pod | One **book** per pod: **name** (`pod.name`), **markdown summary**, **cover image** (required for publish-ready export; optional while drafting). Shown in a **collapsed accordion** at top of workspace. |
| Outline | **Chapters**: number, title, summary, content (markdown), status `outline` \| `draft` \| `done`. **Notes**: only other entry type; inserted **after any chapter** in the global order; labeled Note 1, Note 2 (independent of chapter numbers). |
| Ordering | **Drag-and-drop** reorder of the combined outline; **chapter numbers** and **note numbers** **renumber automatically** (dense 1..n within each kind). |
| List UI | Pod outline list shows **chapter number + title** or **note label**; **filter** by type: chapters / notes / assets. |
| Assets | Separate **library**, not linked to chapters. Default types: **characters**, **items**, **locations**; user may add **custom types** per book. Each asset: name, markdown description, one or more images. |
| Markdown | Summaries, chapter summary/content, assets — all markdown with **inline images**. **Paste image** in editor → upload **Supabase Storage** → insert `soimg:` markdown link (same pattern as todo). |
| Reading | **One chapter per page**, next/previous navigation (notes in reading flow — **proposed** below). |
| Offline | **Read-only**, per book, via **Download** button (service worker + IndexedDB — **proposed** below). |
| Sharing | Same **space/pod** model as existing features (`open` / `request` / `private`, roles). |
| Agents | **MCP only** for AI generation: read/write books, chapters, notes, assets; list/get/create/update/reorder; bots use **summaries** to generate full content. |
| Export | **EPUB 3** for KDP (DOCX later); cover, HTML TOC from chapters, embedded images; notes exclusion — **proposed** below. |

---

## Investigation — existing patterns to reuse

### Pod kinds and schema evolution

[`FeatureKind`](packages/model/src/space/featureKind.ts) today: `todo_list`, `shopping_list`, `financial_planning`, `trip_planning`. Postgres `pod.feature` is **text + CHECK**; each new kind extends the check and `create_pod` (see [`20261022150000_pod_viewer_trip_planning.sql`](supabase/migrations/20261022150000_pod_viewer_trip_planning.sql)).

**Shopping list** is catalog-only (stub UI; API key resource reserved). **Todo**, **FP**, and **trip** are the reference implementations.

### Sharing and roles

- Space/pod visibility and join flow: [`so_app_spaces_pwa_188a72d7.plan.md`](./so_app_spaces_pwa_188a72d7.plan.md).
- [`PodRole`](packages/model/src/space/podRole.ts): `OWNER`, `ADMIN`, `USER`, **`VIEWER`** (added for trip).  
- **Writers:** `app_private.is_pod_writer` = space owner OR `pod_owner` / `pod_admin` / `pod_user` (not viewer).
- **Trip read:** `app_private.can_read_tp_pod` = member or space owner (includes viewer).
- **Todo write:** any member via `can_manage_todo_cards`.
- **FP write:** owner-customisable matrix (`fp_setting.permission`); viewer is read-mostly.

**Proposal for book (v1):** mirror **trip/todo**, not FP matrix.

| Role | Book access |
| --- | --- |
| `pod_viewer` | Read outline, assets, reading view, offline download, storage **select** (signed URLs). No writes/uploads. |
| `pod_user` | Create/edit/reorder chapters, notes, assets, asset types, cover, summaries; paste-upload images. |
| `pod_admin` / `pod_owner` | Same as user; plus delete asset types with assets? (see open questions). Space owner retains manage-pod/delete. |

Assign **`pod_viewer`** when sharing read-only manuscripts; **`pod_user`** for co-authors and AI operators with write keys.

### Markdown and inline images

- Renderer: [`SoMarkdown`](packages/web/lib/markdown/SoMarkdown.tsx) + GFM.
- Storage URI scheme: [`soImageMarkdownUri`](packages/model/src/todo/soImageMarkdownUri.ts) — `![](soimg:encodedPath)` resolved to signed URLs at render time ([`resolveStorageTodoImageSignedUrls`](packages/web/lib/api/storage/resolveStorageTodoImageSignedUrls.ts)).
- Paste flow reference: [`TodoListCardDialogDescription`](packages/web/components/todo/TodoListCardDialogDescription.tsx) → [`uploadStorageTodoInlineImageMarkdownFragment`](packages/web/lib/api/storage/uploadStorageTodoInlineImageMarkdownFragment.ts).
- Bucket: **`pod-private`**, 5MB, JPEG/PNG (trip extended with PDF). Path pattern todo: `{pod_id}/{card_id}/img-{unix}.{ext}`.

Extract shared helpers to `@so/model` (path builders per feature) without breaking todo paths.

### Drag-and-drop ordering

- Todo: [`@dnd-kit`](packages/web/components/todo/TodoListBoard.tsx) — horizontal columns + vertical cards; `reorder_todo_columns` / `reorder_todo_cards` in MCP.
- Trip: `sort_order` on many `tp_*` tables; batch updates e.g. [`updateDbTpActionSortOrders`](packages/web/lib/api/db/tp/updateDbTpActionSortOrders.ts).

Book needs **one global ordered list** (chapters + notes interleaved) — closer to trip day actions than todo columns.

### MCP / REST / API keys

- Hosted MCP: [`POST /api/mcp/[[...feature]]`](packages/web/app/api/mcp/[[...feature]]/route.ts) — per-feature catalogs (`todo`, `fp`, `trip`).
- Trip pattern: [`trip-planning-api-mcp.md`](../plan/feature/trip-planning-api-mcp.md) — `lib/api/db/*` + `lib/api/agent/*` + `mcpCatalogByFeature.ts` + REST in `dispatchAgentRestMore.ts`.
- API key pod grants: `todo`, `shopping`, `fp`, `trip` — add **`book`** with CRUD actions aligned to [`api-mcp.md`](../plan/feature/api-mcp.md).

Product rule: **AI generation via MCP only** in v1 (no in-app “Generate chapter” button required; optional later).

### PWA / offline today

- Installable `/app` PWA with minimal SW: [`packages/web/public/sw.js`](packages/web/public/sw.js) — network-first for `/app`, static cache elsewhere. **No** feature-level offline bundle yet.
- Book offline is **net-new** on top of this shell (see Offline section).

---

## Decisions (proposed for v1 — confirm with Matthew)

| # | Topic | Proposal |
| --- | --- | --- |
| D1 | **Feature kind string** | `book` (`FeatureKind.BOOK = 'book'`). |
| D2 | **Cardinality** | One book metadata row per pod (like one trip per trip pod). |
| D3 | **Outline storage** | Single table `bk_outline_entry` with `kind` `chapter` \| `note`, global `sort_order`, denormalized `chapter_number` / `note_number` updated on reorder (fast list UI; trigger or service-layer renumber). |
| D4 | **Chapter status** | Only on `kind = chapter`. Notes have no status (or ignore if set). |
| D5 | **Pod title vs book** | `pod.name` = book title; `pod.description` unused or one-line subtitle; long **summary** on `bk_book.summary_md`. |
| D6 | **Cover** | `bk_book.cover_storage_path` in `pod-private`; required before **Export EPUB**; optional in editor. |
| D7 | **Reading flow & notes** | **Default:** reader navigates **chapters only** (notes hidden). Toggle in reader: “Include notes” → notes appear as extra pages in sequence position (after the chapter they follow in outline). |
| D8 | **EPUB notes** | **Default exclude** notes from EPUB body; optional checkbox “Include notes as back matter” at export (notes section after last chapter). |
| D9 | **Asset images** | Multiple images per asset; gallery in UI; markdown description may also reference `soimg:` paths. |
| D10 | **Inline image caps** | Per-field caps in `@so/model` (e.g. 20 inline images per chapter content, 10 per summary) — tune in implementation. |
| D11 | **Permissions** | Trip-style viewer read / member write; **no** FP-style matrix in v1. |
| D12 | **Realtime** | Off (consistent with todo/trip). |

---

## Data model

```mermaid
flowchart TB
  pod[pod]
  bk[bk_book]
  outline[bk_outline_entry]
  at[bk_asset_type]
  asset[bk_asset]
  ai[bk_asset_image]
  pod -->|pod_id 1:1| bk
  pod --> outline
  pod --> at
  pod --> asset
  at --> asset
  asset --> ai
```

### Tables (new migration `*_book_pod.sql`)

**Catalog**

- Extend `pod_feature_check` and `create_pod` to accept `'book'`.
- On `create_pod` for `book`: insert `bk_book` row + seed `bk_asset_type` rows: `characters`, `items`, `locations` (stable slugs).

**`bk_book`**

| Column | Type | Notes |
| --- | --- | --- |
| `pod_id` | uuid PK FK → `pod` ON DELETE CASCADE | |
| `summary_md` | text default `''` | Markdown |
| `cover_storage_path` | text nullable | `pod-private` object path |
| `offline_bundle_version` | int default 1 | Bump on any content change affecting offline manifest |
| `created_at` / `updated_at` | timestamptz | `moddatetime` trigger |

**`bk_outline_entry`**

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid PK | |
| `pod_id` | uuid FK cascade | |
| `kind` | text check `chapter` \| `note` | |
| `sort_order` | int not null | Global interleaved order |
| `chapter_number` | int nullable | Set when `kind=chapter`; null for notes |
| `note_number` | int nullable | Set when `kind=note` |
| `title` | text | |
| `summary_md` | text default `''` | |
| `content_md` | text default `''` | Full chapter/note body |
| `status` | text check `outline` \| `draft` \| `done` | Only meaningful for chapters |
| `created_at` / `updated_at` | timestamptz | |

**Constraints / triggers**

- Unique `(pod_id, sort_order)`.
- Check: `kind=chapter` → `status` not null; `kind=note` → `status` is null or forced `outline` in app layer.
- After reorder: recompute `chapter_number` and `note_number` by scanning `sort_order` (function `bk_renumber_outline(p_pod_id)`).

**`bk_asset_type`**

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid PK | |
| `pod_id` | uuid FK | |
| `slug` | text | Unique per pod; built-in slugs reserved |
| `label` | text | Display name |
| `sort_order` | int | |
| `is_system` | boolean | true for the three defaults (cannot delete slug, can rename label) |

**`bk_asset`**

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid PK | |
| `pod_id` | uuid FK | |
| `asset_type_id` | uuid FK | |
| `name` | text | |
| `description_md` | text default `''` | |
| `sort_order` | int | Within type list |
| timestamps | | |

**`bk_asset_image`**

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid PK | |
| `asset_id` | uuid FK cascade | |
| `pod_id` | uuid | Denormalized for RLS |
| `storage_path` | text | |
| `sort_order` | int | |
| `caption` | text nullable | Optional |

### RLS helpers

- `app_private.can_read_book_pod(p_pod_id)` — pod member or space owner (same as trip read).
- `app_private.can_write_book_pod(p_pod_id)` — `is_pod_writer(p_pod_id)`.

Policies: SELECT on all `bk_*` = `can_read_book_pod`; INSERT/UPDATE/DELETE = `can_write_book_pod` (narrow delete on own rows if needed later).

### Storage (`pod-private`)

| Asset | Path pattern | MIME | Limit |
| --- | --- | --- | --- |
| Cover | `{pod_id}/book/cover-{uuid}.{jpg\|png}` | JPEG/PNG | 5 MB |
| Outline inline | `{pod_id}/book/outline/{entry_id}/img-{unix}.{ext}` | JPEG/PNG | 5 MB |
| Asset gallery | `{pod_id}/book/assets/{asset_id}/img-{unix}.{ext}` | JPEG/PNG | 5 MB |

**Policies:** extend `pod_private_objects_*` to allow access when `app_private.can_read_book_pod(pod_id_from_path)` (select) and `can_write_book_pod` (insert/update/delete). Reuse `app_private.pod_id_from_storage_object_name` (first path segment = `pod_id`).

**Paste upload:** client upload → `soimg:` fragment insert (generalise todo helper to `uploadStorageBookInlineImageMarkdownFragment(podId, entryId, blob)`).

### Offline manifest (logical, not a table in v1)

JSON blob stored in IndexedDB:

```ts
interface BookOfflineBundle {
  podId: string;
  version: number; // bk_book.offline_bundle_version
  syncedAt: string; // ISO
  book: { name: string; summaryMd: string; coverPath?: string };
  outline: Array<{...}>;
  assets: Array<{...}>;
  signedUrlMap: Record<string, string>; // storage path → url at sync time
}
```

Bump `offline_bundle_version` on any write to `bk_*` or relevant storage objects (trigger on `bk_book` + outline/assets, or maintain in service layer).

---

## `@so/model`

New package area `packages/model/src/book/`:

- Valibot schemas: book, outline entry create/update, reorder payload, asset type, asset, export options.
- `BookOutlineKind`, `BookChapterStatus` enums.
- `buildBookCoverObjectPath`, `buildBookOutlineImageObjectPath`, `buildBookAssetImageObjectPath`.
- `renumberBookOutline(entries)` — pure function + tests (chapter/note sequences).
- `bookOutlineListLabel(entry)` → `"3 · Title"` or `"Note 2 · …"`.
- Re-export limits: `BOOK_MAX_INLINE_IMAGES_PER_FIELD`, etc.

Extend [`FeatureKind`](packages/model/src/space/featureKind.ts), `parseFeatureKind`, API key types (`book` grant), `ApiKeyResource.BOOK`.

---

## Web API (`packages/web/lib/api/db/book/`)

One function per file (repo convention):

| Area | Functions |
| --- | --- |
| Book | `getDbBook`, `updateDbBook` (summary, cover path clear) |
| Outline | `listDbBookOutline`, `createDbBookOutlineEntry`, `updateDbBookOutlineEntry`, `deleteDbBookOutlineEntry`, `reorderDbBookOutline` |
| Assets | `listDbBookAssetTypes`, `createDbBookAssetType`, `updateDbBookAssetType`, `deleteDbBookAssetType`, CRUD assets + images |
| Workspace | `loadDbBookWorkspace` — single payload for UI + agents |
| Storage | `uploadDbBookCover`, `resolveStorageBookImageSignedUrls` (generalise todo resolver) |
| Offline | `buildDbBookOfflineBundle` — server-built JSON for Download (authenticated) |
| Export | `buildDbBookEpub` — phase 2 / late v1 (see phasing) |

**Reorder:** accept ordered `entryId[]`; transaction: update `sort_order`, call `bk_renumber_outline` (SQL function via RPC or sequential updates from TS using `mapPromiseSeries`).

**API routes (REST for agents + optional UI)**

Prefix: `/api/pods/{podId}/book/...` mirroring trip:

- `GET .../workspace`
- `PATCH .../book` — metadata
- `POST .../outline`, `PATCH/DELETE .../outline/{id}`, `POST .../outline/reorder`
- CRUD asset types, assets, asset images
- `POST .../cover` — multipart or base64 (agent parity with trip attachments)
- `GET .../offline-bundle`
- `POST .../export/epub` — when implemented

Wire through existing agent auth (`authorizeApiKeyCall`, session user).

---

## MCP tools (`POST /api/mcp/book`)

Register in new `BOOK_MCP_TOOLS` section (or `mcpCatalogBook.ts` imported by feature router). Naming: `list_book_outline`, `get_book_workspace`, `update_book_metadata`, `create_book_chapter`, `create_book_note`, `update_book_outline_entry`, `delete_book_outline_entry`, `reorder_book_outline`, `list_book_assets`, `create_book_asset`, …, `list_book_asset_types`, `create_book_asset_type`, `upload_book_inline_image` (base64), `get_book_offline_bundle`.

Tool descriptions should tell agents to **read summaries first**, then generate `content_md`.

Implement adapters under `packages/web/lib/api/agent/bookAgent*.ts` calling the same db helpers as REST.

---

## UI (`packages/web/components/book/`)

Wire [`PodWorkspace`](packages/web/components/app/PodWorkspace.tsx): `FeatureKind.BOOK` → `BookWorkspace`.

### Layout

1. **Collapsed accordion (top):** cover thumbnail, title (`pod.name`), markdown summary preview, edit actions for writers.
2. **Toolbar:** filter chips — **Chapters** | **Notes** | **Assets** | **All outline**; **Download for offline**; **Read**; **Export** (when shipped).
3. **Main pane (filtered):**
   - Outline: sortable list (`@dnd-kit`) showing chapter `n · title` or `Note n · title` + status chip for chapters.
   - Assets: grouped by type; sub-list sortable within type; add custom type (writers).
4. **Detail:** drawer or split panel — title, summary editor, content editor (markdown + paste image), status select for chapters.

### Markdown editors

Shared component `BookMarkdownField` (extract pattern from todo description): textarea, preview toggle, paste handler, `BookMarkdownBody` (resolve `soimg:`).

### Reading view

Route: `/app/spaces/{spaceId}/pods/{podId}/read/[entryId]` or query mode on same pod.

- Renders one **chapter** `content_md` (resolved images).
- Footer: Previous / Next chapter (per D7).
- Optional “Include notes” persisted in `localStorage` per pod.

### Create pod

Extend create-pod dialog: feature **Book**; name = working title.

---

## Offline (read-only) — proposed approach

**v1 scope:** explicit **Download for offline** (not full SW sync of all pods).

1. User taps **Download** → `buildDbBookOfflineBundle` → client stores in **IndexedDB** (`book-offline-{podId}`).
2. Prefetch images: `fetch(signedUrl)` → store blobs keyed by storage path (Cache API bucket `book-offline-images-v1` or IDB).
3. **Offline read route** serves from IDB when `navigator.onLine === false` or user chooses “Offline copy”.
4. **Staleness:** compare `version` / max `updated_at` on next online visit; banner “Update available” → re-download.
5. **Service worker:** optional narrow extension — for `/app/.../read/*` only, cache-first HTML shell; do not cache authenticated API responses globally (JWT expiry). Prefer **app-driven** IDB bundle over opaque SW caching of API.

**Later:** background sync when book pod opened online (if Matthew wants).

---

## Export (EPUB 3 → KDP)

### Product mapping

| Source | EPUB |
| --- | --- |
| Cover | `bk_book.cover_storage_path` → `cover-image` (JPEG embedded) |
| Title | `pod.name` |
| Description | `summary_md` → optional metadata / introductory section |
| Chapters | Each `kind=chapter` → one HTML section in spine order (by `chapter_number` / `sort_order`) |
| TOC | Nav document (`nav` epub:type) listing chapters only |
| Images | Resolve `soimg:` → embed as `images/*` with relative `src` |
| Notes | **Excluded by default**; optional back-matter section |

### Implementation sketch

- Server route `POST .../export/epub` (writer-only): load workspace, build OPF + XHTML via template or lightweight library (**new dependency** — requires explicit approval; candidate: hand-rolled ZIP + templates to avoid heavy deps, or `epub-gen-memory` class package).
- Return `application/epub+zip` download.

### Amazon KDP requirements (citations)

**Kindle eBook cover (marketing image, uploaded separately from EPUB):**

- Formats: JPEG, PNG, GIF, TIFF ([Cover Image Guidelines](https://kdp.amazon.com/en_US/help/topic/G6GTK3T3NUHKLEFX)).
- Minimum 500 px on longest side; max 10,000 px per side; max 50 MB.
- **Recommended: 2560 × 1600 px** (height × width), **1.6:1** aspect ratio, **300 DPI** minimum, **RGB**.
- Warning if below recommended size (not a hard reject).

**Kindle manuscript:**

- EPUB is the **preferred** upload format (also KPF; DOC/DOCX converted with variable quality) ([Save Your Manuscript File](https://kdp.amazon.com/en_US/help/topic/G202145060); [Cambric KDP guide summary](https://cambric.pub/guides/kdp-requirements/)).
- Max converted file **650 MB**.
- Require **HTML-based table of contents** for navigation (not NCX-only).
- Embedded images JPEG/PNG; embed fonts if used.

**Paperback (later if print):**

- Cover: single PDF, bleed **0.125"**, spine width from page count ([Paperback Submission Guidelines](https://kdp.amazon.com/en_US/help/topic/G201857950); [Print Publishing Guidelines PDF](https://images-na.ssl-images-amazon.com/images/G/01/00/01/00/02/17/60/10002176030.pdf)).
- Out of v1 unless Matthew prioritises print wrap export.

**Export UX guardrails:** warn if cover missing or below 2560×1600; warn if any chapter `status !== done` (optional override).

---

## Phasing

| Phase | Deliverable |
| --- | --- |
| **v1a** | Migration, model, db API, workspace UI (accordion, outline CRUD, DnD renumber, filters), markdown + paste upload, asset library, reading view (chapters default), sharing via existing pod roles, unit tests in `@so/model` |
| **v1b** | MCP + REST + API key `book` grant; agent upload image tool |
| **v1c** | Offline download bundle + IDB reader |
| **v1d or v2** | EPUB export; KDP-oriented validation messages |
| **Later** | DOCX export; print PDF cover calculator; in-app AI draft button; FP-style permission matrix; link asset `@mentions` in chapters |

---

## Acceptance criteria (v1a–v1b)

1. Space admin can create a **Book** pod; member sees book workspace.
2. Accordion shows name, summary, cover; writers can edit all three.
3. Add chapters and notes; drag to reorder; chapter and note numbers update correctly after every reorder.
4. Chapter status transitions; notes have no status in UI.
5. Filter outline list by chapters / notes / assets.
6. Asset types: defaults present; custom type creatable; assets with multiple images.
7. Paste PNG into summary/content uploads to `pod-private` and renders in preview.
8. `pod_viewer` can read but cannot mutate; `pod_user` can write.
9. Reading view: chapter-by-chapter navigation; notes excluded unless toggle on.
10. MCP: key with `book` grant on pod can `get_book_workspace`, `create_book_chapter`, `reorder_book_outline`, `update_book_outline_entry` (content), denied without grant or on wrong feature kind.

---

## Test plan

| Layer | Tests |
| --- | --- |
| `@so/model` | Renumber logic; path builders; valibot parse; label helpers; image count limits |
| SQL (manual / integration) | RLS: viewer read, non-member deny; writer insert; cross-pod deny |
| Agent (optional jest) | Authorize matrix for `book` resource |
| E2E (manual browser) | DnD reorder numbers; paste image; reader nav; offline download open airplane mode |

No application unit tests by default (project rule); E2E only if Matthew requests.

---

## Manual tasks (post-migration push)

Same checklist as todo plan ([AGENTS.md](AGENTS.md)):

1. Confirm `moddatetime` extension if used on new tables.
2. Confirm `pod-private` bucket limits/MIME after migration.
3. Verify storage policies for new path prefixes.
4. Local: `supabase db reset`.

---

## Open questions for Matthew

1. **Co-author destructive actions:** Can `pod_user` delete chapters/notes/assets, or only admin/owner?
2. **Custom asset types:** Can members delete a custom type that still has assets (cascade vs block)?
3. **Book subtitle:** Use `pod.description` for subtitle/tagline on cover export, or ignore?
4. **Reading flow default:** Confirm D7 (chapters-only default, notes optional toggle).
5. **EPUB notes default:** Confirm D8 (exclude; optional back matter).
6. **Cover required:** Block export without cover, or allow placeholder?
7. **Inline image cap** per chapter (20?) and total book size budget for offline download.
8. **API key naming:** Resource key `book` on pod grant — OK?
9. **v1 EPUB:** Ship in first release (v1d) or fast-follow PR after core UI?
10. **Shopping list:** Any interaction with book pods (none planned)?

---

## Implementation sequence (after approval)

1. Migration + `database.ts` types refresh  
2. `@so/model` + tests  
3. `lib/api/db/book/*` + storage helpers  
4. `BookWorkspace` UI + reading routes  
5. MCP/REST + API keys UI row for book pods  
6. Offline bundle  
7. EPUB export  

---

## Isolation

All queries `.eq('pod_id', podId)`. Storage paths start with `pod_id`. Pod delete cascades all `bk_*` rows and orphans storage objects (optional cleanup job later).

---

## CI

This PR is **docs only** — CI should remain green. Implementation PRs must pass existing workflows.
