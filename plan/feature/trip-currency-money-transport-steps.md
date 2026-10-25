# Trip currency list, shared money field, transport steps

A price should pick its currency from a fixed list, through one shared amount + currency control. A transport in the library is a **label** plus an optional free-text mode. A route step picks that transport. It does not ask for a mode of its own.

**Repo:** [CoolColdUK/simpleOutcomeDev](https://github.com/CoolColdUK/simpleOutcomeDev)  
**Base:** `develop` after [#23](https://github.com/CoolColdUK/simpleOutcomeDev/pull/23) (Prod v0.34: location country, route price/currency/duration/`transport_lib_id`, travel from/to locations, `TripTpTimestampField`, type-filtered selects, truncate). Matthew confirmed truncate works.  
**Earlier plans:** [trip-planning.md](./trip-planning.md) (locked travel → route → step model), [trip-day-card-icons-activity-accordion.md](./trip-day-card-icons-activity-accordion.md) (optional library mode, still an enum), [trip-done-travel-routes.md](./trip-done-travel-routes.md), [trip-mobile-overflow-location-route.md](./trip-mobile-overflow-location-route.md) (implemented as #23). This plan follows those tables. It does not replace them.

**Status:** Plan only. No feature code on this branch. Agents do not merge. Implement only after Matthew approves this draft.

**Out of scope:** Telegram. A `tags` column or rewriting tag parsing. Browser sign-in docs. Redesigning trip planning. Dropping the travel → route → step model. A new currency or country lookup table. Renaming MCP tools or REST paths. Realtime. New Vercel env vars. New npm packages. Making `tp_transport.transport_lib_id` required. A backfill that invents library rows for old steps. Bulk edits of the live HK–JP trip.

---

## Goal

1. **Currency is a fixed list.** Amounts stay numeric. Currency codes are chosen from a searchable ISO 4217-style list, the same interaction as [`TripTpCountrySelect`](../../packages/web/components/tp/TripTpCountrySelect.tsx) / [`tpIsoCountries.ts`](../../packages/model/src/tp/tpIsoCountries.ts). A new money field with no stored currency opens on the trip’s budget currency, then the pod default currency.
2. **One money control.** `TripTpMoneyField` (`export default function`) is the only amount + currency editor: route option, route step, activity, stay, note, and transport-library template.
3. **Library mode is a string.** `tp_transport_lib` is a label (the name: walk, train, bus 123) plus an optional free-text mode. The predefined mode dropdown and the database enum check on that column go away. There is no replacement enum.
4. **A step picks a transport.** The route-step editor leads with a transport select onto `tp_transport_lib`. It does not show a step mode dropdown. On save, `tp_transport.mode` is written from the linked library’s mode string, or `other` when that string is blank, so the existing `NOT NULL` column stays valid.
5. **From and to sit on one row each.** For a journey and for a step, the location type filter and the location select share one wrapping row. The same for the other end.

## Non-goals

- A second planning model, or moving step clock times off `tp_transport`.
- Dropping `tp_transport.mode`, `tp_route.transport_lib_id`, `tp_action.cost_*`, or `tp_action_transport`.
- Requiring `transport_lib_id` on every step, or inserting library rows for steps that have none.
- Copying a library template’s price, duration, or locations onto a step when the select changes.
- A trip-settings screen for budget currency. Those columns already exist; this pass only stops free-typed codes on the writers that already accept them.
- Replacing `TripTpCountrySelect` or the location-type list.

---

## Current behaviour (develop after #23)

### Currency is typed

`cost_currency` is unconstrained `text` on `tp_action`, `tp_route`, `tp_transport`, `tp_transport_lib`, and `tp_action_transport`. `tp_trip.budget_currency` is unconstrained `text`. `tp_setting.default_currency` is `text not null default 'GBP'` with `tp_setting_currency_not_blank` (`char_length(trim(default_currency)) >= 3`) only. No ISO check anywhere.

The web editors are plain `Input`s:

| Surface | File | What it shows |
| --- | --- | --- |
| Route option | [`TripTravelActionEditor.tsx`](../../packages/web/components/tp/TripTravelActionEditor.tsx) `BoxRoute` | **Option price** + **Currency** (width `5rem`). |
| Route step | same file, `TransportRow` | Placeholders **Cost** and **Currency**, plus booking ref, in one `HStack`. |
| Activity | [`TripActivityActionEditor.tsx`](../../packages/web/components/tp/TripActivityActionEditor.tsx) | **Activity cost** + **Currency**. |
| Stay | [`TripStayActionEditor.tsx`](../../packages/web/components/tp/TripStayActionEditor.tsx) | **Cost** + **Currency**. |
| Note / simple | [`TripSimpleActionEditor.tsx`](../../packages/web/components/tp/TripSimpleActionEditor.tsx) | **Cost** + **Currency**. |
| Library template | [`TripTripCatalogPanel.tsx`](../../packages/web/components/tp/TripTripCatalogPanel.tsx) `TransportLibRow` | **Price** + **Cur.** |

Each one initializes with `stored costCurrency ?? defaultCurrency ?? ''` and writes `null` when the string is empty. [`TripPlanningBoard.tsx`](../../packages/web/components/tp/TripPlanningBoard.tsx) passes `defaultCurrency={trip.budgetCurrency}` into all of them. The workspace also loads `settings.defaultCurrency` from `tp_setting` ([`loadDbTpWorkspace.ts`](../../packages/web/lib/api/db/tp/loadDbTpWorkspace.ts)). The board never reads it.

Valibot treats every `costCurrency`, `budgetCurrency`, and `defaultCurrency` as an optional string ([`tpAgentSchemas.ts`](../../packages/model/src/tp/tpAgentSchemas.ts)). Country codes are the exception: `isTpIsoCountryCode` plus `^[A-Z]{2}$`. Currency has no twin.

The travel editor no longer edits price on `tp_action_transport` (`actionTransports` is unused). [`TripTravelActionDetails.tsx`](../../packages/web/components/tp/TripTravelActionDetails.tsx) still prints a legacy link’s currency as text. That is display, not a second editor.

There is no shared money component. [`TripTpTimestampField`](../../packages/web/components/tp/TripTpTimestampField.tsx) is the pattern to copy: one default-exported file, used everywhere that trio appears.

### Library mode is still the old enum

[`tp_transport_lib`](../../supabase/migrations/20261023190000_trip_locations_transports.sql) started as `mode text not null default 'other'` with `tp_transport_lib_mode_check` limited to `flight`, `train`, `coach`, `bus`, `car`, `ferry`, `walk`, `other`. [#21](https://github.com/CoolColdUK/simpleOutcomeDev/pull/21) ([`20261023210000_trip_location_contact_action_transport_instance.sql`](../../supabase/migrations/20261023210000_trip_location_contact_action_transport_instance.sql)) dropped `NOT NULL` and the default, then recreated the check as “null, or one of those eight words”. The catalog control is still that list: **Mode (optional)** `NativeSelect` in `TransportLibRow`, options from [`tpTransportModes.ts`](../../packages/web/components/tp/tpTransportModes.ts). Empty saves `null`. A typed value such as `bus 123` or `JR Yamanote` cannot be stored. The label column is already the name, and `tp_transport_lib_label_not_blank` already requires it.

[`TripTpTransportLibSelect`](../../packages/web/components/tp/TripTpTransportLibSelect.tsx) lists library labels and adds a second **Filter by mode** select of the same eight words. A row whose `mode` is null is treated as `other` for that filter (`t.mode ?? 'other'`), so “All modes” is the only filter that shows a modeless template. The route accordion uses this select as **Whole-option transport (library)** and keeps its own `transportModeFilter` state.

MCP blurbs still say mode is optional on `create_tp_transport_lib` and do not say it is free text. The valibot field is `optionalString` / `optionalNullString`, so the enum is enforced by Postgres, not by the schema. A free-text `mode` fails at insert.

### A step still asks for a mode, and cannot pick a transport

`tp_transport.mode` is `text not null default 'other'` with `tp_transport_mode_check` — the same eight words ([`20261022150000_pod_viewer_trip_planning.sql`](../../supabase/migrations/20261022150000_pod_viewer_trip_planning.sql)). Nothing after that drops the check. `transport_lib_id` is an optional FK (`on delete set null`) added in #20. The step form does not edit it.

`TransportRow` always renders **Step mode** as a `NativeSelect` of `TP_TRANSPORT_MODES`, whether or not `transport.transportLibId` is set. Save always sends `draft.mode` ([`saveTransport`](../../packages/web/components/tp/TripTravelActionEditor.tsx)). `updateDbTpTransport` has no `transportLibId` field, so the browser cannot persist a step link. **+ Step** calls `createDbTpTransport(routeId, count)` with no library id and `mode: 'other'`.

`create_tp_transport` / `update_tp_transport` also omit `transportLibId`. Create writes `mode` from the caller or `'other'`. The blurb still says `mode: flight/train/bus/ferry/car/other`. #23’s plan said a linked step should copy library mode and hide the dropdown. The shipped editor still shows the dropdown and never writes the step’s `transport_lib_id`. The route-level `tp_route.transport_lib_id` from #23 is a different column. It stays the whole-option means. It is not the step’s means.

The route summary already prints a library label and, when set, its mode in parentheses ([`tpRouteOptionSummary.ts`](../../packages/model/src/tp/tpRouteOptionSummary.ts)). That display can show a free-text mode once the column allows one. It does not need a new enum.

### From / to type filter is stacked under the location

[`TripTpLocationSelect`](../../packages/web/components/tp/TripTpLocationSelect.tsx) is a vertical `Stack`: the location `NativeSelect`, then **Filter by type**. Journey from and journey to each use one of those stacks inside an `HStack`. Step from and step to do the same. So each end is two lines. The activity editor’s **Add location** row is already a wrapping `HStack` of type filter + select. Catalog transport from/to are plain location selects with no type filter.

---

## Desired behaviour

### 1. Fixed currency list

New module [`packages/model/src/tp/tpIsoCurrencies.ts`](../../packages/model/src/tp/tpIsoCurrencies.ts), named exports, re-exported from [`packages/model/src/tp/index.ts`](../../packages/model/src/tp/index.ts). Same shape as countries: `{code, name}`, `TP_ISO_CURRENCIES`, `filterTpIsoCurrencies`, `isTpIsoCurrencyCode`, `tpIsoCurrencyName`.

Curated active ISO 4217 codes, parallel to the country subset already shipped (plus `EUR` for the euro countries on that list). No lookup table. No new check constraint on `cost_currency` (country has none; a check would make every added code a migration).

| Code | Name |
| --- | --- |
| HKD | Hong Kong dollar |
| JPY | Japanese yen |
| CNY | Chinese yuan |
| TWD | New Taiwan dollar |
| KRW | South Korean won |
| SGD | Singapore dollar |
| MYR | Malaysian ringgit |
| THB | Thai baht |
| VND | Vietnamese dong |
| IDR | Indonesian rupiah |
| PHP | Philippine peso |
| INR | Indian rupee |
| AUD | Australian dollar |
| NZD | New Zealand dollar |
| USD | US dollar |
| CAD | Canadian dollar |
| GBP | Pound sterling |
| EUR | Euro |
| CHF | Swiss franc |
| SEK | Swedish krona |
| NOK | Norwegian krone |
| DKK | Danish krone |
| PLN | Polish zloty |
| CZK | Czech koruna |
| TRY | Turkish lira |
| AED | UAE dirham |
| SAR | Saudi riyal |
| ILS | Israeli new shekel |
| EGP | Egyptian pound |
| ZAR | South African rand |
| MXN | Mexican peso |
| BRL | Brazilian real |
| ARS | Argentine peso |
| MOP | Macanese pataca |

`isTpIsoCurrencyCode` is case-insensitive. Writers store the uppercase code. The UI only submits uppercase codes from the list.

**Default when the stored currency is empty**, in this order:

1. `tp_trip.budget_currency` when it is on the list (the header already shows this next to the budget amount, and the editors already receive it).
2. Else `tp_setting.default_currency` when it is on the list (column default `GBP`).
3. Else empty, until a code is chosen.

[`TripPlanningBoard`](../../packages/web/components/tp/TripPlanningBoard.tsx) passes that resolved string as the existing `defaultCurrency` prop. A row that already has `cost_currency` keeps it, including a legacy value that is not on the list. The select shows that stored code as an extra option (the country select already keeps a selected code that the filter hid) so opening the form does not wipe it. Choosing a different currency must be a list code. MCP and REST reject a new currency string that is not on the list. Omitting the key still leaves the column alone, so an old off-list value survives until someone changes it. No currency backfill.

Valibot follows the country pattern: optional string, uppercase `^[A-Z]{3}$`, and `isTpIsoCurrencyCode`. Use it for `costCurrency` on action, route, step, library, and action-transport link schemas, and for `budgetCurrency` and `defaultCurrency` on trip create/update. Nullable update fields still accept `null` to clear `cost_currency`. `tp_setting.default_currency` stays `NOT NULL`; its update does not accept null.

### 2. `TripTpMoneyField`

New file `packages/web/components/tp/TripTpMoneyField.tsx`. `export default function`. Props: amount label, amount string, currency string, optional disabled, and one change callback `{amount, currency}`.

Layout: a wrapping `HStack` (`minW={0}`, `maxW="100%"`) so a phone does not grow sideways. The amount stays a numeric `Input`. The currency half is the country interaction: a search `Input` (code or name) and a `NativeSelect` of `CODE · name`, plus a blank option. No free-typed currency box. No new dependency.

Replace every amount + currency `Input` pair listed above. Booking ref on the step stays its own field. The legacy action-transport block stays display-only in Details; do not add an editor. If that editor returns later, it uses this component.

Empty amount saves `null`. Empty currency saves `null`. A non-empty amount may be saved with a currency; the component does not invent a second rule that the amount requires a currency (today’s columns are independent).

### 3. Library row is label + optional mode string

Catalog `TransportLibRow`: **Label** stays required. **Mode (optional)** becomes a text `Input`. Blank saves `null`. Any other string saves as typed (`bus 123`, `express`, `walk`). Remove the mode `NativeSelect`.

`TripTpTransportLibSelect` drops **Filter by mode** and the `modeFilter` / `onModeFilterChange` props. Options stay the library label, with the mode string in parentheses when it is set. The route accordion’s whole-option select uses the simplified component. Its filter state goes away.

Delete [`tpTransportModes.ts`](../../packages/web/components/tp/tpTransportModes.ts) once nothing imports it. Do not keep the eight words as a hidden validator in valibot or in the UI.

MCP blurbs for `create_tp_transport_lib` / `update_tp_transport_lib`: label is the name; `mode` is an optional free-text string. Schema stays `optionalString` / `optionalNullString` with no enum.

### 4. Step transport, derived mode

The step editor’s first control is `TripTpTransportLibSelect`, label **Transport**. Remove the **Step mode** dropdown. There is no free-text mode field on the step. Mode text is edited on the library row.

| Step state | Editor | Save |
| --- | --- | --- |
| A library row is selected | Transport select. If that row’s mode string is non-empty, show it as read-only text under the select. No mode input. | `transport_lib_id` = that id. `mode` = trimmed library mode, or `other` when the library mode is null or blank. Ignore any mode the client also sent. |
| No library row (legacy, or a new step not linked yet) | Transport select, empty, is the prompt. No mode dropdown and no mode text box. A stored mode may show as muted read-only text (`Stored mode: train`) so the old value is visible. | Leave `mode` unchanged on update. Create with no library id still inserts `mode` `other` (column default). Clearing the link (update `transportLibId: null`) clears the FK and does not rewrite `mode`. |

**+ Step** still inserts an unlinked step. The user then picks a transport and saves. Save is allowed with an empty transport select. The UI prefers a transport by leading with that select. It does not block the save.

Shared helper in the model package, named export, used by the editor and by the agent handlers:

`tpStepModeFromLibrary(mode: string | undefined | null): string`  
Trim. Empty, null, or whitespace returns `other`. Any other string returns that trim. It does not map unknown words onto the old enum.

Browser `updateDbTpTransport` gains `transportLibId`. The step save sends it. The server create/update path loads the owned library row when the id is set and writes `mode` from the helper, so a caller cannot store a mode that disagrees with the link.

`tp_route.transport_lib_id` stays the whole-option means from #23. Linking a transport on a step does not change the route row, and linking one on the route does not change the step. **+ Step** still does not copy the route’s library id.

### 5. From and to on one row

Change `TripTpLocationSelect` from a vertical `Stack` to a wrapping `HStack` (`wrap="wrap"`, `align="flex-end"`, `minW={0}`). **Filter by type** and the location select sit on that row. Each field can shrink and wrap on a narrow phone (`flex="1"`, `minW={0}`). Journey from, journey to, step from, and step to all use this component, so one change covers them. The activity **Add location** row is already a wrapping row; leave it. Catalog transport from/to have no type filter; leave them.

---

## Schema / migration

One migration. Create it with `supabase migration new trip_transport_mode_free_text` when implementing. Do not hand-name the timestamp.

```sql
alter table public.tp_transport_lib
  drop constraint if exists tp_transport_lib_mode_check;

alter table public.tp_transport
  drop constraint if exists tp_transport_mode_check;
```

What that leaves:

| Column | After this migration |
| --- | --- |
| `tp_transport_lib.mode` | Nullable `text`, no default, no check. Already nullable since #21. |
| `tp_transport_lib.label` | Unchanged. Still required and non-blank. |
| `tp_transport.mode` | `text not null default 'other'`. The enum check is gone so a library string such as `JR Yamanote` can be copied here. `other` remains the fallback when the linked mode is blank and when a step is inserted with no library id. |
| `tp_transport.transport_lib_id` | Unchanged. Still optional. |
| `cost_currency`, `budget_currency`, `default_currency` | Unchanged columns. List membership is application validation, same as `tp_location.country`. |

No data rewrite. Existing enum words stay valid text. No new enum. No new index. `database.ts` column types stay `mode: string` on `tp_transport` and `mode: string | null` on `tp_transport_lib`.

Why the step check has to go in the same migration: the library string is what gets written onto `tp_transport.mode`. Leaving `tp_transport_mode_check` in place would reject every custom mode and force `other`, which drops the string this plan is storing. The `NOT NULL` default stays, so the column does not need a second fallback design.

Production applies the migration only through the **Production** GitHub Actions `db push`. Do not apply it from a laptop. No new Vercel env vars. Nothing new under Database → Extensions. Local: `supabase db reset`.

---

## MCP + REST parity

Same handlers. No renamed tools. No new permission resource (still the `trip` grant). REST routes in [`dispatchAgentRestMore.ts`](../../packages/web/lib/api/agent/dispatchAgentRestMore.ts) call these handlers, so they pick up the same bodies.

| Area | MCP | REST | Change |
| --- | --- | --- | --- |
| Currency | Every tool that already takes `costCurrency`, `budgetCurrency`, or `defaultCurrency` | Same bodies | Value must be an uppercase code on `TP_ISO_CURRENCIES`, or null where the update schema already allows null. Blurbs name the list (example: `JPY`, `HKD`, `GBP`). |
| Library | `create_tp_transport_lib`, `update_tp_transport_lib` | `POST/PATCH …/trip/transport-library` | `mode` is an optional free-text string. Label stays required. Blurb drops any reading that mode is the eight-word enum. |
| Step | `create_tp_transport`, `update_tp_transport` | `POST/PATCH …/trip/transports` | Optional `transportLibId`. When set, the server writes `mode` from that library row and ignores a different `mode` in the call. When omitted on create, `mode` defaults to `other`. When omitted on update, `mode` and the link stay. Update `transportLibId: null` clears the link and leaves `mode`. |
| Route | `update_tp_route` | `PATCH …/trip/routes/{id}` | Unchanged shape. `costCurrency` joins the list check. Whole-option `transportLibId` stays. |
| Action-transport link | `link_tp_action_transport`, `update_tp_action_transport` | `POST/PATCH …/trip/action-transports` | Contract stays. `costCurrency` joins the list check. Still not the editor path for option price. |

Patch semantics stay: omit a key to leave the column; send null on an update schema that already allows null to clear a nullable column.

`CreateTransportSchema` and `UpdateTransportSchema` gain `transportLibId` (required string on create when present; null allowed on update). The agent create/update functions must persist `transport_lib_id`. Today they never set it.

---

## Touch points

| File | Change |
| --- | --- |
| `supabase/migrations/<new>_trip_transport_mode_free_text.sql` | Drop the two mode checks. `supabase migration new trip_transport_mode_free_text`. |
| [`packages/model/src/tp/tpIsoCurrencies.ts`](../../packages/model/src/tp/tpIsoCurrencies.ts) | **New.** List, filter, name, membership. |
| [`packages/model/src/tp/tpStepModeFromLibrary.ts`](../../packages/model/src/tp/tpStepModeFromLibrary.ts) | **New.** Named export. Blank library mode → `other`; otherwise the trimmed string. |
| [`packages/model/src/tp/index.ts`](../../packages/model/src/tp/index.ts) | Re-export both. |
| [`packages/model/src/tp/tpAgentSchemas.ts`](../../packages/model/src/tp/tpAgentSchemas.ts) | Currency pipes. `transportLibId` on step create/update. Library `mode` stays a free optional string. |
| [`packages/web/components/tp/TripTpMoneyField.tsx`](../../packages/web/components/tp/TripTpMoneyField.tsx) | **New.** Default export. |
| [`TripTpLocationSelect.tsx`](../../packages/web/components/tp/TripTpLocationSelect.tsx) | Type filter and location select on one wrapping row. |
| [`TripTpTransportLibSelect.tsx`](../../packages/web/components/tp/TripTpTransportLibSelect.tsx) | Label list only. Drop the mode filter props. |
| [`tpTransportModes.ts`](../../packages/web/components/tp/tpTransportModes.ts) | Remove when unused. |
| [`TripTravelActionEditor.tsx`](../../packages/web/components/tp/TripTravelActionEditor.tsx) | Money field on the route option and the step. Step transport select. Stop sending a user-edited step mode. Drop the route mode-filter state. |
| [`TripActivityActionEditor.tsx`](../../packages/web/components/tp/TripActivityActionEditor.tsx), [`TripStayActionEditor.tsx`](../../packages/web/components/tp/TripStayActionEditor.tsx), [`TripSimpleActionEditor.tsx`](../../packages/web/components/tp/TripSimpleActionEditor.tsx), [`TripTripCatalogPanel.tsx`](../../packages/web/components/tp/TripTripCatalogPanel.tsx) | Money field. Library mode text input. |
| [`TripPlanningBoard.tsx`](../../packages/web/components/tp/TripPlanningBoard.tsx) | Resolve `defaultCurrency` from budget currency, then settings. |
| [`updateDbTpTransport.ts`](../../packages/web/lib/api/db/tp/updateDbTpTransport.ts) | Accept `transportLibId`. |
| [`tpAgentTransports.ts`](../../packages/web/lib/api/agent/tpAgentTransports.ts) | Persist `transportLibId`. Derive `mode` when the link is set. |
| [`mcpCatalogByFeature.ts`](../../packages/web/lib/api/mcp/mcpCatalogByFeature.ts) | Blurbs and the step `transportLibId` property. Currency descriptions. |

Application files: `export default function`. No new `index.ts` under `packages/web`. Package helpers stay named exports. No new dependency. No application tests.

`TripTravelActionEditor` is already large. The money field and the step mode helper live in their own files. Do not split unrelated editor sections in the same change.

### Tests (`@so/model` only, when implementing)

| Helper | Cases |
| --- | --- |
| `isTpIsoCurrencyCode` / `filterTpIsoCurrencies` | `JPY` and `jpy` match. `yen` and `JP` do not. Filter matches code or name. Empty query returns the full list. |
| `tpStepModeFromLibrary` | `null`, `undefined`, `''`, and whitespace return `other`. `walk` stays `walk`. ` bus 123 ` returns `bus 123`. A string outside the old eight words is returned unchanged. |

No test for the SQL drop or the React layout.

---

## Accessibility

- `TripTpMoneyField`: visible labels **Amount** (or the caller’s label, such as **Option price**) and **Currency**. The search input’s label is **Search currency**.
- The transport select’s accessible name is **Transport**. Read-only mode text is plain text, not a disabled select that still looks editable.
- `TripTpLocationSelect` keeps the caller’s location label and **Filter by type**. Putting them on one row does not drop either label.
- Library **Mode (optional)** stays a labeled text field. **Label** stays labeled.

---

## Implementation order (after approval)

1. Model: currency list and `tpStepModeFromLibrary`, with unit tests. Valibot currency pipes and step `transportLibId`.
2. Migration (checks only) and MCP/REST: free-text library mode, step link, derived step mode, currency rejection. Blurbs.
3. `TripTpMoneyField`. Swap every amount + currency pair. Board passes the resolved default.
4. Catalog: mode text input. Transport select loses the mode filter. Remove `tpTransportModes.ts`.
5. Step editor: transport select, no mode dropdown, save derives mode and writes `transportLibId`.
6. `TripTpLocationSelect` on one wrapping row per endpoint.
7. QA below.

---

## QA checklist

Use a phone-width viewport (about 390px) and the desktop width. The live HK–JP trip is fine to **look at**. Do not delete filled-in rows. Create a throwaway travel and a throwaway library row on a scratch day if a write is needed, and delete only those rows.

- [ ] Route option, step, activity, stay, note, and a library template each show one amount field and a currency search + select. None of them shows a currency text box. Searching `jp` or `yen` finds `JPY`. Saving `JPY` reloads as `JPY`.
- [ ] A new price on a trip whose budget currency is `HKD` opens on `HKD`. A trip with no budget currency opens on the pod setting (`GBP` unless it was changed). A row that already has `JPY` keeps `JPY`.
- [ ] MCP `update_tp_route` with `costCurrency: "yen"` fails validation. `costCurrency: "JPY"` matches REST `PATCH …/trip/routes/{id}`. Clearing with null clears the column.
- [ ] Catalog: a library row saves with only a label. Mode left blank is null. Mode `bus 123` saves and comes back. The mode control is a text field. `get_tp_workspace` returns that string. MCP `update_tp_transport_lib` and REST match.
- [ ] The transport select lists labels (`walk`, `train`, `bus 123`) and has no mode filter. The route’s whole-option transport select is the same control.
- [ ] A step shows **Transport** and no mode dropdown. Choosing `bus 123` and saving sets `transport_lib_id` and sets `mode` to that row’s mode string. A linked library row with a null mode saves step `mode` `other`. The step form does not let you type a different mode while the link is set.
- [ ] **+ Step** still adds a step with no library id. Saving it without a transport succeeds. An existing step that has a mode and no library id still shows that mode as read-only text and still saves its other fields.
- [ ] MCP `create_tp_transport` with `transportLibId` and a conflicting `mode` stores the library mode. REST `POST/PATCH …/trip/transports` matches. Clearing `transportLibId` clears the FK and leaves `mode`.
- [ ] Journey from: type filter and location select are on one row. Journey to is its own row. Step from and step to match. At about 390px the rows wrap inside the card and the page does not scroll horizontally.
- [ ] Done checkboxes, route accordions, depart/arrive timestamps, location country, and truncate from #23 still behave as they do on `develop`.

---

## Decisions locked by this plan

| Topic | Decision |
| --- | --- |
| Currency list | Curated ISO 4217 codes in `tpIsoCurrencies.ts`. Searchable select, same pattern as country. No currency table and no currency check constraint. |
| Stored off-list currency | Shown so it is not wiped. New choices and API writes must be on the list. No backfill. |
| Default currency | Empty money field uses `budget_currency` when it is on the list, else `default_currency`, else blank. |
| Money UI | One `TripTpMoneyField` for every amount + currency editor. |
| Library | Label required. Mode is an optional free-text string. Drop `tp_transport_lib_mode_check`. No new enum. |
| Mode filter | Removed from the transport select. The list is labels. |
| Step control | Transport select. No step mode dropdown and no step mode text box. |
| Step `mode` column | Stays `NOT NULL` default `other`. Drop `tp_transport_mode_check` so the library string can be stored. Blank library mode writes `other`. |
| Linked save | Server and editor write `mode` from the library and ignore a caller mode. |
| Unlinked step | Allowed. Create uses `other`. Update leaves `mode` alone. Clearing the link leaves `mode`. |
| Route means | `tp_route.transport_lib_id` stays the whole-option link. It is not copied onto new steps. |
| From / to | Type filter and location select share one wrapping row, per end, via `TripTpLocationSelect`. |
| `tp_action_transport` | Still legacy. Tools stay. The editor does not grow a price form there. |
| Migration | One file, the two `DROP CONSTRAINT`s only. |

---

## Open questions

1. **Step with no `transport_lib_id`.** Recommendation: keep the column optional. The new step UI prompts for a transport and still saves a legacy or brand-new row that has none. Do not backfill library rows and do not add `NOT NULL` unless Matthew says that is required. Existing steps keep their stored mode until a transport is chosen.
2. **Which default wins.** Recommendation: trip `budget_currency` first, then pod `default_currency` (often `GBP`). Say if the pod setting should win instead.
3. **Full ISO 4217.** Recommendation: the curated table above, the same size of list as countries. Say if a missing code has to be added before implementation, or if the list should be the full active ISO 4217 set.
4. **Unlinked step mode box.** Recommendation: no mode field on the step at all. Mode is edited on the library row. A legacy unlinked step shows its stored mode as read-only text. Say if an unlinked step should still have a free-text mode box.
