# Day cards — icon edit/delete, activity details accordion

Reading an activity should not mean opening the edit form. The day list stays a glance. Edit and delete on each day card are icon buttons, using the icons the app already has.

**Repo:** [CoolColdUK/simpleOutcomeDev](https://github.com/CoolColdUK/simpleOutcomeDev)  
**Base:** `develop` after [#19](https://github.com/CoolColdUK/simpleOutcomeDev/pull/19) (glance, stay/travel cards, delete) and [#20](https://github.com/CoolColdUK/simpleOutcomeDev/pull/20) (`tp_location`, `tp_transport_lib`, activity/travel linking).  
**Earlier day-UI plan:** [trip-day-ui-polish.md](./trip-day-ui-polish.md) (shipped). This plan does not reopen that model.

**Status:** Plan only. No product code on this branch until Matthew replies **Implement the plan** (or otherwise approves). Implementation continues on **this same branch and draft PR**. Agents do not merge.

**Out of scope:** Telegram. Schema, migrations, MCP, REST. New npm packages. Reworking stay/travel/note editors. Nested form buttons (`Save`, `Remove`, `Delete route`, attachment `Delete`, catalog `Delete`). Bulk edits to the live HK–JP trip.

---

## Goal

1. On every day card, **Edit** and **Delete** are icon buttons (pencil / trash), not the strings `Edit`, `Close`, or `Delete`.
2. An **activity** can be read without the editor. Collapsed card = glance. An accordion on the card, **closed by default**, shows the full read-only details (locations, time window, cost, notes). The pencil still opens the existing activity editor.
3. Stay, note, and travel keep today’s expand-to-editor behaviour. Only the control chrome changes to icons.
4. No database or agent-API change. Workspace payload from #20 already has every field the accordion needs.

## Non-goals

- Accordions for stay, note, or travel (see [open point](#left-for-matthew)).
- Changing what the glance line says (`tpActionDayCardSummary` stays).
- Turning reorder, “Anchor day”, “+ Activity”, or Save into icons beyond the reorder pair called out below.
- Editing locations, cost, or notes from inside the accordion.
- A second activity-place table. #20 replaced `tp_activity_place` with `tp_location` + `tp_action_location`.

---

## Current behaviour (develop after #19 and #20)

Day cards are rendered inline in [`TripPlanningBoard.tsx`](../../packages/web/components/tp/TripPlanningBoard.tsx) (`timeline.map`). One `expandedActionId` means one open editor. [`TripTpCollapsible`](../../packages/web/components/tp/TripTpCollapsible.tsx) is used for destination “Important info” and “Destinations (trip)” only. It is a bordered toggle (`+` / `−`), default closed. Nothing in `packages/web/components/tp` uses Chakra `Accordion` or `IconButton`.

### Glance (collapsed)

| Kind | Collapsed line |
| --- | --- |
| **Stay** | Badge, title, property (`place_text`), check-in → check-out, or “Times not set”. |
| **Activity** | Badge, title, `start_time`–`end_time` when set, linked location names (truncated to two, plus a count). Falls back to legacy `place_text` when nothing is linked. |
| **Travel** | Badge, title, from → to (text or linked location names), transport-library labels, local window or duration, selected route, depart → arrive. |
| **Note** | Badge, title, first line of notes. |

Built by [`tpActionDayCardSummary`](../../packages/model/src/tp/tpActionDayCardSummary.ts) and `actionCardSummary` in the board. Cost, addresses, maps URLs, location notes, and the rest of a long note are **not** on the glance.

### Opening a card always opens the editor

The header button says **Edit**, or **Close** when `expandedActionId` is that action. It is a text `Button`, shown for viewers and for mirror rows. The panel under the header is the editor:

| Kind | Editor | Viewer (`canWrite` false, including mirrors) |
| --- | --- | --- |
| Activity | [`TripActivityActionEditor.tsx`](../../packages/web/components/tp/TripActivityActionEditor.tsx) | Same form, inputs disabled, no Save. Locations, time, cost, and notes are only in that form. Notes is a single-line `Input`. |
| Stay | [`TripStayActionEditor.tsx`](../../packages/web/components/tp/TripStayActionEditor.tsx) | One line: place and check-in/out. |
| Travel | [`TripTravelActionEditor.tsx`](../../packages/web/components/tp/TripTravelActionEditor.tsx) | One line: from → to. |
| Note | [`TripSimpleActionEditor.tsx`](../../packages/web/components/tp/TripSimpleActionEditor.tsx) | Place and full notes. |

So the only way to read an activity’s locations, cost, or notes is to open Edit. That is the gap.

### Edit / Delete chrome

Writers see a red outline **Delete** on canonical and mirror cards. Confirm copy already says the action is removed from every day. `deleteDbTpActionForBrowser` is unchanged.

Also on the card, and **not** the target of the pencil/trash swap:

- **↑ / ↓** text buttons for canonical reorder (no accessible name).
- **Anchor day** on mirrors. It switches to `anchorDayId` and sets `expandedActionId`, so it opens the editor on the home day.
- **+ Activity / + Note / + Stay / + Travel** stay text. New rows still set `expandedActionId` so the editor opens immediately.

Icons already in `@so/component` (re-exported from [`packages/component/src/icons/index.ts`](../../packages/component/src/icons/index.ts)): `EditIcon` (pencil), `DeleteIcon` (trash), `CrossIcon`, `ArrowUpIcon`, `ArrowDownIcon`. Todo and finance screens already pair Chakra `IconButton` with [`AppIconTooltip`](../../packages/web/components/app/AppIconTooltip.tsx) and an `aria-label` (see `TodoListBoardCardHoverActions.tsx`). No new icon set.

### Data already on the workspace

`loadDbTpWorkspace` returns `actions` (`startTime`, `endTime`, `notes`, `costAmount`, `costCurrency`, legacy `placeText` / `mapsUrl`), `locations` (`name`, `address`, `mapsUrl`, `notes`), and `actionLocations` (`actionId`, `locationId`, `sortOrder`). The activity editor already joins those. The accordion can too. **No schema or MCP gap.**

---

## Desired behaviour

### Icon buttons (all kinds)

Same row, same order: Anchor day (text, mirrors only) → move up → move down → delete → edit/close.

| Control | Who sees it | Widget |
| --- | --- | --- |
| **Delete** | `canWrite`, canonical **and** mirror (same as today) | `IconButton` + `DeleteIcon`, `colorPalette="red"`, `variant="ghost"`, `size="xs"` |
| **Edit** | See below | `IconButton` + `EditIcon`, `variant="outline"` when closed, `variant="solid"` when that card’s editor is open |
| **Close editor** | Same people as Edit, while that card is the open editor | Same button, swaps to `CrossIcon`. It clears `expandedActionId`. It does not delete. |
| **Move up / down** | `canWrite` and canonical (same as today) | `ArrowUpIcon` / `ArrowDownIcon`, `variant="outline"`, `size="xs"`. Disabled state unchanged. |

**Edit visibility**

- **Activity:** pencil only when `canWrite` and the row is **canonical**. Viewers and mirror rows read the accordion instead. They do not get a pencil that opens a disabled form.
- **Stay, note, travel:** pencil for everyone who sees **Edit** today (viewers and mirrors included). It still toggles the existing editor, including the short read-only branch for viewers. This pass does not add a read accordion for those kinds.

Delete keeps the current `window.confirm` (kind, title, “removed from every day”).

**Anchor day** stays a text button. It only changes the selected day. It does **not** set `expandedActionId`. Opening the editor on the home day is the pencil, on the canonical card, for a writer.

Wrap each icon button in `AppIconTooltip`. Tooltip text matches `aria-label`.

### Activity accordion

One disclosure per activity card (canonical and mirror), **closed by default**. Several activities may be open at once. That state is local to the card. It is not `expandedActionId`.

| State | What the card shows |
| --- | --- |
| Glance | Unchanged summary under the title. |
| Accordion open, editor closed | Read-only details under the glance. |
| Editor open (`expandedActionId`) | Existing `TripActivityActionEditor`. The disclosure is not rendered while the editor is open, so the card does not show two bodies. Closing the editor returns to glance + a closed accordion. |
| **+ Activity** | Still opens the editor immediately (`setExpandedActionId`). Accordion stays closed. |

Disclosure chrome sits **inside** the card, under the header, with no second bordered box. Do not drop a full [`TripTpCollapsible`](../../packages/web/components/tp/TripTpCollapsible.tsx) (it draws its own border) inside the card. Copy its `+` / `−` toggle and default-closed behaviour. Trigger label: **Details**.

**Read-only body** (omit a row when the value is empty):

- Time window: `start_time`–`end_time` (HH:MM). One side only if the other is empty.
- Locations in `sort_order`: name, address when set, location notes, and `mapsUrl` as a link (`target="_blank"`, `rel="noopener noreferrer"`). Link text is the URL or “Map”. This is the only interaction in the body.
- When there are **no** `tp_action_location` rows, show legacy `place_text` and `maps_url` the same way, so pre-#20 activities are not blank.
- Cost and currency on one line.
- Activity `notes`, `whiteSpace="pre-wrap"`.
- If every row would be empty: muted “No extra details.”

Do not repeat the title. Do not add, remove, or edit locations here. No Save button.

**Editor note field:** activity notes become a `Textarea` (same as the note editor) so a note you can read in the accordion can be edited as more than one line. Save payload stays `notes`. No other editor fields move.

Stay, note, and travel panels are unchanged apart from the icon buttons that open them.

---

## Touch points

| File | Change |
| --- | --- |
| [`packages/web/components/tp/TripPlanningBoard.tsx`](../../packages/web/components/tp/TripPlanningBoard.tsx) | Icon buttons, Anchor day no longer opens the editor, render activity details when the editor is closed. |
| `packages/web/components/tp/TripActivityActionDetails.tsx` | **New.** Default export. Owns open/closed state (default closed). Read-only body. Props: action, locations, action-location links. |
| [`packages/web/components/tp/TripActivityActionEditor.tsx`](../../packages/web/components/tp/TripActivityActionEditor.tsx) | Notes `Input` → `Textarea`. Still the editor only. |
| [`packages/web/components/app/AppIconTooltip.tsx`](../../packages/web/components/app/AppIconTooltip.tsx) | Reuse. No edit. |
| `@so/component` icons | `EditIcon`, `DeleteIcon`, `CrossIcon`, `ArrowUpIcon`, `ArrowDownIcon`. Already exported. |

No changes under `packages/model`, `packages/web/lib/api`, `supabase/migrations`, or MCP catalogs.

`TripPlanningBoard` is already past the project’s preferred file size. Prefer the small new details component so disclosure state is not inside `timeline.map` (a hook cannot live in that loop). Extracting a `TripDayActionCard` is allowed if the card JSX becomes the hard part to read. Do not split unrelated board sections in the same change.

Application files: `export default function`. No new `index.ts` barrels. No new dependency. No new `@so/model` export, so no new unit tests. No application tests.

---

## Accessibility

- Every icon button has a visible tooltip and an `aria-label`. Do not use the icon alone.
- Labels include the kind and title so a list of cards is unambiguous:
  - `Edit activity Shopping`
  - `Close editor Shopping` (when that card is open)
  - `Delete activity Shopping`
  - `Move activity Shopping up` / `Move activity Shopping down`
- Delete is still red **and** named. Colour is not the only cue. The confirm dialog stays.
- Details trigger is a `<button>` (or Chakra `Button`) with `aria-expanded` and `aria-controls` pointing at the body id.
- `EditIcon` / `DeleteIcon` / arrows stay `aria-hidden` (they already are). The button name is the accessible name.
- Maps links are real anchors with an href, not click handlers on a `div`.
- Size stays `xs`, matching the current card controls and the todo icon buttons. Do not shrink them.

---

## Implementation order (this branch, after approval)

1. `TripActivityActionDetails` read-only body + closed-by-default disclosure.
2. Board: wire it for `kind === activity` when that card is not the open editor. Hide the activity pencil unless the viewer can write and the row is canonical.
3. Replace Edit / Close / Delete / ↑ / ↓ with the icon buttons above. Adjust Anchor day so it does not open the editor.
4. Activity editor notes → `Textarea`.
5. QA below. No migration, no MCP, no Telegram.

---

## QA checklist

Use the web day view. The live HK–JP trip is fine to **look at**. Do not delete filled-in rows while checking. Create a throwaway activity on a scratch day if a destructive check is needed, and delete only that row.

- [ ] Each stay, activity, note, and travel card shows a pencil and, for a writer, a trash icon. The words Edit, Close, and Delete are gone from the card header.
- [ ] Trash still asks for confirmation and names the kind and title. Confirming removes that action from every day it appears (canonical and mirror). Cancel leaves it.
- [ ] A viewer sees no trash icon. A viewer sees no pencil on an **activity**. A viewer still sees a pencil on stay, note, and travel, and it still opens the current read-only panel.
- [ ] Activity glance is unchanged (time and shortened location list).
- [ ] Activity **Details** is closed on first paint. Opening it does not show inputs or Save. It lists every linked location (name, address, notes, map link), the time window, cost, and full notes. A second activity’s Details can be open at the same time.
- [ ] Map link opens in a new tab. Nothing in the accordion writes to the database (reload and confirm).
- [ ] An activity with only legacy `place_text` (no linked locations) still shows that place in Details.
- [ ] An activity with no time, locations, cost, or notes shows “No extra details.”
- [ ] Pencil on a canonical activity opens the existing editor (locations add/remove, Save). Details is hidden while that editor is open. Closing returns to the glance with Details closed.
- [ ] Pencil on a stay, note, or travel still opens that editor, including on a mirror row. Trash on a mirror still deletes the underlying action.
- [ ] **Anchor day** changes the selected day and does not open the editor.
- [ ] **+ Activity** still creates a card and opens the editor.
- [ ] Move up / down still reorders canonical cards, shows arrow icons, and exposes up/down to the keyboard and screen reader. Disabled at the ends.
- [ ] Activity notes can be entered on more than one line, saved, and read back in Details with line breaks.
- [ ] Reorder, destination accordions, trip catalog, and budget figures behave as they do today.
- [ ] Narrow viewport: the icon row does not cover the title. Buttons remain tappable.

---

## Decisions locked by this plan

| Topic | Decision |
| --- | --- |
| Which cards get pencil and trash | All four kinds. Trash: writers, canonical and mirror. |
| Activity pencil | Writers, canonical rows only. |
| Stay / note / travel pencil | Same audience as today’s Edit, including viewers and mirrors. |
| Accordion | **Activity only.** Closed by default. Many may be open. Editor replaces it while editing. |
| Accordion contents | Read-only, plus map links. Full locations, not the truncated glance. Legacy `place_text` when nothing is linked. |
| Anchor day | Navigates only. Does not open the editor. |
| Reorder | Arrow icons and accessible names, same behaviour. |
| Nested Delete / Remove / Save | Unchanged text buttons. |
| Data | UI only. No schema, migration, or MCP. |
| Where the code lands | Follow-up commits on **this** branch after Matthew approves. Draft until he says otherwise. |

## Left for Matthew

**Read accordion for stay, note, or travel.** Default if he does not comment: do not add them. Stay and travel already put the useful facts on the glance; note glance keeps the first line, and the pencil still opens the full note. Say if note (or stay/travel) should get the same closed-by-default Details pattern before implementation.

**Icon size on a phone.** Default is `xs`, same as the todo card actions. Say if the day-card icons should be `sm`.
