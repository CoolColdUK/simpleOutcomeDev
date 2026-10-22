# Trip planning REST API + MCP — plan

Expose the **trip planning** feature (merged from PR #9, tables `tp_*` / helpers `lib/api/db/tp/*` / components `components/tp/*`) to agents and integrations via REST and hosted MCP, following the pattern established in [`api-mcp.md`](./api-mcp.md).

**Repo:** [CoolColdUK/simpleOutcomeDev](https://github.com/CoolColdUK/simpleOutcomeDev)  
**Reference:** [`api-mcp.md`](./api-mcp.md), [`financial planning-implementation.md`](./financial%20planning-implementation.md)  
**Related:** [trip-planning.md](./trip-planning.md) (product requirements), PR #9 (merged trip planning implementation), migration `supabase/migrations/20261022150000_pod_viewer_trip_planning.sql`

**Status:** ✅ IMPLEMENTED — PR #15 (draft against `develop`)

---

## Implementation summary

**Shipped in PR #15:**

1. **Timezone conversion utilities** (`packages/model/src/tp/timezoneHelpers.ts`):
   - `localTimeToUtc(localTime, ianaZone)` → UTC instant
   - `utcToLocalTime(utcInstant, ianaZone)` → local wall time
   - `formatTpInstant(utcInstant, ianaZone)` → display format with timezone abbreviation
   - Unit tests covering DST transitions, >24h travel spans, round-trip conversions

2. **Service layer** (`packages/web/lib/api/db/tp/`):
   - `updateDbTpTrip`: update trip metadata + settings (defaultCurrency)
   - `createDbTpDestination`, `updateDbTpDestination`, `deleteDbTpDestination`
   - `updateDbTpDay` (manual anchor day override)
   - `createDbTpAction`, `updateDbTpAction`, `deleteDbTpAction` (with timezone conversion for check-in/check-out)
   - `createDbTpRoute`, `updateDbTpRoute`, `deleteDbTpRoute`, `selectDbTpRoute`
   - `createDbTpTransport`, `updateDbTpTransport`, `deleteDbTpTransport` (with timezone conversion for depart/arrive)
   - `listDbTpAttachments`, `uploadDbTpAttachment` (base64 decode, 5MB limit, JPEG/PNG/PDF, storage upload), `deleteDbTpAttachment`
   - All `.single()` calls null-check `data` for strict TypeScript compliance

3. **Agent adapters** (`packages/web/lib/api/agent/`):
   - `tpAgentWorkspace.ts`: real `updateAgentTpTrip`, `getAgentTpBudgetRollup` (computes action + transport costs)
   - `tpAgentDestinations.ts`, `tpAgentDays.ts`, `tpAgentActions.ts`, `tpAgentRoutes.ts`, `tpAgentTransports.ts`, `tpAgentAttachments.ts`
   - All operations verify pod ownership via `ownedTpRow` before mutation
   - Timezone conversion integrated into create/update operations

4. **Valibot schemas** (`packages/model/src/tp/tpAgentSchemas.ts`):
   - Complete validation schemas for all 20 trip operations
   - Exported from `@so/model`

5. **MCP tools** (`packages/web/lib/api/mcp/mcpCatalogByFeature.ts`):
   - All 20 trip tools defined with proper input schemas and descriptions
   - Per-feature endpoint routing: `/api/mcp/trip` returns TRIP_MCP_TOOLS only

6. **REST routes** (`packages/web/lib/api/agent/dispatchAgentRestMore.ts`):
   - `GET /api/pods/{podId}/trip/workspace` (full workspace)
   - `PATCH /api/pods/{podId}/trip` (update trip)
   - `GET /api/pods/{podId}/trip/budget` (budget rollup)
   - `POST /api/pods/{podId}/trip/destinations`, `PATCH/DELETE /api/pods/{podId}/trip/destinations/{id}`
   - `PATCH /api/pods/{podId}/trip/days/{id}`
   - `POST /api/pods/{podId}/trip/actions`, `PATCH/DELETE /api/pods/{podId}/trip/actions/{id}`
   - `POST /api/pods/{podId}/trip/routes`, `PATCH/DELETE /api/pods/{podId}/trip/routes/{id}`, `POST /api/pods/{podId}/trip/routes/{id}/select`
   - `POST /api/pods/{podId}/trip/transports`, `PATCH/DELETE /api/pods/{podId}/trip/transports/{id}`
   - `GET/POST /api/pods/{podId}/trip/attachments`, `DELETE /api/pods/{podId}/trip/attachments/{id}`

7. **API key authorization**:
   - `ApiKeyResource.TRIP` added to model enums
   - Mapped to `FeatureKind.TRIP_PLANNING` in `featureKindForApiResource`
   - Enabled in `apiKeyPodResource` for pod-scoped permissions
   - UI matrix (`AccountApiKeysPanelMatrix.tsx`) displays trip pods with CRUD permissions automatically

8. **Tests**:
   - Unit tests for timezone helpers (`timezoneHelpers.test.ts`)
   - Service layer follows existing patterns (strict null checks on `.single()`)

**Not included (acceptable per requirements):**
- Day create/delete (auto-synced from trip dates via `syncTpDaysForTrip` - future enhancement)
- Realtime subscriptions (not requested)
- Advanced attachment features (thumbnails, OCR) - base64 upload with signed URLs sufficient

---

## Goal

1. Add **`trip`** as a feature resource in the API key permission matrix (alongside `todo`, `fp`, `space`, `group`, `profile`).
2. Expose trip planning operations via **REST** (`/api/pods/{podId}/trip/...`) and **hosted MCP** tools.
3. REST and MCP call the **same** service layer (existing `lib/api/db/tp/*` helpers).
4. Mirror the authz pattern: key grant ∧ pod membership ∧ featureKind match ∧ pod role (viewer/user/admin/owner).
5. Cover the full trip model: trips, destinations, days, actions (stay/travel/activity/note), routes, transports, attachments.
6. Support **per-feature MCP endpoints** alongside the unified `/api/mcp`.

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
| Local time + timezone | Inputs take wall time + IANA zone per endpoint; server converts and stores UTC instants. Outputs return both. |
| Separate create/update | Map to distinct API key rights; no upserts. |

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

No extra "Delete all" checkbox (unlike fp). Trip deletion via `delete_pod` (space/pod admin).

### Sub-resources

Trip planning has nested entities (destination, day, action, route, transport, attachment). The matrix does **not** separate them into columns. Instead:

**One `trip` resource grant covers:**

| Sub-resource | Create | Read | Update | Delete |
| --- | --- | --- | --- | --- |
| **trip** (metadata) | Pod creation wizard | Workspace load | Update trip fields, settings | (via delete_pod) |
| **destination** | Add destination | (workspace) | Update, reorder via sortOrder | Remove destination |
| **day** | Auto-synced from trip dates | (workspace) | Update day notes/title | Auto-pruned |
| **action** | Add action | (workspace) | Update, reorder via sortOrder, manual anchor day | Delete action |
| **route** | Add route to travel action | (workspace) | Update, reorder via sortOrder, select | Delete route |
| **transport** | Add transport to route | (workspace) | Update, reorder via sortOrder | Delete transport |
| **attachment** | Upload (base64) | (workspace + signed URLs) | (re-upload = delete + create) | Delete attachment |

**Enforcement:**

- **Create:** includes trip init, add destination/action/route/transport, upload attachment.
- **Read:** includes workspace load (full trip data), signed URLs.
- **Update:** includes trip/destination/day/action/route/transport updates, reorder via `sortOrder`, select route, manual anchor day override, settings (currency).
- **Delete:** includes remove destination/action/route/transport/attachment.

`pod_viewer` gets **read only** (no create/update/delete). This is enforced by RLS (`can_write_tp_pod`) and mirrored in the agent layer.

---

## MCP tools (final set: 20 tools)

Tool names follow existing conventions (`{verb}_{feature}_{resource}`). Descriptions are short (like `list_fp_accounts`, `create_todo_card`).

All tools require `podId` (uuid). Input schemas use valibot. Separate create and update tools (they map to separate API key rights).

**Optimization:** Individual list/get operations are **replaced by** `get_tp_workspace` (full trip load). Reorder operations are **folded into** update tools via `sortOrder` field. Trip settings (currency) are **part of** trip get/update.

### Core: Trip workspace

| Tool | Input Schema | Output | Action | Description |
| --- | --- | --- | --- | --- |
| `get_tp_workspace` | `{podId: string}` | Full trip object | `read` | Load complete trip: metadata (title, timezone, dates, status, budget, defaultCurrency), destinations, days, actions, routes, transports, attachments with signed URLs. Uses `loadDbTpWorkspace`. |

### Trip

| Tool | Input Schema | Output | Action | Description |
| --- | --- | --- | --- | --- |
| `update_trip` | `{podId: string, title?: string, timezone?: string, startDate?: string, endDate?: string, status?: 'draft' \| 'active' \| 'done' \| 'archived', budgetAmount?: number, budgetCurrency?: string, defaultCurrency?: string, mapsUrl?: string, notes?: string}` | Updated trip | `update` | Update trip fields. On date change, syncs `tp_day` rows. `defaultCurrency` updates `tp_setting`. |
| `get_tp_budget_rollup` | `{podId: string}` | `{totalCost: number, budgetAmount: number, breakdown: {...}}` | `read` | Compute total costs from actions/transports vs budget. Uses `tpBudgetRollup` helper. |

### Destinations

| Tool | Input Schema | Output | Action | Description |
| --- | --- | --- | --- | --- |
| `create_tp_destination` | `{podId: string, name: string, sortOrder?: number, mapsUrl?: string, timezoneHint?: string, importantInfo?: string, activeStartDate?: string, activeEndDate?: string, notes?: string}` | New destination | `create` | Create destination. |
| `update_tp_destination` | `{podId: string, destinationId: string, name?: string, sortOrder?: number, mapsUrl?: string, timezoneHint?: string, importantInfo?: string, activeStartDate?: string, activeEndDate?: string, notes?: string}` | Updated destination | `update` | Update destination. **Reorder via `sortOrder`** (no separate reorder tool). |
| `delete_tp_destination` | `{podId: string, destinationId: string}` | `{ok: true}` | `delete` | Delete destination. Cascade nullifies FKs. |

### Days

| Tool | Input Schema | Output | Action | Description |
| --- | --- | --- | --- | --- |
| `update_tp_day` | `{podId: string, dayId: string, dayTitle?: string, dayNotes?: string, primaryDestinationId?: string}` | Updated day | `update` | Update day header notes and override destination. Days auto-sync from trip dates (no create/delete tools). |

### Actions

| Tool | Input Schema | Output | Action | Description |
| --- | --- | --- | --- | --- |
| `create_tp_action` | `{podId: string, kind: 'travel' \| 'stay' \| 'activity' \| 'note', title: string, anchorDayId?: string, destinationId?: string, placeText?: string, mapsUrl?: string, fromPlace?: string, toPlace?: string, fromDestinationId?: string, toDestinationId?: string, fromMapsUrl?: string, toMapsUrl?: string, checkInLocalTime?: string, checkOutLocalTime?: string, checkInTimezone?: string, checkOutTimezone?: string, startTime?: string, endTime?: string, costAmount?: number, costCurrency?: string, bookingRef?: string, url?: string, notes?: string, sortOrder?: number}` | New action | `create` | Create action. Check-in/out: **local wall time** (e.g. `2026-11-03T14:05`) + IANA timezone. Server converts to UTC instant. |
| `update_tp_action` | `{podId: string, actionId: string, title?: string, anchorDayId?: string, destinationId?: string, placeText?: string, mapsUrl?: string, fromPlace?: string, toPlace?: string, fromDestinationId?: string, toDestinationId?: string, fromMapsUrl?: string, toMapsUrl?: string, checkInLocalTime?: string, checkOutLocalTime?: string, checkInTimezone?: string, checkOutTimezone?: string, startTime?: string, endTime?: string, costAmount?: number, costCurrency?: string, bookingRef?: string, url?: string, notes?: string, selectedRouteId?: string, sortOrder?: number}` | Updated action | `update` | Update action. **Manual anchor day override allowed.** **Reorder via `sortOrder`** (no separate reorder tool). Kind cannot change. |
| `delete_tp_action` | `{podId: string, actionId: string}` | `{ok: true}` | `delete` | Delete action. Cascade deletes routes/transports. |

### Routes

| Tool | Input Schema | Output | Action | Description |
| --- | --- | --- | --- | --- |
| `create_tp_route` | `{podId: string, actionId: string, name: string, notes?: string, sortOrder?: number}` | New route | `create` | Create route for travel action. |
| `update_tp_route` | `{podId: string, routeId: string, name?: string, notes?: string, sortOrder?: number}` | Updated route | `update` | Update route. **Reorder via `sortOrder`** (no separate reorder tool). |
| `delete_tp_route` | `{podId: string, routeId: string}` | `{ok: true}` | `delete` | Delete route. Cascade deletes transports; nullifies `selected_route_id`. |
| `select_tp_route` | `{podId: string, actionId: string, routeId: string}` | `{ok: true}` | `update` | Set selected route. Recalcs span/mirrors for multi-day travel. |

### Transports

| Tool | Input Schema | Output | Action | Description |
| --- | --- | --- | --- | --- |
| `create_tp_transport` | `{podId: string, routeId: string, mode?: 'flight' \| 'train' \| 'coach' \| 'bus' \| 'car' \| 'ferry' \| 'walk' \| 'other', fromPlace?: string, toPlace?: string, departLocalTime?: string, arriveLocalTime?: string, departTimezone?: string, arriveTimezone?: string, costAmount?: number, costCurrency?: string, bookingRef?: string, url?: string, notes?: string, sortOrder?: number}` | New transport | `create` | Create transport. Depart/arrive: **local wall time** (e.g. `2026-11-15T14:00`) + IANA timezone. Server converts to UTC instant. |
| `update_tp_transport` | `{podId: string, transportId: string, mode?: string, fromPlace?: string, toPlace?: string, departLocalTime?: string, arriveLocalTime?: string, departTimezone?: string, arriveTimezone?: string, costAmount?: number, costCurrency?: string, bookingRef?: string, url?: string, notes?: string, sortOrder?: number}` | Updated transport | `update` | Update transport. **Reorder via `sortOrder`** (no separate reorder tool). Changing times/timezones may recalc anchor day. |
| `delete_tp_transport` | `{podId: string, transportId: string}` | `{ok: true}` | `delete` | Delete transport. Cascade deletes attachments. |

### Attachments

| Tool | Input Schema | Output | Action | Description |
| --- | --- | --- | --- | --- |
| `list_tp_attachments` | `{podId: string, transportId?: string, destinationId?: string}` | `{attachments: [{id, fileName, mimeType, byteSize, signedUrl, uploadedBy, createdAt}, ...]}` | `read` | List attachments for transport or destination (optional filter). Returns metadata + signed URLs (7-day expiry). |
| `upload_tp_attachment` | `{podId: string, transportId?: string, destinationId?: string, fileName: string, mimeType: 'image/jpeg' \| 'image/png' \| 'application/pdf', contentBase64: string}` | `{id, signedUrl}` | `create` | Upload attachment (base64-encoded). **5MB decoded limit.** Exactly one parent (transport XOR destination). |
| `delete_tp_attachment` | `{podId: string, attachmentId: string}` | `{ok: true}` | `delete` | Delete attachment + storage object. |

**Total: 20 tools** (1 workspace + 2 trip + 3 destinations + 1 day + 3 actions + 4 routes + 3 transports + 3 attachments)

---

## REST endpoints

REST routes mirror MCP tools under `/api/pods/{podId}/trip/...`. Method + path patterns:

### Trip

- `GET /api/pods/{podId}/trip/workspace` → `get_tp_workspace`
- `PATCH /api/pods/{podId}/trip` → `update_trip` (includes `defaultCurrency` for settings)
- `GET /api/pods/{podId}/trip/budget` → `get_tp_budget_rollup`

### Destinations

- `POST /api/pods/{podId}/trip/destinations` → `create_tp_destination`
- `PATCH /api/pods/{podId}/trip/destinations/{destinationId}` → `update_tp_destination` (includes `sortOrder` for reorder)
- `DELETE /api/pods/{podId}/trip/destinations/{destinationId}` → `delete_tp_destination`

### Days

- `PATCH /api/pods/{podId}/trip/days/{dayId}` → `update_tp_day`

### Actions

- `POST /api/pods/{podId}/trip/actions` → `create_tp_action`
- `PATCH /api/pods/{podId}/trip/actions/{actionId}` → `update_tp_action` (includes `sortOrder` for reorder, `anchorDayId` for manual override)
- `DELETE /api/pods/{podId}/trip/actions/{actionId}` → `delete_tp_action`

### Routes

- `POST /api/pods/{podId}/trip/routes` → `create_tp_route`
- `PATCH /api/pods/{podId}/trip/routes/{routeId}` → `update_tp_route` (includes `sortOrder` for reorder)
- `DELETE /api/pods/{podId}/trip/routes/{routeId}` → `delete_tp_route`
- `POST /api/pods/{podId}/trip/routes/select` → `select_tp_route` (body: `{actionId, routeId}`)

### Transports

- `POST /api/pods/{podId}/trip/transports` → `create_tp_transport`
- `PATCH /api/pods/{podId}/trip/transports/{transportId}` → `update_tp_transport` (includes `sortOrder` for reorder)
- `DELETE /api/pods/{podId}/trip/transports/{transportId}` → `delete_tp_transport`

### Attachments

- `GET /api/pods/{podId}/trip/attachments` → `list_tp_attachments` (query: `?transportId={uuid}` or `?destinationId={uuid}`)
- `POST /api/pods/{podId}/trip/attachments` → `upload_tp_attachment`
- `DELETE /api/pods/{podId}/trip/attachments/{attachmentId}` → `delete_tp_attachment`

**Dispatcher:** Extend `dispatchAgentRest.ts` and/or `dispatchAgentRestMore.ts` with trip routes (follow existing `/pods/{podId}/todo/...` pattern).

---

## Per-feature MCP endpoints (DECIDED)

**Decision:** Use **feature-scoped MCP endpoints only**. No combined all-tools endpoint. No backward compatibility needed (internal use only).

### Endpoint layout

| Path | Exposed tools | Purpose |
| --- | --- | --- |
| `/api/mcp` | **Core tools only** | Spaces, groups, pods/membership/invites, profile, API key permissions |
| `/api/mcp/trip` | **Trip tools only** | Trip planning operations (no core duplication) |
| `/api/mcp/todo` | **Todo tools only** | Todo list operations |
| `/api/mcp/fp` | **FP tools only** | Financial planning operations |

**No duplication:** Core tools live only on `/api/mcp`. Feature endpoints expose only their feature-specific tools.

### Core tools (`/api/mcp`)

**API key introspection:**
- `get_api_key_permissions`

**Profile:**
- `get_profile`, `update_profile_display_name`, `update_profile_username`

**Spaces:**
- `list_spaces`, `create_space`, `join_space_by_invite`
- `get_space`, `update_space`
- `list_space_pods`, `search_pods`

**Pods (lifecycle):**
- `create_pod`, `update_pod`, `set_pod_status` (archive/restore), `delete_pod`
- `join_open_pod`, `create_pod_join_request`

**Group (membership/invites):**
- `list_space_members`, `update_space_member_role`
- `list_space_invites`, `create_space_invite`, `delete_space_invite`, `disable_space_invite`
- `list_pod_members`, `add_pod_member_by_username`, `update_pod_member_role`
- `list_pod_join_requests`, `approve_pod_join_request`, `deny_pod_join_request`

**Total core: ~25 tools**

### Feature tools

**`/api/mcp/trip` (20 tools):**  
All trip planning tools listed in "MCP tools" section above. No core duplication.

**`/api/mcp/todo` (~15 tools):**  
Columns, cards, comments, reorder, archive, card icons. No core duplication.

**`/api/mcp/fp` (~30 tools):**  
Accounts, categories, transactions, parsers, imports, bill split, settings, auto-assign, delete-all. No core duplication.

### Authorization-aware `tools/list`

`tools/list` on each endpoint **filters** by grants:

1. Parse `Authorization: Bearer <key>` and load `permissions`.
2. For each tool, check if `permissions` includes the required resource (spaces, pods, profile).
3. Return **only tools** the key can potentially call.

**Example:**  
- Key grants: `pods[podA].trip` (read/update), `profile` (read)  
- `GET /api/mcp/trip` → returns trip read/update tools (filtered)  
- `GET /api/mcp/todo` → returns **empty** (no todo grants)  
- `GET /api/mcp` → returns core tools the key can call (profile + space navigation if space member)

**Benefit:** Clients see a relevant catalog on connect.

### Implementation approach

1. **Catalog split:** Organize tools by feature in `mcpCatalog.ts` / `mcpCatalogExtra.ts`:

```ts
export const CORE_MCP_TOOLS = [
  // API key introspection
  tool('get_api_key_permissions', ...),
  
  // Profile
  tool('get_profile', ...),
  tool('update_profile_display_name', ...),
  
  // Spaces, pods, group
  tool('list_spaces', ...),
  tool('create_pod', ...),
  tool('list_pod_members', ...),
  // ... all core tools
];

export const TODO_MCP_TOOLS = [
  tool('list_todo_columns', ...),
  tool('create_todo_card', ...),
  // ... all todo tools
];

export const FP_MCP_TOOLS = [
  tool('list_fp_accounts', ...),
  // ... all fp tools
];

export const TRIP_MCP_TOOLS = [
  tool('get_tp_workspace', ...),
  tool('create_tp_action', ...),
  // ... all trip tools
];
```

2. **Route handler:** `app/api/mcp/[[...segments]]/route.ts`:

```ts
export async function POST(request: Request, {params}: {params: {segments?: string[]}}) {
  const feature = params.segments?.[0] as 'trip' | 'todo' | 'fp' | undefined;
  let tools: readonly McpTool[];
  
  if (feature === 'trip') tools = TRIP_MCP_TOOLS;
  else if (feature === 'todo') tools = TODO_MCP_TOOLS;
  else if (feature === 'fp') tools = FP_MCP_TOOLS;
  else tools = CORE_MCP_TOOLS; // /api/mcp (no feature segment)
  
  return handleMcpRequest(request, tools);
}
```

3. **Authorization filter in `tools/list`:**

```ts
if (method === 'tools/list') {
  const apiKey = await loadApiKey(request);
  const filteredTools = apiKey
    ? tools.filter(tool => canCallTool(tool.name, apiKey.permissions))
    : tools;
  return {tools: filteredTools.map(...)};
}
```

**No backward compatibility:** Existing `/api/mcp` clients (Matthew and bot only) will get core tools; they must move to feature endpoints for feature operations.

---

## Timezone and date formats

### Input format

**Dates:** ISO 8601 date strings (`YYYY-MM-DD`) for `startDate`, `endDate`, `activeStartDate`, `activeEndDate`.

**Local times + timezone (stays and transports):**  
- **Input:** Local wall time (e.g. `2026-11-15T14:00` or `2026-11-03T14:05:30`) + separate IANA timezone field (`checkInTimezone`, `departTimezone`, etc.).  
- **Server:** Converts `localTime + timezone → UTC instant` and stores both the instant (`timestamptz`) and the timezone (`text`) in DB.  
- **Example:**  
  - Input: `checkInLocalTime: "2026-11-15T15:00"`, `checkInTimezone: "Asia/Hong_Kong"`  
  - Stored: `check_in_at: 2026-11-15 07:00:00+00` (UTC), `check_in_timezone: "Asia/Hong_Kong"`

**Trip timezone:** `timezone` field on trip (IANA string) used for day strip generation and fallback display.

**Activity/note times:** `startTime` / `endTime` as local time-of-day strings (`HH:MM` or `HH:MM:SS`), interpreted in trip timezone on anchor day. No separate timezone field.

### Output format

**Dates:** ISO 8601 date strings (`YYYY-MM-DD`).

**Instants:** Objects with **both** local time and UTC:

```ts
// Example transport output
{
  departLocalTime: "2026-11-15T14:00:00",  // local wall time
  departTimezone: "Asia/Hong_Kong",        // IANA
  departAt: "2026-11-15T06:00:00Z",        // UTC instant (ISO 8601)
  
  arriveLocalTime: "2026-11-15T18:30:00",
  arriveTimezone: "Europe/London",
  arriveAt: "2026-11-15T18:30:00Z"
}
```

**Rationale:** Agents can use local time for display (`14:00 HKT → 18:30 GMT`) and UTC instant for calculations (duration, overlap).

**Formatted display:** Client-side (e.g. `formatTpInstant(instant, zone)` in `@so/model`).

### Multi-day logic

**Span calculation** (stay/travel):  
- Stay: `[check_in_at, check_out_at]` (UTC instants)  
- Travel (selected route): `[first_transport.depart_at, last_transport.arrive_at]`

**Mirror days:** Action appears on every trip day D where `dayInterval(D, tripTz)` intersects span (UTC). Handled by existing `tpDayOverlapsTripDay`, `listTpDayTimeline` helpers in `@so/model` — **not exposed as separate MCP tools.**

**Anchor day:** Trip day matching `localDate(depart_at, depart_timezone)` for travel; `localDate(check_in_at, check_in_timezone)` for stay. **Manual override allowed** via `update_tp_action(anchorDayId)` (UI already supports this).

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
| Delete trip | N/A | Handled by `delete_pod` tool (space/pod admin). |

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
- **Timezone logic:** local time + zone → UTC instant conversion; anchor day recalculated when transport times change; span overlaps correct trip days.

**Existing tests:** PR #9 may have tests for merged helpers; extend/verify coverage.

### Integration tests (agent layer)

For each MCP tool and matching REST endpoint:

- **Key authz:** revoked key → fail; missing `trip` grant → fail; wrong `featureKind` → fail.
- **Role matrix:** viewer cannot create/update/delete → fail.
- **Input validation:** valibot schema enforcement.
- **Service call:** REST and MCP produce identical DB state for same input.
- **Cascade:** delete action via REST → transports removed; verify via MCP workspace load.
- **Timezone round-trip:** create transport with local time + zone → read back → verify both local and UTC match.

### Attachment tests

- **Upload:** base64 JPEG → storage object created + DB row.
- **Size limit:** 6MB file (decoded) → fail (over 5MB).
- **MIME filter:** `text/plain` → fail (not jpeg/png/pdf).
- **Read:** list attachments → signed URLs valid for 7 days.
- **Delete:** remove attachment → storage object deleted + DB row removed.

### Multi-day tests

- **Stay spanning 3 nights:** verify mirrors on 4 trip days (check-in day + 3 nights).
- **Travel >24h:** flight departing Mon 10:00 HKT, arriving Wed 06:00 GMT → mirrors on Mon/Tue/Wed.
- **Anchor day:** change transport departure time → anchor day ID updated if local date shifts.
- **Manual override:** set `anchorDayId` explicitly → stays pinned even if times change.

### Per-feature endpoint tests

- **Tool catalog:** `GET /api/mcp/trip` with trip grant → returns 20 trip tools + shared core.
- **Filtered list:** Key with only trip grant → `tools/list` on `/api/mcp` returns trip tools only (no todo/fp).
- **No grant:** Key with only todo grant → `GET /api/mcp/trip` → returns shared core only.
- **Backwards compat:** Existing `/api/mcp` clients work unchanged.

---

## Decisions (locked)

These questions were resolved by Matthew:

1. **Workspace bulk read (`get_tp_workspace`):** ✅ Included in v1 for efficiency.
2. **Attachment upload:** ✅ Base64 in MCP tool body (like `replace_todo_card_icon`). 5MB limit.
3. **Attachment list filtering:** ✅ One tool with optional `transportId` / `destinationId` filter params.
4. **Trip deletion:** ✅ Via `delete_pod` only (space/pod admin). No separate `delete_trip` tool.
5. **Day create/delete:** ✅ Omit; days auto-sync from trip dates. No explicit day CRUD tools.
6. **Anchor day manual override:** ✅ **Allowed** via `update_tp_action(anchorDayId)` (UI already supports).
7. **Budget rollup:** ✅ Expose `get_tp_budget_rollup` tool using `tpBudgetRollup` helper.
8. **Error granularity:** ✅ Generic errors in v1 (e.g. `not_found`); detailed codes deferred to phase 2.
9. **Active destinations inference:** ✅ Omit `get_tp_active_destinations_for_day` tool; agents compute client-side from workspace data.
10. **Reorder operations:** ✅ **Fold into update via `sortOrder` field** (no separate reorder tools). Mirrors `update_todo_card`.
11. **Trip settings:** ✅ **Fold into trip get/update** (`defaultCurrency` on `update_trip`). No separate setting tools.
12. **Tool count:** ✅ **Trim to ~20 tools.** Remove redundant list/get (workspace covers them). Separate create/update (distinct API key rights).
13. **Time input format:** ✅ **Local wall time + IANA timezone** (not UTC). Server converts. Outputs return both local and UTC.
14. **Per-feature MCP endpoints:** ✅ **DECIDED** — `/api/mcp` becomes core-only (spaces, groups, pods, membership, profile, API key permissions). Feature endpoints `/api/mcp/trip`, `/api/mcp/todo`, `/api/mcp/fp` have ONLY that feature's tools (no core duplication). No backward compatibility needed.

---

## Implementation notes

### Service layer

**Existing helpers** (merged from PR #9, `packages/web/lib/api/db/tp/`):

- `createDbTpAction`, `updateDbTpAction`, `updateDbTpActionSortOrders` → use `update` for sortOrder changes
- `createDbTpAttachment`, `deleteDbTpAttachment`
- `createDbTpRoute`, `deleteDbTpRoute`, `selectDbTpRoute`
- `createDbTpTransport`, `deleteDbTpTransport`, `updateDbTpTransport`
- `updateDbTpDay`, `updateDbTpDestination`
- `createDbTpTripBundle` (wizard helper)
- `loadDbTpWorkspace` (full workspace load)

**New helpers needed:**

- `updateDbTpTrip` (includes `defaultCurrency` for `tp_setting`)
- `createDbTpDestination`, `deleteDbTpDestination`
- `listDbTpAttachments` (with signed URLs)
- `getBudgetRollup` (compute total costs vs budget)
- `syncTpDaysForTrip` (called on trip date update)
- **Timezone conversion helpers:** `localTimeToUtc(localTime, timezone)`, `utcToLocalTime(instant, timezone)`

**Attachment storage:**  
- Use existing storage helpers pattern (`uploadStorageTpAttachment`, signed URL generation like `listStorageTodoCardIconSignedUrls`).
- Bucket: `pod-private`
- Paths: `{podId}/tp/transport/{transportId}/{attachmentId}-{safe_filename}` or `{podId}/tp/destination/{destinationId}/{attachmentId}-{safe_filename}`

**Authz enforcement:**  
- `requirePodAgent(request, {featureKind: 'trip_planning', podId, resource: 'trip', action})` (follow `fpCall` pattern).
- RLS already enforces `can_read_tp_pod` / `can_write_tp_pod` (viewer vs writer).

### Agent adapter layer

**MCP catalog:** Add trip tools to `mcpCatalogExtra.ts` or new `tpAgentTools.ts`.  
**REST dispatcher:** Extend `dispatchAgentRest.ts` or `dispatchAgentRestMore.ts` with trip routes.

**Valibot schemas:** Define in `@so/model` (e.g. `agentTpActionSchema`, `agentTpTransportSchema`, `agentTpAttachmentUploadSchema`).  
**Agent result types:** Mirror UI types from `@so/model` trip schemas.

**Per-feature endpoints:** New route `app/api/mcp/[[...segments]]/route.ts` + `getMcpToolsForFeature` helper in catalog.

---

## Success criteria

1. **Matrix UI:** Trip pods appear in the pod table with Create/Read/Update/Delete cells writing `pods[podId].trip`.
2. **Presets:** All on, All off, All read correctly toggle trip pod rows.
3. **MCP catalog:** 20 trip tools registered; total catalog size documented.
4. **REST routes:** All endpoints under `/api/pods/{podId}/trip/...` callable with Bearer token.
5. **Same service layer:** REST and MCP call identical helpers; no duplicated logic.
6. **Authz enforced:** Key grant + membership + featureKind + role checked per call; viewer read-only.
7. **Attachment upload/download:** Base64 upload, 5MB limit, jpeg/png/pdf only; signed URLs on read.
8. **Timezone handling:** Local time + zone inputs → UTC instant storage; outputs return both; anchor day and mirrors correctly computed.
9. **Tests pass:** Unit tests for new service helpers; integration tests for agent layer; timezone round-trip; per-feature endpoints.
10. **Per-feature endpoints:** `/api/mcp/trip`, `/api/mcp/todo`, `/api/mcp/fp` work; `tools/list` filters by grants.
11. **Docs:** MCP config snippet in create key flow; tool descriptions match existing terse style.

---

## Tool count summary

**Final: 20 trip tools** (vs 36 in first draft)

| Category | Tools | Notes |
| --- | --- | --- |
| Workspace | 1 | `get_tp_workspace` (replaces individual list/get) |
| Trip | 2 | `update_trip` (includes settings), `get_tp_budget_rollup` |
| Destinations | 3 | create, update (includes reorder via sortOrder), delete |
| Days | 1 | update (no create/delete; auto-synced) |
| Actions | 3 | create, update (includes reorder, manual anchor day), delete |
| Routes | 4 | create, update (includes reorder), delete, select |
| Transports | 3 | create, update (includes reorder), delete |
| Attachments | 3 | list, upload (base64), delete |

**Shared core** (every feature endpoint): `get_api_key_permissions`, `get_profile`, `list_spaces`, `list_space_pods`

**Total MCP catalog** (all features):  
- Todo: ~15 tools  
- FP: ~30 tools  
- Trip: 20 tools  
- Space/group: ~10 tools  
- Profile: 3 tools  
- Shared: 4 tools  
- **Total: ~78 tools** (existing + trip)

---

## References

- **Product plan:** [trip-planning.md](./trip-planning.md)  
- **API/MCP pattern:** [api-mcp.md](./api-mcp.md)  
- **Financial planning impl:** [financial planning-implementation.md](./financial%20planning-implementation.md)  
- **Migration:** `supabase/migrations/20261022150000_pod_viewer_trip_planning.sql`  
- **Existing helpers:** `packages/web/lib/api/db/tp/*`  
- **MCP catalog:** `packages/web/lib/api/mcp/mcpCatalog.ts`, `mcpCatalogExtra.ts`  
- **REST dispatcher:** `packages/web/lib/api/agent/dispatchAgentRest.ts`, `dispatchAgentRestMore.ts`
