# API keys, REST, and MCP — feature plan

Expose **current** SimpleOutcome features to agents and integrations the way EndureTrade does: API keys, REST, and hosted MCP, with **one shared code path**. Telegram and chat bridges are **out of this plan**.

**Repo:** [CoolColdUK/simpleOutcomeDev](https://github.com/CoolColdUK/simpleOutcomeDev)  
**Reference pattern:** [CoolColdUK/trading-journal](https://github.com/CoolColdUK/trading-journal) (`packages/model/src/apiKey`, hosted `POST /api/mcp` only — do **not** copy the local stdio package)

Checkbox cells follow trading-journal:

- `packages/web/app/settings/SettingsPageApiKeysTab.tsx` (`PermissionGrid`)
- `packages/model/src/apiKey/apiKeyPermissionPresets.ts` (`ApiKeyPermissionPreset.AllOn`, `ApiKeyPermissionPreset.AllOff`)

That grid has per-cell checkboxes and All on / All off. It has no row or column bulk toggles. SimpleOutcome adds those, plus **All read**.

This is a **plan / requirements** document. User-scoped keys are already implemented (`supabase/migrations/20261021180000_user_scoped_api_keys.sql`, `AccountApiKeysPanel` on `AccountSettingsPage`). This revision replaces the preset list and the separate space-section tables. Product code for that layout, and for the financial-planning routes below, waits until this plan is approved. It then lands on **one implementation PR**.

---

## Goal

1. Users create and manage **API keys** (create / list / revoke; secret shown once) from **account settings**.
2. **REST** `/api/...` and **MCP** tools call the **same** service functions, Valibot schemas, and authz.
3. Space, group, and todo are already on REST and hosted MCP. The next implementation revises the key matrix (below) and adds **financial_planning** accounts, transactions, categories, parsers, and imports. **shopping_list** stays a grantable pod resource and gets no routes until that product exists. Contact and profile stay parked.
4. MCP tools are organised by pod `FeatureKind`. **Permissions are per pod** the owner can access, including pods in more than one space. `space` and `group` are granted per space on the same key.

---

## Principles

| Principle | Detail |
| --- | --- |
| Same code | One service layer per resource. REST handlers and MCP tools are thin adapters. No duplicated business logic. |
| Hosted MCP only | `POST /api/mcp` only. **No** local `packages/mcp` / stdio package in the success path. |
| Authz is layered | Every call: **key valid** ∧ **live space/pod membership** ∧ **pod `featureKind` matches tool family** ∧ **key permission** ∧ **pod role matrix** (owner-custom CRUD on fp, existing pod roles elsewhere). |
| Acting principal | Membership and role checks use the **key owner’s user id**, not a fake service account. Invites and role changes apply immediately. |
| Revoke is live | Validate the key (hash / status) on **every** request. Do not cache “connected = forever” for MCP sessions. |
| Effective permissions | `get_api_key_permissions` returns **effective** rights: key grants ∩ role matrix ∩ pods and spaces the owner can still access. |
| Tool catalog | Register the **full** tool catalog. **Deny at call time**. Prefer filtering list/responses when the protocol allows; do not rely on connect-time subset alone (clients cache tools). |
| User + pods | A key belongs to the **signed-in user**. Pod access is an explicit **per-pod grant**. A missing grant allows no call on that pod. The create form opens **all off**. |

---

## Out of scope (this plan)

- Telegram / WhatsApp / chat bridges
- Bulk-only import tools (until a concrete agent need)
- Billing / marketplace
- Streaming chat over MCP
- Shipping bank parser presets or Open Banking
- A second API-key editor on space settings
- Inventing a shopping-list schema, services, or routes in the next implementation PR

---

## Domain resources (matrix)

Align API key **resources** with model packages and `FeatureKind`:

| Resource (key scope) | Feature / package | Notes |
| --- | --- | --- |
| `space` | space route / space admin | Per space. The space **header row** in the pod table. Stored as `spaces[spaceId].space`. |
| `group` | people / member and role admin for that space | Per space. The **Group** row under that space header. Invite, change roles, and remove members, **without** full space admin. Stored as `spaces[spaceId].group`. |
| `todo` | `todo_list` | One grant on that pod (`pods[podId].todo`) |
| `shopping` | `shopping_list` | One grant on that pod (`pods[podId].shopping`). No product tables or routes yet (see current state). |
| `fp` | `financial_planning` | One matrix row per pod (`pods[podId].fp`). Stored as the existing nested fp grant. The row’s CRUD checkboxes write that action onto `account`, `category`, `transaction`, `parser`, `import`, `bill_split`, and `settings`. They do not write `delete_all`. Calls still need the nested grant **and** the owner-custom role matrix. |
| `contact` | contact | Parked. Not a matrix row until a product need |
| `profile` | profile | Parked. If added later, one account-level row, default off |

**Actions** (EndureTrade-style), column order **Create / Read / Update / Delete**: `create` / `read` / `update` / `delete`. Extend only when a resource needs a distinct verb (for example `import` / `undoImport` for fp). The Delete checkbox writes `delete` on the resource. It does not write fp `delete_all`.

**MCP tool naming:** stable verb_resource names, grouped by feature family for docs, e.g. `list_todo_cards`, `create_todo_card`, `list_fp_accounts`, `create_fp_transaction`, `list_space_pods`. Tool family must match the target pod’s `featureKind`.

---

## Auth model

### Key record (sketch)

- Belongs to a **user** (`ownerUserId`). No `spaceId`. No `podIds` allowlist.
- **Permissions shape:**

```ts
{
  pods: {
    [podId]: {
      todo?: ApiKeyAction[]       // todo_list pods
      shopping?: ApiKeyAction[]   // shopping_list pods
      fp?: ApiKeyFpGrant          // financial_planning pods
    }
  }
  spaces: {
    [spaceId]: {
      space?: ApiKeyAction[]      // space header row
      group?: ApiKeyAction[]      // Group row under that header
    }
  }
}
```

- A pod grant stores the resource that matches that pod’s `featureKind`. Checking Create / Read / Update / Delete on an fp row writes that action onto each nested fp resource the key can grant (`account`, `category`, `transaction`, `parser`, `import`, `bill_split`, `settings`). Omit `delete_all`.
- **Empty default (fail closed):** omit a pod or space that has no checked action. `pods: {}` and `spaces: {}` allow no pod, space, or group call. The create form starts from **All off**. There is no “empty means every pod” mode.
- One key may list pods from several spaces the owner can access. Pods that share a space are edited under that space’s header. The stored shape is still `pods[podId]` and `spaces[spaceId]`.
- Status: active / revoked / expired; hashed secret; lookup prefix; created/last-used timestamps.
- Plaintext secret returned **once** on create.

### Every authenticated call

1. Parse Bearer token → lookup + verify hash → reject if revoked/expired.
2. Resolve **owner user id**.
3. Resolve target **space** / **pod** from the request (path, body, or tool args).
4. Pod call: `permissions.pods[podId]` must include the action for that pod’s feature resource. Space or group call: `permissions.spaces[spaceId].space` or `permissions.spaces[spaceId].group` must include the action. A missing id or action is deny.
5. Confirm the owner still has **live membership** on that space/pod.
6. Confirm pod `featureKind` matches the tool/route family (pod calls). A stored resource that no longer matches `featureKind` is deny.
7. The grant in step 4 is the explicit key permission.
8. Require the **pod role matrix** (and the space role for `space` / `group`) to allow that action for the owner’s role. For fp, that is the nested `fp` grant ∩ the owner-custom role matrix (`fpCan`).

Fail closed with the same error shapes on REST and MCP.

Stale pod or space ids (deleted space, lost membership, archived pod) stay in JSON until the next save and fail closed on each call. Deleting a space does not delete the user-owned key.

### Introspection

- `GET /api/api-keys/me` and MCP `get_api_key_permissions` → **effective** capabilities for this key across the pods and spaces it grants, after membership, `featureKind`, and role-matrix intersection. The payload is `{ principalUserId, spaces: [{ spaceId, space, group }], pods: [{ podId, spaceId, featureKind, todo?, shopping?, fp? }] }`. Empty effective sections are omitted.

---

## Migration from the first slice

The first slice (`supabase/migrations/20261021120000_api_keys.sql`) created `public.api_key` with required `space_id`, `pod_ids uuid[]`, and `create_api_key(p_space_id, p_name, p_pod_ids, p_permissions, p_expires_at)`. An empty `pod_ids` list means every pod the owner can access **in that space**. Permissions may be space-level actions or `pods[podId]` grants. The settings UI was `SpaceApiKeysPanel` on `SpaceSettingsPage`.

**Chosen path: revoke active keys and require recreate.** That migration is already applied in `supabase/migrations/20261021180000_user_scoped_api_keys.sql`:

1. Revoke every active row: `status = 'revoked'`, `revoked_at = now()` where `status = 'active'`. Leave revoked rows in place so the account list can show prefix, name, and last used.
2. Drop `space_id` (FK, `api_key_owner_space_idx`, `api_key_space_id_idx`) and `pod_ids`. Index `owner_user_id`.
3. Replace `create_api_key` with a user-scoped function: name, permissions jsonb, optional expiry. Validate server-side that every `podId` is a pod the caller can access, every `spaceId` is a space they belong to, and actions are the four CRUD verbs (plus the nested fp object). Reject unknown ids.
4. Keep RLS select and revoke limited to `owner_user_id = auth.uid()`.
5. Do not backfill `pods` or `spaces`. Owners create new keys on the account page.

The layout change in this revision does not add another key migration. `spaces[spaceId].space`, `spaces[spaceId].group`, and `pods[podId]` stay the stored shape.

---

## REST surface (phased)

Thin Next.js routes under `/api/...` that:

- Authenticate via Bearer API key (session JWT remains for the first-party app UI; agent traffic is key-based)
- Validate input with existing / new Valibot schemas in `packages/model`
- Call shared services
- Return the same JSON types the UI already understands where practical

### Already shipped

1. **API keys** — user-scoped model, DB, account-settings CRUD (create/list/revoke), `me` permissions. Space settings is a one-line pointer.
2. **Auth middleware** shared by REST and MCP.
3. **todo** — columns, cards (tags on the card), comments. Card image upload is not in this API.
4. **space / group** subset — space read and update; list pods; list members; update member role; list, create, and delete invites. There is no remove-member route yet. `group` still means that admin capability; this plan does not add the route.

### Next implementation (one PR, after this plan is approved)

5. **Key matrix UX** in the UI section below (three presets, space-grouped table).
6. **financial_planning** REST and hosted MCP, same services, for the product that already exists:
   - accounts → transactions → categories
   - parsers and imports (they are already solid; see current state)
   - each call: nested `fp` grant ∩ role matrix
7. **shopping_list** — no routes. Blocked until a shopping product exists.

### Later

8. **contact** / **profile** if a product need appears.
9. Remaining fp surfaces that already exist in the app and are **not** in the next PR: bill split, settings writes, delete-all, auto-assign, reports.
10. Shopping routes, only after shopping tables and services exist.

Prefer list filters + pagination over bulk endpoints in v1.

---

## MCP

### Hosted (product)

- `POST /api/mcp` — Streamable HTTP (EndureTrade pattern)
- `Authorization: Bearer <api_key>`
- `GET` with `Accept: text/event-stream` + Bearer → empty SSE keepalive (avoid connector 405s); plain GET → small JSON transport stub
- Tool handlers call the **same** services as REST
- Full catalog registered; permission + membership enforced per call

### Docs / AI setup

- Copy EndureTrade’s `buildApiKeyAiSetupPrompt` idea: after create, show a paste-ready MCP config snippet with `${ENV}` placeholder for the secret (never embed the raw token in prompts long-term)

---

## UI

Manage keys on **account settings**: `AccountSettingsPage` (`packages/web/app/(private)/app/settings/page.tsx`, route `/app/settings`).

`SpaceApiKeysPanel` stays off `SpaceSettingsPage`. That page keeps one line: API keys are managed in Account settings. Do not keep a second editor there.

### Presets

Exactly three, in this order. Applying one **replaces** the whole grid.

1. **All on** — Create, Read, Update, and Delete checked on every visible pod row, every space header row, and every Group row.
2. **All off** — those checkboxes cleared. This is the fail-closed default when the form opens.
3. **All read** — Read checked on every visible pod row, every space header row, and every Group row. Create, Update, and Delete off.

Withdrawn from the plan and from the intended UI (they are still in the shipped editor until the implementation PR): Todo read and write, Todo read, Financial planning read, Space read, Group read.

### Pod permission table

One table. Pods are **grouped by space**: every pod in a space stays together. Sort spaces by space name, then pods in that space by pod name.

For each space the owner belongs to, in order:

1. **Space header row**, full width, label = space name. Same Create / Read / Update / Delete checkboxes, plus that row’s own row toggle. Those cells write `spaces[spaceId].space` (the space route / space admin grant).
2. **Group row**, immediately under the header and before that space’s pods. Label **Group**. Same four checkboxes and its own row toggle. Those cells write `spaces[spaceId].group`.
3. **Pod rows** for that space. Label = pod name. Cells write `pods[podId]` for the resource that matches the pod’s `featureKind`. Same four columns, same row toggle as today.

A space with no visible pods still shows the header and the Group row.

**Colour.** Space header rows and Group rows use one tint, different from pod rows, so space grants are visually distinct. The Group row uses that same tint family and is labeled Group.

**Column toggles** (header checkbox per action; mixed column shows mixed; next click turns the column on) apply to **pod rows only**. They do not change space header rows or Group rows.

**Row toggles** (checkbox at the start of the row; mixed row shows mixed; next click turns the row on) are per row: the space header, the Group row, and each pod row change only that row.

There is no second table and no per-space section under the pod matrix. The header and Group rows replace that.

### After create, and the list

- Show the secret once; copy the MCP config snippet.
- List the owner’s keys (every space): prefix, status, last used, revoke. First-slice rows appear here as revoked after the migration.

---

## Testing / acceptance (v1)

- Same service unit tests cover REST and MCP adapters
- Revoked key fails on the next call, including a key revoked by the migration
- Key with `fp.transaction.delete` still fails when the owner’s pod role cannot delete
- A grant on pod A cannot touch pod B, including a pod in another space
- Empty `pods` and `spaces` cannot call any pod, space, or group route
- One key can grant a todo pod in one space and a shopping pod in another (the shopping grant is stored; no shopping route exists yet)
- Todo MCP create and REST create produce identical DB rows and validation errors
- `get_api_key_permissions` does not claim actions the role matrix denies
- Create form opens all off
- Preset list is only All on, All off, and All read
- All on fills every visible pod row, every space header, and every Group row
- All read checks Read on those same rows and leaves Create, Update, and Delete off
- All off clears them
- Pods that share a space are contiguous, under that space’s header, with the Group row between the header and the pods
- A pod-column toggle sets that action on every visible pod row and leaves space header and Group cells unchanged
- A space-header row toggle and a Group row toggle change only that row
- Space and group are not edited in a second table
- Delete on an fp row writes nested `delete` and does not write `delete_all`
- Fp account, transaction, category, parser, and import calls succeed only when the nested grant and the role matrix both allow them, and REST and MCP share the service

---

## Decisions (locked)

1. **Same code** for REST and MCP.
2. **Hosted MCP only** — no local `packages/mcp` / stdio package.
3. **Call-time** deny; full tool catalog at register.
4. Include **`shopping`** in the resource matrix (`pods[podId].shopping`). Add **`group`** next to `space`. `group` is people, member, and role admin for that space (invite, change roles, remove members) without full space admin, stored as `spaces[spaceId].group`. Shopping has no routes until a shopping product exists.
5. Keys are **user-scoped** (`ownerUserId`). One key may grant pods in several spaces. Drop `space_id`.
6. Pod access is a **per-pod grant** (`podId` → resource actions; fp nested). A missing grant allows nothing. Create UI defaults to **all off**. Drop the pod allowlist and the “empty allowlist means every pod” rule.
7. `featureKind` gates which tools apply to a pod. The matrix still shows **one row per pod**; the stored resource follows that pod’s `featureKind`.
8. Authz: key ∧ membership ∧ featureKind ∧ key perms ∧ **role matrix**. Fp calls are nested `fp` grant ∩ role matrix. Fail closed. Revoke on every call. Hosted MCP only. These auth principles stay.
9. Principal = **key owner user id**.
10. Revoke checked **every call**.
11. Introspection = **effective** rights.
12. Keys UI stays on **`AccountSettingsPage`**. Space settings keeps the one-line pointer. The next implementation PR, after this plan is approved, ships the matrix UX in this revision and the financial-planning slice in “Current state”. It does not ship shopping routes.
13. Presets are only **All on**, **All off**, and **All read**. All read checks Read on every visible pod row and every space header and Group row, and turns Create, Update, and Delete off. Todo read/write, Todo read, FP read, Space read, and Group read are withdrawn.
14. One pod table, pods **grouped by space**. A full-width **space header** (label = space name, different colour) writes `spaces[spaceId].space`. The **Group** row directly under it (same tint family, label Group) writes `spaces[spaceId].group`. Pod rows under that write `pods[podId]`. Column toggles apply to pod rows only. The space header and the Group row have their own row toggle and cells. No separate space-permission table.
15. First-slice keys: **revoke active rows and recreate**. Do not translate empty allowlists into pod grants. Already migrated.
16. Fp row CRUD still writes the nested resources listed in the domain table, including `bill_split` and `settings`, and still omits `delete_all`. The next PR exposes routes only for accounts, transactions, categories, parsers, and imports.
17. Parked: Telegram, bulk import tools, billing, EndureTrade-style local stdio MCP, contact, profile, and a shopping product.

---

## Open (parked, not blocking draft)

- Distinct fp verbs (`import`, `undoImport`, `delete_all`) beyond the four CRUD columns. The grid writes CRUD onto the nested fp resources. The next PR’s import surface is list / create / undo using the existing import services, still authorized as nested `import` actions ∩ the role matrix.
- Whether `profile` belongs on agent keys. If it does, one account-level row, default off.
- Whether `contact` is exposed, and on which row.
- Rate limits / audit log shape (add when abuse is real)
- A remove-member route for `group` delete. The grant already means that. No such route is shipped.

---

## Current state / this slice

Checked against the repo. This is the slice the **next implementation PR** should follow. This document does not implement it.

### Already in the product

- User-scoped keys and `AccountApiKeysPanel`. Presets in code today: All on, All off, Todo read and write, Todo read only, Financial planning read only, Space read only, Group read only. The pod grid is one table (`{spaceName} / {podName}`). Space and Group are **separate tables under that grid**, one section per space. This plan replaces that preset list and that second table.
- Hosted `POST /api/mcp` and REST via the agent dispatcher. Catalog: `get_api_key_permissions`; space read/update; list pods; group members and invites (no remove member); todo columns, cards, comments. Tags are fields on the card. Card image upload is not an agent route. Server routes use `SUPABASE_SECRET_KEY`. There is no `packages/mcp` package.
- **shopping_list:** `FeatureKind.SHOPPING_LIST` is in the catalog and `create_pod` accepts it. There is no shopping table in `supabase/migrations`, no shopping model package, and no shopping db service. `PodWorkspace` shows “coming soon” for that feature. **Blocked.** The next PR does not add shopping tables or routes. A shopping pod row may still store `pods[podId].shopping`.
- **financial_planning:** the product exists. Migrations start at `20260905010000_financial_planning.sql` (plus import logs, same-file duplicates, and category groups). Tables include `fp_setting`, `fp_account`, `fp_category`, `fp_parser`, `fp_import`, `fp_import_file`, and `fp_transaction`. Bill split is a parent transaction plus children, not its own table. `@so/model` `src/fp` covers the permission matrix, CSV parse, import collect, and related helpers, with tests. `packages/web/lib/api/db` has list/create/update/delete for accounts, categories, transactions, and parsers, plus import create/list/undo and hash checks. `FinancialPlanningBoard` is the workspace. **No fp REST or MCP routes** are registered. Nested fp authz ∩ `fpCan` is already implemented and tested.
- Parsers and imports are solid enough to expose: parser builder UI, CSV mapping in the model, import file hash, row logs, and undo. Bank presets and Open Banking stay out.

### Ship on the next implementation PR

- The matrix UX in this revision (presets, space header, Group row, pod-only column toggles).
- REST and hosted MCP, thin adapters over the existing db services:
  - accounts — list, create, update, delete
  - transactions — list, create, update, delete
  - categories — list, create, update, delete
  - parsers — list, create, update, delete
  - imports — list, create, undo
- Same authz as today: the call’s `fp` resource and action must be on `pods[podId].fp`, and the owner’s role matrix must allow it. Fail closed.
- Do not add routes for bill split, settings, delete-all, auto-assign, or reports in that PR.
- Do not add shopping routes.

---

## Success

An agent can, with one user-scoped API key: connect **hosted** MCP only, CRUD todos on a granted `todo_list` pod (including pods in other spaces), manage a space’s members and invites when that space’s `group` row is granted, and read or write fp accounts, transactions, categories, parsers, and imports only where both the nested key grant and the owner’s role allow — with the same business logic behind REST and MCP. A shopping pod can be granted on the key and still has nothing to call until a shopping product exists.
