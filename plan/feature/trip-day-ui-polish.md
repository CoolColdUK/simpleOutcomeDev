# Trip day view — glance, accordions, and usable stay / travel

The day view should show **what is on for that day at a glance**. Details (destination info, activity places, travel legs) open in an **accordion**. This pass also makes the day list honest: existing **stay** and **travel** rows render as those kinds, **+ Stay** / **+ Travel** create real cards, each card can be **deleted**, and **selected route** has one source of truth.

**Repo:** [CoolColdUK/simpleOutcomeDev](https://github.com/CoolColdUK/simpleOutcomeDev)  
**Requirements:** [trip-planning.md](./trip-planning.md) (locked model — this plan does not reopen it)  
**Agent surface:** [trip-planning-api-mcp.md](./trip-planning-api-mcp.md) (already shipped; this plan adds a small activity-place delta)

**Status:** Draft plan only. **No feature code in the plan commit.** After Matthew approves, implement **on this same branch** in one follow-up pass. Agents do not merge. The PR stays **draft** until Matthew says otherwise.

**Out of scope:** Telegram bot (queued on its own track). No map SDK, no booking, no new trip-level journey compare. Do not bulk-delete live itinerary content while Matthew is on the 2026 HK–JP trip (see [QA](#qa-checklist)).

---

## Goal

1. A selected day lists **distinct** stay, activity, note, and travel cards, including rows **already in the database**.
2. Web **+ Stay** and **+ Travel** insert those kinds and the new card stays on the day so it can be filled in or deleted.
3. Every day card has a **delete** control. `delete_tp_action` already exists; the UI does not call it.
4. After `select_tp_route`, `get_tp_workspace` reports the matching route as selected. **`tp_action.selected_route_id` is the source of truth.** `tp_route.is_selected` is kept in sync on write and derived from the action on read.
5. Destination important-info is an accordion, **collapsed by default**.
6. On first open, the day tab is **today** when today falls inside the trip, otherwise the **nearer end** (first day before the trip, last day after it).
7. An **activity** is a time window with one or more **places** underneath (accordion). **Travel** uses the same accordion idea for routes and legs. Smallest model change: a child table for activity places; travel already has routes → transports.

---

## Current behaviour

### Day list hides stay and travel unless times are complete

[`TripPlanningBoard.tsx`](../../packages/web/components/tp/TripPlanningBoard.tsx) builds the day list through [`tpDayTimelineEntries`](../../packages/model/src/tp/tpDayTimelineEntries.ts).

| Kind | What the day list does today |
| --- | --- |
| **Activity / note** | Shown when `anchor_day_id` is the selected day. Badge uses `entry.kind`. |
| **Stay** | Included only when **both** `check_in_at` and `check_out_at` are set **and** the span overlaps the trip day. A stay with no times is dropped (`stay === undefined` → return). |
| **Travel** | The board builds a span only when the chosen route has **both** a depart instant and an arrive instant. Otherwise the travel action is omitted before the timeline helper runs. |

So a day full of activities titled `Travel: …` looks like “everything is an activity”. Those rows are real `kind = activity` workarounds. Real `kind = travel` and `kind = stay` rows are already in `tp_action` and are returned by [`loadDbTpWorkspace`](../../packages/web/lib/api/db/tp/loadDbTpWorkspace.ts); the **timeline filter** is what hides them. Kinds are not remapped to activity.

Collapsed cards show a kind badge and title (plus notes when closed). They do not show a time window, places, or the selected leg. Editors sit behind an **Edit** toggle (`expandedActionId`), not an accordion summary.

### + Stay and + Travel leave empty shells

[`addAction`](../../packages/web/components/tp/TripPlanningBoard.tsx) inserts a row titled `Stay` or `Travel` via [`createDbTpAction`](../../packages/web/lib/api/db/tp/createDbTpAction.ts) (kind is correct; no times, no places). Travel then creates route `Option A` and selects it. There is **no try/catch**, so a failure never reaches the board error alert.

On reload the new row fails the timeline rules above, so the card disappears and `expandedActionId` points at nothing. The database row remains: an empty `Stay` or `Travel` title with no check-in, no endpoints, and (if route insert failed part-way) sometimes no transports. That matches “fail or produce empty leftover cards”.

### Delete exists on the API only

- DB helper: [`deleteDbTpAction`](../../packages/web/lib/api/db/tp/deleteDbTpAction.ts) (`delete` on `tp_action`; routes and transports cascade).
- Agent: `deleteAgentTpAction` → MCP `delete_tp_action`, REST `DELETE /api/pods/{podId}/trip/actions/{actionId}`.
- Web day card: reorder, Edit, and mirror “Anchor day”. **No delete control.** [`TripTravelActionEditor`](../../packages/web/components/tp/TripTravelActionEditor.tsx) can delete **routes** and transports, not the action.

### Selected route: two columns, agent write updates one

Locked rule in [trip-planning.md](./trip-planning.md): `selected_route_id` and `is_selected` stay in sync; prefer **`tp_action.selected_route_id`**, and derive route selection on read.

| Path | What it writes |
| --- | --- |
| Browser [`selectDbTpRoute`](../../packages/web/lib/api/db/tp/selectDbTpRoute.ts) | Sets every sibling `tp_route.is_selected` false, sets the chosen route true, then `tp_action.selected_route_id`. |
| Agent [`selectDbTpRouteForAgent`](../../packages/web/lib/api/db/tp/selectDbTpRoute.ts) (used by `select_tp_route` / `selectAgentTpRoute`) | Updates **`selected_route_id` only**. Leaves `is_selected` false. |
| [`loadDbTpWorkspace`](../../packages/web/lib/api/db/tp/loadDbTpWorkspace.ts) | `selectedRouteId` from `selected_route_id`. `isSelected` from **`tp_route.is_selected` only**. |

`get_tp_workspace` returns that payload unchanged ([`getAgentTpWorkspace`](../../packages/web/lib/api/agent/tpAgentWorkspace.ts)). After `select_tp_route`, `action.selectedRouteId` is set and the matching route still has `isSelected: false`.

Related footgun, same follow-up: browser [`updateDbTpAction`](../../packages/web/lib/api/db/tp/updateDbTpAction.ts) always sends `selected_route_id: input.selectedRouteId ?? null`. [`TripTravelActionEditor`](../../packages/web/components/tp/TripTravelActionEditor.tsx) `saveAction` does not pass `selectedRouteId`, so saving a travel card **clears** the selection. Patch only provided fields.

There is **no** partial unique index enforcing one selected route per action (the original plan asked for an app + DB guard).

### Destination info is always open

On the selected day, “Important info” renders every active destination’s `important_info` in full ([`TripPlanningBoard.tsx`](../../packages/web/components/tp/TripPlanningBoard.tsx) around the `activeDestinationIds` block). The trip-level “Destinations (trip)” editor at the bottom is also always expanded (textarea + save + attachments). Nothing in `packages/web` uses Chakra `Accordion` yet. `@chakra-ui/react` v3 is already a dependency; do not add a package.

### Default day tab is the first day

`reload` does `setSelectedDayId((current) => current ?? next.days[0]?.id)`. First paint always selects **day index 0**, including when today is mid-trip or the trip is already over. Trip dates and `tp_trip.timezone` are on the workspace trip. [`localDateInZone`](../../packages/model/src/tp/localDateInZone.ts) already formats an instant as `YYYY-MM-DD` in an IANA zone. Day rows have `calendarDate`.

### Activity is a single place; the time window is stored and ignored

`tp_action` already has `start_time` and `end_time` (`time` without time zone; local on the anchor day, trip timezone — see [trip-planning.md](./trip-planning.md)). Agent create/update accepts `startTime` / `endTime`. The workspace mapper **drops** them (`DbTpAction` has no `startTime` / `endTime`). [`TripSimpleActionEditor`](../../packages/web/components/tp/TripSimpleActionEditor.tsx) edits one `place_text` + `maps_url` and does not edit the window.

Travel alternatives already exist: `tp_route` → ordered `tp_transport`. No schema change is required to show legs inside an accordion.

There is no child table for “several places under one activity”. `tp_destination` is trip-level safety info, not a stop on an activity.

---

## Proposed UX

One expanded **action** at a time (keep `expandedActionId`). New cards from **+ Stay** / **+ Travel** / **+ Activity** / **+ Note** open expanded so the first edit is immediate. Everything else starts collapsed. Use Chakra `Accordion` for destination info and for the visual of each card; action open/close stays controlled by `expandedActionId` so reorder and “Anchor day” keep working.

### Collapsed card (glance)

| Kind | Summary line |
| --- | --- |
| **Stay** | Badge `stay`, title, property (`place_text`), check-in → check-out when set. Mirror badge unchanged. If times are missing: title + “Times not set”. |
| **Activity** | Badge `activity`, title, `start_time`–`end_time` when set, then place names (legacy `place_text` if there are no child places, otherwise the child list, truncated). Example: `Shopping · 13:00–15:00 · 3 places`. |
| **Travel** | Badge `travel`, title, `from_place` → `to_place`, selected route name, first depart → last arrive on that route when instants exist. If nothing is filled in: title + “Route not set”. |
| **Note** | Badge `note`, title, first line of notes. |

Mirrors stay read-only in the expanded panel (existing rule). Expanded canonical panel is the current editor.

### + Stay / + Travel

Keep creating `kind = stay` / `kind = travel` (do not create an activity titled “Travel: …”). Travel still seeds one route and selects it. Wrap the sequence in try/catch and set the board error. The new row must remain on the **anchor day** even with empty times (timeline change below), so the editor is visible. If route seeding fails, the travel card still shows and can be deleted.

### Delete

On **every** day card (canonical and mirror), writers see **Delete**. Confirm with the kind and title, and state that the action is removed from **every** day it appears (one `tp_action` row; mirrors are not separate rows). Call `deleteDbTpAction`, clear `expandedActionId` when it was that id, reload. Hide the control when `canWriteTpPod` is false. Viewers do not get a delete.

### Destination info

- **Day “Important info”:** one accordion, collapsed by default. Trigger lists destination names (or “Important info” when there is one). Body is the current stacked text. No change to which destinations are chosen (`tpActiveDestinationsForDay`).
- **Trip “Destinations (trip)” block:** same treatment, collapsed by default, so the day strip is what you see first. Edit, save, and attachments stay inside the panel.

### Default day tab

Apply only when there is no current selection, or the stored id is no longer in `days` (date shrink). Do not override a day the user already picked in this session.

Compare **today in `tp_trip.timezone`** (`localDateInZone(now, trip.timezone)`) to `tp_day.calendar_date`:

| Today vs trip days | Select |
| --- | --- |
| Equal to a `calendar_date` | That day |
| Before the first day | First day |
| After the last day | Last day |
| Inside the range but that date row is missing | Nearest day (smaller absolute day distance; tie → earlier day) |
| No days, or timezone formatting fails | Leave unset / first day, and do not throw |

Put the choice in `@so/model` (`tpDefaultSelectedDayId`) so it is unit-tested. The board only calls it.

---

## Data model

### Stay / travel visibility (no migration)

Change [`tpDayTimelineEntries`](../../packages/model/src/tp/tpDayTimelineEntries.ts):

- **Stay** with both instants: unchanged overlap mirrors. **Also** show it on `anchor_day_id` when it has no complete span (draft card).
- **Travel:** the board must pass anchor-day travel actions into the helper even when depart/arrive are missing. Complete spans still mirror across overlapped days. A draft with only an anchor day shows on that day as `canonical`.
- **One entry per action per day.** If the anchor day is also inside the span, do not emit a second row.
- Activity and note rules stay as they are.

Draft stay/travel on the anchor day use the action `sort_order` (same as activities), not the mirror offset (`10_000 + sort_order`).

### Selected route (repair migration, no new table)

**Source of truth:** `tp_action.selected_route_id`.

Read path: `isSelected` is true iff `route.id === action.selectedRouteId` when `selectedRouteId` is set. When it is null, fall back to stored `is_selected` so a browser-only flag is not hidden before the repair runs. Implement the comparison in `@so/model` (`tpRouteIsSelected`) and use it in `loadDbTpWorkspace`. Any UI that treats “selected” as `selectedRouteId === route.id || route.isSelected` can keep that OR only as long as the mapper has already applied the rule; prefer the helper so the two flags cannot disagree in the client.

Write path: one shared select function used by the browser helper and `selectDbTpRouteForAgent`:

1. Reject the call when the route’s `action_id` is not the given action.
2. Set `is_selected = (id = routeId)` for every route of that action.
3. Set `tp_action.selected_route_id` to that route.

Browser `updateDbTpAction` becomes a **patch**: omit keys that the caller did not pass, so a travel save does not null `selected_route_id`. Include `start_time` / `end_time` in the patch and on `DbTpAction`.

### Activity places (one new table)

Do **not** store the place list as JSON on `tp_action`, and do **not** reuse `tp_destination` or `tp_transport`. Those are different objects. A child table matches `tp_route` / `tp_transport` and is the smallest change that allows more than one place.

`public.tp_activity_place`:

| Column | Notes |
| --- | --- |
| `id` | uuid PK, `gen_random_uuid()` |
| `action_id` | FK → `tp_action` **on delete cascade**. App rejects insert unless that action’s `kind` is `activity` (same style as routes, which are not kind-checked in SQL). |
| `place_text` | text, not blank |
| `maps_url` | optional |
| `notes` | optional |
| `sort_order` | int, default 0 |
| `created_at`, `updated_at` | same `moddatetime` trigger pattern as the other `tp_*` tables |

**Display rule (no backfill of existing rows):**

- Zero child places: the glance and the editor use `tp_action.place_text` / `maps_url` (today’s single place, including `Travel: …` activity workarounds).
- One or more child places: the glance lists those rows. The editor edits the list.
- First time the user adds another place: insert a row from the current `place_text` (when non-empty), then the new place. Leave `place_text` in place so older readers still see a label; the UI prefers children when any exist.

**Time window** stays `tp_action.start_time` / `end_time`. No per-place times in this pass. Cost stays on the activity (counted once). Places have no cost and no attachments.

**Travel accordion** reads existing routes and transports. No new travel table.

Workspace type gains `activityPlaces: { id, actionId, placeText, mapsUrl?, notes?, sortOrder }[]`. `DbTpAction` gains `startTime?` and `endTime?`.

---

## MCP / REST deltas

Existing tools stay. `get_tp_workspace` grows `activityPlaces` and correct `isSelected` / `startTime` / `endTime`. No new permission resource: places are part of the `trip` grant, same as routes.

| Tool | Input | Right | REST |
| --- | --- | --- | --- |
| `create_tp_activity_place` | `{podId, actionId, placeText, mapsUrl?, notes?, sortOrder?}` | `create` | `POST /api/pods/{podId}/trip/activity-places` |
| `update_tp_activity_place` | `{podId, placeId, placeText?, mapsUrl?, notes?, sortOrder?}` | `update` | `PATCH /api/pods/{podId}/trip/activity-places/{placeId}` |
| `delete_tp_activity_place` | `{podId, placeId}` | `delete` | `DELETE /api/pods/{podId}/trip/activity-places/{placeId}` |

Wire them like routes: valibot schemas in [`tpAgentSchemas.ts`](../../packages/model/src/tp/tpAgentSchemas.ts), catalog entries in [`mcpCatalogByFeature.ts`](../../packages/web/lib/api/mcp/mcpCatalogByFeature.ts), branches in [`dispatchAgentRestMore.ts`](../../packages/web/lib/api/agent/dispatchAgentRestMore.ts), pod-ownership check before write. `select_tp_route` keeps its current name and arguments; only the write/read implementation changes.

`delete_tp_action` is unchanged. Deleting an activity cascades its places.

---

## Migration

New file under `supabase/migrations/` (timestamp after `20261023120000_api_key_trip_and_update.sql`). Production applies it through the Production workflow `db push`. Do not apply it to production from a laptop.

1. **Repair selection (no deletes).**
   - Where `selected_route_id` is set: `is_selected = (tp_route.id = tp_action.selected_route_id)` for routes of that action.
   - Where `selected_route_id` is null and exactly one route has `is_selected`: set `selected_route_id` to that route.
   - Where `selected_route_id` is null and more than one route is selected: keep the lowest `sort_order` (tie → lowest `id`), clear the rest, set `selected_route_id` to the keeper.
2. **Partial unique index** `tp_route_one_selected_per_action` on `(action_id) where is_selected`, after the repair.
3. **Create `tp_activity_place`** as above. RLS: copy [`tp_route_all`](../../supabase/migrations/20261022150000_pod_viewer_trip_planning.sql) (`can_read_tp_pod` / `can_write_tp_pod` via the parent action’s trip). Grants: `select, insert, update, delete` to `authenticated`; `all` to `service_role`. `moddatetime` on `updated_at`. Enable RLS.
4. Update generated/hand-maintained table types in [`packages/web/lib/supabase/database.ts`](../../packages/web/lib/supabase/database.ts).

Do **not** migrate activity rows titled `Travel: …` into `kind = travel`. Do **not** delete empty Stay/Travel shells in SQL. Both are live-trip content; cleanup is a manual QA step after the UI can show and delete them.

---

## Implementation order (same branch, after approval)

1. Model: timeline drafts + `tpRouteIsSelected` + `tpDefaultSelectedDayId`, with unit tests.
2. Mapper: `startTime` / `endTime`, derived `isSelected`, `activityPlaces` once the table exists. Unify route select. Patch `updateDbTpAction`.
3. Migration (selection repair, unique index, `tp_activity_place`).
4. Web: timeline shows draft stay/travel; **+ Stay** / **+ Travel** error handling; delete on each card; glance lines; destination accordions; default day; activity window + place list inside the activity accordion; travel accordion summary over existing routes/legs.
5. MCP/REST place tools and workspace payload.
6. QA cleanup below. No Telegram work.

Packages touched: `@so/model` (pure helpers + schemas + tests), `@so/web` (board, editors, db/tp, agent, MCP). No new npm dependency.

---

## Tests

`@so/model` only (exported functions). No new application tests.

| Helper | Cases |
| --- | --- |
| `tpDayTimelineEntries` | Activity/note still anchor-only. Stay with times still mirrors. Stay with no times appears on the anchor day only. Travel with no span appears on the anchor day only. Travel with a span mirrors, including a span that includes the anchor day (**one** entry that day). |
| `tpRouteIsSelected` | Selected id wins over a stale `is_selected`. Null selected id falls back to the stored flag. |
| `tpDefaultSelectedDayId` | Today equal to a day; today before the first day; today after the last day; gap inside the range (nearer day, tie → earlier); empty day list. |

---

## QA checklist

Use a trip pod that already has mixed kinds (the live HK–JP trip when Matthew is ready for someone to touch it). Confirm in the web day view **and** in `get_tp_workspace`.

- [ ] An existing `kind = travel` row shows badge **travel**, not activity, on its anchor day even when transports have no times, and on every overlapped day when the selected route has depart and arrive.
- [ ] An existing `kind = stay` row shows badge **stay** on its anchor day, and on overlapped nights when check-in and check-out are set.
- [ ] Activity and note cards are unchanged in kind. Rows titled `Travel: …` stay **activities** until Matthew deletes the ones that duplicate a real travel row. **Do not delete those in bulk.**
- [ ] **+ Stay** adds a stay card that remains visible, opens the stay editor, and survives reload before times are saved.
- [ ] **+ Travel** adds a travel card with one selected route, remains visible, and opens the travel editor.
- [ ] A failed create surfaces the error alert and does not look like a silent no-op.
- [ ] Delete on a canonical card removes it. Delete on a mirror removes the same action from the other days. A viewer has no delete control. Routes/transports/places of that action are gone.
- [ ] **Empty shells (one-off, after delete works):** from `get_tp_workspace`, list actions whose `kind` is `stay` or `travel`, whose `title` is exactly `Stay` or `Travel`, and which have no place, no from/to, no check-in/out, no notes, and no transports. Delete **those** with the new control or `delete_tp_action`. Re-load the workspace and confirm they are gone and that filled-in stays and travels remain. Record the deleted ids in the PR test notes. This is not a migration.
- [ ] `select_tp_route` then `get_tp_workspace`: `action.selectedRouteId` equals the route id **and** that route’s `isSelected` is true; sibling routes are false. Saving the travel card in the web UI does not clear `selectedRouteId`.
- [ ] Day important-info accordion and the trip destinations block open collapsed. Expanding shows the same text as today. Active destinations are unchanged.
- [ ] Opening the trip with no day selected: today inside the range selects today; a future trip selects day 1; a past trip selects the last day. Changing day and reloading stays on the chosen day.
- [ ] Activity with `start_time` / `end_time` shows the window on the collapsed card. Adding two places shows both only when expanded; the collapsed line shows the count (and a short name list). A pre-existing activity with only `place_text` still shows that place with no child rows.
- [ ] Travel collapsed line shows from → to and the selected route’s legs; expand shows options and transports (select, add, delete route still work).
- [ ] `pod_viewer` can read and cannot create places, delete actions, or edit.
- [ ] Budget still counts an activity cost once and still uses the selected route’s transport costs (`tpRouteIsSelected` / `selectedRouteId`).

---

## Decisions locked by this plan

| Topic | Decision |
| --- | --- |
| Why travel looks like activities | Timeline drops incomplete stay/travel; workaround rows are real activities titled `Travel: …`. Show real kinds; do not rewrite those titles in a migration. |
| Empty Stay/Travel cards | Manual delete after the control ships. Not a SQL delete. |
| Selected route | `selected_route_id` wins. Writes update both columns. Repair migration + partial unique index. |
| Activity places | New `tp_activity_place` child. Time window is existing `start_time` / `end_time`. |
| Travel legs | Accordion over `tp_route` / `tp_transport`. No new table. |
| Default day | Today in the trip timezone, clamped to the strip. |
| Where the code lands | Follow-up commits on **this** branch. Draft until Matthew says otherwise. |
