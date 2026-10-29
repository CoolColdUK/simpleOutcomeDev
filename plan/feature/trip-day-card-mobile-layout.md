# Day cards — mobile title and description on their own row

On a narrow screen the day-card controls sit in the same row as the title, so the title and the glance description are squeezed into the leftover width. Below the app’s `md` breakpoint the controls keep the first row and the title, description, and activity tags take a full-width second row. At `md` and above the card stays the single row it is today.

**Repo:** [CoolColdUK/simpleOutcomeDev](https://github.com/CoolColdUK/simpleOutcomeDev)  
**Base:** `develop` after [#25](https://github.com/CoolColdUK/simpleOutcomeDev/pull/25) (stay span pins, collapsed travel steps, Selected badge, hide past days). Prod is that line (`0.36.0`).  
**Earlier plans:** [trip-day-card-icons-activity-accordion.md](./trip-day-card-icons-activity-accordion.md) (icon edit/delete, activity Details, glance tags), [trip-done-travel-routes.md](./trip-done-travel-routes.md) (done checkbox), [trip-mobile-overflow-location-route.md](./trip-mobile-overflow-location-route.md) (wrap, line clamps, tag ellipsis), [trip-stay-span-travel-collapse-selected.md](./trip-stay-span-travel-collapse-selected.md) (top/bottom stay pins). This plan does not reopen those models.

**Status:** Draft plan on branch `cursor/trip-day-card-mobile-layout-e1d6`. Not implemented. Soft questions below are the recommended defaults; Matthew saying “go” accepts every default. Agents do not merge.

**Out of scope:** Telegram. Schema, migrations, MCP, REST. New npm packages. A new icon set. Changing `tpActionDayCardSummary`, tag parsing, the glance cap of four, or the line-clamp counts from #23. Stay-pin placement. Reordering rules. Realtime. New Vercel env vars. Application unit tests or a visual-regression dependency. The day-chip scroller. The **+ Activity / + Note / + Stay / + Travel** toolbar. Editors. Destination accordions.

---

## Goal

1. On a narrow viewport, a day action card’s controls occupy the first row and the title plus glance description occupy a full-width second row.
2. Activity, stay (including both #25 pins), travel, and note use that layout. They are one card header today.
3. From the `md` breakpoint up, the header is the current single row. Desktop is unchanged.
4. #23 truncation stays: same clamps, same tag cap. The only change is that each clamped line is the card width instead of the sliver beside the icons.
5. One set of controls in the DOM. Same `aria-label`s, same tooltips, same `xs` hit targets.

## Non-goals

- A second header implementation that mounts the buttons twice (`display: none` on one copy).
- Moving **Details** (`+` / `−`) into the control row. It is already a full-width row under the header.
- Stacking the **Selected** badge above the route-option summary. That header is one summary sentence, not a title plus a description.
- Stacking done checkboxes inside Details (activity location, travel step, linked transport).
- Larger or smaller icon buttons.
- More than two title lines or three description lines.
- Showing tags on stay, note, or travel.

---

## Current behaviour (develop after #25)

Day cards are rendered inline in [`TripPlanningBoard.tsx`](../../packages/web/components/tp/TripPlanningBoard.tsx) (`timeline.map`). One `Box` per timeline entry, key `` `${actionId}-${pin}` ``. Activity, note, stay, and travel share that header. A stay pin (`top` or `bottom`) is the same header; `pin !== 'flow'` only hides ↑ / ↓.

### What shares the row with the title

The header is one `HStack` (`justify="space-between"`, `wrap="wrap"`, `align="flex-start"`, `minW={0}`). It has two children.

**Left cluster** (`HStack`, `flex="1"`, `minW={0}`, does not wrap):

| Control | When | Widget |
| --- | --- | --- |
| Done | Activity, stay, travel. Not a note. | [`TripTpDoneCheckbox`](../../packages/web/components/tp/TripTpDoneCheckbox.tsx). Tooltip “Done for this day card only.” |
| Kind | Every card | Chakra `Badge`, text `activity` / `stay` / `travel` / `note`. There is no type SVG. |
| `mirror` | `displayMode === 'mirror'` | Outline `Badge`. Non-anchor stay pins included. |
| Title | Every card | [`TripTpTruncateText`](../../packages/web/components/tp/TripTpTruncateText.tsx), `lineClamp={2}`, `wordBreak="break-all"`. |
| Description | When the glance is more than the title | Same component, `fontSize="sm"`, `color="fg.muted"`, `lineClamp={3}`. |
| Tags | Activity, and only when the parse returns chips | [`TripDayCardTags`](../../packages/web/components/tp/TripDayCardTags.tsx) `max={4}`, under the description, inside the text `Stack`. |

The title, description, and tags are already a vertical `Stack` (`flex="1"`, `minW={0}`). They sit **beside** the checkbox and the badges, not under them. The description is [`actionCardSummary`](../../packages/web/components/tp/TripPlanningBoard.tsx): [`tpActionDayCardSummary`](../../packages/model/src/tp/tpActionDayCardSummary.ts) with the leading `title · ` stripped. Empty when the helper returns only the title.

| Kind | Description (glance, not the title) |
| --- | --- |
| Stay | Property (`place_text`) and check-in → check-out, or “Times not set”. Same sentence on both pins. |
| Activity | `start_time`–`end_time` when set, then up to two location names (or legacy `place_text`). |
| Travel | From → to, transport labels, local window or duration, selected route name, depart → arrive. |
| Note | First line of notes. No description block when notes are empty. |

**Right cluster** (`HStack`, no wrap, content width). Because the left cluster has `minW={0}` and `flex="1"`, this cluster does not drop to the next line. The text stack shrinks instead. That is the squeeze.

| Control | When | Widget |
| --- | --- | --- |
| Anchor day | Mirror, and `anchorDayId` is set | Text `Button` `size="xs"`. Changes the selected day. Does not open the editor. |
| Move up / down | Writer, canonical, `pin === 'flow'` | `IconButton` `size="xs"` + `ArrowUpIcon` / `ArrowDownIcon` (14px). Hidden on stay pins. |
| Delete | Writer, canonical and mirror, every pin | `IconButton` `size="xs"` `variant="ghost"` `colorPalette="red"` + `DeleteIcon`. |
| Edit / close | Activity and travel: writer and canonical. Stay and note: anyone who could open Edit today, including viewers and mirrors. | `IconButton` `size="xs"`. `EditIcon`, or `CrossIcon` while that pin’s editor is open. |

Each icon button is wrapped in [`AppIconTooltip`](../../packages/web/components/app/AppIconTooltip.tsx). `aria-label` matches the tooltip and includes kind and title (`Edit activity Shopping`, `Move stay Hotel up`, `Delete travel Flight`, `Close editor Shopping`). Icons are `aria-hidden`. Delete still confirms.

A writer’s canonical activity in normal flow is the widest row: checkbox, kind badge, title stack, ↑, ↓, delete, pencil. A mirror stay pin swaps the arrows for **Anchor day** and the `mirror` badge, which is wider than an icon. A viewer’s activity is the narrowest: checkbox, kind badge, and no pencil.

### What is already off that row

These do not share the title row. This plan leaves them there.

| Control | Where |
| --- | --- |
| Activity **Details** and travel **Details** | Full-width ghost `Button` under the header. Label `Details`, trailing `+` / `−` (not a chevron). `aria-expanded` / `aria-controls`. Closed by default. Hidden while that card’s editor is open. |
| Route option header | [`TripTpRouteOptionTitle`](../../packages/web/components/tp/TripTpRouteOptionTitle.tsx) inside the Details route button and inside the travel editor’s [`TripTpCollapsible`](../../packages/web/components/tp/TripTpCollapsible.tsx). **Selected** badge (`flexShrink={0}`) plus one summary `Text` (`lineClamp={3}`), then `+` / `−`. One sentence, not a title and a description. |
| Collapsed travel step | `TripTpCollapsible` title is one string (library label, from → to, times) plus `+` / `−`. |
| Activity location done, route-step done, linked-transport done | Checkbox beside a short label **inside** an open Details body. |
| **+ Activity / + Note / + Stay / + Travel** | Separate non-wrapping `HStack` on the Actions heading. Not inside the card. |
| Day chips | Horizontal scroller. Unchanged since the overflow plan. |

### Why the title loses width

The card is `minW={0}` `maxW="100%"` `overflowX="clip"` with `p={3}`. The page shell pads `px={{base: 4, md: 8}}` ([`so-theme.ts`](../../packages/web/styles/so-theme.ts)). Breakpoints are Chakra `defaultConfig` (the theme does not override them): `sm` 480px, `md` 768px. The rest of the app splits layout at `md` (`{base, md}`), not at `sm`.

On a ~390px phone the card’s content box is about 320px. The right cluster alone is four `xs` icon buttons (theme size `xs` is 32×32) plus gaps, and a mirror row adds the **Anchor day** label. The left cluster adds the checkbox and one or two badges. The text `Stack` is whatever remains, and `lineClamp` ellipsizes inside that remainder. `wrap="wrap"` on the outer row never gets a turn, because `minW={0}` lets the text shrink to zero before the icons wrap.

### Truncation this layout has to respect (#23, as shipped)

[`TripTpTruncateText`](../../packages/web/components/tp/TripTpTruncateText.tsx): `overflow="hidden"`, `textOverflow="ellipsis"`, `wordBreak="break-all"`, `lineClamp` (default 2). Glance title is 2. Glance description is 3. Details notes and location notes use their own clamps (4, and address 3). Those bodies are not in the header.

[`TripDayCardTags`](../../packages/web/components/tp/TripDayCardTags.tsx): wrapping row, at most four chips on the glance, then `+N` (`aria-label="{N} more tags"`). Each chip is `whiteSpace="nowrap"`, `maxW="100%"`, ellipsis. `100%` is the text stack’s width, so today a long chip ellipsizes inside the squeezed column. The full set is in activity Details, with no cap. The overflow plan’s original “let the chip wrap its words” landed as ellipsis instead. This plan does not switch it back.

---

## Desired behaviour

### Breakpoint

**Proposed default:** Chakra `md` (768px), mobile-first, same split as the shell padding and the marketing grids.

| Viewport | Header |
| --- | --- |
| Below `md` (`base`) | Row 1: controls. Row 2: title, description, tags, full card width. |
| `md` and up | Today’s single row. Text stack between the badges and the action icons. Text still `flex="1"` `minW={0}`. Icons do not shrink. |

No `useBreakpoint` hook. Responsive style props only, so the server render and the first client paint match.

### Who gets the two rows

Every day action card. One header component, so the kinds cannot drift.

| Card | Mobile row 1 | Mobile row 2 |
| --- | --- | --- |
| Activity, flow or mirror | Checkbox, kind badge, `mirror` when shown, then the action icons that role already has | Title, description, tag chips |
| Stay, `pin` `top`, `bottom`, or `flow` | Same. No ↑ / ↓ on a pin (`pin !== 'flow'`), same as today. Both pins of one stay use the stacked header. | Title and the stay glance (property, check-in → check-out). No tags. |
| Travel | Same as activity (pencil only for a writer on the canonical row). | Title and the travel glance. No tags. |
| Note | Kind badge and the icons. No done checkbox. | Title and the first note line when it exists. No tags. |

A viewer with only a checkbox and a badge still stacks. The title width does not depend on how many icons that role has.

**Details** stays the next block under the text, full width, for activity and travel. The editor, when open, stays under that, with the disclosure unmounted as it is today.

### Row 1 contents and order

Same controls, same visibility rules, same order as the current left-then-right reading order:

1. Done checkbox (when the kind has one)
2. Kind badge
3. `mirror` badge (mirrors only)
4. Anchor day (mirrors only)
5. Move up, move down (writer, canonical, `pin === 'flow'`)
6. Delete (writers)
7. Edit / close (same `showCardEdit` rule as today)

The action cluster (4–7) is one inner `HStack` with `flexShrink={0}` so the buttons stay a group. If that group does not fit beside the checkbox and badges, it wraps **under them and still above the title**. It does not sit on the title row.

Row 1 aligns to the start (`flex-start`), `gap={2}`, `wrap="wrap"`. Do not `space-between` the icons across an empty row.

### Row 2 contents

The existing text `Stack`, full width of the card content box (`flexBasis: 100%` below `md`, `minW={0}`, `maxW="100%"`):

1. Title, `lineClamp={2}`
2. Description, `lineClamp={3}`, omitted when `actionCardSummary` is `''`
3. Activity tags, `max={4}`, omitted when there are none

Nothing else moves into this stack. Kind and `mirror` stay on row 1 so the title line is only title.

### One DOM, desktop row unchanged

Do not render the buttons twice. One flex row, CSS `order` and `flex` only:

- Parent: `HStack`, `align="flex-start"`, `gap={2}`, `minW={0}`, `maxW="100%"`, `wrap={{base: 'wrap', md: 'nowrap'}}`.
- Checkbox, kind badge, `mirror` badge: `flexShrink={0}`, default `order` 0.
- Text stack: `order={{base: 1, md: 0}}`, `flex={{base: '1 0 100%', md: '1'}}`, `minW={0}`.
- Action cluster: default `order` 0, `flexShrink={0}`.

Below `md`, `order` paints every `order` 0 control before the text, and `flex-basis: 100%` puts the text on its own line. At `md`, every child is `order` 0, source order is checkbox → badges → text → actions, the text grows, and `nowrap` keeps a single row. That is the desktop header.

`TripPlanningBoard.tsx` is 935 lines. Put this header in a new application file [`TripDayActionCardHeader.tsx`](../../packages/web/components/tp/TripDayActionCardHeader.tsx) (`export default function`). The board keeps data loading, the timeline loop, Details, and the editors. The header is presentational: flags and handlers in, no fetch. No new `index.ts`. No new dependency.

### Truncation after the split

Clamps and the tag cap do not change. The width they measure does.

| Piece | After this plan, below `md` |
| --- | --- |
| Title | Still two lines, still `break-all`. Each line is the card width, so fewer characters are cut. |
| Description | Still three lines. A stay’s check-in → check-out, a travel’s from → to, and a note’s first line use the full card. |
| Glance tags | Still four chips then `+N`. A chip’s `maxW="100%"` is the card, not the leftover beside the icons, so a long token ellipsizes later. Chips still do not wrap internally. The row still wraps between chips. |
| Details | Unchanged, including uncapped tags and note `lineClamp={4}`. The rest of a clamped glance is still in Details (activity, travel) or the editor (stay, note). |

### Route option headers

**Proposed default:** leave them. The **Selected** badge is one word beside a three-line summary, and the summary is not split into a title and a description. Pulling the badge onto its own line would touch `TripTpRouteOptionTitle`, which is shared by travel Details and the travel editor. Not this pass.

### Tap targets and accessibility

- Icon buttons stay `size="xs"` (32×32 in the default Chakra icon-button recipe). That clears WCAG 2.2 SC 2.5.8 (24×24). Do not use `2xs`. Do not switch the phone to `sm`. #21 already locked `xs`; this request is about row width, not a smaller glyph.
- `gap={2}` (8px) stays between controls so the 32px targets do not overlap.
- The done checkbox keeps its current size. Do not scale it down to buy width. It moves to row 1 with the icons.
- **Anchor day** stays a text button at `size="xs"`. It is wider than an icon and may be what wraps the action cluster. It does not move onto the title row.
- `aria-label`s, tooltips, `aria-expanded` on Details, and the tag group’s `aria-label="Tags"` stay. Delete stays red and named, and the confirm dialog stays.
- Source order stays checkbox → badges → title → description → tags → actions → Details. Screen readers follow that order on every width. Below `md`, CSS `order` paints the actions **above** the title. The button name already includes the kind and the title (`Delete stay Hotel`), so the control is identifiable without a second copy of the heading. The title remains non-focusable text, as today. Do not promote it to a heading in this pass.
- One of each control in the tab order. Details stays after the header in the tab order, which is also where it is painted.

---

## Implementation sketch (after approval)

Layout only. No schema fork.

1. Add `TripDayActionCardHeader` and move the header JSX there. Props cover the flags the board already computes (`showActionDone`, `showCardEdit`, `displayMode`, `pin`, `expanded`, tags, title, summary, handlers). Do not recompute the workspace inside the header.
2. Apply the flex `order` / `flex` / `wrap` rules above. Keep `overflowX="clip"` on the card.
3. Leave Details, editors, route titles, step rows, the add-action toolbar, and the day chips where they are.
4. QA below. No migration, no MCP, no model test (no helper change).

Files: new `packages/web/components/tp/TripDayActionCardHeader.tsx`, and [`TripPlanningBoard.tsx`](../../packages/web/components/tp/TripPlanningBoard.tsx) only to render it. No SQL. No `@so/model` change.

---

## QA checklist

Phone width about 390px, a width just under 768px, and a width at 768px and above. The live HK–JP trip is fine to **look at**. Do not delete filled-in rows. Use a throwaway card on a scratch day if a control has to be pressed, and delete only that row.

- [ ] Below 768px, a writer’s canonical activity shows checkbox, kind badge, ↑, ↓, delete, and pencil on the first row, and the title and glance on a second row that runs the width of the card. Tags sit under the glance, not beside the pencil.
- [ ] A long title uses two full-width lines and then ellipsizes. A long glance uses three. They are not clipped mid-row by the icons.
- [ ] A long activity tag ellipsizes at the card width. Five tags still show four chips and `+N`. Details still lists every tag.
- [ ] A stay with a multi-day span uses the stacked header on the top pin and on the bottom pin. Neither pin shows ↑ / ↓. A middle day shows two stacked cards, each with its own control row and its own title row.
- [ ] A mirror card shows the `mirror` badge and **Anchor day** on the control row. Anchor day still only changes the selected day.
- [ ] A note has no done checkbox. Title (and the first note line, when present) is still on the second row.
- [ ] A viewer’s activity has no trash and no pencil. The title is still full width on row 2.
- [ ] Pencil, trash (confirm, cancel), done, and ↑ / ↓ behave as they do on `develop`. Labels are unchanged.
- [ ] **Details** is still under the text, still `+` / `−`, still closed on first paint. It is not in the control row.
- [ ] At 768px and above, the header is one row: checkbox and badges, then title and glance, then the action icons on the right. Tags stay under the glance. Compare with `develop` before calling it done.
- [ ] The page does not scroll horizontally. The day-chip strip can still scroll on its own.
- [ ] Route option headers still show **Selected** inline with the summary. The travel editor is unchanged.
- [ ] Keyboard: one tab stop per control, in the order checkbox, Anchor day, arrows, delete, edit, then Details. No duplicate buttons.

---

## Success criteria

- Draft review agrees the two-row split below `md` and the unchanged row from `md` up.
- After implementation on this branch: activity, stay pins, travel, and note follow the table above. A 390px card gives the title the content width of the card.
- Glance clamps and the four-tag cap match #23. Details is the place the rest is read.
- Desktop header matches `develop`.
- No migration, no MCP change, no new dependency, no second copy of the buttons.

## Risks

- Below `md` each card is one row taller. A middle day with two stay pins grows by two rows. That is the trade for a readable title.
- CSS `order` makes the phone paint actions above the title while the accessibility tree still reads the title first. Button names include the title, which is why a second DOM copy is not worth it. If a screen-reader pass feels wrong, the follow-up is to revisit order, not to mount the buttons twice.
- Just under 768px (a large phone in landscape, a narrow split view) stacks even when a few icons would have fit. `md` matches the rest of the app. Soft question 1 is the escape hatch.
- The action cluster wraps as a unit. On a 320px-wide card with **Anchor day**, row 1 can become two control lines and then the title. The title stays full width either way.
- Extracting the header is a move, not a behaviour change, on desktop. The QA item at ≥768px is what catches a missed `order` or `wrap` value.

---

## Soft questions for Matthew

Saying “go” accepts every recommended default.

1. **Breakpoint.** Recommended: stack below `md` (768px), single row from `md` up. Same split as the page shell. Say if it should instead be `sm` (480px), so only the narrow phone stacks, or `lg` (1024px), so a tablet stacks too.
2. **Row 1 membership.** Recommended: done checkbox, kind badge, `mirror` badge, Anchor day, ↑ / ↓, delete, and edit/close. Title, description, and activity tags on row 2. Say if the kind badge or the done checkbox should stay beside the title.
3. **Sparse cards.** Recommended: always stack below `md`, including a viewer activity that only has a checkbox and a badge, so the title width does not jump by role. Say if a card with no action icons should keep today’s one row.
4. **Details `+` / `−`.** Recommended: leave it under the title. It is not beside the title today, and it is not a chevron. Say if it should move up onto the control row.
5. **Route option headers.** Recommended: leave **Selected** inline with the summary in travel Details and in the travel editor. Say if that badge should sit on its own line above the summary below `md`.
6. **Nested done rows.** Recommended: leave activity-location, route-step, and linked-transport checkboxes beside their labels inside Details. Say if those should stack too.
7. **Truncation.** Recommended: keep title at 2 lines, glance at 3, glance tags at 4 then `+N`, chip ellipsis (no internal wrap). Only the line width grows. Say if the phone glance should show more lines now that the line is wider.
8. **Icon size.** Recommended: keep `xs` (32px). Do not shrink on the phone and do not grow to `sm`. Say if the control row should use a different size.
9. **Add-action toolbar.** Recommended: leave **+ Activity / + Note / + Stay / + Travel** as they are. Say if that row should wrap on a phone in the same change.
10. **Tests.** Recommended: the QA checklist above, on a phone width and at `md`. No new Jest suite and no Playwright. The web app has no component test runner, and this change adds no `@so/model` helper. Say if a browser check is not enough.
