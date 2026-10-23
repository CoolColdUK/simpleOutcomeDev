# Day cards — icon edit/delete, activity details accordion

Reading an activity should not mean opening the edit form. The day list stays a glance. Edit and delete on each day card are icon buttons, using the icons the app already has. Activity cards also show the tags already written on their linked locations.

**Repo:** [CoolColdUK/simpleOutcomeDev](https://github.com/CoolColdUK/simpleOutcomeDev)  
**Base:** `develop` after [#19](https://github.com/CoolColdUK/simpleOutcomeDev/pull/19) (glance, stay/travel cards, delete) and [#20](https://github.com/CoolColdUK/simpleOutcomeDev/pull/20) (`tp_location`, `tp_transport_lib`, activity/travel linking).  
**Earlier day-UI plan:** [trip-day-ui-polish.md](./trip-day-ui-polish.md) (shipped). This plan does not reopen that model.

**Status:** Implemented on this branch (PR #21). Agents do not merge.

**Out of scope:** Telegram. Schema, migrations, MCP, REST, including any real `tags` column. New npm packages. Reworking stay/travel/note editors. Nested form buttons (`Save`, `Remove`, `Delete route`, attachment `Delete`, catalog `Delete`). Bulk edits to the live HK–JP trip. Writing tags back into notes from the day card.

---

## Goal

1. On every day card, **Edit** and **Delete** are icon buttons (pencil / trash), not the strings `Edit`, `Close`, or `Delete`.
2. An **activity** can be read without the editor. Collapsed card = glance. An accordion on the card, **closed by default**, shows the full read-only details (locations, time window, cost, notes, tags). The pencil still opens the existing activity editor.
3. Stay, note, and travel keep today’s expand-to-editor behaviour. Only the control chrome changes to icons.
4. No database or agent-API change. Workspace payload from #20 already has every field the accordion and the tag parse need (`tp_location.notes`, `tp_action_location`).
5. An **activity** day card shows the combined, deduped tags of its linked locations. Glance gets a short chip row. Details repeats the full set. Tags are parsed from location notes. There is no tags column in this pass.

## Non-goals

- Accordions for stay, note, or travel (see [open point](#left-for-matthew)).
- Changing the glance sentence (`tpActionDayCardSummary` stays). Tags are a separate chip row, not more words in that sentence.
- Tags on stay, note, or travel cards (see [Tags](#tags-from-location-notes)).
- Turning reorder, “Anchor day”, “+ Activity”, or Save into icons beyond the reorder pair called out below.
- Editing locations, cost, notes, or tags from inside the accordion.
- A second activity-place table. #20 replaced `tp_activity_place` with `tp_location` + `tp_action_location`.
- A `tags` column, migration, or MCP field. The `Tags:` line in location notes remains the store until a later plan.

---

## Current behaviour (develop after #19 and #20)

Day cards are rendered inline in [`TripPlanningBoard.tsx`](../../packages/web/components/tp/TripPlanningBoard.tsx) (`timeline.map`). One `expandedActionId` means one open editor. [`TripTpCollapsible`](../../packages/web/components/tp/TripTpCollapsible.tsx) is used for destination “Important info” and “Destinations (trip)” only. It is a bordered toggle (`+` / `−`), default closed. Nothing in `packages/web/components/tp` uses Chakra `Accordion` or `IconButton`.

### Glance (collapsed)

| Kind | Collapsed line |
| --- | --- |
| **Stay** | Badge, title, property (`place_text`), check-in → check-out, or “Times not set”. |
| **Activity** | Badge, title, `start_time`–`end_time` when set, linked location names (truncated to two, plus a count). Falls back to legacy `place_text` when nothing is linked. **No tags.** |
| **Travel** | Badge, title, from → to (text or linked location names), transport-library labels, local window or duration, selected route, depart → arrive. |
| **Note** | Badge, title, first line of notes. |

Built by [`tpActionDayCardSummary`](../../packages/model/src/tp/tpActionDayCardSummary.ts) and `actionCardSummary` in the board. Cost, addresses, maps URLs, location notes, and the rest of a long note are **not** on the glance.

There is no tags field on `tp_location`, `tp_action`, or the workspace type. On the live trip, tags are a line inside location `notes`, for example `Tags: food, walk`. The day card does not read that line. Stay and note rows have no `tp_location` id. Travel can point at locations (`from_location_id`, `to_location_id`) but the card does not show their notes.

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

`loadDbTpWorkspace` returns `actions` (`startTime`, `endTime`, `notes`, `costAmount`, `costCurrency`, legacy `placeText` / `mapsUrl`, and on travel `fromLocationId` / `toLocationId`), `locations` (`name`, `address`, `mapsUrl`, `notes`), and `actionLocations` (`actionId`, `locationId`, `sortOrder`). The activity editor already joins those. The accordion and the tag parse can too. **No schema or MCP gap.** Do not add a tags column.

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
| Glance | Same summary sentence as today, plus the activity tag chips (below). |
| Accordion open, editor closed | Read-only details under the glance. |
| Editor open (`expandedActionId`) | Existing `TripActivityActionEditor`. The disclosure is not rendered while the editor is open, so the card does not show two bodies. Closing the editor returns to glance + a closed accordion. |
| **+ Activity** | Still opens the editor immediately (`setExpandedActionId`). Accordion stays closed. |

Disclosure chrome sits **inside** the card, under the header, with no second bordered box. Do not drop a full [`TripTpCollapsible`](../../packages/web/components/tp/TripTpCollapsible.tsx) (it draws its own border) inside the card. Copy its `+` / `−` toggle and default-closed behaviour. Trigger label: **Details**.

**Read-only body** (omit a row when the value is empty):

- Time window: `start_time`–`end_time` (HH:MM). One side only if the other is empty.
- **Tags:** the full combined set (same chips as the glance, no “+N” cap). Omit the row when there are none.
- Locations in `sort_order`: name, address when set, location notes **with `Tags:` lines removed**, and `mapsUrl` as a link (`target="_blank"`, `rel="noopener noreferrer"`). Link text is the URL or “Map”. The map link is the only control in the body. Tag chips are not buttons.
- When there are **no** `tp_action_location` rows, show legacy `place_text` and `maps_url` the same way, so pre-#20 activities are not blank.
- Cost and currency on one line.
- Activity `notes`, `whiteSpace="pre-wrap"`. Do **not** parse `Tags:` out of the activity’s own notes. A line there is prose, not a tag source.
- If every row would be empty (no tags, time, locations, cost, or notes): muted “No extra details.”

Do not repeat the title. Do not add, remove, or edit locations or tags here. No Save button.

### Tags from location notes

Tags are shown on **activity** cards only.

| Kind | Why |
| --- | --- |
| **Activity** | Already linked through `tp_action_location` to one or more `tp_location` rows. Combine every linked location’s tags. |
| **Travel** | `from_location_id` and `to_location_id` are real links, so a later pass could reuse the same helper on those two notes. **Not in this pass.** The travel glance is already a long summary, and this ask is the activity set. Do not pull tags from transport-library endpoints. |
| **Stay** | Property is `place_text` plus an optional destination. No `tp_location` id. Do not match `place_text` to a location name. |
| **Note** | Free text. No location link. Do not scan the note body for `Tags:`. |

Legacy activities that only have `place_text` and no `tp_action_location` rows have nothing to parse. They show no tag chips.

**Parse** (pure helper, no I/O):

`tpTagsFromLocationNotes(notesInOrder)` in [`packages/model/src/tp/tpTagsFromLocationNotes.ts`](../../packages/model/src/tp/tpTagsFromLocationNotes.ts). The caller passes one notes string per location, already in display order. For an activity that order is `tp_action_location.sort_order` (ties keep the order the caller passed). Missing locations are skipped.

`tpLocationNotesWithoutTagLines(notes)` in [`packages/model/src/tp/tpLocationNotesWithoutTagLines.ts`](../../packages/model/src/tp/tpLocationNotesWithoutTagLines.ts) returns the notes with tag lines removed, or `undefined` when nothing remains. Details uses it so the `Tags:` line is not printed again under the location.

Re-export both from [`packages/model/src/tp/index.ts`](../../packages/model/src/tp/index.ts) the same way as the other `tp*` helpers (`export {default as …}`). The line matcher lives in `tpTagsFromLocationNotes.ts` and is imported by the strip helper so the two cannot disagree. Do not export the matcher. Unit tests cover both public functions. No web-only copy of the parse.

Rules:

1. Split a notes string on lines (`\n`, also `\r\n`).
2. A tag line is a line that, after leading trim, matches `tags` then optional space then `:`, case-insensitive. `Tags: food` and `tags : food` count. `Tagged: food` and `See tags: food` do not (the word must be the whole start of the line).
3. The remainder of that line is split on **commas only**. Semicolons, slashes, and `#` stay inside the token.
4. Trim each token. Drop empty tokens. Do not collapse spaces inside a token (`street food` stays two words).
5. Walk lines top to bottom, then locations in caller order, tokens left to right.
6. Dedupe with `toLowerCase()` (not locale case). Keep the **first** spelling. `Food` then `food` → `Food`. `food` then `Food` → `food`.
7. A line that is only `Tags:` adds nothing. A comma token is not parsed again as a tag line (`Tags: food, Tags: walk` → `food` and `Tags: walk`).
8. `undefined`, `''`, and notes with no tag line → `[]`.

**Glance chips** (header, still visible while the editor is open):

- Chakra `Badge`, `variant="outline"`, `size="sm"`, in a wrapping row under the summary sentence. Not appended to `tpActionDayCardSummary`.
- Same order as the helper. Zero tags → render nothing (no “No tags” on the glance).
- **At most four** tag chips. When there are more, a fifth badge shows `+N` (`N` is the count not shown). `+N` is not a tag. The full set is in Details.
- Canonical and mirror cards show the same chips (same links).

**Details** repeats every tag as the same kind of badge, with no cap, under a “Tags” label. Omit the row when the list is empty.

Chips are not filters and not links. The group has `aria-label="Tags"`. The overflow badge has `aria-label="{N} more tags"`.

**Editor note field:** activity notes become a `Textarea` (same as the note editor) so a note you can read in the accordion can be edited as more than one line. Save payload stays `notes`. No other editor fields move.

Stay, note, and travel panels are unchanged apart from the icon buttons that open them.

---

## Touch points

| File | Change |
| --- | --- |
| [`packages/model/src/tp/tpTagsFromLocationNotes.ts`](../../packages/model/src/tp/tpTagsFromLocationNotes.ts) | **New.** Default export. Parse and dedupe. |
| [`packages/model/src/tp/tpLocationNotesWithoutTagLines.ts`](../../packages/model/src/tp/tpLocationNotesWithoutTagLines.ts) | **New.** Default export. Notes body with tag lines removed. |
| [`packages/model/src/tp/tpTagsFromLocationNotes.test.ts`](../../packages/model/src/tp/tpTagsFromLocationNotes.test.ts) | Cases below. Cover the strip helper in the same file or a sibling test. |
| [`packages/model/src/tp/index.ts`](../../packages/model/src/tp/index.ts) | Re-export both helpers. |
| [`packages/web/components/tp/TripPlanningBoard.tsx`](../../packages/web/components/tp/TripPlanningBoard.tsx) | Icon buttons, Anchor day no longer opens the editor, activity details when the editor is closed, glance tag chips. |
| `packages/web/components/tp/TripActivityActionDetails.tsx` | **New.** Default export. Owns open/closed state (default closed). Read-only body including the full tag list. Props: action, locations, action-location links. |
| `packages/web/components/tp/TripDayCardTags.tsx` | **New.** Default export. Presentational chip row. Props: tags, and `max` (`4` on the glance, unset in Details). No parse logic. |
| [`packages/web/components/tp/TripActivityActionEditor.tsx`](../../packages/web/components/tp/TripActivityActionEditor.tsx) | Notes `Input` → `Textarea`. Still the editor only. Do not add a tag editor. |
| [`packages/web/components/app/AppIconTooltip.tsx`](../../packages/web/components/app/AppIconTooltip.tsx) | Reuse. No edit. |
| `@so/component` icons | `EditIcon`, `DeleteIcon`, `CrossIcon`, `ArrowUpIcon`, `ArrowDownIcon`. Already exported. |

No changes under `packages/web/lib/api`, `supabase/migrations`, or MCP catalogs. `@so/model` gains only the two pure helpers.

`TripPlanningBoard` is already past the project’s preferred file size. Prefer the small new details component so disclosure state is not inside `timeline.map` (a hook cannot live in that loop). Extracting a `TripDayActionCard` is allowed if the card JSX becomes the hard part to read. Do not split unrelated board sections in the same change.

Application files: `export default function`. No new `index.ts` barrels in `packages/web`. No new dependency. No application tests.

### Tests (`@so/model` only)

| Helper | Cases |
| --- | --- |
| `tpTagsFromLocationNotes` | `Tags: Food, Walk` → `Food`, `Walk`. Second location `tags: walk, Museum` → `Food`, `Walk`, `Museum` (first casing kept). `Food, food` → one `Food`. `tags : street food` keeps the internal space. `Tags:` and blank tokens add nothing. `See tags: food` and `Tagged: food` are ignored. Semicolon stays in the token. `undefined` and notes with no tag line → `[]`. Line order then location order. |
| `tpLocationNotesWithoutTagLines` | Mixed notes keep the non-tag lines and drop every tag line. Only tag lines → `undefined`. `undefined` notes → `undefined`. |

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
- Tag chips are text badges in a group labelled `Tags`. They are not buttons. The glance overflow badge is named “N more tags”.
- Size of icon buttons stays `xs`, matching the current card controls and the todo icon buttons. Do not shrink them. Tag badges use `sm`.

---

## Implementation order (this branch, after approval)

1. `tpTagsFromLocationNotes` and `tpLocationNotesWithoutTagLines`, with unit tests.
2. `TripDayCardTags` plus `TripActivityActionDetails` (closed by default, full tag list, location notes without tag lines).
3. Board: activity details when that card is not the open editor; glance chips (max four, then `+N`). Hide the activity pencil unless the viewer can write and the row is canonical.
4. Replace Edit / Close / Delete / ↑ / ↓ with the icon buttons above. Adjust Anchor day so it does not open the editor.
5. Activity editor notes → `Textarea`.
6. QA below. No migration, no MCP, no Telegram.

---

## QA checklist

Use the web day view. The live HK–JP trip is fine to **look at**. Do not delete filled-in rows while checking. Create a throwaway activity on a scratch day if a destructive check is needed, and delete only that row.

- [ ] Each stay, activity, note, and travel card shows a pencil and, for a writer, a trash icon. The words Edit, Close, and Delete are gone from the card header.
- [ ] Trash still asks for confirmation and names the kind and title. Confirming removes that action from every day it appears (canonical and mirror). Cancel leaves it.
- [ ] A viewer sees no trash icon. A viewer sees no pencil on an **activity**. A viewer still sees a pencil on stay, note, and travel, and it still opens the current read-only panel.
- [ ] Activity glance sentence is unchanged (time and shortened location list). Under it, outline badges show the combined tags.
- [ ] Two linked locations, `Tags: Food, Walk` and `tags: walk, Museum`, produce chips **Food**, **Walk**, **Museum** on the glance and the same three in Details. Walk is not repeated. The first spelling wins.
- [ ] A fifth and later tag is not a glance chip. The glance shows four tags and a `+N` badge. Details lists every tag, with no `+N`.
- [ ] An activity with no `Tags:` lines, and a stay, note, or travel card, shows no tag chips. A travel row with `from_location_id` set still shows no chips. An activity note that contains `Tags: …` does not add chips.
- [ ] An activity with only legacy `place_text` (no linked locations) shows no tag chips.
- [ ] Activity **Details** is closed on first paint. Opening it does not show inputs or Save. It lists every linked location (name, address, notes **without** the `Tags:` line, map link), the time window, cost, full notes, and the full tag list. A second activity’s Details can be open at the same time. Glance chips stay visible while Details or the editor is open.
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
| Accordion contents | Read-only, plus map links. Full locations, not the truncated glance. Legacy `place_text` when nothing is linked. Full tag list. Location notes omit `Tags:` lines. |
| Tags source | Location `notes` lines matching `Tags:` (case-insensitive, optional space before `:`). Not a column. Not activity notes. |
| Parse | Comma-split, trim, drop blanks. Dedupe with `toLowerCase()`, keep first spelling. Order: location `sort_order`, then left to right. |
| Where tags show | **Activity only.** Glance: outline chips, max 4, then `+N`. Details: every chip again. Stay and note have no location id. Travel’s from/to location ids are not shown this pass. |
| Glance sentence | `tpActionDayCardSummary` unchanged. Chips sit under it. |
| Anchor day | Navigates only. Does not open the editor. |
| Reorder | Arrow icons and accessible names, same behaviour. |
| Nested Delete / Remove / Save | Unchanged text buttons. |
| Data | UI plus two pure `@so/model` tag helpers and tests. |
| Where the code lands | **This** branch / PR #21. |

## Transport library and travel instance (Matthew scope expansion)

**Migration:** [`20261023210000_trip_location_contact_action_transport_instance.sql`](../../supabase/migrations/20261023210000_trip_location_contact_action_transport_instance.sql) (Production `db push`).

| Change | Shape |
| --- | --- |
| `tp_location` | Optional `open_time`, `close_time`, `website`, `email`, `phone` (`time` / `text`). |
| `tp_transport_lib.mode` | Nullable. No default. Enum check only when non-null. Label is the user-facing name (e.g. `bus 123`). |
| `tp_action_transport` | Instance overrides: `duration_minutes`, `cost_amount`, `cost_currency`, `from_location_id`, `to_location_id`. Link row is no longer sort-order only. |

**MCP / REST**

- `create_tp_location` / `update_tp_location`: `openTime`, `closeTime`, `website`, `email`, `phone` (optional). Workspace `locations[]` includes them.
- `link_tp_action_transport`: optional instance fields on create. **`update_tp_action_transport`** (new) and `PATCH …/action-transports/{linkId}` for updates. Workspace `actionTransports[]` includes instance fields.
- `create_tp_transport_lib` / `update_tp_transport_lib`: `mode` optional (omit or null).

Web: location catalog editor, activity Details, travel “Linked transports” rows edit and save instance fields. Route `tp_transport` legs unchanged in this pass.

## Left for Matthew

**Read accordion for stay, note, or travel.** Default if he does not comment: do not add them. Stay and travel already put the useful facts on the glance; note glance keeps the first line, and the pencil still opens the full note. Say if note (or stay/travel) should get the same closed-by-default Details pattern before implementation.

**Icon size on a phone.** Default is `xs`, same as the todo card actions. Say if the day-card icons should be `sm`.

**Glance tag cap.** Default is four chips, then `+N`, with the full set in Details. Say if the glance should show every chip instead.
