# Stay span on day cards, collapsed travel steps, selected route tag, hide past days

A stay should read as the nights you are in it: bottom of the check-in day, top of the check-out day, and both ends of every day strictly in between. Editing a travel route should not dump every step open. The chosen route option should be obvious as a tag, not only as a word inside a summary sentence. Days that are already over should drop out of the day chips until a switch shows them again.

**Repo:** [CoolColdUK/simpleOutcomeDev](https://github.com/CoolColdUK/simpleOutcomeDev)  
**Base:** `develop` after [#24](https://github.com/CoolColdUK/simpleOutcomeDev/pull/24) (currency list, shared money field, transport steps). Prod is that line (`0.35.0`).  
**Earlier plans:** [trip-planning.md](./trip-planning.md) (stay span + travel → route → step), [trip-day-ui-polish.md](./trip-day-ui-polish.md), [trip-day-card-icons-activity-accordion.md](./trip-day-card-icons-activity-accordion.md), [trip-done-travel-routes.md](./trip-done-travel-routes.md), [trip-currency-money-transport-steps.md](./trip-currency-money-transport-steps.md). This plan does not reopen those models.

**Status:** Plan only. No product code, migration, or UI change in this PR. Implement on this same branch after Matthew approves. Agents do not merge.

**Out of scope:** Telegram. Schema, migrations, MCP, REST. A second stay row in the database. Changing check-in / check-out storage. Travel day-board step collapse (Details already hides steps until a route is opened). Reordering pinned stays with the activity arrows. A server or database preference for the past-day switch (local UI state only; see [soft question 4](#soft-questions-for-matthew)). Filtering actions inside the open day. Using the device timezone to decide that a day has passed. New npm packages. Realtime. New Vercel env vars. Bulk edits to the live HK–JP trip.

---

## Goal

1. **Stay placement.** On the day list, a stay with a complete check-in → check-out span is pinned by calendar role. Check-in day: bottom only. Check-out day: top only. Days strictly between: top and bottom. Two drawings of one action.
2. **Travel edit.** Inside an expanded route option, each step is collapsed until that step is expanded. The route header stays visible without opening steps.
3. **Selected tag.** The selected route option shows a **Selected** badge wherever route options are listed. Selection stays `tp_action.selected_route_id` via `tpRouteIsSelected`. UI only.
4. **Past day chips.** The day button group hides days strictly before today in the trip timezone. A **Show past days** switch, default off, puts them back. Today and later days stay in the group.

Labels below that say **proposed** are the reading of Matthew’s request for this review. The placement matrix in [Locked placement](#locked-placement) is locked, including afternoon check-out. “Past” in [Hide past day chips](#hide-past-day-chips) is locked to the trip timezone.

## Non-goals

- Pinning travel the same way. Travel keeps one card per overlapping day.
- A thinner “still here” bar in place of the second card. Both ends are the same stay card.
- Time-of-day exceptions. Clock time does not add or remove a pin. See [Locked placement](#locked-placement).
- Collapsing route-option fields (price, duration, whole-option transport). Only the step bodies collapse.
- A second disclosure on the day-board travel Details list. That list already opens one route at a time.
- Dropping the `mirror` badge, Anchor day, or the done checkbox.
- Hiding the open day’s action list because that day is past. The switch filters chips, not the plan under them.
- Changing which day `tpDefaultSelectedDayId` picks on first load. It already prefers today in the trip timezone.

---

## Current behaviour (develop after #24)

The board shows one day at a time. [`tpDayTimelineEntries`](../../packages/model/src/tp/tpDayTimelineEntries.ts) builds that day’s list. [`TripPlanningBoard.tsx`](../../packages/web/components/tp/TripPlanningBoard.tsx) renders it in `sortOrder` order.

### Day chips show every day

Under the trip header, the board maps `data.days` into one horizontal button row (`HStack`, `overflowX="auto"`). Each chip’s label is `dayTitle`, or `calendarDate` when the title is empty. The selected chip is `solid`; the others are `outline`. Click sets `selectedDayId`.

Only that selected day renders a day plan. There is no strip of day columns.

On load, when the current id is missing, [`tpDefaultSelectedDayId`](../../packages/model/src/tp/tpDefaultSelectedDayId.ts) picks today in `trip.timezone` via `localDateInZone`. Before the trip starts it picks the first day. After the trip ends it picks the last day. Every chip stays on screen either way. Nothing in trip planning is a show-past switch. The todo toolbar already uses Chakra `Switch` for “Show archived” ([`TodoListBoardToolbar.tsx`](../../packages/web/components/todo/TodoListBoardToolbar.tsx)).

### Stay is one card per overlapping day

A stay with both `checkInAt` and `checkOutAt` is included on every trip day where [`tpSpanOverlapsTripDay`](../../packages/model/src/tp/tpSpanOverlapsTripDay.ts) is true (the stay interval overlaps that calendar date in the **trip** timezone). The function emits **one** entry:

| Where | `displayMode` | `sortOrder` |
| --- | --- | --- |
| Anchor day | `canonical` | the action’s `sortOrder` (mixed in with activities and notes) |
| Any other overlapping day | `mirror` | `10_000 + sortOrder` (forced under the day’s other cards) |

There is no top pin and no second card. A hotel that runs Monday afternoon → Wednesday afternoon sits once in Monday’s list (wherever its sort order lands), once at the bottom of Tuesday, and once at the bottom of Wednesday. Check-out morning vs check-out afternoon does not change that.

A stay with a blank check-in or check-out is anchor-day only, one canonical card. That path stays.

The card key is `` `${actionId}-${displayMode}` ``. Two pins of the same stay on the same day would collide if both were `mirror` or both were `canonical`.

Pencil, delete, and done all use the one `actionId`. The editor is [`TripStayActionEditor.tsx`](../../packages/web/components/tp/TripStayActionEditor.tsx). `canWrite` on that editor is true only when the row is canonical. Mirror rows still open the form, read-only. `expandedActionId` is one id for the whole board, so a second visual of the same id would mount a second editor today.

Done is `tp_action.done`. The tooltip says “Done for this day card only.” Both pins would still be one flag.

### Travel editor leaves every step open

[`TripTravelActionEditor.tsx`](../../packages/web/components/tp/TripTravelActionEditor.tsx) wraps each route in [`TripTpCollapsible`](../../packages/web/components/tp/TripTpCollapsible.tsx), **closed by default**. The trigger is [`tpRouteOptionSummary`](../../packages/model/src/tp/tpRouteOptionSummary.ts) (name, the word `selected` when chosen, endpoints, step count, price, times).

Opening a route shows option price, duration, whole-option library transport, Save, the **Steps** heading, Select / Delete route, **+ Step**, then every step as a full [`TransportRow`](../../packages/web/components/tp/TripTravelActionEditor.tsx): done, library, from/to, duration, depart, arrive, cost, booking ref, notes, Save, attachments. Nothing hides a step. The selected route is `opacity: 1` against `0.85` on the others, and its **Select** button is omitted. There is no badge.

### Day-board travel already collapses routes, not steps

[`TripTravelActionDetails.tsx`](../../packages/web/components/tp/TripTravelActionDetails.tsx) is the travel **Details** accordion, closed by default. Inside it, each route option is its own disclosure, also closed by default. Opening one lists short read-only step lines (label, from → to, duration, cost, time). The header text includes the word `selected` from the same summary helper. The glance sentence ([`tpActionDayCardSummary`](../../packages/model/src/tp/tpActionDayCardSummary.ts)) names the selected route. It does not list the other options.

### Selection is already stored

`tpRouteIsSelected(routeId, action.selectedRouteId, route.isSelected)` prefers `selected_route_id`. `is_selected` is the fallback when that id is absent. No column is missing for a tag.

---

## Desired behaviour

### Locked placement

Clock time does not choose the pin. The check-in **day** is the bottom. The check-out **day** is the top. An afternoon check-out does not add a bottom card. A morning check-in does not add a top card.

**Day A** is the trip day whose `calendarDate` equals `localDateInZone(checkInAt, checkInTimezone ?? tripTimezone)`.  
**Day B** is the trip day whose `calendarDate` equals `localDateInZone(checkOutAt, checkOutTimezone ?? tripTimezone)`.  
Dates are `YYYY-MM-DD`, so string order is calendar order. A day is a candidate only when `tpSpanOverlapsTripDay` is already true (same overlap as today, trip timezone).

| Role | Rule | Cards on that day |
| --- | --- | --- |
| Check-in day | `calendarDate === A` and `A !== B` | **Bottom only** |
| Check-out day | `calendarDate === B` and `A !== B` | **Top only** |
| Middle day | `A < calendarDate < B` | **Top and bottom** |
| Same civil day | `A === B` | **Proposed:** one card, in the normal action order. See [soft questions](#soft-questions-for-matthew). |

**Locked example.** Check-in mid-day on day A, check-out mid-day on day B, `A ≠ B`:

| Day | Cards |
| --- | --- |
| A (check-in), any check-in time | Bottom only |
| B (check-out), any check-out time, including afternoon | Top only |
| Every trip day strictly between A and B | Top and bottom |

Adjacent nights have no middle day. Check-in Monday, check-out Tuesday: Monday bottom, Tuesday top.

Three calendar dates. Check-in Monday, check-out Wednesday: Monday bottom, Tuesday top and bottom, Wednesday top.

A stay with a blank check-in or check-out stays one card on the anchor day, in normal sort order. It is not pinned.

**Proposed timezone tail.** A trip day that overlaps the UTC span but whose `calendarDate` is outside `[A, B]` (check-in zone and trip zone disagree) still shows **one** card: bottom when `calendarDate < A`, top when `calendarDate > B`. The stay does not vanish. It is not doubled.

**Proposed invalid span.** Check-out local date before check-in local date: no twins. One card per overlapping day, normal sort order.

### One action, two drawings

Both pins share `actionId`. They are not a second stay.

| Control | Behaviour |
| --- | --- |
| Glance | Same summary on both pins (badge, title, place, check-in → check-out). |
| Pencil | Opens **one** `TripStayActionEditor`. The body mounts on the pin that was opened. The other pin stays a glance. Pencil on the open pin closes. Pencil on the twin moves the editor to that pin. |
| Delete | Same confirm, same delete. Removes the stay from every day. |
| Done | One `tp_action.done`. Both pins show it. Either checkbox writes it. |
| Anchor day | Unchanged. Non-anchor pins stay `mirror`. The editor is writable only on the anchor day’s pins. |
| ↑ / ↓ | **Proposed:** pinned stays leave the activity reorder list. Order inside a pin band follows `sortOrder`. Several stays on one day stack in that order at the top, and again at the bottom. |

Render order on a day: top pins, then the existing flow (activities, notes, travel, draft stays), then bottom pins.

React key includes the pin: `` `${actionId}-${pin}` `` with `pin` of `top`, `bottom`, or `flow`.

`displayMode` stays `canonical` when `anchorDayId` is this day, otherwise `mirror`, on every pin of that stay.

### Travel edit: steps collapsed

**Scope is the edit UI** (`TripTravelActionEditor` / `TransportRow`).

Route options stay in `TripTpCollapsible`, closed by default. Opening a route still shows option price, duration, whole-option transport, Save, the Steps heading, Select / Delete, and **+ Step**.

Each step under that is its own disclosure, **closed by default**. Closed step: one line (library label, else mode, from → to, and the depart → arrive line when both instants exist) and the `+` / `−` control already used by `TripTpCollapsible`. Open step: today’s `TransportRow` fields, unchanged.

The route header, including the selected tag, is readable with every step closed.

Day-board Details is unchanged in this pass. Routes there are already closed until opened, and the lines inside are short. If that list is still too loud, Matthew can pull it into scope. See [soft questions](#soft-questions-for-matthew).

### Selected route tag

Add a Chakra `Badge`, copy **Selected**, on the route option header:

- Travel editor, on the route `TripTpCollapsible` title (the title already accepts `ReactNode`).
- Travel Details, on each route option button in `TripTravelRouteOptionDetails`.

The glance line already prints the selected route’s name and does not list options. No badge there.

**Proposed:** stop appending the word `selected` inside `tpRouteOptionSummary`, so the badge is the only “selected” marker. Keep the `isSelected` argument so callers do not fork the helper; it would no longer change the sentence. Update `tpRouteOptionSummary.test.ts` with that. Opacity and the hidden **Select** button stay.

Data path stays `selectedRouteId` / `tpRouteIsSelected`. No migration.

### Hide past day chips

**Locked.** A trip day has **passed** when `calendarDate` is strictly before **today** in the **trip** timezone (`trip.timezone`). Today is `localDateInZone(now, trip.timezone)`, the same comparison [`tpDefaultSelectedDayId`](../../packages/model/src/tp/tpDefaultSelectedDayId.ts) already uses. `calendarDate === today` is today, not past. Later dates are future. The device timezone, including the phone timezone, is not consulted. A phone set to another zone does not move the cutoff.

The chip row gains a Chakra `Switch`, label **Show past days**, default **off**. Same control shape as the todo toolbar.

| Switch | Button group |
| --- | --- |
| Off (default) | Omit days with `calendarDate < today`. Today and every later day stay, in the existing day order. |
| On | Every day, past included, same order as now. |

The open day plan is unchanged. Actions on a past day still render when that day is the selection.

**Proposed persistence (soft):** sticky **per trip** on this browser. A local UI preference keyed by trip id. Missing key means **off**, so the first open of a trip hides past days. Turning the switch on or off writes that key and the next open of the same trip restores it. Same idea as [`useTodoPodSingleListMode`](../../packages/web/lib/todo/useTodoPodSingleListMode.ts), which stores a flag in `localStorage` under a prefix plus an id (there, pod id; here, trip id). It is not a column on `tp_trip`, not a per-user server setting, and it does not follow the account to another browser. **Alternative:** reset every open (session-only React state, no `localStorage`). See [soft question 4](#soft-questions-for-matthew).

**Proposed selection rule** when the switch is off and the selected day is past: move to today if that date is a trip day, otherwise to the first day that is not past. Turning the switch on does not move the selection. A trip that is entirely in the past has no such day. **Proposed:** keep the last day (what `tpDefaultSelectedDayId` already returns) and leave that one chip visible, so the row is not empty. **Show past days** then reveals the rest.

**Proposed Anchor day.** That button can select a past day while the switch is off. The day plan opens, and that selected chip stays in the row until the user leaves it. Other past chips stay hidden. Turning the switch off while still sitting on that past day runs the snap above.

---

## Implementation sketch (after approval)

Smallest change that matches the matrix. No schema fork.

1. Extend `TpDayTimelineEntry` with `pin: 'top' | 'bottom' | 'flow'`. Stays with a complete span emit one or two entries per the matrix. Other kinds emit `flow`. Draft stays emit `flow` on the anchor day.
2. Unit tests on `tpDayTimelineEntries` (exported from `@so/model`):
   - Mid-day check-in on A, mid-day check-out on B: A is one `bottom` entry; B is one `top` entry; a day between is `top` and `bottom`; no `bottom` on B.
   - Check-in Monday, check-out Wednesday: Tuesday has two entries, same `actionId`, different pins.
   - Same civil day: one `flow` entry (the proposed same-day rule).
   - Blank span: one canonical `flow` entry on the anchor day only.
   - Afternoon check-out does not add a second entry on B. A `00:00` check-in does not add a top entry on A.
3. `TripPlanningBoard` groups `top`, then `flow`, then `bottom`. Editor body for a stay mounts on one pin. Key uses `pin`. Canonical reorder ignores pinned entries.
4. `TransportRow` gains a closed-by-default disclosure. Route collapsible stays as it is.
5. `Badge` “Selected” on the two route-option headers. Summary sentence drops the inline word.
6. A small exported helper next to `tpDefaultSelectedDayId`, for example `tpTripDayIsPast(calendarDate, tripTimezone, nowMs)`, with unit tests: yesterday is past, today is not, tomorrow is not, and the cutoff is the trip timezone passed in (a different zone around the same instant can disagree). `TripPlanningBoard` filters the chip row with it. The switch reads and writes a `localStorage` key that includes the trip id, default off when the key is absent. Chip order stays the workspace order.

Files: `packages/model/src/tp/tpDayTimelineEntries.ts`, its test, the new past-day helper and its test, `TripPlanningBoard.tsx`, `TripTravelActionEditor.tsx`, `TripTravelActionDetails.tsx`, `tpRouteOptionSummary.ts` and its test. No SQL.

---

## Soft questions for Matthew

1. **Same-day stay.** Check-in and check-out on the same calendar date (`A === B`). **Proposed:** one card in the normal action order, not a top pin and not a bottom pin, and not both. Say if you would rather pin that single card to the bottom (treat the day as check-in) or to the top (treat it as check-out).
2. **Expand affordance.** **Proposed:** each step has its own `+` / `−`, closed by default, inside the route that is already closed by default. The Steps heading stays a heading. Say if you would rather have one **Steps** disclosure that hides every step body together. Also: a step just added with **+ Step** — **proposed** it opens expanded so the new fields are visible; existing steps stay closed.
3. **Tag copy and placement.** **Proposed:** badge text `Selected`, on the route option header in the travel editor and in day-board Details. The word `selected` comes out of the summary sentence. The day-card glance keeps printing the chosen route’s name and does not gain a badge. Say if the copy should be different, or if the badge should also sit on the glance.
4. **Persist the show-past switch.** **Proposed:** sticky per trip. Local UI preference keyed by trip id (`localStorage`). Default **off** the first time that trip is opened on this browser. Later opens of the same trip restore the last choice. Not a server setting and not shared across browsers. **Alternative:** reset every open (session-only, no stored key). Say if you want the alternative, or a per-user preference instead of per trip.
5. **Selected day is past while the switch is off.** **Proposed:** snap to today when today is a trip day, otherwise to the first day that is not past. If the whole trip is past, keep the last day and leave that one chip visible. Anchor day may still open a past day, and that selected chip stays until the user leaves it. Say if you would rather snap straight to today or to the first visible day and drop the last-day and Anchor-day exceptions.
6. **What the switch hides.** **Proposed:** the day button group only. The board has one day plan, not a row of day columns, so there is no column to collapse. The open day’s actions stay put. Say if a later multi-day layout should hide those columns too.

---

## Success criteria

- Draft review agrees the locked matrix, including afternoon check-out = top only on day B, and check-in day = bottom only.
- After implementation on this branch: model tests cover that matrix, the same-day rule Matthew picks, and the blank-span case.
- A multi-day stay draws two cards only on middle days. Both open one editor and one database row.
- In the travel editor, route headers show with steps collapsed. Expanding one step shows the fields that are on screen today.
- The selected route has a visible **Selected** badge in the editor and in Details. Unselected routes do not. `selected_route_id` is still the source of truth.
- With the switch off, chips whose `calendarDate` is strictly before today in the trip timezone are absent. Today and later chips remain. The switch on puts the omitted chips back in the same order. A device timezone that differs from the trip does not change which chips hide.
- The show-past choice for a trip sticks on this browser under that trip id, and a trip with no stored choice opens with the switch off.
- No migration, no MCP change, no new dependency.

## Risks

- Two full cards on a busy middle day add height. That is the request. The twin is a glance unless its pencil is the one that opened the editor.
- Pinning removes stays from ↑ / ↓. Order among stays in a band is whatever `sortOrder` already is.
- `tpRouteOptionSummary` is shared by the editor and Details. Dropping the word `selected` changes both sentences in one place, which is what keeps the badge from doubling the word.
- Check-in timezone vs trip timezone can put a card on a neighbouring trip day (the tail rule above). Worth a look on a trip that plans in one zone and checks in in another.
- A finished trip is entirely past. The empty chip-row rule (keep the last day visible) is what stops the board opening with no day to pick. Matthew can reject that in soft question 5.
- “Today” moves at midnight in the trip timezone. The chip row should follow that without a reload if the board stays open across midnight. Cheap to recompute from `Date.now()` when the switch or the day list renders. The cutoff is still `trip.timezone`, not the phone zone.
- The sticky switch lives in this browser’s `localStorage`. Another browser, or a cleared site store, opens that trip at off again. That is the proposal, not a server preference.
