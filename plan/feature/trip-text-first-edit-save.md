# Trip day plan — text-first view, Edit to change, Save to confirm

Matthew wants the **day plan** and related trip surfaces to **read as text by default**. Form controls appear only after **Edit**; **Save** persists and returns to text view. **Cancel** discards in-progress edits (where applicable). This reduces clutter on mobile and matches how day **action cards** already work at a glance (header summary + optional Details accordion + pencil **Edit**).

**Repo:** [CoolColdUK/simpleOutcomeDev](https://github.com/CoolColdUK/simpleOutcomeDev)  
**Requirements:** [trip-planning.md](./trip-planning.md) (model unchanged)  
**Related shipped UI:** [trip-day-ui-polish.md](./trip-day-ui-polish.md) (accordions, card Edit toggle), PR #27 one-travel-per-leg copy

**Status:** **Implemented** on branch `cursor/trip-one-travel-per-leg-bb31` (PR #27). Matthew approved in Technical Forum (Nov 2026).

### What landed

- Shared [`TripTpEditSaveBar`](../../packages/web/components/tp/TripTpEditSaveBar.tsx) (Edit / Save / Cancel).
- [`TripDayPlanPanel`](../../packages/web/components/tp/TripDayPlanPanel.tsx) — day title, notes, primary destination; explicit Save (no blur-save).
- [`TripDestinationImportantPanel`](../../packages/web/components/tp/TripDestinationImportantPanel.tsx) — important info text-first; attachments list/download in view, upload/delete only while editing.
- [`TripTripCatalogPanel`](../../packages/web/components/tp/TripTripCatalogPanel.tsx) — location and transport library rows: compact view summary, Edit for full forms; new rows open in edit after create.
- [`TripPlanningBoard`](../../packages/web/components/tp/TripPlanningBoard.tsx) wires day plan + destination panels.

**Not in this pass:** inner view mode inside stay/activity/travel card editors (stretch deferred).

**Defaults used (open questions):** blur-save removed; attachments view + edit-only mutations; new catalog rows enter edit after create.

**Out of scope for this plan:** Telegram, map SDK, schema/API/MCP changes (unless implementation discovers a hard blocker — unlikely). **`pod_viewer`** stays read-only text everywhere (no Edit affordance).

---

## Goal

1. **Day plan** box: show day title, day notes, and primary-destination override as **formatted text**; **Edit** opens the current inputs; **Save** writes via existing `updateDbTpDay` / `saveDayHeader` path and closes edit mode.
2. **Trip destinations** (`Destinations (trip)`): hide the always-on **Important / safety** textarea; show truncated or full text in view mode; **Edit** → textarea (+ existing attachment panel can stay visible or follow same toggle — see open questions).
3. **Location catalog** (`TripTripCatalogPanel` → `LocationRow`): view mode shows a compact summary (name, type, country, address snippet, hours, contact lines); **Edit** reveals today’s full field stack; **Save** / **Delete** as today.
4. **Transport library** (`TransportLibRow`): same pattern — label, mode, cost, duration, important flag as text; **Edit** for fields; **Save** / **Delete**.

Optional stretch (same PR only if cheap): apply the same **view → Edit → Save** inside expanded **action card editors** (stay / activity / travel journey block). Matthew’s ask names **destination area**, **transport**, and **location** first; action editors can stay on the existing card-level Edit unless he wants parity in one pass.

---

## Current behaviour (clutter)

| Surface | File | Today |
| --- | --- | --- |
| **Day plan** | [`TripPlanningBoard.tsx`](../../packages/web/components/tp/TripPlanningBoard.tsx) (~558–623) | Writers always see `Input`, `Textarea`, and **Primary destination** `NativeSelect`. Saves on **blur** (`saveDayHeader`), not an explicit Save. Viewers see disabled controls (still look like empty forms). |
| **Important info (day)** | Same file (~625–645) | Already **text-first** in a collapsed `TripTpCollapsible` — good reference pattern. |
| **Destinations (trip)** | Same file (~840–897) | Destination **name** is text; **`importantInfo`** is an always-visible `Textarea` + **Save destination info** per row for writers. Viewers get `TripTpTruncateText`. Attachments always shown. |
| **Locations** | [`TripTripCatalogPanel.tsx`](../../packages/web/components/tp/TripTripCatalogPanel.tsx) `LocationRow` | Entire catalog row is a **form** (~15 fields + Save/Delete) whenever the collapsible is open. |
| **Transport library** | Same file `TransportLibRow` | Same — full form always visible. |
| **Day action cards** | [`TripDayActionCardHeader.tsx`](../../packages/web/components/tp/TripDayActionCardHeader.tsx) + `*Details` / `*Editor` | **Text-first at card level:** title/summary on header; **Details** accordion when collapsed; **Edit** opens `TripTravelActionEditor` / etc. which are **all fields** (no inner view mode). |

**Reference patterns already in repo**

- Viewers: `TripSimpleActionEditor` returns read-only `Text` when `!canWrite`.
- Writers on cards: icon **Edit** / close (`expandedActionId` in board).
- Muted empty states: `color="fg.muted"`, `TripTpTruncateText`, `fontSize="sm"`.

---

## Target interaction (per surface)

Shared rules:

| Rule | Detail |
| --- | --- |
| **Default** | Render **read-only text** (labels optional, values as `Text` / links for maps URL / `TripTpTruncateText` for long notes). |
| **Edit** | Visible only when `canWrite`. Toggles local `editing` state (or reuses board-level state where one section at a time is enough). |
| **Save** | Calls **existing** DB helpers; on success exit edit mode and refresh workspace (`reload` / `onSaved`). |
| **Cancel** | Exit edit mode without save; reset local state from props (discard drafts). |
| **Blur-save** | **Remove** for day header fields once explicit Save exists (avoid double semantics). |
| **Mobile** | View mode stays one column; Edit forms keep existing `wrap="wrap"` / `minW={0}` from editors. No new breakpoints required. |
| **Permissions** | `canWrite` from [`canWriteTpPod`](../../packages/model/src/tp/canWriteTpPod.ts) / board — viewers never see Edit. |

### Day plan

| View | Edit |
| --- | --- |
| Day title or “No title” (muted) | Current `Input` |
| Day notes or muted placeholder text | Current `Textarea` |
| Primary destination: label + resolved name (“Auto from stay / travel” when unset) | Current `NativeSelect` |

Toolbar: **Edit** when idle; **Save** + **Cancel** when editing.

### Destinations (trip) — important info block

| View | Edit |
| --- | --- |
| `importantInfo` as text (truncate with expand or `lineClamp` consistent with day important info) | Current `Textarea` + **Save destination info** (rename to **Save** in edit chrome) |

Destination **name** and date range stay text-only in v1 (no destination metadata editor in this panel today).

### Location row (catalog)

| View | Edit |
| --- | --- |
| One or two lines: **name** · type · country; optional address / hours / contact summary | Today’s full `LocationRow` fields |

Consider collapsing each location in a nested `TripTpCollapsible` (title = name) so the catalog list is scannable — optional if view lines are enough.

### Transport library row

| View | Edit |
| --- | --- |
| **label** · mode · cost · duration · important badge/hint | Today’s full `TransportLibRow` fields |

---

## Likely files touched (implementation pass)

| Area | Files |
| --- | --- |
| Day plan + destinations strip | [`TripPlanningBoard.tsx`](../../packages/web/components/tp/TripPlanningBoard.tsx) — extract `TripDayPlanPanel` / `TripDestinationImportantPanel` if the board file grows |
| Catalog | [`TripTripCatalogPanel.tsx`](../../packages/web/components/tp/TripTripCatalogPanel.tsx) — split `LocationRowView` / `LocationRowEdit`, same for transport |
| Shared chrome | Small helper e.g. `TripTpEditSaveBar.tsx` (Edit / Save / Cancel `HStack`) to match button sizes (`size="sm"`) |
| Formatting | Optional pure formatters in `@so/model` only if multiple components share “display line for location” — prefer local functions in web first |

**No** changes expected to `packages/web/lib/api/db/tp/*`, agent handlers, or MCP catalog unless Cancel/Save exposes a bug in existing update paths.

---

## Non-goals

- Redesigning action card accordions or route/step UX (unless bundled as optional stretch).
- Inline editing of trip-level destination **names**, sort order, or active dates (not in current UI).
- Replacing transport/location **selects** inside travel/activity editors with a new picker UX — those stay as-is; this plan targets **catalog rows** and **day/destination** panels.
- Auto-save, Realtime, or new permissions.
- Bulk migration or data cleanup.

---

## Open questions (for Matthew)

1. **Day plan blur-save → Save:** OK to require explicit **Save** (and drop auto-save on blur) for day title/notes/primary destination?
2. **Attachments** on destination rows: stay visible in view mode, or only while editing important info?
3. **New location / + Transport:** after create, open in **Edit** mode once, or show view with empty “New location” until Edit?
4. **Action card editors:** include stay/activity/travel **inner** view mode in the same PR, or phase 2?

---

## Acceptance criteria

- [x] With write access, **Day plan** shows text by default; **Edit** reveals fields; **Save** persists and returns to text; **Cancel** restores previous values without network write.
- [x] **Destinations (trip)** important info follows the same pattern for writers; viewers see text only (no disabled inputs).
- [x] Each **location** and **transport library** row: view summary by default; **Edit** / **Save** / **Cancel** / **Delete** behave as today for writes.
- [x] No new API fields or migrations.
- [ ] Mobile: day plan and catalog remain usable without horizontal scroll regressions (manual check on a narrow viewport).
- [x] `pod_viewer`: no Edit buttons; all touched surfaces remain read-only text.

---

## Suggested implementation order

1. Shared **Edit / Save / Cancel** bar component + local `editing` state pattern.
2. **Day plan** panel (highest visibility).
3. **Destinations (trip)** important-info blocks.
4. **TripTripCatalogPanel** location + transport rows.
5. QA on HK–JP-style pod: day with long notes, catalog with many locations, viewer role smoke test.

---

## QA checklist (after implementation)

- [ ] Edit day title, Cancel — title unchanged after reload.
- [ ] Edit destination important info, Save — text visible in view mode and in day **Important info** accordion when destination is active.
- [ ] Edit location name in catalog, Save — summary line updates; travel editor location select still lists new name.
- [ ] Viewer login — no inputs, no Edit, text matches workspace data.
