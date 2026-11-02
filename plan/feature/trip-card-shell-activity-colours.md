# Trip planning UI — icon edit, hide empty chrome, shared card shell, activity-type colours

Matthew wants trip-planning panels to **feel like day action cards**: icon **Edit** / **Delete** in the header, **expand/collapse** with consistent chrome, **no empty optional blocks** until there is content or the user is editing, and an **optional per–action-kind background tint** on day cards (stay / travel / activity / note) stored at pod/trip settings when set.

**Repo:** [CoolColdUK/simpleOutcomeDev](https://github.com/CoolColdUK/simpleOutcomeDev)  
**Requirements:** [trip-planning.md](./trip-planning.md) (domain model unchanged except optional settings column noted below)  
**Shipped baseline:** [trip-text-first-edit-save.md](./trip-text-first-edit-save.md) — **implemented** in PR #27 (merge `3ab59aa` on `develop`). Day plan, destination important info, and catalog rows are text-first with text **Edit** / **Save** / **Cancel** via [`TripTpEditSaveBar`](../../packages/web/components/tp/TripTpEditSaveBar.tsx). Action cards already use pencil / trash icons in [`TripDayActionCardHeader`](../../packages/web/components/tp/TripDayActionCardHeader.tsx).

**Status:** **Plan only** — branch `cursor/trip-card-shell-activity-colours-f12f`. **Do not merge** until Matthew approves in Technical Forum. **After approval, implement on this same branch** (replace draft plan PR body / mark plan section implemented; do not open a second PR for the same work).

---

## Goal

1. **Icon Edit (and Delete where supported)** — Replace text **Edit** on day plan, destination important, location row, and transport library row with the same **IconButton + `AppIconTooltip` + `EditIcon`** pattern as action cards. **Delete** becomes a red ghost **DeleteIcon** where remove already exists in data/API (location, transport library, day actions). Do **not** add delete for entities with no delete path (e.g. **`tp_day`** — no delete helper in repo).
2. **Show only when needed** — Hide empty **Important info** (day accordion), **Attachments**, and similar optional blocks until they have content **or** the enclosing section is in **Edit** mode. Writers still see a clear **Edit** affordance on the card header so empty sections can be filled.
3. **Consistent expandable card shell** — Day plan, each destination important block, each catalog row (location / transport), and the day-level **Important info** strip use one shared **expandable card** layout modeled on the action card: bordered `Box`, header row (title, optional badge/subtitle, header actions), body collapsed or expanded, optional inner **Details** disclosure where read-only depth is needed.
4. **Optional activity-type background colour** — Pod-visible setting: map each [`TpActionKind`](../../packages/model/src/tp/tpActionKind.ts) (`stay`, `travel`, `activity`, `note`) to an optional Chakra-compatible colour token or hex. When unset for a kind, day cards look **exactly as today**. When set, apply a subtle background on the action card shell only (not the whole board).

---

## Locked decisions (plan — change only with Matthew)

| # | Decision |
| --- | --- |
| L1 | **Edit** on non-action surfaces uses **pencil icon** (outline); entering edit mode does **not** swap to cross on panels that use explicit **Save** / **Cancel** (cross remains the action-card “close editor” semantics only). |
| L2 | **Save** and **Cancel** stay **text buttons** (`size="sm"`) in the card footer while editing — same as today’s [`TripTpEditSaveBar`](../../packages/web/components/tp/TripTpEditSaveBar.tsx) save path, only the idle **Edit** control and **Delete** move to icons. |
| L3 | **Delete** uses **confirm** before network call (mirror action card / catalog copy). Location and transport: keep existing delete behaviour, icon only. **Destination delete:** API exists ([`deleteDbTpDestination`](../../packages/web/lib/api/db/tp/deleteDbTpDestination.ts), agent/MCP today); add a **browser** wrapper (same shape as [`deleteDbTpLocation`](../../packages/web/lib/api/db/tp/deleteDbTpLocation.ts)) and **icon Delete** on destination cards **only if Matthew confirms** removing destinations from the trip UI is desired (see open question). **No delete** on day plan panel. |
| L4 | **Hide empty chrome:** If `importantInfo` is blank and not editing → do not render the day **Important info** accordion at all (writers use **Destinations (trip)**). If destination attachments list is empty and not editing → hide **Attachments** block entirely (upload appears in edit mode). Viewers never see empty attachment headings. |
| L5 | **Shared shell:** New presentational component (e.g. `TripTpExpandableCard`) owns border, padding, expand/collapse, and header action slot; panels pass title, `defaultExpanded`, `canWrite`, and children. **Do not** replace [`TripTpCollapsible`](../../packages/web/components/tp/TripTpCollapsible.tsx) for trip-wide sections in v1 unless the shell subsumes it — prefer migrating **day plan + destination row + catalog row** first; **Destinations (trip)** outer wrapper may stay collapsible or adopt shell in the same pass if diff stays focused. |
| L6 | **Activity colours:** Persist on **`tp_setting`** as optional `jsonb` (e.g. `action_kind_colors`) keyed by action kind string → colour string. Rationale: one trip per pod today; settings row already holds pod-level TP defaults ([`default_currency`](../../supabase/migrations/20261022150000_pod_viewer_trip_planning.sql)). Requires **one migration** + load/update in [`loadDbTpWorkspace`](../../packages/web/lib/api/db/tp/loadDbTpWorkspace.ts) / [`updateDbTpTrip`](../../packages/web/lib/api/db/tp/updateDbTpTrip.ts) or a small `updateDbTpSetting` helper. **No MCP/agent change in v1** unless Matthew wants agent-set colours later. Client-only / localStorage is **rejected** (viewers on other devices would not see colours). |
| L7 | Colour UI: small **Trip settings** block on the board (writers only) or nested under an existing trip header area — colour inputs per kind, clear-to-default, preview on one sample card. Values validated as safe CSS colour strings in web; invalid values ignored on read. |
| L8 | **`pod_viewer`:** No Edit/Delete icons; read-only text and expanded view only where content exists. |

**Out of scope for this plan:** Telegram, map SDK, redesign of travel route/step editors, inner view mode inside stay/note/travel editors (still deferred from PR #27), new delete APIs, bulk HK–JP data edits.

---

## Current behaviour (develop after PR #27)

| Surface | File | Today |
| --- | --- | --- |
| **Day action cards** | [`TripDayActionCardHeader.tsx`](../../packages/web/components/tp/TripDayActionCardHeader.tsx) | Icon **Edit** / **Delete**; bordered card in board; activity/travel **Details** accordion when collapsed. |
| **Day plan** | [`TripDayPlanPanel.tsx`](../../packages/web/components/tp/TripDayPlanPanel.tsx) | Static `Heading` + bordered box; text **Edit** / **Save** / **Cancel**; always shows all three fields (muted placeholders when empty). |
| **Day Important info** | [`TripPlanningBoard.tsx`](../../packages/web/components/tp/TripPlanningBoard.tsx) (~548–568) | [`TripTpCollapsible`](../../packages/web/components/tp/TripTpCollapsible.tsx) shown whenever `activeDestinationIds.length > 0`, even when all `importantInfo` empty (“No details yet.”). |
| **Destinations (trip)** | [`TripDestinationImportantPanel.tsx`](../../packages/web/components/tp/TripDestinationImportantPanel.tsx) + board collapsible | Text edit bar; **Attachments** heading always visible (`None` when empty); upload/delete only when editing. |
| **Location / transport rows** | [`TripTripCatalogPanel.tsx`](../../packages/web/components/tp/TripTripCatalogPanel.tsx) | Nested bordered stack per row; text **Edit**; text red **Delete** in `trailing`; lists wrapped in `TripTpCollapsible` (+/−), not action-card header. |
| **Action card colours** | Board card `Box` | Neutral border only; kind shown as **Badge** text. |
| **Delete APIs (browser)** | `packages/web/lib/api/db/tp/*` | Actions, locations, transport lib, attachments; **no** `deleteDbTpDay`; **no** browser `deleteDbTpDestination` (agent only). |

**Reference patterns**

- Icons: `EditIcon`, `DeleteIcon`, `CrossIcon` from `@so/component`; tooltips via [`AppIconTooltip`](../../packages/web/components/app/AppIconTooltip.tsx) (see todo board hover actions).
- Text-first edit: [`TripTpEditSaveBar`](../../packages/web/components/tp/TripTpEditSaveBar.tsx).
- Activity read depth: [`TripActivityActionDetails.tsx`](../../packages/web/components/tp/TripActivityActionDetails.tsx) (ghost **Details** button, closed by default).

---

## Target interaction

### 1 — Icon edit / delete

| Surface | Edit | Delete |
| --- | --- | --- |
| Day plan | Header pencil → edit mode | — (no API) |
| Destination important | Header pencil | Optional trash if L3 confirmed + browser delete wired |
| Location row | Header pencil | Header trash (confirm) |
| Transport lib row | Header pencil | Header trash (confirm) |
| Day action cards | unchanged | unchanged |

Refactor [`TripTpEditSaveBar`](../../packages/web/components/tp/TripTpEditSaveBar.tsx) or add `TripTpEditSaveActions` so **idle** state renders icon Edit in an **`HStack`** aligned to the card header (not buried under body text). **Delete** moves out of `trailing` text button into header icon cluster for catalog rows.

### 2 — Hide empty chrome

| Block | Hidden when | Still reachable |
| --- | --- | --- |
| Day **Important info** accordion | All active destinations have empty `importantInfo` and user not editing any destination important block on that day | **Destinations (trip)** → Edit on destination row |
| **Attachments** (destination) | `filtered.length === 0` and not editing that destination | Edit destination → upload |
| **Attachments** (travel transport steps) | Same rule in [`TripTravelActionEditor`](../../packages/web/components/tp/TripTravelActionEditor.tsx) if panel is always visible today — audit in implementation; hide when empty and not editing |

Day plan: keep panel visible (core day context) but may **collapse** empty optional subsections inside shell (title/notes/primary still listed with muted empty state) — do **not** hide the whole day plan card.

### 3 — Shared expandable card shell

Proposed API (illustrative):

```tsx
<TripTpExpandableCard
  title="Day plan"
  expanded={expanded}
  onExpandedChange={setExpanded}
  headerActions={<TripTpHeaderIconActions ... />}
  footer={editing ? <TripTpEditSaveBar ... /> : null}
>
  {body}
</TripTpExpandableCard>
```

Behaviour aligned with action cards:

- Default **expanded** for day plan when selected day has any non-empty field **or** user last edited; default **collapsed** for catalog rows (scannable list) matching today’s need to open collapsible sections.
- Header: title (+ optional subtitle), right-aligned icon cluster (`flexShrink={0}`), `minW={0}` on title stack for mobile ([`trip-day-card-mobile-layout.md`](./trip-day-card-mobile-layout.md)).
- Expand/collapse: chevron or +/- consistent with activity **Details** — pick one control per card (header chevron for whole card; inner **Details** only where read-only depth remains).

**Migrate**

- [`TripDayPlanPanel`](../../packages/web/components/tp/TripDayPlanPanel.tsx) → shell + header icons.
- [`TripDestinationImportantPanel`](../../packages/web/components/tp/TripDestinationImportantPanel.tsx) → shell per destination (may replace flat `Stack` inside **Destinations (trip)**).
- [`LocationRow` / `TransportLibRow`](../../packages/web/components/tp/TripTripCatalogPanel.tsx) → shell (collapse when not editing).
- Day **Important info** strip → shell or collapsed card only when L4 says visible.

### 4 — Activity-type background colour

| Kind | Default | When set |
| --- | --- | --- |
| `stay`, `travel`, `activity`, `note` | No background override | `bg` or subtle `bg.muted` token on action card outer `Box` in [`TripPlanningBoard`](../../packages/web/components/tp/TripPlanningBoard.tsx) timeline map |

- Read colours from workspace `settings.actionKindColors` (name TBD in implementation).
- Writers edit via trip/settings UI; persist with pod `tp_setting` update.
- **Migration:** `alter table tp_setting add column action_kind_colors jsonb;` (nullable; no check constraint — validation in TS).
- **Model (optional):** exported type + valibot map in `@so/model` if agent/MCP later; not required for web-only v1.

---

## Likely files touched (implementation pass)

| Area | Files |
| --- | --- |
| Shared UI | New `TripTpExpandableCard.tsx`, `TripTpHeaderIconActions.tsx` (or extend edit save bar); refactor `TripTpEditSaveBar.tsx` |
| Panels | `TripDayPlanPanel.tsx`, `TripDestinationImportantPanel.tsx`, `TripTripCatalogPanel.tsx` |
| Board | `TripPlanningBoard.tsx` — day important visibility, action card `bg`, settings UI |
| Attachments | `TripTpAttachmentPanel.tsx` — conditional render wrapper or props `hideWhenEmpty` |
| Settings / DB | `supabase/migrations/*_tp_setting_action_kind_colors.sql`, `loadDbTpWorkspace.ts`, new or extended update helper, `database.ts` types |
| Model (optional) | `packages/model/src/tp/tpActionKindColors.ts` + tests if validation shared |
| Docs | This plan → update **Status** and check acceptance criteria when done |

**No** changes expected to MCP agent handlers unless Matthew extends scope to agent-set colours.

---

## Non-goals

- Replacing text **Save** / **Cancel** with icons on panels.
- Delete on **`tp_day`** or trip wizard destinations list without product spec.
- New activity kinds or changing [`TpActionKind`](../../packages/model/src/tp/tpActionKind.ts).
- Theming non-TP pods or global Chakra theme tokens.
- Realtime sync of expand state across clients (local `useState` only).

---

## Open questions (for Matthew)

1. **Destination delete in UI:** OK to expose trash on destination important cards wired to existing `deleteDbTpDestination` (with confirm naming the destination)?
2. **Day Important info accordion:** When hidden for empty content, is **Destinations (trip)** alone enough, or should writers see a one-line muted link “Add important info for this day’s destinations”?
3. **Card default expansion:** Day plan expanded by default on mobile, or collapsed like catalog rows until tapped?
4. **Colour settings placement:** Inline on trip board vs collapsible “Display settings” — preference?
5. **Colour format:** Preset palette (brand/subtle tokens) only vs free-form hex input?

---

## Acceptance criteria

- [ ] Writers see **pencil Edit** (not text “Edit”) on day plan, destination important, location row, and transport row headers; **Save** / **Cancel** unchanged while editing.
- [ ] Location and transport **Delete** are **icon** controls with confirm; behaviour matches current delete helpers.
- [ ] Day **Important info** accordion absent when all relevant `importantInfo` empty and no destination row on that panel is editing; viewers never see empty accordion.
- [ ] Destination **Attachments** UI hidden when no files and not editing; upload available after **Edit**.
- [ ] Day plan, destination important, and catalog rows use **`TripTpExpandableCard`** (or agreed rename) with consistent header layout and expand/collapse.
- [ ] Optional per-kind action card backgrounds persist in **`tp_setting`**; unset kinds match current neutral cards; viewer sees colours read-only.
- [ ] One Supabase migration for `action_kind_colors` (or agreed column name); Production workflow applies via existing `db push`.
- [ ] `pod_viewer`: no edit/delete icons; no settings editor.
- [ ] Mobile: no horizontal scroll regression on HK–JP-style pod (manual narrow viewport check).

---

## Suggested implementation order

1. Migration + load/save for `action_kind_colors`; board applies bg on action cards.
2. `TripTpExpandableCard` + header icon actions; refactor `TripTpEditSaveBar` integration.
3. **Day plan** panel on new shell + icon Edit.
4. **Destination important** + attachment hide-when-empty + icon Edit (+ optional delete if approved).
5. **Catalog** rows on shell + icon Edit/Delete.
6. Day **Important info** visibility rules + shell alignment.
7. Writer **colour settings** UI + QA checklist.

---

## QA checklist (after implementation)

- [ ] Empty active destination → no day Important info accordion; add text via Destinations → Edit → Save → accordion appears.
- [ ] Destination with attachment → view mode shows list; remove all in edit → attachments hidden in view.
- [ ] Catalog delete icon → row removed; travel/activity selects still consistent.
- [ ] Set stay colour only → other kinds unchanged.
- [ ] Clear colour → card returns to current default.
- [ ] Viewer role → colours visible, no edit chrome.

---

## After Matthew approves

**Implement on branch `cursor/trip-card-shell-activity-colours-f12f` in the same pull request.** Mark this document **Status** as implemented, check acceptance criteria, and convert the PR from plan/draft to ready for review. Do not merge until Matthew confirms QA.
