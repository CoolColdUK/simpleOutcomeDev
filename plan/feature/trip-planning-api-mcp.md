# Trip planning REST API + MCP — plan

Expose the **trip planning** feature (merged from PR #9, tables `tp_*` / helpers `lib/api/db/tp/*` / components `components/tp/*`) to agents and integrations via REST and hosted MCP, following the pattern established in [`api-mcp.md`](./api-mcp.md).

**Repo:** [CoolColdUK/simpleOutcomeDev](https://github.com/CoolColdUK/simpleOutcomeDev)  
**Reference:** [`api-mcp.md`](./api-mcp.md), [`financial planning-implementation.md`](./financial%20planning-implementation.md)  
**Related:** [trip-planning.md](./trip-planning.md) (product requirements), PR #9 (merged trip planning implementation), migration `supabase/migrations/20261022150000_pod_viewer_trip_planning.sql`

**Status:** PLAN ONLY — no implementation code yet

---

## Goal

1. Add **`trip`** as a feature resource in the API key permission matrix (alongside `todo`, `fp`, `space`, `group`, `profile`).
2. Expose trip planning operations via **REST** (`/api/pods/{podId}/trip/...`) and **hosted MCP** tools.
3. REST and MCP call the **same** service layer (existing `lib/api/db/tp/*` helpers).
4. Mirror the authz pattern: key grant ∧ pod membership ∧ featureKind match ∧ pod role (viewer/user/admin/owner).
5. Cover the full trip model: trips, destinations, days, actions (stay/travel/activity/note), routes, transports, attachments, settings.

---

## Principles

| Principle | Detail |
| --- | --- |
| Same code | REST and MCP call identical service functions. No duplicated logic. |
| Existing helpers | Use merged `lib/api/db/tp/*` (e.g. `createDbTpAction`, `updateDbTpDay`, `loadDbTpWorkspace`). |
| Pod-scoped grant | `pods[podId].trip` on the API key, checked per call. |
| Role-aware | Respect `pod_viewer` (read-only), `pod_user`/`pod_admin` (write), `pod_owner` (all). |
| Fail closed | Missing grant, revoked key, or insufficient role → deny. |
| Attachment safety | Base64 upload (like `replace_todo_card_icon`); 5MB limit; JPEG/PNG/PDF only. |
| Timezone explicit | Instants as ISO 8601 (UTC); timezone as IANA string; formatted display client-side. |

---

## API key permission matrix

### Feature kind and resource

**Feature:** `trip_planning` (already merged in `FeatureKind` enum and `pod.feature` check).

**Resource:** `trip` (stored as `pods[podId].trip` on the API key).

**Actions:** `create` | `read` | `update` | `delete`

### Permission matrix (UI and presets)

The **pod permission table** in `AccountApiKeysPanel` already groups pods by space. For `trip_planning` pods:

- **Pod row label:** pod name (trip planning)
- **Cells:** Create / Read / Update / Delete checkboxes
- **Stored:** `pods[podId].trip` array of actions `['read', 'create', 'update', 'delete']`
- **Row toggle:** sets all four cells for that pod
- **Column toggles:** apply to trip pods like todo/fp pods

**Preset behavior:**

| Preset | Effect on trip pods |
| --- | --- |
| **All on** | Create, Read, Update, Delete checked on every trip pod row |
| **All off** | All cells unchecked |
| **All read** | Read checked; Create, Update, Delete off |

No extra "Delete all" checkbox (unlike fp). Trip deletion uses the standard `delete` action.

### Sub-resources

Trip planning has nested entities (destination, day, action, route, transport, attachment). The matrix does **not** separate them into columns. Instead:

**One `trip` resource grant covers:**

| Sub-resource | Create | Read | Update | Delete |
| --- | --- | --- | --- | --- |
| **trip** (metadata) | Pod creation wizard | Read trip | Update trip fields | Delete trip (pod delete path) |
| **destination** | Add destination | List/get destinations | Update destination | Remove destination |
| **day** | Auto-synced from trip dates | Read day timeline | Update day notes/title | Auto-pruned |
| **action** | Add action | List/get actions | Update action, reorder | Delete action |
| **route** | Add route to travel action | List/get routes | Update route, select route | Delete route |
| **transport** | Add transport to route | List/get transports | Update transport | Delete transport |
| **attachment** | Upload attachment | Download signed URL | Replace attachment | Delete attachment |
| **setting** | Auto-created on pod | Read settings | Update currency | (pod delete) |

**Enforcement:**

- **Create:** includes trip init, add destination/day/action/route/transport/attachment, upload attachment.
- **Read:** includes workspace load, list operations, signed URLs.
- **Update:** includes trip/destination/day/action/route/transport updates, reorder actions, select route, anchor day sync.
- **Delete:** includes remove destination/action/route/transport/attachment.

`pod_viewer` gets **read only** (no create/update/delete). This is enforced by RLS (`can_write_tp_pod`) and mirrored in the agent layer.

---

## MCP tools

Tool names follow existing conventions (`{verb}_{feature}_{resource}`). Descriptions are short (like `list_fp_accounts`, `create_todo_card`).

All tools require `podId` (uuid). Input schemas use valibot (mirror `agentFpTransactionWriteSchema` style). Output schemas mirror UI types.

### Trip and settings

| Tool | Description | Input | Output | Action | Notes |
| --- | --- | --- | --- | --- | --- |
| `get_trip` | Read trip metadata. | `{podId}` | Trip object | `read` | Returns trip fields: title, timezone, start/end dates, status, budget, maps_url, notes. Fails if no trip row (should exist after pod create). |
| `update_trip` | Update trip fields. | `{podId, title?, timezone?, startDate?, endDate?, status?, budgetAmount?, budgetCurrency?, mapsUrl?, notes?}` | Updated trip | `update` | On date change, syncs `tp_day` rows (via `syncTpDaysForTrip`). |
| `get_tp_setting` | Read trip settings. | `{podId}` | Setting object | `read` | Returns `{defaultCurrency}`. |
| `update_tp_setting` | Update default currency. | `{podId, defaultCurrency}` | Updated setting | `update` | 3-char currency code. |

### Destinations

| Tool | Description | Input | Output | Action | Notes |
| --- | --- | --- | --- | --- | --- |
| `list_tp_destinations` | List destinations for trip. | `{podId}` | `{destinations: [...]}` | `read` | Ordered by `sort_order`. |
| `create_tp_destination` | Create destination. | `{podId, name, sortOrder?, mapsUrl?, timezoneHint?, importantInfo?, activeStartDate?, activeEndDate?, notes?}` | New destination | `create` | Name required. |
| `update_tp_destination` | Update destination. | `{podId, destinationId, name?, sortOrder?, mapsUrl?, timezoneHint?, importantInfo?, activeStartDate?, activeEndDate?, notes?}` | Updated destination | `update` | |
| `delete_tp_destination` | Delete destination. | `{podId, destinationId}` | `{ok: true}` | `delete` | Cascade nullifies FKs on actions/transports. |
| `reorder_tp_destinations` | Reorder destinations. | `{podId, orderedIds: string[]}` | `{ok: true}` | `update` | Array of destination IDs in new order. |

### Days

| Tool | Description | Input | Output | Action | Notes |
| --- | --- | --- | --- | --- | --- |
| `list_tp_days` | List days for trip. | `{podId}` | `{days: [...]}` | `read` | Ordered by `day_index`. Includes day fields: day_index, calendar_date, day_title, day_notes, primary_destination_id. |
| `update_tp_day` | Update day header. | `{podId, dayId, dayTitle?, dayNotes?, primaryDestinationId?}` | Updated day | `update` | Day header fields only (not actions). |

**Note:** Days are auto-synced when trip dates change (`update_trip` calls `syncTpDaysForTrip`). No separate create/delete day tools.

### Actions

Actions cover **travel**, **stay**, **activity**, **note** kinds.

| Tool | Description | Input | Output | Action | Notes |
| --- | --- | --- | --- | --- | --- |
| `list_tp_actions` | List actions for trip. | `{podId, anchorDayId?}` | `{actions: [...]}` | `read` | Optional filter by anchor day. Returns all action kinds. |
| `get_tp_action` | Get one action. | `{podId, actionId}` | Action object | `read` | Includes routes/transports for travel actions. |
| `create_tp_action` | Create action. | `{podId, kind, title, anchorDayId?, destinationId?, placeText?, mapsUrl?, fromPlace?, toPlace?, fromDestinationId?, toDestinationId?, fromMapsUrl?, toMapsUrl?, checkInAt?, checkOutAt?, checkInTimezone?, checkOutTimezone?, startTime?, endTime?, costAmount?, costCurrency?, bookingRef?, url?, notes?, sortOrder?}` | New action | `create` | Kind required: `travel`, `stay`, `activity`, `note`. Field requirements vary by kind (e.g. stay needs check-in/out; travel needs from/to). |
| `update_tp_action` | Update action. | `{podId, actionId, title?, anchorDayId?, destinationId?, placeText?, mapsUrl?, fromPlace?, toPlace?, fromDestinationId?, toDestinationId?, fromMapsUrl?, toMapsUrl?, checkInAt?, checkOutAt?, checkInTimezone?, checkOutTimezone?, startTime?, endTime?, costAmount?, costCurrency?, bookingRef?, url?, notes?, selectedRouteId?}` | Updated action | `update` | Kind cannot change. Anchor day change recalcs mirrors. |
| `delete_tp_action` | Delete action. | `{podId, actionId}` | `{ok: true}` | `delete` | Cascade deletes routes/transports. |
| `reorder_tp_actions` | Reorder actions on day. | `{podId, anchorDayId, orderedIds: string[]}` | `{ok: true}` | `update` | Array of action IDs in new sort order for that anchor day. |

**Travel action anchor day logic:**  
Anchor day = trip day matching `localDate(first_transport.depart_at, depart_timezone)` on selected route. Handled server-side when route/transport times change.

### Routes

Routes are alternatives under a **travel** action.

| Tool | Description | Input | Output | Action | Notes |
| --- | --- | --- | --- | --- | --- |
| `list_tp_routes` | List routes for action. | `{podId, actionId}` | `{routes: [...]}` | `read` | Includes transports per route. |
| `create_tp_route` | Create route. | `{podId, actionId, name, notes?, sortOrder?}` | New route | `create` | Name required. |
| `update_tp_route` | Update route. | `{podId, routeId, name?, notes?, sortOrder?}` | Updated route | `update` | |
| `delete_tp_route` | Delete route. | `{podId, routeId}` | `{ok: true}` | `delete` | Cascade deletes transports; nullifies `selected_route_id` on parent action. |
| `select_tp_route` | Set selected route. | `{podId, actionId, routeId}` | `{ok: true}` | `update` | Updates `selected_route_id` on action; recalcs span/mirrors for multi-day travel. |

### Transports

Transports are segments within a route.

| Tool | Description | Input | Output | Action | Notes |
| --- | --- | --- | --- | --- | --- |
| `list_tp_transports` | List transports for route. | `{podId, routeId}` | `{transports: [...]}` | `read` | Ordered by `sort_order`. |
| `create_tp_transport` | Create transport. | `{podId, routeId, mode?, fromPlace?, toPlace?, departAt?, arriveAt?, departTimezone?, arriveTimezone?, costAmount?, costCurrency?, bookingRef?, url?, notes?, sortOrder?}` | New transport | `create` | Mode defaults to `other`; choices: `flight`, `train`, `coach`, `bus`, `car`, `ferry`, `walk`, `other`. Times are ISO 8601 instants. |
| `update_tp_transport` | Update transport. | `{podId, transportId, mode?, fromPlace?, toPlace?, departAt?, arriveAt?, departTimezone?, arriveTimezone?, costAmount?, costCurrency?, bookingRef?, url?, notes?}` | Updated transport | `update` | Changing times/timezones may recalc anchor day on parent action. |
| `delete_tp_transport` | Delete transport. | `{podId, transportId}` | `{ok: true}` | `delete` | Cascade deletes attachments. |
| `reorder_tp_transports` | Reorder transports. | `{podId, routeId, orderedIds: string[]}` | `{ok: true}` | `update` | Array of transport IDs in new order for that route. |

### Attachments

Attachments hang off **transports** (tickets) or **destinations** (safety docs). MIME: `image/jpeg`, `image/png`, `application/pdf`. Limit: 5MB per file.

| Tool | Description | Input | Output | Action | Notes |
| --- | --- | --- | --- | --- | --- |
| `list_tp_attachments` | List attachments. | `{podId, transportId?, destinationId?}` | `{attachments: [...]}` | `read` | Filter by parent. Returns metadata + signed URLs. |
| `upload_tp_attachment` | Upload attachment. | `{podId, transportId?, destinationId?, fileName, mimeType, contentBase64}` | New attachment | `create` | Exactly one parent (transport XOR destination). Base64 encode file. Size check: decoded bytes ≤ 5MB. MIME must be jpeg/png/pdf. |
| `delete_tp_attachment` | Delete attachment. | `{podId, attachmentId}` | `{ok: true}` | `delete` | Removes storage object + DB row. |

**Upload flow:**  
1. Client base64-encodes file.  
2. MCP tool validates size/MIME.  
3. Server decodes, uploads to `pod-private` storage (`{podId}/tp/transport/{transportId}/{attachmentId}-{safe_filename}` or `{podId}/tp/destination/{destinationId}/{attachmentId}-{safe_filename}`).  
4. DB row created with `storage_path`.  

**Read flow:**  
List/get tools include signed URLs (7-day expiry, like todo card icons).

### Workspace and bulk read

| Tool | Description | Input | Output | Action | Notes |
| --- | --- | --- | --- | --- | --- |
| `get_tp_workspace` | Load full workspace. | `{podId}` | `{trip, destinations, days, actions, routes, transports, attachments, setting}` | `read` | Uses existing `loadDbTpWorkspace` helper. One call returns entire trip data (like UI workspace load). |

**Open question:** Should this be in v1, or should agents call individual list tools? (Prefer including it for efficiency.)

---

## REST endpoints

REST routes mirror MCP tools under `/api/pods/{podId}/trip/...`. Method + path patterns:

### Trip and settings

- `GET /api/pods/{podId}/trip` → `get_trip`
- `PATCH /api/pods/{podId}/trip` → `update_trip`
- `GET /api/pods/{podId}/trip/settings` → `get_tp_setting`
- `PATCH /api/pods/{podId}/trip/settings` → `update_tp_setting`

### Destinations

- `GET /api/pods/{podId}/trip/destinations` → `list_tp_destinations`
- `POST /api/pods/{podId}/trip/destinations` → `create_tp_destination`
- `PATCH /api/pods/{podId}/trip/destinations/{destinationId}` → `update_tp_destination`
- `DELETE /api/pods/{podId}/trip/destinations/{destinationId}` → `delete_tp_destination`
- `POST /api/pods/{podId}/trip/destinations/reorder` → `reorder_tp_destinations` (body: `{orderedIds}`)

### Days

- `GET /api/pods/{podId}/trip/days` → `list_tp_days`
- `PATCH /api/pods/{podId}/trip/days/{dayId}` → `update_tp_day`

### Actions

- `GET /api/pods/{podId}/trip/actions` → `list_tp_actions` (query: `?anchorDayId={uuid}`)
- `GET /api/pods/{podId}/trip/actions/{actionId}` → `get_tp_action`
- `POST /api/pods/{podId}/trip/actions` → `create_tp_action`
- `PATCH /api/pods/{podId}/trip/actions/{actionId}` → `update_tp_action`
- `DELETE /api/pods/{podId}/trip/actions/{actionId}` → `delete_tp_action`
- `POST /api/pods/{podId}/trip/actions/reorder` → `reorder_tp_actions` (body: `{anchorDayId, orderedIds}`)

### Routes

- `GET /api/pods/{podId}/trip/routes` → `list_tp_routes` (query: `?actionId={uuid}`)
- `POST /api/pods/{podId}/trip/routes` → `create_tp_route`
- `PATCH /api/pods/{podId}/trip/routes/{routeId}` → `update_tp_route`
- `DELETE /api/pods/{podId}/trip/routes/{routeId}` → `delete_tp_route`
- `POST /api/pods/{podId}/trip/routes/select` → `select_tp_route` (body: `{actionId, routeId}`)

### Transports

- `GET /api/pods/{podId}/trip/transports` → `list_tp_transports` (query: `?routeId={uuid}`)
- `POST /api/pods/{podId}/trip/transports` → `create_tp_transport`
- `PATCH /api/pods/{podId}/trip/transports/{transportId}` → `update_tp_transport`
- `DELETE /api/pods/{podId}/trip/transports/{transportId}` → `delete_tp_transport`
- `POST /api/pods/{podId}/trip/transports/reorder` → `reorder_tp_transports` (body: `{routeId, orderedIds}`)

### Attachments

- `GET /api/pods/{podId}/trip/attachments` → `list_tp_attachments` (query: `?transportId={uuid}` or `?destinationId={uuid}`)
- `POST /api/pods/{podId}/trip/attachments` → `upload_tp_attachment`
- `DELETE /api/pods/{podId}/trip/attachments/{attachmentId}` → `delete_tp_attachment`

### Workspace

- `GET /api/pods/{podId}/trip/workspace` → `get_tp_workspace`

**Dispatcher:** Extend `dispatchAgentRest.ts` and/or `dispatchAgentRestMore.ts` with trip routes (follow existing `/pods/{podId}/todo/...` pattern).

---

## Implementation notes

### Service layer

**Existing helpers** (merged from PR #9, `packages/web/lib/api/db/tp/`):

- `createDbTpAction`, `updateDbTpAction`, `updateDbTpActionSortOrders`
- `createDbTpAttachment`, `deleteDbTpAttachment`
- `createDbTpRoute`, `deleteDbTpRoute`, `selectDbTpRoute`
- `createDbTpTransport`, `deleteDbTpTransport`, `updateDbTpTransport`
- `updateDbTpDay`, `updateDbTpDestination`
- `createDbTpTripBundle` (wizard helper)
- `loadDbTpWorkspace` (full workspace load)

**New helpers needed:**

- `getDbTpTrip`, `updateDbTpTrip`
- `listDbTpDestinations`, `createDbTpDestination`, `deleteDbTpDestination`, `reorderDbTpDestinations`
- `listDbTpDays`
- `listDbTpActions`, `getDbTpAction`, `deleteDbTpAction`, `reorderDbTpActions`
- `listDbTpRoutes`, `createDbTpRoute`, `updateDbTpRoute`, `selectDbTpRoute` (may exist)
- `listDbTpTransports`, `createDbTpTransport`, `updateDbTpTransport`, `reorderDbTpTransports`
- `listDbTpAttachments` (with signed URLs)
- `getDbTpSetting`, `updateDbTpSetting`
- Sync helper `syncTpDaysForTrip` (called on trip date update)

**Attachment storage:**  
- Use existing storage helpers pattern (`uploadStorageTpAttachment`, signed URL generation like `listStorageTodoCardIconSignedUrls`).
- Bucket: `pod-private`
- Paths: `{podId}/tp/transport/{transportId}/{attachmentId}-{safe_filename}` or `{podId}/tp/destination/{destinationId}/{attachmentId}-{safe_filename}`

**Authz enforcement:**  
- `requirePodAgent(request, {featureKind: 'trip_planning', podId, resource: 'trip', action})` (follow `fpCall` pattern).
- RLS already enforces `can_read_tp_pod` / `can_write_tp_pod` (viewer vs writer).

### Agent adapter layer

**MCP catalog:** Add trip tools to `mcpCatalogExtra.ts` (or new `tpAgentTools.ts` if grouping separately).  
**REST dispatcher:** Extend `dispatchAgentRest.ts` or `dispatchAgentRestMore.ts` with trip routes.

**Valibot schemas:** Define in `@so/model` (e.g. `agentTpActionSchema`, `agentTpTransportSchema`, `agentTpAttachmentUploadSchema`).  
**Agent result types:** Mirror UI types from `@so/model` trip schemas.

---

## Timezone and date formats

### Input format

**Dates:** ISO 8601 date strings (`YYYY-MM-DD`) for `startDate`, `endDate`, `calendar_date`, `activeStartDate`, `activeEndDate`, `postedDate`.

**Instants:** ISO 8601 datetime strings (UTC) for `checkInAt`, `checkOutAt`, `departAt`, `arriveAt`. Examples:
- `2026-11-15T14:00:00Z` (UTC)
- `2026-11-15T14:00:00+08:00` (offset; server converts to UTC)

**Timezones:** IANA timezone strings for `timezone`, `checkInTimezone`, `checkOutTimezone`, `departTimezone`, `arriveTimezone`, `timezoneHint`. Examples: `Europe/London`, `Asia/Hong_Kong`, `America/New_York`.

**Times (local):** ISO 8601 time strings (`HH:MM` or `HH:MM:SS`) for `startTime`, `endTime` on activities/notes (interpreted in trip timezone context on anchor day).

### Output format

**Dates:** ISO 8601 date strings.  
**Instants:** ISO 8601 datetime strings (UTC).  
**Timezones:** IANA strings.  
**Formatted display:** Client-side (e.g. `14:00 HKT → 18:30 GMT` using `formatTpInstant` from `@so/model`).

### Multi-day logic

**Span calculation** (stay/travel):  
- Stay: `[check_in_at, check_out_at]`  
- Travel (selected route): `[first_transport.depart_at, last_transport.arrive_at]`

**Mirror days:** Action appears on every trip day D where `dayInterval(D, tripTz)` intersects span. (Handled by existing `tpDayOverlapsTripDay`, `listTpDayTimeline` helpers in `@so/model` — not exposed as separate MCP tools.)

**Anchor day:** Trip day matching `localDate(depart_at, depart_timezone)` for travel; `localDate(check_in_at, check_in_timezone)` for stay.

---

## Delete semantics and permissions

### Which operations require `delete` action?

| Operation | Required action | Notes |
| --- | --- | --- |
| Delete destination | `delete` | Cascade nullifies FKs on actions/transports. |
| Delete action | `delete` | Cascade deletes routes/transports/attachments. |
| Delete route | `delete` | Cascade deletes transports; nullifies `selected_route_id`. |
| Delete transport | `delete` | Cascade deletes attachments. |
| Delete attachment | `delete` | Removes storage object + DB row. |
| Delete trip | N/A (pod delete) | Handled by `delete_pod` tool (space/pod admin). |

**Read-only (viewer) behavior:** `pod_viewer` cannot delete anything. Calls fail with authz error.

### Cascade rules (DB enforced)

Already in migration:

- `tp_destination.trip_id ON DELETE CASCADE`
- `tp_day.trip_id ON DELETE CASCADE`
- `tp_action.trip_id ON DELETE CASCADE`, `anchor_day_id ON DELETE SET NULL`
- `tp_route.action_id ON DELETE CASCADE`
- `tp_transport.route_id ON DELETE CASCADE`
- `tp_attachment.transport_id ON DELETE CASCADE`, `destination_id ON DELETE CASCADE`

---

## Testing

### Unit tests (service layer)

For each new `{action}DbTp{Resource}` helper:

- **Happy path:** valid input → DB row created/updated/deleted.
- **Validation:** missing required fields → error.
- **Authz:** viewer cannot write → RLS blocks.
- **Cascade:** deleting parent removes children (destination → nullifies action FKs; action → deletes routes/transports).
- **Timezone logic:** anchor day recalculated when transport times change; span overlaps correct trip days.

**Existing tests:** PR #9 may have tests for merged helpers; extend/verify coverage.

### Integration tests (agent layer)

For each MCP tool and matching REST endpoint:

- **Key authz:** revoked key → fail; missing `trip` grant → fail; wrong `featureKind` → fail.
- **Role matrix:** viewer cannot create/update/delete → fail.
- **Input validation:** valibot schema enforcement.
- **Service call:** REST and MCP produce identical DB state for same input.
- **Cascade:** delete action via REST → transports removed; verify via MCP list.

### Attachment tests

- **Upload:** base64 JPEG → storage object created + DB row.
- **Size limit:** 6MB file → fail (over 5MB).
- **MIME filter:** `text/plain` → fail (not jpeg/png/pdf).
- **Read:** list attachments → signed URLs valid for 7 days.
- **Delete:** remove attachment → storage object deleted + DB row removed.

### Multi-day tests

- **Stay spanning 3 nights:** verify mirrors on 4 trip days (check-in day + 3 nights).
- **Travel >24h:** flight departing Mon 10:00 HKT, arriving Wed 06:00 GMT → mirrors on Mon/Tue/Wed.
- **Anchor day:** change transport departure time → anchor day ID updated if local date shifts.

---

## Open questions for Matthew

1. **Workspace bulk read (`get_tp_workspace`):** Include in v1, or require agents to call individual list tools? (Recommendation: include for efficiency, mirrors UI load.)

2. **Attachment upload approach:**  
   - **Option A (recommended):** Base64 in MCP tool body (like `replace_todo_card_icon`). 5MB limit enforced on decoded size.  
   - **Option B:** Separate signed upload URL endpoint (more complex; defer to phase 2).  
   
   → **Decision:** Use base64 in v1.

3. **Destination important-info auto-inference:** The `tpActiveDestinationsForDay` helper (auto from stays/travel) is UI logic in `@so/model`. Expose as a separate MCP tool (`get_tp_active_destinations_for_day(podId, dayId)`) or omit from agent surface? (Recommendation: omit v1; agents can implement inference client-side from workspace data.)

4. **Reorder operations scope:**  
   - Destinations: trip-level reorder (simple).  
   - Actions: per anchor-day reorder (matches `updateDbTpActionSortOrders`).  
   - Transports: per route reorder (simple).  
   - **Routes:** per action reorder? (Not in existing helpers; add if needed.)  
   
   → **Decision:** Add `reorder_tp_routes` (per action) for completeness.

5. **Trip deletion:** Covered by `delete_pod` tool (space/pod admin), or expose separate `delete_trip` tool (no-op; trip is 1:1 with pod)? (Recommendation: omit; deleting trip = delete pod.)

6. **Attachment list filtering:** Filter by parent (`transportId` XOR `destinationId`) via query params, or separate tools (`list_tp_transport_attachments`, `list_tp_destination_attachments`)? (Recommendation: one tool with optional filter params, like `list_fp_transactions` with account filter.)

7. **Day create/delete:** Days are auto-synced from trip dates. Expose explicit `create_tp_day` / `delete_tp_day` tools, or omit? (Recommendation: omit; day lifecycle tied to trip date updates.)

8. **Anchor day manual override:** Expose tool to manually set `anchor_day_id` on action (e.g. for ideas → pinned day), or keep auto-only? (Recommendation: auto-only in v1; manual pin in UI phase 2.)

9. **Budget rollup:** Expose `get_tp_budget_rollup(podId)` tool returning `{totalCost, budgetAmount, breakdown: [...]}`, or expect agents to compute client-side from trip/actions/transports? (Recommendation: include tool using existing `tpBudgetRollup` helper from `@so/model`.)

10. **Error granularity:** When a nested create fails (e.g. `create_tp_transport` with invalid route ID), return `{error: {code: 'not_found', resource: 'route', id}}` or generic `not_found`? (Recommendation: generic in v1; detailed error codes in phase 2 if needed.)

---

## Success criteria

1. **Matrix UI:** Trip pods appear in the pod table with Create/Read/Update/Delete cells writing `pods[podId].trip`.
2. **Presets:** All on, All off, All read correctly toggle trip pod rows.
3. **MCP catalog:** All tools listed above registered in `mcpCatalog.ts` / `mcpCatalogExtra.ts`.
4. **REST routes:** All endpoints under `/api/pods/{podId}/trip/...` callable with Bearer token.
5. **Same service layer:** REST and MCP call identical helpers; no duplicated logic.
6. **Authz enforced:** Key grant + membership + featureKind + role checked per call; viewer read-only.
7. **Attachment upload/download:** Base64 upload, 5MB limit, jpeg/png/pdf only; signed URLs on read.
8. **Timezone handling:** Instants + IANA timezones in/out; anchor day and mirrors correctly computed.
9. **Tests pass:** Unit tests for new service helpers; integration tests for agent layer.
10. **Docs:** MCP config snippet in create key flow; tool descriptions match existing terse style.

---

## Approval

**Status:** PLAN ONLY — awaiting Matthew's review and approval before implementation.

**Open questions above** should be resolved before starting implementation.

After approval, implementation proceeds on this branch (`cursor/trip-planning-api-mcp-plan-c7f9`) or a new branch named by Matthew.

---

## Appendix: Tool count summary

**Total proposed tools:** ~36

**Breakdown by category:**

| Category | Tools | Notes |
| --- | --- | --- |
| Trip/settings | 4 | get/update trip, get/update setting |
| Destinations | 5 | list, create, update, delete, reorder |
| Days | 2 | list, update (no create/delete) |
| Actions | 6 | list, get, create, update, delete, reorder |
| Routes | 6 | list, create, update, delete, select, reorder (if added) |
| Transports | 6 | list, create, update, delete, reorder |
| Attachments | 3 | list, upload, delete |
| Workspace | 1 | get workspace (bulk load) |
| Budget | 1 | get budget rollup (if added) |
| Active destinations | 1 | get active destinations for day (if added) |

**Defer to phase 2:**  
- Trip-level whole-journey plan compare (`tp_travel_plan` style)  
- Soft links to todo / FP pods  
- Telegram bridge integration  
- AI trip generation

---

## References

- **Product plan:** [trip-planning.md](./trip-planning.md)  
- **API/MCP pattern:** [api-mcp.md](./api-mcp.md)  
- **Financial planning impl:** [financial planning-implementation.md](./financial%20planning-implementation.md)  
- **Migration:** `supabase/migrations/20261022150000_pod_viewer_trip_planning.sql`  
- **Existing helpers:** `packages/web/lib/api/db/tp/*`  
- **MCP catalog:** `packages/web/lib/api/mcp/mcpCatalog.ts`, `mcpCatalogExtra.ts`  
- **REST dispatcher:** `packages/web/lib/api/agent/dispatchAgentRest.ts`, `dispatchAgentRestMore.ts`
