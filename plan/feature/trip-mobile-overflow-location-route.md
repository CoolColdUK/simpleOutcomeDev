# Mobile overflow, location country, route-owned travel fields

A phone day view should not scroll sideways when a tag, a destination note, or a station line is long. A travel’s start and end should be catalog **locations**. A location can name its **country**. The price, currency, duration, and linked means of a journey option should live on that **route**, and the option’s mode should be the linked transport’s mode. Depart and arrive should use the same timestamp fields the stay editor already uses.

**Repo:** [CoolColdUK/simpleOutcomeDev](https://github.com/CoolColdUK/simpleOutcomeDev)  
**Base:** `develop` after [#19](https://github.com/CoolColdUK/simpleOutcomeDev/pull/19) (glance, selected route), [#20](https://github.com/CoolColdUK/simpleOutcomeDev/pull/20) (`tp_location`, `tp_transport_lib`, `from_location_id` / `to_location_id`), [#21](https://github.com/CoolColdUK/simpleOutcomeDev/pull/21) (activity Details, tag chips, location contact, transport-instance overrides, optional library mode), and [#22](https://github.com/CoolColdUK/simpleOutcomeDev/pull/22) (done flags, travel Details, route accordions, step duration and locations).  
**Earlier plans:** [trip-planning.md](./trip-planning.md) (locked travel → route → step model and zoned instants), [trip-day-ui-polish.md](./trip-day-ui-polish.md), [trip-day-card-icons-activity-accordion.md](./trip-day-card-icons-activity-accordion.md), [trip-done-travel-routes.md](./trip-done-travel-routes.md). This plan evolves those tables. It does not replace them.

**Status:** Plan only. Not implemented. Agents do not merge. After Matthew approves, implement on **this same branch**.

**Screenshot (Matthew, 2026-10-24):** phone day view, status bar `07:07`. Long text leaves a narrow left column and paints across the rest of the screen. Visible pieces include a clipped chip like `nts 5F/6F/1F; MUJI 3F`, left-cut destination lines (`kihabara`, `(akodon)`, `abu-shabu`, `onigiri`, `22:00`), and an unwrapped note `Akihabara Stn. International parcels. Sat main counter 09:00–17:00; weekend`. Those strings are the acceptance examples for the layout fix.

**Out of scope:** Telegram. A `tags` column or rewriting tag parsing. Dropping `from_place` / `to_place`, `tp_action.cost_*`, `tp_action_transport`, or `tp_transport.mode`. A new currency or country lookup table. Renaming MCP tools or REST paths. Realtime. New Vercel env vars. New npm packages (no date-picker library). Bulk hand-edits of the live HK–JP trip beyond the conservative copy in the migration. Stay or note Details. `tp_destination.country` (country is on the location). `tp_route.notes` still being dropped by the workspace mapper (unchanged; #22 left it). Making `tp_transport.mode` nullable.

---

## Goal

1. **Mobile overflow.** Tags and long text wrap inside the day card, the destination accordion, and Details. The phone viewport does not grow sideways. Touch [`TripDayCardTags`](../../packages/web/components/tp/TripDayCardTags.tsx) and the related card, accordion, and Details text.
2. **Travel from / to are locations.** The travel action’s start and end use `tp_location` through the existing `from_location_id` / `to_location_id`. The editor’s primary control is that catalog select. Free-text place fields stay in the database as a fallback for rows that have no location yet.
3. **Location country.** `tp_location.country` is optional text. Catalog UI, activity and travel Details, workspace, MCP, and REST all read and write it.
4. **Route owns price, currency, duration, and the linked means.** Those fields sit on `tp_route` (the route option). They are not only on the travel action, and they are not only scattered across `tp_action_transport` and steps. Steps keep their clock times. See [open questions](#open-questions) for whether a step still has its own price.
5. **Route mode is the transport.** Do not add a mode column on `tp_route`. The option’s mode is `tp_transport_lib.mode` via the route’s linked means. A step that points at a library row shows that mode and does not offer a second mode control.
6. **Depart / arrive use the stay timestamp fields.** One shared component, the same date + time + IANA zone group the stay editor already uses, backed by `tpInstantFromParts`. Storage stays `timestamptz` plus timezone text.

## Non-goals

- Replacing the travel → route → step model with a new table.
- A required country, or parsing country out of `address`.
- Deleting legacy action price or `tp_action_transport` rows. Old clients keep their tools. The web editor stops treating those rows as the place you set the option’s price.
- Copying one action price onto every route of a multi-option travel (that would multiply the budget).
- Turning activity `start_time` / `end_time` or location open/close into full timestamps. Those stay `time` on the anchor day or the catalog.
- Using the todo `datetime-local` input for depart/arrive. That control has no IANA zone. Trip instants stay zoned ([trip-planning.md](./trip-planning.md) decision 9).

---

## Current behaviour (develop after #22)

### Long text widens the phone

Day cards are inline in [`TripPlanningBoard.tsx`](../../packages/web/components/tp/TripPlanningBoard.tsx). The card `Box` has a border and padding and no `minW={0}` or `maxW`. The header is an `HStack` (a row that does not wrap) of the done checkbox, kind badge, and a `Stack` of title, glance sentence, and [`TripDayCardTags`](../../packages/web/components/tp/TripDayCardTags.tsx). That text stack has no `minW={0}` and no `flex="1"`. In a row, the default minimum size is the content’s minimum, so a long unwrapped child widens the card past the viewport. The card does not clip, so the text paints outside the column. That matches the screenshot: a sentence with spaces still runs in one line across the white area, which happens when the box is as wide as the text rather than as wide as the phone.

[`TripDayCardTags`](../../packages/web/components/tp/TripDayCardTags.tsx) puts each tag in a `Badge` inside an `HStack` with `wrap="wrap"`. Wrapping applies between badges. A single long badge (the `5F/6F/1F; MUJI 3F` style chip) stays one line. Glance passes `max={4}`, which caps how many chips show, not how wide one chip is. Tags are still parsed from location `Tags:` lines by [`tpTagsFromLocationNotes`](../../packages/model/src/tp/tpTagsFromLocationNotes.ts). There is no tags column.

[`TripTpCollapsible`](../../packages/web/components/tp/TripTpCollapsible.tsx) puts the title in a `Button` with `width="full"` and `overflow="hidden"` on the box. The button label is one line. A long title (`Important info · …`, `Destinations (trip)`, a route summary) either stretches the box or gets clipped. Destination **Important info** and the **Destinations (trip)** body use `whiteSpace="pre-wrap"` ([`TripPlanningBoard.tsx`](../../packages/web/components/tp/TripPlanningBoard.tsx)). `pre-wrap` wraps at the container width. If an ancestor is sized by the text, there is no narrower width to wrap at. The Akihabara station line is this kind of note (location notes or destination important info).

The same pattern is in [`TripActivityActionDetails.tsx`](../../packages/web/components/tp/TripActivityActionDetails.tsx) (address, website, notes, tag chips) and [`TripTravelActionDetails.tsx`](../../packages/web/components/tp/TripTravelActionDetails.tsx) (endpoint name, the route-summary button, notes). Travel editor rows use `HStack` with `minW="12rem"` or `minW="10rem"` ([`TripTravelActionEditor.tsx`](../../packages/web/components/tp/TripTravelActionEditor.tsx)). Some wrap, some do not (step from/to, cost, depart/arrive).

The day-tab strip (`overflowX="auto"`) is a separate, intentional scroller. Leave it.

### Travel from / to are still mostly free text

`tp_action` for `kind = travel` stores both:

| Column | Role today |
| --- | --- |
| `from_place`, `to_place` | Free text. The editor labels them **Journey from** / **Journey to** and they are the first fields. |
| `from_location_id`, `to_location_id` | Optional selects onto `tp_location` (#20). |
| `from_destination_id`, `to_destination_id` | Trip region, not a place. |
| `from_maps_url`, `to_maps_url` | Action-level map links. The location row has its own `maps_url`. |

[`TripTravelActionDetails`](../../packages/web/components/tp/TripTravelActionDetails.tsx) and [`tpActionDayCardSummary`](../../packages/model/src/tp/tpActionDayCardSummary.ts) already prefer the location **name** and fall back to the place text. The editor still asks for the text first and the location second. Steps (`tp_transport`) have the same pair: text inputs **and** location selects (#22). MCP and REST already accept `fromLocationId` / `toLocationId` on `create_tp_action` / `update_tp_action` and on `create_tp_transport` / `update_tp_transport`.

A destination is the region on the day strip (`tp_destination`). A location is the reusable place (`tp_location`). This plan does not merge those.

### Locations have no country

[`tp_location`](../../supabase/migrations/20261023190000_trip_locations_transports.sql) has `name`, `address`, `maps_url`, `notes`, and since #21 `open_time`, `close_time`, `website`, `email`, `phone`. No country. The catalog form is [`TripTripCatalogPanel.tsx`](../../packages/web/components/tp/TripTripCatalogPanel.tsx) `LocationRow`. Workspace type `DbTpLocation` has no `country`. `create_tp_location` / `update_tp_location` and `POST/PATCH /api/pods/{podId}/trip/locations` do not take one.

### Price, duration, and the linked means are not on the route

Locked shape from [trip-planning.md](./trip-planning.md) and [#20](https://github.com/CoolColdUK/simpleOutcomeDev/pull/20)–[#22](https://github.com/CoolColdUK/simpleOutcomeDev/pull/22): a travel action has alternative **routes** (`tp_route`). Each route has ordered **steps** (`tp_transport`). The library (`tp_transport_lib`) is the reusable means. `tp_action_transport` says “this journey uses that means” and holds #21 instance overrides. One selected route: `tp_action.selected_route_id`.

| Matthew’s word | Table | What it stores today |
| --- | --- | --- |
| Travel activity | `tp_action` (`kind = travel`) | Journey `cost_amount` / `cost_currency`, `duration_minutes`, from/to text **and** location ids, local `start_time` / `end_time`. |
| Route option | `tp_route` | `name`, `notes`, `sort_order`, selected flag. **No** price, currency, duration, or transport. Workspace `DbTpRoute` is only id, action, name, selected, sort (notes are stored and not mapped). |
| Linked means on the journey | `tp_action_transport` | Points at `tp_transport_lib`. Instance `duration_minutes`, `cost_*`, `from_location_id`, `to_location_id`, `done`. Not tied to a route. Unique on `(action_id, transport_lib_id)`. |
| Step | `tp_transport` | Own `cost_*`, `duration_minutes`, `mode` (required), from/to text and location ids, `depart_at` / `arrive_at` plus IANA zones, optional `transport_lib_id`, booking ref, notes. |
| Means catalog | `tp_transport_lib` | Label (the name, e.g. `bus 123`). Optional `mode` (#21). Template duration, price, from/to locations. |

[`tpBudgetRollup`](../../packages/model/src/tp/tpBudgetRollup.ts): for a travel, if the **action** has `costAmount`, that number is the whole journey and step costs are ignored. If the action cost is empty, the rollup sums step costs on the **selected** route only. Route rows contribute nothing, because they have no cost. `tp_action_transport.cost_amount` is not in the rollup.

Linking a library row in the travel editor writes **two** rows ([`linkTransportLib`](../../packages/web/components/tp/TripTravelActionEditor.tsx)): a `tp_action_transport`, and a new step on the selected route (or the first route) copying mode, duration, price, and location ids. They are siblings. Unlinking the action row does not delete the step. #22 documented that on purpose. This plan stops adding new siblings for price and duration. It does not delete old ones.

[`tpRouteOptionSummary`](../../packages/model/src/tp/tpRouteOptionSummary.ts) builds the accordion trigger from the route name, `selected`, step endpoints, step count, a single-currency **sum of step prices**, and first depart → last arrive. It cannot show a route-level price, because that column does not exist.

### Mode is on the step and on the library, not on the route

`tp_route` has no `mode`. `tp_transport.mode` is required (`flight`, `train`, `coach`, `bus`, `car`, `ferry`, `walk`, `other`, default `other`). `tp_transport_lib.mode` is optional. The step form shows a mode `<NativeSelect>` even when the step has `transport_lib_id`. Linking copies `lib.mode ?? 'other'` onto the new step, after which the two can diverge. The route summary does not show a mode.

### Depart / arrive are ad-hoc inputs

There is no shared datetime widget in `@so/component` or under `packages/web/components`. The trip standard for a zoned instant is the stay editor ([`TripStayActionEditor.tsx`](../../packages/web/components/tp/TripStayActionEditor.tsx)):

- `Input type="date"`
- `Input type="time"`
- IANA timezone text
- [`tpInstantFromParts`](../../packages/web/lib/tp/tpDateTimeParts.ts) / `tpPartsFromInstant` (`dayjs` timezone)

Those three values become `check_in_at` + `check_in_timezone` (and check-out). The travel step form repeats the same three inputs inline for **Depart** and **Arrive** (`depart_at`, `depart_timezone`, `arrive_at`, `arrive_timezone`) without sharing the stay markup. MCP already takes `departLocalTime` + `departTimezone` and the arrive pair. Todo’s `datetime-local` is a different control and is not this standard.

Activity `start_time` / `end_time` and location `open_time` / `close_time` are `time` without a date. They are not the depart/arrive case.

---

## Desired behaviour

### 1. Wrap long text on a phone

CSS and layout only. No migration. No change to `tpTagsFromLocationNotes`.

The trip board column and each day card are at most the width of the viewport. Inner text stacks can shrink (`minW={0}`, `flex="1"` on the title stack, `maxW="100%"` on the card). After those constraints, `pre-wrap` notes wrap. Add `overflowWrap="anywhere"` on prose so a token with no spaces (a URL, a gate code) also breaks. Notes keep their line breaks.

| Surface | Rule |
| --- | --- |
| Tag chip | Badge may wrap: `whiteSpace="normal"`, `maxW="100%"`, `overflowWrap="anywhere"`. The row still wraps between chips. Glance `max={4}` stays. Do not ellipsis a tag; the label has to be readable. |
| Glance sentence | Wrap. If it would run past three lines, clamp to three (`lineClamp={3}`). The full text stays in Details. |
| Activity Details, travel Details | Wrap address, website, email, notes, endpoint names. No line clamp. The Akihabara sentence is fully visible, on more than one line. |
| Destination **Important info** and **Destinations (trip)** | Same wrap. No line clamp in the open body. |
| Accordion triggers | Details, route option, and `TripTpCollapsible` titles wrap (`whiteSpace="normal"`, `height="auto"`, `textAlign="left"`, `minW={0}`). The `+` / `−` does not shrink. |
| Card backstop | `overflowX="clip"` on the day card and the collapsible **after** wrap is in place, so a missed nowrap child cannot widen the page. The screenshot sentence must still be fully visible, not cut off mid-word by the clip. |

The day-tab strip keeps horizontal scroll. Editor rows that are still a non-wrapping `HStack` (`minW` of 10rem or 12rem on the travel step) get `wrap="wrap"` and a parent `minW={0}`, including the new timestamp fields.

Check at about 390px wide with the screenshot strings: no horizontal page scroll; chips wrap; the station note wraps inside the destination block or Details.

### 2. Travel start and end use a location

The editor’s **Journey from** and **Journey to** are location selects (the trip’s `tp_location` catalog), the same ids #20–#22 already store. Destination selects stay (region vs place). When a location is selected, the form does not also require a free-text place or a second maps URL. The location’s `maps_url`, address, hours, and contact already show in Details.

`from_place` / `to_place` and `from_maps_url` / `to_maps_url` stay in the schema. On save, if a location is set and the matching place text is blank, write the location **name** into the place text so the existing glance fallback and any agent that still reads `fromPlace` keep working. Rows that only have text and no location id still display the text. The editor does not lead with an empty text box.

Steps follow the same rule. The step’s primary from and to are `from_location_id` / `to_location_id`. Place text is filled from the location name when blank. #22 already showed both controls; this pass makes the location select the one you use.

No new MCP tool. `fromLocationId` / `toLocationId` stay on action and step create/update. Document in the tool blurbs that agents set the location ids. `fromPlace` / `toPlace` remain optional fallbacks.

Adding a brand-new place is still **+ Location** in the catalog on the same page. This pass does not embed a second location creator in the travel form.

### 3. Country on the location

Migration (create with `supabase migration new trip_location_country_and_route_option` when implementing; one file with the route columns below):

```sql
alter table public.tp_location
  add column if not exists country text;
```

Nullable. No check constraint and no ISO table. Blank in the form is stored as null (same as address). No backfill.

| Surface | Change |
| --- | --- |
| Catalog `LocationRow` | Country field under address. |
| Activity Details and travel endpoint block | Show country under the name when set, with the address. |
| `DbTpLocation` and `loadDbTpWorkspace` | `country?: string`. |
| Valibot `CreateLocationSchema` / `UpdateLocationSchema` | `country` optional; update may clear it (`optionalNullString`). |
| MCP | `create_tp_location`, `update_tp_location` property `country`. |
| REST | Same handlers: `POST/PATCH /api/pods/{podId}/trip/locations`. |

Glance chips do not gain the country. `tp_destination` does not gain a country column.

### 4. Price, currency, duration, and linked transport on the route

Add columns on `tp_route`. Do not add a new table. Do not move step clock times.

```sql
alter table public.tp_route
  add column if not exists cost_amount numeric,
  add column if not exists cost_currency text,
  add column if not exists duration_minutes integer,
  add column if not exists transport_lib_id uuid references public.tp_transport_lib (id) on delete set null;

alter table public.tp_route
  drop constraint if exists tp_route_duration_positive;

alter table public.tp_route
  add constraint tp_route_duration_positive
  check (duration_minutes is null or duration_minutes >= 0);

create index if not exists tp_route_transport_lib_id_idx
  on public.tp_route (transport_lib_id);
```

How the existing tables relate after this:

| Table | After this plan |
| --- | --- |
| `tp_transport_lib` | Still the catalog means (`bus 123`, optional mode, template price and duration). Not a route. |
| `tp_route` | One option. **Owns** the option price, currency, duration, and at most one `transport_lib_id`. Name, notes, sort, and selected flag stay. |
| `tp_transport` (step) | Still the ordered leg: depart/arrive instants, timezones, booking ref, notes, attachments, from/to locations. Optional `transport_lib_id` on a leg stays for a multi-leg option. Step price and duration: see [open questions](#open-questions). |
| `tp_action_transport` | Legacy “this action uses that means” link from #21. Columns stay. Tools stay. The web editor no longer uses this row to edit the option’s price, currency, or duration. |
| `tp_action` | Still the journey shell: title, selected route, from/to **locations**, anchor-day `start_time` / `end_time`, notes, `done`. Journey price and duration move to the route in the editor. Columns stay so old rows and the budget fallback keep working. |

**One linked means per route option.** A second means on the same option is another step with its own `transport_lib_id`, not a second row on `tp_action_transport`. Picking a means in the route editor sets `tp_route.transport_lib_id` only. It does not insert `tp_action_transport` and it does not auto-insert a step. **+ Step** stays the way you add a leg.

**Copy (single-route travels only).** Do not fan one action price out across several options.

1. If the travel has exactly one route, copy `tp_action.cost_amount`, `cost_currency`, and `duration_minutes` onto that route where the route column is still null.
2. If that travel also has exactly one `tp_action_transport`, set `tp_route.transport_lib_id` from the link when the route’s id is null, and fill any route price, currency, or duration that is still null from the link (action values already copied in step 1 win).
3. Several routes, or several action-transport links: leave the new route columns null. The action cost remains the budget number until a writer sets a price on a route.

Do not null the action or link columns in this migration.

**Budget.** Change [`tpBudgetRollup`](../../packages/model/src/tp/tpBudgetRollup.ts) so a travel counts **one** of these, in order:

1. Selected route `cost_amount`, when set.
2. Else the action `cost_amount`, when set (today’s rule, for rows the copy did not touch).
3. Else the sum of step `cost_amount` on the selected route (today’s fallback).

Never add route cost and step costs together. Never add route cost and action cost together. Non-travel actions are unchanged. `tp_action_transport` cost stays out of the rollup.

**UI.** On the route accordion in the travel editor: price, currency (default the trip budget currency, same as today’s journey currency field), duration in minutes, and a transport-library select. Remove journey price, currency, and duration from the action form, and remove the instance price/duration editors on the action-level **Linked transports** block. Travel Details shows price, currency, duration, and the library label on the route body. If the selected route has no `transport_lib_id` and the action still has legacy `tp_action_transport` rows, Details still lists those rows so an old trip does not look empty. The route trigger uses `tpRouteOptionSummary`: when the route has `cost_amount` and `cost_currency`, that pair is the price part; otherwise keep today’s single-currency step sum.

**Workspace.** `routes[]` gains `costAmount`, `costCurrency`, `durationMinutes`, `transportLibId` (camelCase). `DbTpRoute` gains those fields.

### 5. Mode comes from the linked transport

Do not add `tp_route.mode`.

| Case | What the UI shows |
| --- | --- |
| Route has `transport_lib_id` and the library `mode` is set | That mode is the option’s mode (summary can include it next to the library label). |
| Library `mode` is null | No mode word. The label is enough (`bus 123`), matching #21. |
| Step has `transport_lib_id` | Show the library mode as text. Hide the step mode `<NativeSelect>`. On save, set `tp_transport.mode` from the library, or `other` when the library mode is null, so the NOT NULL column stays valid. The writer does not edit a second mode. |
| Step has no library id | Keep the existing mode select. |

MCP: `create_tp_transport` / `update_tp_transport` still accept `mode` for a step with no `transportLibId`. When `transportLibId` is set, the server writes `mode` from the library and ignores a different `mode` in the same call. `create_tp_route` / `update_tp_route` do not take `mode`.

### 6. Shared timestamp fields

New application component `TripTpTimestampField` (`export default function`, next to the other `TripTp*` files). Props: label, date, time, timezone, disabled, and a single change callback for the three strings. It renders the stay trio in a wrapping row (`minW={0}`) so the three inputs do not widen the phone.

Use it for:

- Stay check-in and check-out (replace the inline inputs; same save path).
- Travel step **Depart** and **Arrive**.

Keep using `tpInstantFromParts` / `tpPartsFromInstant`. Columns and MCP local-time + timezone arguments stay. No REST change for steps beyond what already exists.

Activity start/end and location open/close stay `Input type="time"`.

---

## MCP + REST parity

Same handlers as today. New fields are camelCase on `get_tp_workspace` and on create/update bodies. No renamed tools. No new permission resource (still the `trip` grant).

| Area | MCP | REST | Change |
| --- | --- | --- | --- |
| Location | `create_tp_location`, `update_tp_location` | `POST/PATCH …/trip/locations` | Optional `country`. Workspace `locations[].country`. |
| Route | `create_tp_route`, `update_tp_route` | `POST/PATCH …/trip/routes` | Optional `costAmount`, `costCurrency`, `durationMinutes`, `transportLibId` (update may clear the id, the amount, and the duration). Workspace `routes[]` includes them. Blurb stays “route option”. |
| Step | `create_tp_transport`, `update_tp_transport` | `POST/PATCH …/trip/transports` | When `transportLibId` is set, `mode` is taken from the library. `fromLocationId` / `toLocationId` remain the step endpoints. |
| Travel action | `create_tp_action`, `update_tp_action` | `POST/PATCH …/trip/actions` | `fromLocationId` / `toLocationId` are the start and end. `fromPlace` / `toPlace` stay optional. Price and duration on the action are legacy; the route fields are the ones to set. |
| Action-transport link | `link_tp_action_transport`, `update_tp_action_transport` | `POST/PATCH …/trip/action-transports` | Unchanged contract so #21 clients keep working. Not the editor path for option price. |

Patch semantics match the other trip fields: omit a key to leave the column; send null on the update schema to clear a nullable column.

---

## Touch points

| File | Change |
| --- | --- |
| `supabase/migrations/<new>_trip_location_country_and_route_option.sql` | `country` on `tp_location`. Price, currency, duration, `transport_lib_id` on `tp_route`. Single-route copy. `supabase migration new trip_location_country_and_route_option`. |
| [`packages/web/lib/supabase/database.ts`](../../packages/web/lib/supabase/database.ts) | New columns on Row, and on Insert/Update where those objects are explicit. |
| [`packages/web/lib/api/db/tp/loadDbTpWorkspace.ts`](../../packages/web/lib/api/db/tp/loadDbTpWorkspace.ts) | Map `country` and the route fields. |
| [`packages/model/src/tp/tpAgentSchemas.ts`](../../packages/model/src/tp/tpAgentSchemas.ts) | `country` on location schemas. Route cost, currency, duration, `transportLibId`. |
| [`packages/model/src/tp/tpBudgetRollup.ts`](../../packages/model/src/tp/tpBudgetRollup.ts) | Selected-route cost first. |
| [`packages/model/src/tp/tpRouteOptionSummary.ts`](../../packages/model/src/tp/tpRouteOptionSummary.ts) | Route price wins over the step sum. Optional library label and mode. |
| [`packages/web/lib/api/mcp/mcpCatalogByFeature.ts`](../../packages/web/lib/api/mcp/mcpCatalogByFeature.ts) | Properties and blurbs above. |
| Agent route/location/transport handlers and `createDb` / `updateDb` helpers | Persist the new columns. Step save applies library mode when linked. |
| [`TripDayCardTags.tsx`](../../packages/web/components/tp/TripDayCardTags.tsx) | Wrapping badges. |
| [`TripPlanningBoard.tsx`](../../packages/web/components/tp/TripPlanningBoard.tsx) | Card shrink rules, glance clamp, destination text wrap. |
| [`TripTpCollapsible.tsx`](../../packages/web/components/tp/TripTpCollapsible.tsx) | Wrapping title. |
| [`TripActivityActionDetails.tsx`](../../packages/web/components/tp/TripActivityActionDetails.tsx) | Wrap, show country. |
| [`TripTravelActionDetails.tsx`](../../packages/web/components/tp/TripTravelActionDetails.tsx) | Wrap, location endpoints, route price and linked means, country on endpoints. |
| [`TripTravelActionEditor.tsx`](../../packages/web/components/tp/TripTravelActionEditor.tsx) | Location selects as from/to. Route fields. Stop double-writing price onto `tp_action_transport`. Timestamp component on depart/arrive. Hide step mode when a library means is set. |
| [`TripTripCatalogPanel.tsx`](../../packages/web/components/tp/TripTripCatalogPanel.tsx) | Country on the location row. |
| [`TripStayActionEditor.tsx`](../../packages/web/components/tp/TripStayActionEditor.tsx) | Use `TripTpTimestampField`. |
| `packages/web/components/tp/TripTpTimestampField.tsx` | **New.** Default export. |

Application files: `export default function`. No new `index.ts` under `packages/web`. Package helpers stay named exports from [`packages/model/src/tp/index.ts`](../../packages/model/src/tp/index.ts). No new dependency. No application tests.

`TripPlanningBoard` and `TripTravelActionEditor` are already large. Put the timestamp widget and any new route-field row in their own files. Do not split unrelated board sections in the same change.

### Tests (`@so/model` only, when implementing)

| Helper | Cases |
| --- | --- |
| `tpBudgetRollup` | Selected route cost is used and step costs on that route are not added. Action cost is used only when the selected route has no cost. Empty route and empty action still sum selected-route steps and ignore another route. Non-travel costs unchanged. |
| `tpRouteOptionSummary` | Route `costAmount` + `costCurrency` replaces the step sum. Missing route price still sums one currency and omits mixed currencies. Library label shows when passed. Mode shows only when the library mode is set. |

No test for the SQL copy or the React layout. Overflow is checked on a phone-width viewport in QA.

---

## Accessibility

- Wrapping buttons stay real buttons with `aria-expanded` / `aria-controls` as they are today. The visible title is the accessible name, including when it wraps.
- Tag row keeps `aria-label="Tags"`. A wrapped badge’s text is the badge’s name.
- Location select labels stay **Journey from** and **Journey to**. Country’s label is **Country**.
- `TripTpTimestampField` groups date, time, and timezone under the visible label (Depart, Arrive, Check-in, Check-out). Each input has its own accessible name (Date, Time, Timezone).
- Route price and duration inputs have visible labels. The transport select’s label names the means (`Transport`).

---

## Implementation order (this branch, after approval)

1. Layout pass: tag badges, card and accordion shrink/wrap, Details prose, editor row wrap. No schema. Check the screenshot strings at phone width.
2. `TripTpTimestampField`. Switch stay check-in/out and travel depart/arrive. No schema.
3. Migration and `database.ts`. Workspace mapping. Location country through catalog, Details, valibot, MCP, REST.
4. Travel editor: location selects as from/to; save copies the location name into blank place text.
5. Route columns through schemas, MCP, REST, editor, Details, `tpRouteOptionSummary`, `tpBudgetRollup`, and unit tests. Stop the editor’s double write of price and duration onto `tp_action_transport`.
6. Step mode follows the library when `transport_lib_id` is set. Route summary shows the library label and mode.
7. QA below.

Production applies the migration only through the **Production** GitHub Actions `db push`. Do not apply it from a laptop. No new Vercel env vars. Confirm nothing new under Database → Extensions. Local: `supabase db reset`.

---

## QA checklist

Use a phone-width viewport (about 390px) and the desktop width. The live HK–JP trip is fine to **look at**. Do not delete filled-in rows. Create a throwaway travel on a scratch day if a write is needed, and delete only that row.

- [ ] The screenshot strings wrap inside the card, the destination block, and Details. The page does not scroll horizontally. The station sentence is fully readable. A long tag wraps inside its chip. The day-tab strip can still scroll sideways on its own.
- [ ] Glance longer than three lines clamps; opening Details shows the rest.
- [ ] Journey from and journey to are location selects. Saving with a location and empty place text stores the location name in `from_place` / `to_place`. A row that only has place text still shows that text. Destination from/to still saves.
- [ ] Catalog: set and clear `country`. Activity Details and a travel endpoint show it. `get_tp_workspace` returns `country`. MCP `update_tp_location` and REST `PATCH …/trip/locations/{id}` match.
- [ ] A new route option saves price, currency, duration, and one library means on `tp_route`. Workspace `routes[]` matches. MCP `update_tp_route` and REST `PATCH …/trip/routes/{id}` match. Clearing `transportLibId` clears the column.
- [ ] Linking a means on the route does not insert `tp_action_transport` and does not insert a step. **+ Step** still adds a step.
- [ ] Budget: selected route price counts once. Step prices on that route are not added on top. A travel with no route price and an action price still uses the action price. A travel with neither uses the selected route’s step sum.
- [ ] A single-route travel that had an action price shows that price on the route after `db reset` / `db push`. A travel with two routes does not get the action price copied onto both.
- [ ] A route whose library means has `mode` shows that mode and no extra mode dropdown on a step that uses the same means. A step with no library means still has the mode select. A library means with a null mode shows the label only.
- [ ] Depart and arrive use the same date, time, and timezone fields as stay check-in. Reload keeps the instants. Activity start/end stay time-only.
- [ ] Done checkboxes, icon edit/delete, and route accordions from #21–#22 still behave as they do on `develop`.

---

## Decisions locked by this plan

| Topic | Decision |
| --- | --- |
| Overflow | Wrap inside the viewport. Clamp only the glance (3 lines). Clip is a backstop after wrap, not the way text is hidden. |
| Tags | Still parsed from `Tags:` lines. Chips wrap. No tags column. |
| Travel endpoints | `from_location_id` / `to_location_id` are the editor controls. Place text remains a fallback column. |
| Destinations | Unchanged. A destination is not a location. |
| Country | Nullable text on `tp_location` only. |
| Route option | Gains price, currency, duration, and one `transport_lib_id`. |
| Action price / duration | Columns remain. Editor and budget prefer the selected route. |
| `tp_action_transport` | Legacy. Tools stay. Editor stops writing option price there. |
| Step times | Stay on `tp_transport` (`depart_at` / `arrive_at` + IANA zones). |
| Mode | No `tp_route.mode`. Linked steps show `tp_transport_lib.mode`. |
| Timestamps | `TripTpTimestampField` = stay’s date + time + IANA zone. No new dependency. |
| Budget | One travel figure: route cost, else action cost, else selected-route step sum. |

---

## Open questions

1. **Step price and duration after the route has its own.** Recommendation: keep `tp_transport.cost_*` and `duration_minutes`, and keep them on the step form, for a leg that has its own fare (flight + train). The budget and the route summary use the route price whenever it is set, and only sum steps when the route price is empty. If Matthew wants a single price and the step form should drop price and duration, say so before implementation. The columns would still not be dropped in this pass.
2. **More than one catalog means on a route option that has no steps.** Recommendation: one `transport_lib_id` on `tp_route`. Extra means are steps. `tp_action_transport` can already attach several means to the action; this plan does not move that list onto the route as a new link table. If an option needs several means without steps, say so.
