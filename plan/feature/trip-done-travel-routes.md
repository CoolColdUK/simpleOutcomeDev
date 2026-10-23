# Trip done checkboxes, travel Details, route and step accordions

A day card should be markable **done** without opening the editor, and a **travel** card should be readable the same way an activity already is. Route options stay on the existing travel → route → leg model. Each option is hidden behind its own accordion and labelled with a short summary. Slow mutations, especially **+ Route**, show a pending state until the workspace reload finishes.

**Repo:** [CoolColdUK/simpleOutcomeDev](https://github.com/CoolColdUK/simpleOutcomeDev)  
**Base:** `develop` after [#19](https://github.com/CoolColdUK/simpleOutcomeDev/pull/19) (routes, selected route), [#20](https://github.com/CoolColdUK/simpleOutcomeDev/pull/20) (locations, transport library, `tp_action_transport`), and [#21](https://github.com/CoolColdUK/simpleOutcomeDev/pull/21) (activity Details, location hours/contact, transport-instance overrides, optional library mode).  
**Earlier plans:** [trip-planning.md](./trip-planning.md) (locked travel → route → transport model), [trip-day-ui-polish.md](./trip-day-ui-polish.md), [trip-day-card-icons-activity-accordion.md](./trip-day-card-icons-activity-accordion.md). This plan does not reopen those models.

**Status:** Plan only. After Matthew approves, implementation lands on **this same branch / PR**. Do not open a second implementation PR. Agents do not merge. The PR stays **draft** until he says otherwise.

**Out of scope:** Telegram and any other non-trip track. Stay or note Details accordions. A new `tp_step` table. Renaming MCP tools or REST paths. `tp_trip.status` (`draft` / `active` / `done` / `archived`) — that is the whole-trip lifecycle, not a day-card checkbox. Strikethrough, hiding done cards, or a “show done” filter. Dropping done costs out of the budget rollup. Cascading done from a parent to its children. A `done` flag on the location catalog (`tp_location`) or the transport library (`tp_transport_lib`) or on `tp_route`. Making `tp_transport.mode` nullable. Bulk edits to the live HK–JP trip. New npm packages. Realtime. New Vercel env vars.

---

## Goal

1. **Done** is a checkbox, default unchecked. It is stored on the day-card action (activity, stay, travel, and note), on each activity’s location **link**, on each travel’s transport **instance** link, and on each route **step**.
2. A **travel** day card has a **Details** accordion, closed by default, same idea as the activity Details from #21. Reading the journey does not open the editor.
3. When a travel has route options, each option is its own accordion inside Details. The trigger is a **summarised name** (route name, selected marker, endpoints, step count, price when one currency, times when set).
4. The travel data model stays **action → one or more routes → one or more steps**. Overall start and end live on the travel **action**. Each step already has price, start, end, duration, and its own start and end time. This pass evolves `tp_route` / `tp_transport` / `tp_action_transport`. It does not replace them.
5. **+ Route** and the other travel-editor mutations that reload the workspace disable the control and show pending copy until the reload finishes.

## Non-goals

- Accordions for stay or note. #21 left those open. This pass answers **travel** only.
- Editing locations, prices, or times from inside Details. Details is read-only except the done checkboxes.
- Selecting a route from Details. Selection stays the editor control. The summary line says which option is selected.
- A database constraint that rejects a route with zero steps. Existing rows and in-progress drafts may be empty. The UI says “No steps.”
- Copying historical `tp_action_transport` rows into steps. The editor already copies instance fields onto a step when a library means is linked. Leave old rows as they are.
- Changing the glance sentence (`tpActionDayCardSummary` stays).

---

## Current behaviour (develop after #21)

### No per-item done

Nothing in `tp_action`, `tp_action_location`, `tp_action_transport`, or `tp_transport` stores a checkbox. `tp_trip.status` includes the value `done`, and the board header can set the trip to `active` or `archived`. That flag is the trip, not a place, a ride, or a card. Todo cards have their own completed flag. Trip planning does not use it.

### Activity Details exists; travel does not

[`TripActivityActionDetails.tsx`](../../packages/web/components/tp/TripActivityActionDetails.tsx) is a closed-by-default disclosure labelled **Details**. It renders when the activity editor is closed. The pencil on an activity is writers + canonical rows only.

[`TripPlanningBoard.tsx`](../../packages/web/components/tp/TripPlanningBoard.tsx) does not mount that disclosure for travel. Travel, stay, and note still use the pencil to open the editor (viewers and mirror rows included). A viewer who opens travel sees one line: from → to. Journey price, linked transports, location hours, and route options are behind Edit.

The travel glance (built by [`tpActionDayCardSummary`](../../packages/model/src/tp/tpActionDayCardSummary.ts)) already shows title, from → to text, up to two library labels, the action time window or duration, the selected route **name**, and depart → arrive on the selected route. It does not list every route option.

### Routes are options; steps are `tp_transport` rows

Locked in [trip-planning.md](./trip-planning.md): a travel action has alternative **routes** (`tp_route`). Each route has ordered **transports** (`tp_transport`). One selected route: `tp_action.selected_route_id` is the source of truth (`tpRouteIsSelected`).

| Matthew’s word | Table today | What it already stores |
| --- | --- | --- |
| Travel activity | `tp_action` where `kind = travel` | Overall from/to text **and** `from_location_id` / `to_location_id`. Local `start_time` / `end_time`. Journey `duration_minutes` and `cost_*`. |
| Route | `tp_route` | `name` (not blank), notes, sort, selected flag. |
| Step | `tp_transport` | Price (`cost_amount`, `cost_currency`). Start/end text (`from_place`, `to_place`) and location ids (`from_location_id`, `to_location_id`, #20). Duration (`duration_minutes`, #20). Start/end instants (`depart_at`, `arrive_at`) plus IANA `depart_timezone` / `arrive_timezone`. Optional `transport_lib_id`. `mode` is still required (default `other`). |

**+ Travel** inserts the action, then route `Option A`, then selects it ([`addAction`](../../packages/web/components/tp/TripPlanningBoard.tsx)). It does not insert a step. A route may have zero legs. The editor labels those “No legs”.

### Two transport attachments, on purpose after #20 / #21

| Row | Attached to | Role |
| --- | --- | --- |
| `tp_transport_lib` | The trip | Reusable means. Label is the name (`bus 123`). **Mode is optional** (#21). Template duration, price, from/to locations. |
| `tp_action_transport` | The travel **action** | “This journey uses that means.” Instance overrides from #21: `duration_minutes`, `cost_amount`, `cost_currency`, `from_location_id`, `to_location_id`. No clock times. Not tied to a route. Unique on `(action_id, transport_lib_id)`. |
| `tp_transport` | One **route** | The scheduled step. Same instance-style fields, plus clock times, booking ref, notes, attachments. Optional pointer `transport_lib_id`. |

Linking a library row in [`TripTravelActionEditor.tsx`](../../packages/web/components/tp/TripTravelActionEditor.tsx) writes **both**: a `tp_action_transport` row, and a new `tp_transport` on the selected route (or the first route) copying mode, duration, price, and location ids. They are siblings. There is no foreign key from the step to the action-link. Unlinking the action row does not delete the step.

The step editor saves mode, place text, depart/arrive, price, booking ref, and notes. It does **not** save `duration_minutes` or `from_location_id` / `to_location_id` even though those columns exist and the agent create path can set them. Location hours, website, email, and phone live on `tp_location` and already show in activity Details. They are not repeated on the travel card.

Route options inside the **editor** already use [`TripTpCollapsible`](../../packages/web/components/tp/TripTpCollapsible.tsx). The trigger is `` `${name} (selected) · N legs` ``. That collapsible has its own border and is easy to miss because it sits under the journey form. The day card has no route accordion at all.

`tp_route.notes` is stored and accepted by `update_tp_route`. The workspace mapper drops it (`DbTpRoute` has no `notes`). This pass does not need route notes for the summary.

### + Route looks dead because the button never goes pending

[`addRoute`](../../packages/web/components/tp/TripTravelActionEditor.tsx) inserts a route, selects it when it is the first, then calls `onSaved`. [`onEditorSaved`](../../packages/web/components/tp/TripPlanningBoard.tsx) starts `reload()` and does not return the promise (`onSaved: () => void`). The **+ Route** button stays enabled with the same label for the whole insert and the workspace reload. The same pattern is used for adding a leg, picking a route, deleting a route, linking a library means, and saving the journey. A second click can stack another insert before the first reload paints.

---

## Desired behaviour

### Done checkboxes

Unchecked means not done. Existing rows stay unchecked (`default false`). Toggling writes immediately. It does not wait for **Save journey** or the activity Save button.

| Checkbox | Column | Where it shows |
| --- | --- | --- |
| Day card | `tp_action.done` | Header of every activity, stay, travel, and note card, canonical and mirror. Same row, so a mirror shows the same value. |
| Place on an activity | `tp_action_location.done` | Next to each linked location in activity Details, and on the matching row in the activity editor. |
| Means on a travel | `tp_action_transport.done` | Next to each linked transport in travel Details, and on the matching “Linked transports” row in the travel editor. |
| Step | `tp_transport.done` | Next to each step inside that route’s accordion in travel Details, and on the step in the travel editor. |

The reusable **catalog** does not get a checkbox. `tp_location` and `tp_transport_lib` stay shared templates. Ticking a place on Monday’s shopping activity leaves the same place on another activity unchecked. Ticking “bus 123” on one travel leaves the library row and every other use unchecked.

**No cascade.** Ticking the activity does not tick its location links. Ticking every location link does not tick the activity. Ticking a transport instance link does not tick the step that was copied from the same library row, and the reverse is also false. They are separate rows.

**Who can toggle**

- Writers (`canWriteTpPod`): enabled on canonical and mirror cards. A mirror toggle updates the one underlying row.
- Viewers: the control is visible and disabled, so the state can still be read.

Checked cards stay in the list, in the same order, with the same glance sentence. Budget rollup still counts their costs. `tp_trip.status` is unchanged.

While a toggle request is in flight the checkbox is disabled and `aria-busy`. A failed write leaves the previous value and uses the board error alert.

### Travel Details accordion

One disclosure per travel card (canonical and mirror), **closed by default**. Several travels may be open at once. That state is local to the card. It is not `expandedActionId`.

Copy the activity pattern: trigger label **Details**, `+` / `−`, `aria-expanded`, `aria-controls`. Sit it inside the card under the header. Do not wrap it in `TripTpCollapsible` (that draws a second border).

| State | What the card shows |
| --- | --- |
| Glance | Same summary sentence as today. Action done checkbox in the header. |
| Details open, editor closed | Read-only body below, plus the nested done checkboxes. |
| Editor open | Existing `TripTravelActionEditor`. Details is not rendered, so the card does not show two bodies. Closing the editor returns to glance + a closed Details. |
| **+ Travel** | Still opens the editor immediately. Details stays closed. |

**Pencil.** Match activity now that travel has a read body: pencil only when `canWrite` and the row is **canonical**. Viewers and mirror rows read Details. Stay and note pencils stay as they are in #21 (viewers and mirrors included).

**Read-only body** (omit a row when the value is empty):

- Journey from → to. Prefer the linked location **name** (`from_location_id` / `to_location_id`). Fall back to `from_place` / `to_place`. When the location row has an address, hours (`open_time`–`close_time`), website, email, or phone, show those under that endpoint the same way activity Details shows a linked location. Map link when `maps_url` or the action’s from/to maps URL is set (`target="_blank"`, `rel="noopener noreferrer"`).
- Action time window: `start_time`–`end_time` (HH:MM). One side only if the other is empty.
- Duration in minutes, when set.
- Journey price and currency on one line (the action’s `cost_*`, not the sum of steps).
- Linked transports in `sort_order`: done checkbox, library label, instance duration, instance price, from → to location names. Omit a field the instance and the library both leave empty. Instance values win (`duration_minutes` on the link, else the library), matching the editor’s effective-* helpers.
- Travel `notes`, `whiteSpace="pre-wrap"`.
- Then the route accordions (next section).
- If the journey fields and the route list are all empty: muted “No extra details.” A travel that only has routes still shows those accordions.

Do not repeat the title. No Save button in Details.

### Route option accordions

Inside travel Details, **one accordion per `tp_route`** of that action, ordered by `sort_order` then id. Closed by default, including the selected route. Several route accordions on the same card may be open. Opening a route accordion does not select it and does not open the editor.

The trigger is the summary string from `tpRouteOptionSummary` (pure helper, no I/O). Join the parts that exist with ` · `:

| Part | Rule |
| --- | --- |
| Name | `tp_route.name`. Always present (column is not blank). |
| Selected | The word `selected` when `tpRouteIsSelected` is true for this route. |
| Endpoints | First step’s start label, `→`, last step’s end label, in `sort_order`. A label is the location **name** when `from_location_id` / `to_location_id` resolves, otherwise `from_place` / `to_place`. Skip this part when either side is missing. |
| Count | `No steps`, `1 step`, or `N steps`. |
| Price | Sum of step `cost_amount` when **every** priced step shares one `cost_currency` and at least one step has a price. Steps with no price are skipped in the sum. Mixed currencies: omit the price (no FX). Format: currency code, then the sum. |
| Times | First step `depart_at` → last step `arrive_at`, via existing `formatTpInstant` and each step’s timezone (fallback `UTC`, same as the glance). Omit when either instant is missing. |

Example trigger: `Option A · selected · HK Airport → Shinjuku · 2 steps · HKD 180 · 14:00 HKT → 18:30 JST`.

**Route body:** ordered steps. Each step line: done checkbox, means label when `transport_lib_id` resolves else the mode, start → end (same label rule), duration minutes when set, price when set, local start time → local end time when the instants are set. Empty route: muted “No steps.”

The editor keeps its route collapsibles. Point their titles at the same helper so the editor and Details do not invent two names. Editor controls (select, delete route, add step, step form, attachments) stay in the editor.

### Step fields in the editor

A step **is** a `tp_transport` row. The editor should save the fields Matthew named, using columns that already exist:

| Asked for | Column | Editor |
| --- | --- | --- |
| Price | `cost_amount`, `cost_currency` | Already saved. |
| Start | `from_location_id`, with `from_place` when there is no catalog pick | Place text is saved today. Add a location select and persist `from_location_id`. |
| End | `to_location_id`, with `to_place` | Same. |
| Duration | `duration_minutes` | Column exists. Add the input and include it in `updateDbTpTransport` / the agent update. |
| Start time | `depart_at` + `depart_timezone` | Already edited as local date + time + IANA zone. |
| End time | `arrive_at` + `arrive_timezone` | Same. |

Overall travel start and end stay on the **action**: `from_location_id` / `to_location_id` (text fallbacks `from_place` / `to_place`) and `start_time` / `end_time`. Do not add a second pair of `time` columns on the step. Step times stay timestamptz because a leg can cross midnight and zones (trip-planning decision 9). The action window stays `time` without time zone, local on the anchor day.

`tp_transport.mode` stays required. When the step was spawned from the library, the summary prefers the library **label** over the mode enum. Library `mode` stays optional.

Do not enforce “at least one step” in SQL or by auto-inserting a blank step on **+ Route** / **+ Travel**. An extra insert would make the slow button slower, and a check constraint would reject routes that already exist. Draft routes with zero steps remain valid. The read model still describes the intended shape as one or more routes and, once the traveller has filled the option in, one or more steps.

### Loading and disabled state

The control that started the mutation shows pending copy and is disabled until the workspace reload finishes. Other mutation buttons in that travel editor are disabled for the same interval so a double-click cannot insert a second route.

| Control | Pending label |
| --- | --- |
| **+ Route** | `Adding route…` |
| Add step (today’s add-leg button) | `Adding step…` |
| Select route | `Selecting…` |
| Delete route | `Deleting route…` |
| Add from library | `Linking transport…` |
| Save journey | `Saving…` |
| Done checkbox | Disabled, `aria-busy`, label unchanged |

Implementation notes:

- Change the travel editor’s `onSaved` to `() => Promise<void>`. The board passes a function that **returns** `reload()`. `addRoute` awaits the insert, awaits `onSaved()`, and clears pending in `finally`.
- Set pending **before** the first await. Clear it on success and on error. Errors still go to `onError`.
- Disabled is not the only cue. The label changes to the pending string (or `aria-busy` plus the visible checkbox state for done).
- Do not add a board-wide overlay. Catalog saves, destination saves, and reorder stay as they are.

---

## Data model

No new table. No drop. No backfill of `done = true`.

```sql
-- Sketch only. Implementation creates the file with `supabase migration new`.
-- Suggested name: trip_done_flags
-- Timestamp must sort after 20261023210000_trip_location_contact_action_transport_instance.sql.

alter table public.tp_action
  add column if not exists done boolean not null default false;

alter table public.tp_action_location
  add column if not exists done boolean not null default false;

alter table public.tp_action_transport
  add column if not exists done boolean not null default false;

alter table public.tp_transport
  add column if not exists done boolean not null default false;
```

RLS policies on these tables already allow the pod writer to update the row and the reader to select it. `done` is not an authorization column. Do not add policies, grants, indexes, or an `updated_at` trigger. `tp_action` and `tp_transport` already have `moddatetime`. `tp_action_location` and `tp_action_transport` have no `updated_at`; leave that alone.

`get_tp_workspace` adds boolean `done` on `actions`, `actionLocations`, `actionTransports`, and `transports`. Camel case, same as `durationMinutes`. Absent in old clients is not a concern: the column is `not null`, so the API always sends `true` or `false`.

### How the three transport rows relate (do not merge them)

```
tp_transport_lib          reusable means (trip catalog, mode optional)
        │
        ├─ tp_action_transport     instance on the travel action
        │     duration, price, from/to location, done
        │     no clock times, no route
        │
        └─ tp_transport            step on one route
              duration, price, from/to location, done
              depart_at / arrive_at + IANA zones
              optional transport_lib_id
              parent: tp_route → tp_action (kind = travel)
```

Overall A→Z and the journey clock window stay on `tp_action`. A step’s start and end are that leg only. The single-segment sync already in the editor (one step on the selected route copies from/to **text** onto the step when the journey is saved) stays. Do not extend that sync to overwrite `done`.

Activity places stay `tp_action_location` → `tp_location`. Travel endpoints do not become action-location rows. Location contact fields from #21 stay on `tp_location` and surface in travel Details for the journey endpoints.

---

## MCP and REST

Same agent handlers for MCP tools and REST routes. Schemas in [`packages/model/src/tp/tpAgentSchemas.ts`](../../packages/model/src/tp/tpAgentSchemas.ts). Tool list in [`packages/web/lib/api/mcp/mcpCatalogByFeature.ts`](../../packages/web/lib/api/mcp/mcpCatalogByFeature.ts). REST dispatch in [`packages/web/lib/api/agent/dispatchAgentRestMore.ts`](../../packages/web/lib/api/agent/dispatchAgentRestMore.ts).

Patch semantics match the other trip fields: omit `done` to leave it, send `true` or `false` to set it. Create omits to `false`.

| Area | MCP | REST | Change |
| --- | --- | --- | --- |
| Action | `create_tp_action`, `update_tp_action` | `POST/PATCH …/trip/actions` | Optional `done`. Workspace `actions[].done`. |
| Place link | `link_tp_action_location` optional `done`. **`update_tp_action_location`** (new) | `POST …/trip/action-locations`. **`PATCH …/trip/action-locations/{linkId}`** (new; this path is DELETE only today) | `{podId, linkId, done?, sortOrder?}`. Workspace `actionLocations[].done`. |
| Transport instance | `link_tp_action_transport`, `update_tp_action_transport` | `POST/PATCH …/trip/action-transports` | Optional `done`. Workspace `actionTransports[].done`. |
| Step | `create_tp_transport`, `update_tp_transport` | `POST/PATCH …/trip/transports` | Optional `done`. Also document and accept the step fields that already exist and are easy to miss: `durationMinutes`, `fromLocationId`, `toLocationId`. Workspace `transports[].done`. |

Do not add `done` to `create_tp_location`, `update_tp_location`, `create_tp_transport_lib`, or `update_tp_transport_lib`.

`create_tp_transport` / `update_tp_transport` descriptions should call the row a **step** (transport leg on a route). Keep the tool names. `create_tp_route` stays “route option”.

No new permission resource. All of these rows are the existing `trip` grant.

Browser writes use the same columns: `updateDbTpAction` patch, a small `updateDbTpActionLocation` (the link has no update helper today), `updateDbTpActionTransport`, and `updateDbTpTransport`.

---

## Touch points

| File | Change |
| --- | --- |
| `supabase/migrations/<new>_trip_done_flags.sql` | Four `done` columns. Create the file with `supabase migration new trip_done_flags` when implementing. |
| [`packages/web/lib/supabase/database.ts`](../../packages/web/lib/supabase/database.ts) | `done: boolean` on the four tables’ Row types; optional on Insert/Update where those objects are explicit. |
| [`packages/web/lib/api/db/tp/loadDbTpWorkspace.ts`](../../packages/web/lib/api/db/tp/loadDbTpWorkspace.ts) | Map `done` on actions, action locations, action transports, transports. |
| [`packages/model/src/tp/tpAgentSchemas.ts`](../../packages/model/src/tp/tpAgentSchemas.ts) | `done` on the create/update objects above. New `UpdateActionLocationSchema`. |
| [`packages/model/src/tp/tpRouteOptionSummary.ts`](../../packages/model/src/tp/tpRouteOptionSummary.ts) | **New.** Default export. Summary trigger string. |
| [`packages/model/src/tp/tpRouteOptionSummary.test.ts`](../../packages/model/src/tp/tpRouteOptionSummary.test.ts) | Cases below. |
| [`packages/model/src/tp/index.ts`](../../packages/model/src/tp/index.ts) | Re-export the helper (`export {default as …}`). |
| [`packages/web/lib/api/mcp/mcpCatalogByFeature.ts`](../../packages/web/lib/api/mcp/mcpCatalogByFeature.ts) | `done` properties. New `update_tp_action_location`. Step tool blurbs say “step”. |
| [`packages/web/lib/api/agent/dispatchAgentRestMore.ts`](../../packages/web/lib/api/agent/dispatchAgentRestMore.ts) | `PATCH` on `action-locations/{linkId}`. |
| `packages/web/lib/api/agent/tpAgentActionLocations.ts` | Update handler next to link/unlink. |
| `packages/web/lib/api/db/tp/updateDbTpActionLocation.ts` | **New.** Browser patch for `done` (and sort, if the editor already changes sort on this table). |
| Existing action / action-transport / transport update helpers and agent handlers | Accept `done`. Transport update also persists `durationMinutes` and location ids. |
| [`packages/web/components/tp/TripPlanningBoard.tsx`](../../packages/web/components/tp/TripPlanningBoard.tsx) | Header checkbox. Travel Details when the editor is closed. Travel pencil limited to writers on canonical rows. `onEditorSaved` returns `reload()`. |
| `packages/web/components/tp/TripTravelActionDetails.tsx` | **New.** Default export. Owns open state (default closed) and nested route accordions. |
| [`packages/web/components/tp/TripActivityActionDetails.tsx`](../../packages/web/components/tp/TripActivityActionDetails.tsx) | Done checkbox on each location link. |
| [`packages/web/components/tp/TripActivityActionEditor.tsx`](../../packages/web/components/tp/TripActivityActionEditor.tsx) | Same checkbox on each linked location row. |
| [`packages/web/components/tp/TripTravelActionEditor.tsx`](../../packages/web/components/tp/TripTravelActionEditor.tsx) | Pending labels. Step form gains duration and location selects. Route trigger uses `tpRouteOptionSummary`. Done on transport links and steps. Button copy for a new leg: **+ Step**. |
| [`packages/web/components/tp/TripStayActionEditor.tsx`](../../packages/web/components/tp/TripStayActionEditor.tsx) and the note editor | No Details work. Header checkbox is enough. |

Application files: `export default function`. No new `index.ts` barrels under `packages/web`. No new dependency. No application tests.

`TripPlanningBoard` is already past the preferred file size. Put Details and the route list in `TripTravelActionDetails`. A tiny presentational done checkbox used by the board and the details components is fine if it keeps the board from growing a third inline control. Do not split unrelated board sections in the same change.

### Tests (`@so/model` only)

| Helper | Cases |
| --- | --- |
| `tpRouteOptionSummary` | Name only when there are no steps and the route is not selected: `Option A · No steps`. Selected route adds `selected`. Two steps with location names: `Option A · selected · HK Airport → Shinjuku · 2 steps`. One step uses `1 step`. Price sums when currency matches, ignores steps with no price, and is omitted when currencies differ. Depart and arrive format through the same instant helper the glance uses; missing either instant omits the time part. Missing location id falls back to place text. |

No test for the boolean column itself. Workspace mapping is application glue.

---

## Accessibility

- The action checkbox’s accessible name includes kind and title: `Mark activity Shopping done`, and `Mark activity Shopping not done` when it is already checked. Same pattern for stay, travel, and note.
- Nested checkboxes name the row: `Mark location TeamLab done`, `Mark transport bus 123 done`, `Mark step HK Airport → Shinjuku done`.
- Disabled viewer checkboxes stay in the accessibility tree with the current checked state.
- Details and each route accordion are buttons with `aria-expanded` and `aria-controls`.
- Pending **+ Route** exposes `Adding route…` as its accessible name (the visible label), and `aria-busy="true"`.
- Map and website links are anchors with an href.

---

## Implementation order (this branch, after approval)

1. Migration (`supabase migration new trip_done_flags`) and `database.ts` types.
2. Workspace mapping and browser/agent patches, including `update_tp_action_location` and REST `PATCH`. MCP catalog + valibot schemas. `done` on create/update for action, action-location, action-transport, and transport.
3. `tpRouteOptionSummary` and unit tests.
4. Day-card checkbox (all four kinds) and activity location checkboxes in Details and the activity editor.
5. `TripTravelActionDetails`: journey fields, linked transports, nested route accordions. Hide it while the travel editor is open. Restrict the travel pencil.
6. Travel editor: step duration and location fields, shared summary titles, **+ Step** label, done checkboxes, pending labels with `onSaved` awaited through reload.
7. QA below. No Telegram.

Production applies the migration only through the **Production** GitHub Actions `db push`. Do not apply it from a laptop. No new Vercel env vars. Local: `supabase db reset`.

---

## QA checklist

Use the web day view. The live HK–JP trip is fine to **look at**. Do not delete filled-in rows while checking. Create a throwaway travel on a scratch day if a write is needed, and delete only that row.

- [ ] Every activity, stay, travel, and note card shows a done checkbox. A new card is unchecked. Reloading keeps the value. A mirror shows the same value as the canonical card.
- [ ] A writer can check and uncheck. A viewer sees the checkbox disabled and cannot change it. A failed save restores the previous check and shows the board error.
- [ ] Checking an activity does not check its location links. Checking a location link does not check the activity or the same location on another activity. The Locations catalog has no done control.
- [ ] Checking a linked transport does not check the route step that shares its library id, and does not check the transport library row.
- [ ] `tp_trip.status` still changes only from the header actions that exist today. Marking a card done does not set the trip status to `done`.
- [ ] Budget figures still include costs on done actions and done steps.
- [ ] Travel **Details** is closed on first paint. Opening it does not show the journey form. It shows endpoints (location name, address, hours, website, email, phone when set), the action time window, duration, journey price, notes, and linked transports.
- [ ] Two route options render as two accordions, both closed. Each trigger is the summary (name, `selected` on the chosen one, endpoints, step count). Opening one does not select it and does not open the editor.
- [ ] A route with no steps shows `No steps` on the trigger and “No steps.” in the body. A one-step route says `1 step`.
- [ ] Mixed step currencies omit the summed price. A single currency shows the sum of priced steps only.
- [ ] Step done toggles from Details and from the editor, and both paths agree after reload.
- [ ] Pencil on a canonical travel still opens the editor, and Details is hidden while it is open. A viewer has no travel pencil and can still open Details. Stay and note pencils behave as they do today.
- [ ] **+ Route** switches to `Adding route…`, disables, and ignores a second click until the new option appears. The same pending treatment applies to add step, select, delete route, link library, and save journey.
- [ ] Saving a step persists duration and from/to locations. Start and end times still use the existing timezone fields. The action’s from/to and start/end time are unchanged by a step save.
- [ ] Agent: `update_tp_action` with `done: true`, `update_tp_action_location`, `update_tp_action_transport` with `done`, and `update_tp_transport` with `done` plus `durationMinutes`. `get_tp_workspace` returns the booleans. REST `PATCH` matches each tool.
- [ ] Activity Details, icon edit/delete, catalogs, and destination accordions behave as they do after #21.
- [ ] Narrow viewport: the checkbox and the icon row do not cover the title.

---

## Decisions locked by this plan

| Topic | Decision |
| --- | --- |
| Action checkbox | `tp_action.done` on activity, stay, travel, and note. Header. Canonical and mirror share the row. |
| Place checkbox | `tp_action_location.done`. Per activity link. |
| Means checkbox | `tp_action_transport.done`. The #21 instance link. |
| Step checkbox | `tp_transport.done`. |
| Catalog | No `done` on `tp_location` or `tp_transport_lib`. |
| Route option | No `done` on `tp_route`. Selected stays `selected_route_id`. |
| Cascade | None. Parent, link, and step are independent. |
| Default | Unchecked. `not null default false`. Existing rows stay unchecked. |
| Trip status | Untouched. Card `done` is not `TpTripStatus.DONE`. |
| Budget | Done rows still count. |
| Glance | `tpActionDayCardSummary` unchanged. No strikethrough and no filter. |
| Travel Details | Closed by default. Hidden while the editor is open. Read-only except done checkboxes. |
| Travel pencil | Writers, canonical rows only. |
| Stay / note pencil | Unchanged from #21. No Details accordion. |
| Route UI | One closed accordion per route inside travel Details. Trigger from `tpRouteOptionSummary`. |
| Step identity | A step is `tp_transport`. No `tp_step` table. MCP tool names stay. |
| Step times | Existing `depart_at` / `arrive_at` plus IANA zones. Overall window stays on the action. |
| Empty routes | Allowed. No check constraint and no auto blank step. |
| Transport rows | Library, action instance, and route step stay three tables. |
| Slow mutations | Pending label and disabled until `reload()` resolves. **+ Route** is the reported case; the travel editor’s other saves use the same treatment. |
| Where the code lands | **This** branch, after approval. Agents do not merge. |

## Confirm or override

Defaults above are what implementation will follow if Matthew does not comment.

1. **Location done vs activity done.** The checkbox on a place is the **link** (`tp_action_location`), independent of `tp_action.done` and of every other link to that `tp_location`. Say if the reusable location row itself should be markable done, or if ticking the activity should tick its places.
2. **Transport instance vs step.** `tp_action_transport.done` and the `tp_transport` row copied from the same library entry are independent. Say if one checkbox should speak for both.
3. **Note cards.** They get `tp_action.done` because the column is on every action. Say if a note should not show the checkbox. Stay is included on purpose: it is a day card with the same header.
