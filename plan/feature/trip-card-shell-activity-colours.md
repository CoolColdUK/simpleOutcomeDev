# Trip planning UI — icon edit, hide empty chrome, shared card shell, activity-type colours, activity lock

Matthew wants trip-planning panels to **feel like day action cards**: icon **Edit** / **Delete** in the header, **expand/collapse** with consistent chrome, **no empty optional blocks** until there is content or the user is editing, **optional per–action-kind background tints** on day cards, and **API-only lock** on **activity** actions so agents cannot mutate locked rows by mistake (humans see a read-only lock indicator in the UI).

**Repo:** [CoolColdUK/simpleOutcomeDev](https://github.com/CoolColdUK/simpleOutcomeDev)  
**Requirements:** [trip-planning.md](./trip-planning.md)  
**Shipped baseline:** [trip-text-first-edit-save.md](./trip-text-first-edit-save.md) — **implemented** in PR #27 (merge `3ab59aa` on `develop`). Day plan, destination important info, and catalog rows are text-first with text **Edit** / **Save** / **Cancel** via [`TripTpEditSaveBar`](../../packages/web/components/tp/TripTpEditSaveBar.tsx). Action cards already use pencil / trash icons in [`TripDayActionCardHeader`](../../packages/web/components/tp/TripDayActionCardHeader.tsx).

**Status:** **Plan only** — branch `cursor/trip-card-shell-activity-colours-f12f` (PR #28). **Open questions resolved** in Technical Forum (Nov 2026); locked answers recorded below. **No implementation in this pass.** **Do not merge** until the implementation pass is complete and Matthew confirms QA. **Implement on this same branch / PR** after Matthew gives go-ahead to code (update this doc’s status and convert draft PR to ready for review).

---

## Goal

1. **Icon Edit (and Delete where supported)** — Replace text **Edit** on day plan, destination important, location row, and transport library row with the same **IconButton + `AppIconTooltip` + `EditIcon`** pattern as action cards. **Delete** becomes a red ghost **DeleteIcon** where remove already exists in data/API (location, transport library, day actions, **destinations**). Do **not** add delete for entities with no delete path (e.g. **`tp_day`**).
2. **Show only when needed** — Hide empty **Important info** (day accordion), **Attachments**, and similar optional blocks until they have content **or** the enclosing section is in **Edit** mode. Writers still see a clear **Edit** affordance on the card header so empty sections can be filled. **No** muted “Add important info…” link when the day accordion is hidden.
3. **Consistent expandable card shell** — Day plan, each destination important block, each catalog row (location / transport), and the day-level **Important info** strip use one shared **expandable card** layout modeled on the action card: bordered `Box`, header row (title, optional badge/subtitle, header actions), body collapsed or expanded, optional inner **Details** disclosure where read-only depth is needed.
4. **Optional activity-type background colour** — Pod-visible setting: map each [`TpActionKind`](../../packages/model/src/tp/tpActionKind.ts) (`stay`, `travel`, `activity`, `note`) to an optional **hex** colour. When unset for a kind, day cards look **exactly as today**. When set, apply a subtle background on the action card shell only. Writers edit colours inside a collapsible **Display settings** section (not always inline on the board).
5. **Activity lock (API-only toggle)** — For `tp_action` rows with `kind = activity` only: optional `locked` flag set/cleared **only** via REST + MCP (no browser lock/unlock control). When locked, refuse mutations from browser write paths and agent/REST **except** the dedicated lock/unlock API. UI may show a **read-only lock badge/indicator** on the activity card header. Unlock is also API-only (MCP/REST).

---

## Locked decisions (Matthew — Technical Forum, Nov 2026)

| # | Decision |
| --- | --- |
| L1 | **Edit** on non-action surfaces uses **pencil icon** (outline); entering edit mode does **not** swap to cross on panels that use explicit **Save** / **Cancel** (cross remains the action-card “close editor” semantics only). |
| L2 | **Save** and **Cancel** stay **text buttons** (`size="sm"`) in the card footer while editing — only idle **Edit** and **Delete** move to icons. |
| L3 | **Delete** uses **confirm** before network call. Location and transport: icon delete, same behaviour as today. **Destination delete: YES** — trash on destination important cards, browser wrapper around existing [`deleteDbTpDestination`](../../packages/web/lib/api/db/tp/deleteDbTpDestination.ts), confirm dialog **names the destination**. **No delete** on day plan panel. |
| L4 | **Hide empty chrome:** Blank `importantInfo` and not editing → **no** day **Important info** accordion. Empty attachments and not editing → hide **Attachments** block. **Destinations (trip)** alone is enough to add important info — **no** extra muted link on the day view. Viewers never see empty attachment headings. |
| L5 | **Shared shell:** New presentational component (e.g. `TripTpExpandableCard`) owns border, padding, expand/collapse, and header action slot. **Day plan default expansion: expanded** (including mobile). **Catalog rows** stay **collapsed until tapped** (scannable list). |
| L6 | **Activity colours:** Persist on **`tp_setting`** as optional `jsonb` (e.g. `action_kind_colors`) keyed by action kind → **hex string** (`#RRGGBB` or `#RGB`). Requires **one migration** + load/update in [`loadDbTpWorkspace`](../../packages/web/lib/api/db/tp/loadDbTpWorkspace.ts) and a small settings update helper. Client-only / localStorage **rejected**. |
| L7 | **Colour UI:** Collapsible **Display settings** on the trip board (writers only) — **free-form hex input** per kind, clear-to-default, optional preview. Invalid hex ignored on read (fallback to default card). Not preset-only. |
| L8 | **`pod_viewer`:** No Edit/Delete icons; Display settings hidden; read-only text and lock badge visible when set. |
| L9 | **Activity lock:** Column **`tp_action.locked boolean not null default false`**. Semantics apply **only when `kind = activity`**; lock/unlock **only** via dedicated REST + MCP tool(s). **No** browser control to toggle lock. UI: read-only indicator on locked activity cards; disable or guard Edit/Delete/Save paths in browser when locked (mutations already rejected server-side). |
| L10 | **Locked activity mutations:** When `locked` and `kind = activity`, reject **update** and **delete** of the action and any change that alters activity payload: [`updateDbTpAction`](../../packages/web/lib/api/db/tp/updateDbTpAction.ts) (including `done`, times, cost, notes, sort, anchor), [`deleteDbTpAction`](../../packages/web/lib/api/db/tp/deleteDbTpAction.ts), **action–location links** (create/link/unlink/update/delete [`tp_action_location`](../../supabase/migrations/20261023190000_trip_locations_transports.sql) including `done` on links). Activities do **not** use route/transport/attachment children today — no travel-only tables in scope. Stay/travel/note **`locked` column ignored** (always treated as unlocked until a future plan extends lock). |
| L11 | **Lock API surface:** One MCP tool (e.g. **`set_tp_activity_lock`**) and matching REST route (e.g. **`PATCH /api/pods/{podId}/trip/actions/{actionId}/lock`**) with body `{ locked: boolean }`. Tool description must state: only for **activity** kind; use to prevent accidental agent edits; **unlock via same API** — UI does not unlock. Optional read-only `locked` on `get_tp_workspace` / workspace load (already on action row). |

### Resolved open questions (formerly open)

| # | Question | Answer |
| --- | --- | --- |
| 1 | Destination delete in UI? | **Yes** — trash + confirm naming destination (L3). |
| 2 | Muted “Add important info…” when day accordion hidden? | **No** — Destinations (trip) only (L4). |
| 3 | Day plan default expansion? | **Expanded** by default (L5). |
| 4 | Colour settings placement? | Collapsible **Display settings** (L7). |
| 5 | Colour format? | **Free-form hex** (L6–L7). |

**Out of scope for this plan:** Telegram, map SDK, redesign of travel route/step editors, inner view mode inside stay/note/travel editors (still deferred from PR #27), lock on stay/travel/note, browser lock/unlock toggle, bulk HK–JP data edits.

---

## Activity lock — design (implementation pass)

### Model today

- Trip actions live in **`tp_action`** ([`supabase/migrations/20261022150000_pod_viewer_trip_planning.sql`](../../supabase/migrations/20261022150000_pod_viewer_trip_planning.sql)): `kind` ∈ `travel` \| `stay` \| `activity` \| `note` ([`TpActionKind`](../../packages/model/src/tp/tpActionKind.ts)).
- **Activities** link to catalog places via **`tp_action_location`** (not routes/transports). Per-day **`done`** on action and links ([`20261024120000_trip_done_flags.sql`](../../supabase/migrations/20261024120000_trip_done_flags.sql)).
- Workspace shape: [`DbTpAction`](../../packages/web/lib/api/db/tp/loadDbTpWorkspace.ts) + `actionLocations[]` in board/editors ([`TripActivityActionEditor`](../../packages/web/components/tp/TripActivityActionEditor.tsx), [`TripActivityActionDetails`](../../packages/web/components/tp/TripActivityActionDetails.tsx)).
- **No `locked` column today.**

### Schema (lightest)

```sql
alter table public.tp_action
  add column if not exists locked boolean not null default false;
```

- No check tying `locked` to `kind` at DB level — enforcement in app layer keeps stay/travel/note edits unaffected even if `locked` were true historically.
- **`get_tp_workspace` / `loadDbTpWorkspace`:** map `locked` → `actions[].locked` (default `false`).

### Central guard

- Add **`assertTpActivityUnlocked(supabase, actionId)`** (or shared TS helper in `@so/model` + used by web/agent) that loads `kind` + `locked` and throws **`activity_locked`** (409) when mutation would change a locked activity.
- **`setTpActivityLockForAgent` / browser-exposed lock endpoint** is the **only** write allowed to flip `locked` on activity rows (plus direct SQL/admin out of band).

### Enforcement points (browser + agent)

| Operation | Entry | Guard when target is locked activity |
| --- | --- | --- |
| Update action | `updateDbTpAction` / `updateDbTpActionForAgent`, `updateAgentTpAction`, REST `PATCH …/trip/actions/{id}` | Reject unless patch is **only** `{ locked }` via lock route |
| Delete action | `deleteDbTpAction`, `deleteAgentTpAction`, REST `DELETE …/trip/actions/{id}` | Reject |
| Link / unlink location | Agent + REST action-location handlers, browser link helpers | Reject |
| Update link (`done`, sort) | `updateDbTpActionLocation*`, agent `update_tp_action_location` | Reject |
| Reorder | `updateDbTpAction` with `sortOrder` | Reject |
| Toggle done (card) | Board `toggleActionDone` → update action | Reject |
| Create action | N/A | Unaffected |

Implement guard **once** at DB helper layer where possible so browser and agent share behaviour.

### MCP + REST (new)

| Surface | Name | Input | Notes |
| --- | --- | --- | --- |
| MCP | **`set_tp_activity_lock`** | `{ podId, actionId, locked: boolean }` | Returns updated action or `{ ok: true }`. Fails if not `kind = activity`. Description: lock prevents agent/UI writes until unlocked via this tool. |
| REST | **`PATCH /api/pods/{podId}/trip/actions/{actionId}/lock`** | `{ locked: boolean }` | Same semantics as MCP; register beside existing trip action routes. |
| Valibot | `@so/model` schema | `SetTpActivityLockSchema` | Export for agent registration + tests. |

**Do not** add `locked` to generic `update_tp_action` optional fields (keeps lock changes auditable and prevents agents from unlocking while “updating title”).

### UI (read-only)

- [`TripDayActionCardHeader`](../../packages/web/components/tp/TripDayActionCardHeader.tsx): when `kind === activity` && `locked`, show lock badge/icon (add **`LockIcon`** to `@so/component` if missing) with tooltip “Locked — change via API”.
- When locked: hide or disable writer **Edit**, **Delete**, and activity editor **Save**; **Details** read-only accordion may stay open for read. **`pod_viewer`:** show badge only.
- **No** control to lock/unlock in browser (L9).

### Risks

- Agents that only call `update_tp_action` today will get **409** until they use **`set_tp_activity_lock`** first — document in MCP tool descriptions.
- Forgetting a mutation path (e.g. new action-location REST) could bypass lock — add unit tests on guard helper and one integration test per handler family.

---

## Current behaviour (develop after PR #27)

| Surface | File | Today |
| --- | --- | --- |
| **Day action cards** | [`TripDayActionCardHeader.tsx`](../../packages/web/components/tp/TripDayActionCardHeader.tsx) | Icon **Edit** / **Delete**; bordered card in board; activity/travel **Details** accordion when collapsed. |
| **Day plan** | [`TripDayPlanPanel.tsx`](../../packages/web/components/tp/TripDayPlanPanel.tsx) | Static `Heading` + bordered box; text **Edit** / **Save** / **Cancel**; always shows all three fields (muted placeholders when empty). |
| **Day Important info** | [`TripPlanningBoard.tsx`](../../packages/web/components/tp/TripPlanningBoard.tsx) (~548–568) | [`TripTpCollapsible`](../../packages/web/components/tp/TripTpCollapsible.tsx) shown whenever `activeDestinationIds.length > 0`, even when all `importantInfo` empty (“No details yet.”). |
| **Destinations (trip)** | [`TripDestinationImportantPanel.tsx`](../../packages/web/components/tp/TripDestinationImportantPanel.tsx) + board collapsible | Text edit bar; **Attachments** heading always visible (`None` when empty); upload/delete only when editing. **No destination delete in UI.** |
| **Location / transport rows** | [`TripTripCatalogPanel.tsx`](../../packages/web/components/tp/TripTripCatalogPanel.tsx) | Nested bordered stack per row; text **Edit**; text red **Delete** in `trailing`; lists wrapped in `TripTpCollapsible` (+/−). |
| **Action card colours** | Board card `Box` | Neutral border only; kind shown as **Badge** text. |
| **Activity lock** | — | Not implemented. |

**Reference patterns**

- Icons: `EditIcon`, `DeleteIcon`, `CrossIcon` from `@so/component`; tooltips via [`AppIconTooltip`](../../packages/web/components/app/AppIconTooltip.tsx).
- Text-first edit: [`TripTpEditSaveBar`](../../packages/web/components/tp/TripTpEditSaveBar.tsx).
- Activity read depth: [`TripActivityActionDetails.tsx`](../../packages/web/components/tp/TripActivityActionDetails.tsx).

---

## Target interaction

### 1 — Icon edit / delete

| Surface | Edit | Delete |
| --- | --- | --- |
| Day plan | Header pencil → edit mode | — (no API) |
| Destination important | Header pencil | Header trash (confirm names destination) |
| Location row | Header pencil | Header trash (confirm) |
| Transport lib row | Header pencil | Header trash (confirm) |
| Day action cards | unchanged (disabled/hidden when activity **locked**) | unchanged (disabled when locked) |

Refactor [`TripTpEditSaveBar`](../../packages/web/components/tp/TripTpEditSaveBar.tsx) or add header action cluster so **idle** **Edit** sits in the card header. Catalog **Delete** moves from `trailing` text to header icons.

### 2 — Hide empty chrome

| Block | Hidden when | Still reachable |
| --- | --- | --- |
| Day **Important info** accordion | All active destinations have empty `importantInfo` and user not editing any destination important block on that day | **Destinations (trip)** → Edit on destination row (**no** day-level hint link) |
| **Attachments** (destination) | `filtered.length === 0` and not editing that destination | Edit destination → upload |
| **Attachments** (travel transport steps) | Audit in implementation; hide when empty and not editing |

Day plan card remains visible; **default expanded** (L5).

### 3 — Shared expandable card shell

- **`TripTpExpandableCard`**: day plan **`defaultExpanded={true}`**; catalog rows collapsed until tapped.
- Migrate: [`TripDayPlanPanel`](../../packages/web/components/tp/TripDayPlanPanel.tsx), [`TripDestinationImportantPanel`](../../packages/web/components/tp/TripDestinationImportantPanel.tsx), catalog rows, day Important info strip when visible.

### 4 — Activity-type background colour

- **`tp_setting.action_kind_colors`**: hex per kind; apply on action card `Box` in [`TripPlanningBoard`](../../packages/web/components/tp/TripPlanningBoard.tsx).
- **Display settings:** collapsible section with hex inputs (L7).

---

## Likely files touched (implementation pass)

| Area | Files |
| --- | --- |
| Shared UI | `TripTpExpandableCard.tsx`, `TripTpHeaderIconActions.tsx`, `TripTpEditSaveBar.tsx`, `TripTpDisplaySettingsPanel.tsx` (or similar) |
| Panels | `TripDayPlanPanel.tsx`, `TripDestinationImportantPanel.tsx`, `TripTripCatalogPanel.tsx` |
| Board | `TripPlanningBoard.tsx` — important visibility, card `bg`, locked activity UX |
| Header | `TripDayActionCardHeader.tsx` — lock badge |
| Attachments | `TripTpAttachmentPanel.tsx` — `hideWhenEmpty` |
| Settings / DB | `*_tp_setting_action_kind_colors.sql`, `*_tp_action_locked.sql`, `loadDbTpWorkspace.ts`, settings update helper, `database.ts` |
| Lock | `updateDbTpAction.ts`, `deleteDbTpAction.ts`, action-location create/update/delete helpers, `tpAgentActions.ts`, new lock handler + route registration, `tpAgentSchemas.ts`, `@so/model` tests for guard + schema |
| Icons | `@so/component` `LockIcon` if needed |
| Docs | This plan → **Status** + acceptance when done |

---

## Non-goals

- Replacing text **Save** / **Cancel** with icons on panels.
- Delete on **`tp_day`**.
- Browser UI to lock/unlock activities.
- Lock on stay, travel, or note (v1).
- MCP/agent changes for **colour** settings (web writers only unless extended later).
- Realtime sync of expand state across clients.

---

## Acceptance criteria

### UI shell & chrome

- [ ] Writers see **pencil Edit** on day plan, destination important, location row, and transport row headers; **Save** / **Cancel** unchanged while editing.
- [ ] Location, transport, and **destination** **Delete** are **icon** controls with confirm (destination confirm **names** the destination).
- [ ] Day **Important info** accordion absent when all relevant `importantInfo` empty; **no** muted add link on day view.
- [ ] Destination **Attachments** hidden when no files and not editing.
- [ ] Day plan, destination important, and catalog rows use **`TripTpExpandableCard`**; day plan **expanded by default**; catalog collapsed until opened.
- [ ] **Display settings** collapsible with **hex** inputs; per-kind backgrounds persist in **`tp_setting`**; unset kinds unchanged; viewer sees colours, not editor.
- [ ] `pod_viewer`: no edit/delete icons; no Display settings editor.
- [ ] Mobile: no horizontal scroll regression (manual narrow viewport).

### Activity lock

- [ ] Migration adds **`tp_action.locked`**; workspace exposes `actions[].locked`.
- [ ] **`set_tp_activity_lock`** MCP + REST lock route; only updates `locked` on **activity** rows.
- [ ] Locked activity: browser and agent **update/delete** and action-location mutations return clear error; lock/unlock succeeds.
- [ ] Locked activity card shows **read-only lock indicator**; writer Edit/Delete disabled or blocked; unlock **only** via API/MCP.
- [ ] Stay/travel/note behaviour unchanged when `locked` column false (default).

### Migrations

- [ ] Production workflow applies **`action_kind_colors`** and **`locked`** via existing `db push`.

---

## Suggested implementation order

1. Migrations: `action_kind_colors`, `tp_action.locked`; workspace load + types.
2. **`assertTpActivityUnlocked`** + lock set helper; MCP/REST lock endpoint; wire guards on mutation paths.
3. Activity card lock badge + disabled edit/delete when locked.
4. `TripTpExpandableCard` + header icon actions.
5. Day plan (expanded default) + icon Edit.
6. Destination important + destination delete icon + attachment hide-when-empty.
7. Catalog rows + icon Edit/Delete.
8. Day Important info visibility + Display settings hex colours + QA.

---

## QA checklist (after implementation)

- [ ] Empty active destination → no day Important info accordion; add via Destinations → Edit → Save → accordion appears.
- [ ] Destination delete icon → confirm shows name → row gone.
- [ ] Lock activity via MCP → UI shows badge; Edit/Delete/Save blocked; Details still readable.
- [ ] Unlock via MCP → UI editable again.
- [ ] Agent `update_tp_action` on locked activity → 409; `set_tp_activity_lock` unlock → update succeeds.
- [ ] Display settings hex → only that kind’s cards tinted; invalid hex ignored.
- [ ] Viewer → colours + lock badge; no edit chrome.

---

## After Matthew approves implementation

**Implement on branch `cursor/trip-card-shell-activity-colours-f12f` in PR #28.** Mark this document **Status** as implemented, check acceptance criteria, and convert the PR from plan/draft to ready for review. Do not merge until Matthew confirms QA.
