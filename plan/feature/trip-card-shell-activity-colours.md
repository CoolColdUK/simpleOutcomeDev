# Trip planning UI — icon edit, hide empty chrome, shared card shell, activity-type colours, two-layer lock, trip settings

Matthew wants trip-planning panels to **feel like day action cards**: icon **Edit** / **Delete** in the header, **expand/collapse** with consistent chrome, **no empty optional blocks** until there is content or the user is editing, **optional per–action-kind background tints** on day cards, **trip metadata editable on the web**, and **two independent locks** — both toggled **only in the UI**:

- **Trip plan lock** — freeze the **whole** trip plan; blocks **all** plan mutations from browser **and** MCP/REST until a human unlocks in the UI.
- **Activity lock** — freeze **one activity** (`kind = activity`); blocks mutations to that action (and its action–location links) from browser **and** MCP/REST until a human unlocks on the card in the UI. **Unlocking the trip does not** clear activity locks.

**How AI is blocked:** locks are **not** MCP toggles — agents cannot call a “lock” tool. When `locked` is true, **existing** MCP/REST **write** handlers refuse changes (`trip_locked` / `activity_locked`). Humans **unlock in the web**, then edit (or ask an agent to edit).

There is **no** separate “trip plan editor” product — when unlocked, editing works as today. Locking only **freezes** all or part of the plan.

**Repo:** [CoolColdUK/simpleOutcomeDev](https://github.com/CoolColdUK/simpleOutcomeDev)  
**Requirements:** [trip-planning.md](./trip-planning.md)  
**Shipped baseline:** [trip-text-first-edit-save.md](./trip-text-first-edit-save.md) — **implemented** in PR #27 (merge `3ab59aa` on `develop`).

**Status:** **Plan only** — branch `cursor/trip-card-shell-activity-colours-f12f` (PR #28). **No implementation in this pass.** **Do not merge** until implementation is complete and Matthew confirms QA. **Implement on this same branch / PR** only after Matthew **approve / Go**.

---

## Goal

1. **Icon Edit (and Delete where supported)** — Same **IconButton + `AppIconTooltip` + `EditIcon`** pattern as action cards on day plan, destination important, location row, and transport library row. **Delete** as **DeleteIcon** where remove exists (location, transport library, day actions, **destinations**). No delete for **`tp_day`**.
2. **Show only when needed** — Hide empty **Important info** (day accordion) and **Attachments** until content exists or section is in **Edit** mode. **No** muted “Add important info…” link.
3. **Consistent expandable card shell** — Shared **`TripTpExpandableCard`** for day plan, destination important, catalog rows, day Important info when visible.
4. **Optional activity-type background colour** — Hex per [`TpActionKind`](../../packages/model/src/tp/tpActionKind.ts) in **`tp_setting.action_kind_colors`**; edited inside **Trip settings** (below).
5. **Trip plan lock (UI toggle)** — **`tp_trip.locked`**: freezes all trip-plan writes (UI + MCP/REST). Toggle **only** in the web UI.
6. **Activity lock (UI toggle)** — **`tp_action.locked`** for **`kind = activity` only**: freezes that activity’s writes (UI + MCP/REST), including **action–location** link mutations. Toggle on the **activity card** (writers). Badge when locked. **No** MCP lock tools for either layer.
7. **Trip settings (web)** — Matthew cannot update trip info on the web today; add a single **Trip settings** surface (collapsible on the board) where writers edit **trip metadata** and related pod defaults, plus **Display** (colours) and **Lock trip plan**. Fields should cover what [`updateDbTpTrip`](../../packages/web/lib/api/db/tp/updateDbTpTrip.ts) already supports: **title**, **start/end dates**, **timezone**, **status**, **budget amount/currency**, **maps URL**, **notes**, and **`defaultCurrency`** → `tp_setting`. When **trip is locked**, trip-info and display edits are disabled; **Unlock trip plan** remains available to writers.

---

## Two lock layers (explicit)

| Layer | Stored on | Who toggles lock | Who can mutate content when unlocked | When locked |
| --- | --- | --- | --- | --- |
| **Trip plan lock** | `tp_trip.locked` | **Web UI only** (Trip settings and/or board header) | UI + MCP/REST | **All** trip-scoped writes → **`trip_locked`** (409); UI disables Add/Edit/Save/Delete/settings edits |
| **Activity lock** | `tp_action.locked` (`kind = activity`) | **Web UI only** (activity card) | UI + MCP/REST | Activity-scoped writes → **`activity_locked`** (409); card Edit/Delete/Save disabled; badge shown |

**Precedence:** Run **`assertTpTripUnlocked(tripId)`** before any trip-scoped **content** mutation (including activity bodies and **`update_tp_action`**). If the trip is locked, nothing changes until a human unlocks the **trip** in the UI. When the trip is **unlocked**, **`assertTpActivityUnlocked(actionId)`** gates that activity’s content mutations. **Trip unlock does not auto-unlock activities.**

**Same rule for both locks:** toggle **`locked`** only via web (Supabase browser client + RLS or web-only helper). **Do not** add `locked` to MCP `update_trip` / `update_tp_action` or new MCP tools such as ~~`set_tp_activity_lock`~~. If the SPA uses a Route Handler for lock toggles, **omit** it from the trip MCP/REST catalog agents use.

---

## Locked decisions (Matthew — Technical Forum, Nov 2026)

| # | Decision |
| --- | --- |
| L1 | **Edit** on non-action surfaces: pencil icon; no cross on Save/Cancel panels. |
| L2 | **Save** / **Cancel** stay text buttons; **Edit** and **Delete** move to icons. |
| L3 | **Destination delete: YES** — trash + confirm naming destination; browser [`deleteDbTpDestination`](../../packages/web/lib/api/db/tp/deleteDbTpDestination.ts) wrapper. |
| L4 | Hide empty Important info accordion and Attachments; no day-level add link. |
| L5 | **`TripTpExpandableCard`**: day plan **expanded by default**; catalog rows collapsed until tapped. |
| L6 | **`tp_setting.action_kind_colors`** jsonb; hex validation in web. |
| L7 | **Trip settings** — one collapsible **Trip settings** panel (writers): **trip info** form + **Display** (hex per kind) + **Lock trip plan** toggle. Replaces a standalone “Display settings only” chrome (display lives inside Trip settings). |
| L8 | **`pod_viewer`:** no edit/delete/lock toggles; no Trip settings editor; read-only; locked banners/badges visible. |
| L9 | **Both locks UI-only:** **`tp_trip.locked`** and **`tp_action.locked`** (activity only). **No MCP tools** to set either flag. |
| L10 | **Locked activity (content):** reject updates/deletes and **action–location** create/update/delete/link/`done` when `kind = activity` && `locked`. Stay/travel/note ignore `locked` for enforcement. (Activities have no route/transport/attachment children; travel nested tables out of scope for activity lock.) |
| L11 | **Enforcement:** **`assertTpTripUnlocked`** on all trip-scoped content writes (browser DB helpers + all `tpAgent*` handlers). **`assertTpActivityUnlocked`** on activity-scoped content writes. **Exceptions:** web-only updates that **only** flip `tp_trip.locked` or `tp_action.locked` (and must require `canWriteTpPod`; activity toggle only when trip unlocked + `kind = activity`). |
| L12 | **Trip locked UX:** banner; disable plan edits and Trip settings fields (except unlock); activity lock toggles disabled while trip locked. |
| L13 | **Trip info gap:** After create, board shows trip title/dates/timezone/status read-only ([`TripPlanningBoard.tsx`](../../packages/web/components/tp/TripPlanningBoard.tsx) ~471–494) with only **Mark active** / **Archive**. Wire Trip settings to existing [`updateDbTpTrip`](../../packages/web/lib/api/db/tp/updateDbTpTrip.ts) via a **browser** wrapper (same fields as agent `update_trip` — **no new API** unless wrapper missing). Extend workspace load if **`mapsUrl`** should appear (column exists on `tp_trip`; [`DbTpTrip`](../../packages/web/lib/api/db/tp/loadDbTpWorkspace.ts) may need `mapsUrl` mapped). Date changes keep **`syncDbTpDaysForTrip`** behaviour. |

### Resolved open questions (UI polish)

| # | Question | Answer |
| --- | --- | --- |
| 1 | Destination delete in UI? | **Yes** (L3). |
| 2 | Muted add-info link? | **No** (L4). |
| 3 | Day plan default expansion? | **Expanded** (L5). |
| 4 | Colour settings placement? | **Trip settings** → Display subsection (L7). |
| 5 | Colour format? | **Hex** (L6). |

**Out of scope:** Telegram, map SDK, travel route/step editor redesign, inner view mode on stay/note/travel editors, MCP lock toggles, lock on stay/travel/note, bulk HK–JP edits.

---

## Trip settings — design (implementation pass)

### Current gap

| Field | In DB / `updateDbTpTrip` | On web after create |
| --- | --- | --- |
| title, startDate, endDate, timezone | yes | **Read-only** heading/subtitle |
| status | yes | **Mark active** / **Archive** only (direct Supabase patch, not full form) |
| budgetAmount, budgetCurrency | yes | **Read-only** display |
| mapsUrl, notes | yes | **Not shown** |
| defaultCurrency (`tp_setting`) | yes via `updateDbTpTrip` | **Not shown** (board uses `settings.defaultCurrency` for money helpers only) |

Agent path already exists: **`update_trip`** MCP → [`updateDbTpTrip`](../../packages/web/lib/api/db/tp/updateDbTpTrip.ts) ([`tpAgentWorkspace.ts`](../../packages/web/lib/api/agent/tpAgentWorkspace.ts)).

### Target UI

- Collapsible **Trip settings** (writers): **Edit / Save / Cancel** or inline Save bar consistent with [`TripTpEditSaveBar`](../../packages/web/components/tp/TripTpEditSaveBar.tsx) pattern.
- **Trip info** section: inputs for L13 fields; Save calls `updateDbTpTripForBrowser({ podId, … })` with **`assertTpTripUnlocked`** before save.
- **Display** subsection: hex inputs → `tp_setting.action_kind_colors` update helper.
- **Plan lock** subsection: **Lock trip plan** switch (same as optional header control — one state).
- **`pod_viewer`:** section hidden.

### API gap

- **None** for trip fields if browser wrapper calls existing `updateDbTpTrip`. Optional: map **`mapsUrl`** on `DbTpTrip` in `loadDbTpWorkspace` for form seeding (UI-only type/load tweak, not a new REST contract).

---

## Trip plan lock — design (implementation pass)

### Schema

```sql
alter table public.tp_trip
  add column if not exists locked boolean not null default false;
```

### Toggle (UI only)

- `updateDbTpTripLockedForBrowser(tripId, locked)` — patches **only** `locked` (or dedicated column update via RLS). **Not** on agent `update_trip` input schema.

### Guard

- **`assertTpTripUnlocked`** on every content write, including **`updateDbTpTrip`** when any field other than `locked` changes, and **`update_trip`** MCP handler.

### UI

- Banner when locked; **Unlock trip plan** in Trip settings (and optionally header).

---

## Activity lock — design (implementation pass)

### Schema

```sql
alter table public.tp_action
  add column if not exists locked boolean not null default false;
```

- Workspace: `actions[].locked`.

### Toggle (UI only)

- Activity card: lock/unlock control for writers (`kind === activity`, trip unlocked). `updateDbTpActionLockedForBrowser(actionId, locked)` — **only** `locked` column; **not** exposed on MCP `update_tp_action`.

### Guard

- **`assertTpActivityUnlocked(actionId)`** before activity content mutations (browser + agent). Includes **`update_tp_action`**, **`delete_tp_action`**, action-location tools, done toggles, reorder on that action.

### UI

- [`TripDayActionCardHeader`](../../packages/web/components/tp/TripDayActionCardHeader.tsx): lock toggle + badge when locked; tooltip e.g. “Locked — unlock on card to edit”. Disable Edit/Delete/Save while locked.

### Cancelled (do not implement)

- ~~**`set_tp_activity_lock`** MCP tool~~  
- ~~**`PATCH …/trip/actions/{actionId}/lock`** agent-catalog route~~  
- ~~**`SetTpActivityLockSchema`** for agents~~

---

## Current behaviour (develop after PR #27)

| Surface | Today |
| --- | --- |
| **Trip header** | Read-only title/dates/timezone/status/budget; status buttons only |
| **Trip settings** | **Missing** |
| **Day / catalog / destination UI** | Text-first Edit bar; see prior plan table |
| **Locks** | Not implemented |

---

## Target interaction (summary)

- Icon edit/delete on panels; trip/activity lock disables writer mutations as above.
- **Trip settings** for metadata + display colours + trip lock.
- **`TripTpExpandableCard`** for day plan (expanded default), destinations, catalog.

---

## Likely files touched (implementation pass)

| Area | Files |
| --- | --- |
| Trip settings | New `TripTpTripSettingsPanel.tsx` (trip info + display + trip lock) |
| Shared UI | `TripTpExpandableCard.tsx`, `TripTpHeaderIconActions.tsx`, `TripTpEditSaveBar.tsx` |
| Panels / board | `TripDayPlanPanel.tsx`, `TripDestinationImportantPanel.tsx`, `TripTripCatalogPanel.tsx`, `TripPlanningBoard.tsx` |
| Header | `TripDayActionCardHeader.tsx` — activity lock toggle + badge |
| DB | Migrations `tp_trip.locked`, `tp_action.locked`, `action_kind_colors`; `loadDbTpWorkspace.ts`; `updateDbTpTrip.ts` + **browser wrappers**; `database.ts` |
| Guards | `@so/model` or shared `assertTpTripUnlocked` / `assertTpActivityUnlocked`; wire all `packages/web/lib/api/db/tp/*` writes + **`tpAgent*`** handlers |
| Agent | **No new tools**; ensure `update_trip` / `update_tp_action` **reject** when locked; **omit** `locked` from agent update schemas |
| Icons | `LockIcon` in `@so/component` if needed |

---

## Non-goals

- MCP or agent-catalog REST **lock toggles** (trip or activity).
- Adding `locked` to MCP **`update_trip`** / **`update_tp_action`** optional fields.
- Lock on stay/travel/note (v1).
- Browser-only **colour** via MCP (colours remain web Trip settings).

---

## Acceptance criteria

### UI shell & chrome

- [ ] Icon Edit/Delete pattern on day plan, destination, catalog rows; expandable cards; hide empty Important/Attachments; hex colours in Trip settings Display.
- [ ] **Trip settings** saves title, dates, timezone, status, budget, maps URL, notes, default currency via existing `updateDbTpTrip` when trip **unlocked**.
- [ ] Trip **locked** → trip info/display saves refused; unlock in UI restores editing.

### Locks (both UI-only toggles)

- [ ] Migrations **`tp_trip.locked`**, **`tp_action.locked`**; workspace exposes flags.
- [ ] Writers toggle **trip lock** and **activity lock** only in web UI; **no** MCP lock tools.
- [ ] Trip locked → all MCP/REST plan writes + UI plan edits fail; activity lock toggles disabled.
- [ ] Trip unlocked + activity locked → that activity’s MCP/REST/UI content writes fail; unlock on card restores edits; **trip unlock does not** clear activity lock.
- [ ] `pod_viewer`: sees state; no toggles.

### Migrations

- [ ] `action_kind_colors`, `tp_trip.locked`, `tp_action.locked` via Production `db push`.

---

## Suggested implementation order

1. Migrations + workspace types (`mapsUrl` on trip if needed).
2. **`assertTpTripUnlocked`** / **`assertTpActivityUnlocked`** + agent/browser wiring; **no** MCP lock tools.
3. **Trip settings** panel (trip info + display colours + trip lock).
4. Activity card lock toggle + badge.
5. Expandable cards + icon edit/delete + hide-empty chrome.
6. QA.

---

## QA checklist (after implementation)

- [ ] Change trip title in Trip settings → persists; MCP `update_trip` with new title works when unlocked.
- [ ] Lock trip in UI → MCP `update_tp_action` 409; trip settings Save 409; unlock → OK.
- [ ] Lock activity on card → MCP update that action 409; unlock on card → OK; trip lock still blocks both.
- [ ] Trip unlock leaves activity still locked if it was locked before.

---

## After Matthew approves implementation

**Implement on branch `cursor/trip-card-shell-activity-colours-f12f` in PR #28.** Update **Status**, check acceptance criteria, convert PR to ready for review. Do not merge until Matthew confirms QA.
