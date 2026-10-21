# API keys, REST, and MCP — feature plan

Expose **current** SimpleOutcome features to agents and integrations the way EndureTrade does: API keys, REST, and hosted MCP, with **one shared code path**. Telegram and chat bridges are **out of this plan**.

**Repo:** [CoolColdUK/simpleOutcomeDev](https://github.com/CoolColdUK/simpleOutcomeDev)  
**Reference pattern:** [CoolColdUK/trading-journal](https://github.com/CoolColdUK/trading-journal) (`packages/model/src/apiKey`, hosted `POST /api/mcp` only — do **not** copy the local stdio package)

Checkbox cells follow trading-journal:

- `packages/web/app/settings/SettingsPageApiKeysTab.tsx` (`PermissionGrid`)
- `packages/model/src/apiKey/apiKeyPermissionPresets.ts` (`ApiKeyPermissionPreset.AllOn`, `ApiKeyPermissionPreset.AllOff`)

That grid has per-cell checkboxes and All on / All off. It has no row or column bulk toggles. SimpleOutcome adds those, plus **All read**.

This is a **plan / requirements** document. User-scoped keys are already implemented (`supabase/migrations/20261021180000_user_scoped_api_keys.sql`, `AccountApiKeysPanel` on `AccountSettingsPage`). This revision replaces the preset list and the separate space-section tables, and it is the scope for REST and hosted MCP coverage of every shipped product feature. Product code waits until this plan is approved, then lands on **one implementation**. After that merges, an agent with a properly granted key can use hosted MCP and REST for all shipped features. There is no later “step 2” PR for domains that already have tables and services.

---

## Goal

1. Users create and manage **API keys** (create / list / revoke; secret shown once) from **account settings**.
2. **REST** `/api/...` and **MCP** tools call the **same** service functions, Valibot schemas, and authz.
3. After this implementation is merged, an agent with a properly granted key can use **hosted MCP and REST** for every product feature that already has tables and services: todo, space and group (including the gaps below), financial planning, and profile. Shopping stays a reserved pod type. Contact is not a product surface.
4. MCP tools are organised by pod `FeatureKind`. **Permissions are per pod** the owner can access, including pods in more than one space. `space` and `group` are granted per space on the same key. Profile is one account-level grant.

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
- A new generic bulk-import tool. The existing financial-planning import service is in scope.
- Billing / marketplace
- Streaming chat over MCP
- Shipping bank parser presets or Open Banking
- A second API-key editor on space settings

---

## Domain resources (matrix)

Align API key **resources** with model packages and `FeatureKind`:

| Resource (key scope) | Feature / package | Notes |
| --- | --- | --- |
| `space` | space route / space admin | Per space. The space **header row** in the pod table. Stored as `spaces[spaceId].space`. |
| `group` | people / member and role admin for that space | Per space. The **Group** row under that space header. Invite, change roles, and remove members, **without** full space admin. Stored as `spaces[spaceId].group`. |
| `todo` | `todo_list` | One grant on that pod (`pods[podId].todo`) |
| `fp` | `financial_planning` | One matrix row per pod (`pods[podId].fp`). The row’s CRUD checkboxes write that action onto `account`, `category`, `transaction`, `parser`, `import`, `bill_split`, and `settings`. They do not write `delete_all`. A separate **Delete all transactions** checkbox on an fp pod row writes `fp.delete_all: ['create']`. Calls still need the nested grant **and** the owner-custom role matrix. |
| `profile` | `profile` | One account-level row, not inside a space. Read and Update. Stored as `profile` on the key. |

Contact is not a row. `POST /api/contact` validates a marketing form and logs it. Nothing is stored.

**Actions** (EndureTrade-style), column order **Create / Read / Update / Delete**: `create` / `read` / `update` / `delete`. Extend only when a resource needs a distinct verb (for example `import` / `undoImport` for fp). The Delete checkbox writes `delete` on the resource. It does not write fp `delete_all`.

**MCP tool naming:** stable verb_resource names, grouped by feature family for docs, e.g. `list_todo_cards`, `create_todo_card`, `list_fp_accounts`, `create_fp_transaction`, `list_space_pods`. Tool family must match the target pod’s `featureKind`.

---

## Auth model

### Key record (sketch)

- Belongs to a **user** (`ownerUserId`). No `spaceId`. No `podIds` allowlist.
- **Permissions shape:**

```ts
{
  profile?: ApiKeyAction[]        // account-level Read / Update
  pods: {
    [podId]: {
      todo?: ApiKeyAction[]       // todo_list pods
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

- A pod grant stores the resource that matches that pod’s `featureKind`. Checking Create / Read / Update / Delete on an fp row writes that action onto each nested fp resource the key can grant (`account`, `category`, `transaction`, `parser`, `import`, `bill_split`, `settings`). Those four cells do not write `delete_all`. The fp row’s **Delete all transactions** checkbox writes `fp.delete_all: ['create']`.
- **Empty default (fail closed):** omit a pod, space, or profile grant that has no checked action. `pods: {}` and `spaces: {}` and a missing `profile` allow no pod, space, group, or profile call. The create form starts from **All off**. There is no “empty means every pod” mode.
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

- `GET /api/api-keys/me` and MCP `get_api_key_permissions` → **effective** capabilities for this key across the pods and spaces it grants, after membership, `featureKind`, and role-matrix intersection. The payload is `{ principalUserId, profile?, spaces: [{ spaceId, space, group }], pods: [{ podId, spaceId, featureKind, todo?, fp? }] }`. Empty effective sections are omitted. Profile is the owner’s own row; it does not depend on a space role.

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

1. **API keys** — user-scoped model, DB, account-settings CRUD (create/list/revoke) on the signed-in session, plus `GET /api/api-keys/me` and `get_api_key_permissions` on the bearer key.
2. **Auth middleware** shared by REST and MCP.
3. **todo** — column CRUD, card CRUD, comment CRUD. See the agent surface for the gaps (reorder, column archive, assignee, card icon).
4. **space / group** subset — space read and update; list pods; list members; update member role; list, create, and delete invites.

### This implementation (after this plan is approved)

5. **Key matrix UX** in the UI section below.
6. **REST and hosted MCP for every shipped feature** in “Agent surface”. Same services as the app. No follow-up PR for a second step.

Prefer list filters + pagination over bulk endpoints. The existing fp import, confirm, and bulk category-assign services are part of this surface.

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

1. **All on** — Create, Read, Update, and Delete checked on every visible pod row, every space header row, every Group row, and the Profile row. On each fp pod row, **Delete all transactions** is checked.
2. **All off** — those checkboxes cleared, including Delete all transactions. This is the fail-closed default when the form opens.
3. **All read** — Read checked on every visible pod row, every space header row, every Group row, and the Profile row. Create, Update, and Delete off. Delete all transactions off.

Withdrawn from the plan and from the intended UI (they are still in the shipped editor until the implementation PR): Todo read and write, Todo read, Financial planning read, Space read, Group read.

### Pod permission table

One table. Pods are **grouped by space**: every pod in a space stays together. Sort spaces by space name, then pods in that space by pod name.

For each space the owner belongs to, in order:

1. **Space header row**, full width, label = space name. Same Create / Read / Update / Delete checkboxes, plus that row’s own row toggle. Those cells write `spaces[spaceId].space` (the space route / space admin grant).
2. **Group row**, immediately under the header and before that space’s pods. Label **Group**. Same four checkboxes and its own row toggle. Those cells write `spaces[spaceId].group`.
3. **Pod rows** for that space. Label = pod name. Cells write `pods[podId]` for the resource that matches the pod’s `featureKind`. Same four columns, same row toggle as today. An fp pod row also has **Delete all transactions**, which is not a fifth CRUD column and is not changed by the column toggles.

A space with no visible pods still shows the header and the Group row.

**Profile row.** One row for the account, outside every space block. Label **Profile**. Read and Update only (no create or delete service). Its row toggle sets those two cells. Column toggles do not change it. Cells write `profile`.

**Colour.** Space header rows and Group rows use one tint, different from pod rows, so space grants are visually distinct. The Group row uses that same tint family and is labeled Group.

**Column toggles** (header checkbox per action; mixed column shows mixed; next click turns the column on) apply to **pod rows only**. They do not change space header rows, Group rows, the Profile row, or Delete all transactions.

**Row toggles** (checkbox at the start of the row; mixed row shows mixed; next click turns the row on) are per row: the space header, the Group row, each pod row, and the Profile row change only that row. A pod row toggle sets the four CRUD cells. It does not set Delete all transactions.

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
- One key can grant a todo pod in one space and an fp pod in another
- Todo MCP create and REST create produce identical DB rows and validation errors
- `get_api_key_permissions` does not claim actions the role matrix denies
- Create form opens all off
- Preset list is only All on, All off, and All read
- All on fills every visible pod row, every space header, every Group row, and Profile Read and Update, and checks Delete all transactions on each fp pod row
- All read checks Read on those same rows and on Profile, and leaves Create, Update, Delete, and Delete all transactions off
- All off clears them
- Pods that share a space are contiguous, under that space’s header, with the Group row between the header and the pods
- A pod-column toggle sets that action on every visible pod row and leaves space header and Group cells unchanged
- A space-header row toggle and a Group row toggle change only that row
- Space and group are not edited in a second table
- Delete on an fp row writes nested `delete` and does not write `delete_all`
- Delete all transactions is denied unless that fp row’s extra checkbox granted `fp.delete_all`
- Every family in “Agent surface” is callable on REST and on hosted MCP through the same service, or is listed under “No route”
- Profile read and update affect only the key owner
- Contact and shopping have no agent tools

---

## Decisions (locked)

1. **Same code** for REST and MCP.
2. **Hosted MCP only** — no local `packages/mcp` / stdio package.
3. **Call-time** deny; full tool catalog at register.
4. Add **`group`** next to `space`. `group` is people, member, and role admin for that space (invite, change roles, remove members) without full space admin, stored as `spaces[spaceId].group`.
5. Keys are **user-scoped** (`ownerUserId`). One key may grant pods in several spaces. Drop `space_id`.
6. Pod access is a **per-pod grant** (`podId` → resource actions; fp nested). A missing grant allows nothing. Create UI defaults to **all off**. Drop the pod allowlist and the “empty allowlist means every pod” rule.
7. `featureKind` gates which tools apply to a pod. The matrix still shows **one row per pod**; the stored resource follows that pod’s `featureKind`.
8. Authz: key ∧ membership ∧ featureKind ∧ key perms ∧ **role matrix**. Fp calls are nested `fp` grant ∩ role matrix. Fail closed. Revoke on every call. Hosted MCP only. These auth principles stay.
9. Principal = **key owner user id**.
10. Revoke checked **every call**.
11. Introspection = **effective** rights.
12. Keys UI stays on **`AccountSettingsPage`**. Space settings keeps the one-line pointer. The next implementation, after this plan is approved, ships the matrix UX and the agent surface below. After merge, a properly granted key reaches every shipped feature on hosted MCP and REST. That is not a follow-up PR.
13. Presets are only **All on**, **All off**, and **All read**. All read checks Read on every visible pod row, every space header, every Group row, and Profile, and turns Create, Update, Delete, and Delete all transactions off. Todo read/write, Todo read, FP read, Space read, and Group read are withdrawn.
14. One pod table, pods **grouped by space**. A full-width **space header** (label = space name, different colour) writes `spaces[spaceId].space`. The **Group** row directly under it (same tint family, label Group) writes `spaces[spaceId].group`. Pod rows under that write `pods[podId]`. An fp pod row has a separate Delete all transactions checkbox. A **Profile** row sits outside the space blocks and writes `profile`. Column toggles apply to pod rows only. The space header, Group row, and Profile row have their own row toggle and cells. No separate space-permission table.
15. First-slice keys: **revoke active rows and recreate**. Do not translate empty allowlists into pod grants. Already migrated.
16. Fp row CRUD writes `account`, `category`, `transaction`, `parser`, `import`, `bill_split`, and `settings`. It does not write `delete_all`. Delete all transactions is the extra checkbox (`fp.delete_all: ['create']`). The implementation exposes the fp families in “Agent surface”, including bill split, settings, auto-assign, confirm, and delete-all.
17. Parked: Telegram, a generic bulk-import tool, billing, EndureTrade-style local stdio MCP, the contact stub, and a shopping product. Profile is in this implementation.

---

## Open (parked, not blocking draft)

- Rate limits / audit log shape (add when abuse is real).
- `group` means remove-member as well as invite and role change. No remove-member service exists, so this implementation does not invent one.

---

## Current state / this slice

Checked against the repo. This is the slice the **next implementation PR** should follow. This document does not implement it.

### Already in the product

- User-scoped keys and `AccountApiKeysPanel`. Presets in code today: All on, All off, Todo read and write, Todo read only, Financial planning read only, Space read only, Group read only. The pod grid is one table (`{spaceName} / {podName}`). Space and Group are **separate tables under that grid**, one section per space. This plan replaces that preset list and that second table.
- Hosted `POST /api/mcp` and REST via the agent dispatcher. Catalog today: `get_api_key_permissions`; `get_space`, `update_space`, `list_space_pods`; `list_space_members`, `update_space_member_role`, `list_space_invites`, `create_space_invite`, `delete_space_invite`; todo column, card, and comment CRUD. Card tags, due, and completed are card fields. Assignee and card icons are not on the agent schema yet. Server routes use `SUPABASE_SECRET_KEY`. There is no `packages/mcp` package.
- **financial_planning** product exists and has **no** agent routes yet. Migrations start at `20260905010000_financial_planning.sql` (import logs, same-file duplicates, category groups). Tables: `fp_setting`, `fp_account`, `fp_category`, `fp_parser`, `fp_import`, `fp_import_file`, `fp_transaction`. Bill split is a parent transaction plus children. Category “groups” are fields on `fp_category`, not a separate table. Services in `packages/web/lib/api/db`: account, category, transaction, and parser list/create/update/delete; `sumDbFpAccountBalance`; transaction assign, bulk assign, and confirm; import create/list/list files/undo/`hasDbFpImportHash`; `getDbFpSetting` / `updateDbFpSetting`; `deleteAllDbFpTransactions`; `createDbFpBillSplit` / `deleteDbFpBillSplit`; auto-assign preview and apply. The report and CSV download are client-side over those lists (`buildFpCategoryReport`, `downloadFpTransactionsCsv`). Nested fp authz ∩ `fpCan` is already implemented and tested.
- **profile** is a real table and real services: `getDbProfile`, `updateDbProfileDisplayName`, `updateDbProfileUsername` (cooldown in `@so/model`). Used by account settings and the username gate. The current `ApiKeyPermissions` type has no `profile` field; this implementation adds it.
- **contact** is `POST /api/contact`: valibot parse, `console.info`, `{ok: true}`. No table.

### Agent surface

The matrix UX in this revision, plus the families below. REST and MCP call the same existing service. Names are the MCP tools; REST is the same operation under `/api/...`. This is the whole bearer surface after merge.

**Keep (already shipped):** `get_api_key_permissions`; `get_space`, `update_space`, `list_space_pods`; `list_space_members`, `update_space_member_role`, `list_space_invites`, `create_space_invite`, `delete_space_invite`; `list/create/update/delete_todo_column`; `list/create/update/delete_todo_card`; `list/create/update/delete_todo_comment`.

**Space** (`spaces[spaceId].space`, plus the role check the screen already uses):

- `list_spaces` — spaces the owner still belongs to. A valid key is enough. A later call on a space still needs that space’s grant.
- `create_space` — same as the home dialog. A valid key is enough. The new space is not granted on the key until the key is edited.
- `create_pod`, `update_pod`, `set_pod_status` (archive and restore), `delete_pod`. Create uses space admin (`canManageSpace`). Update, archive, and delete use the pod settings rule (pod owner or space owner).
- `search_pods`, `join_open_pod`, `create_pod_join_request` — Find pods. Key grant is `space` read on that space (any member can open that screen). Join still follows open-pod versus request rules.
- `join_space_by_invite` — the `/app/join/[token]` page. A valid key is enough. The space is not on the key until the key is edited.

**Group** (`spaces[spaceId].group`, plus the screen’s role check):

- `disable_space_invite` (the invitations page; delete is already shipped).
- `list_pod_members`, `add_pod_member_by_username`, `update_pod_member_role`.
- `list_pod_join_requests`, `approve_pod_join_request`, `deny_pod_join_request`.

**Todo** (`pods[podId].todo`):

- `reorder_todo_columns`, `reorder_todo_cards` (update).
- `archive_todo_column_cards`, `archive_todo_column_completed` (update). These clear `column_id`, which is how the board archives.
- `update_todo_card` also accepts `assigneeUserId` (the db service already does; the agent schema does not).
- `replace_todo_card_icon`, `clear_todo_card_icon` (update), and a signed URL on card read. Existing storage helpers (`replaceTodoCardIcon`, `clearTodoCardIcon`, `listStorageTodoCardIconSignedUrls`).

**Profile** (`profile` on the key; the owner only):

- `get_profile` (read).
- `update_profile_display_name`, `update_profile_username` (update). Username keeps `canChangeUsername` / the cooldown.

**Financial planning** (`pods[podId].fp` ∩ `fpCan`):

- Accounts — list, create, update, delete. List includes the derived balance (`sumDbFpAccountBalance`).
- Categories — list, create, update, delete, including the group fields on the category.
- Transactions — list, create, update, delete. Update covers the archive flag. Also `assign_fp_transaction_category`, `bulk_assign_fp_transaction_category`, and `confirm_fp_transactions` (transaction update).
- Parsers — list, create, update, delete.
- Imports — list, list files, create, undo (import delete), `has_fp_import_hash` (import read).
- Bill split — `create_fp_bill_split`, `delete_fp_bill_split` (`bill_split` create / delete). The UI creates splits; the delete service exists and is included.
- Settings — `get_fp_setting` (settings read), `update_fp_setting` for currency and the permission matrix (settings update).
- Auto-assign — preview (transaction read), apply (transaction update).
- `delete_all_fp_transactions` — `fp.delete_all` create, from the extra checkbox, and `fpCan` for `delete_all`.

**API keys on the bearer catalog** stay `get_api_key_permissions` only. Create, list, and revoke stay the signed-in account page. A key does not mint keys.

### No route

- **Shopping.** Reserved `FeatureKind.SHOPPING_LIST` only. See Future note.
- **Contact.** Marketing stub, no table, no stored messages.
- **Remove space member** and **delete space.** No service. Not invented here.
- **Password change.** Session auth (`updateSupabaseAuthPassword`), not a domain service.
- **Fp report and CSV download.** Computed in the client from accounts, categories, and transactions. Listing those resources is the agent surface. No bank presets and no Open Banking.

---

## Future note

`FeatureKind.SHOPPING_LIST` is already a reserved pod type: the catalog includes it and `create_pod` accepts it. If a pod of that kind is visible, the matrix shows an ordinary pod row for it, and the existing `pods[podId].shopping` field on the grant type can store those cells.

---

## Success

An agent can, with one user-scoped API key, connect **hosted** MCP and call the same operations over REST. Where the key grants it, and the owner’s role still allows it, that covers every shipped feature: todos (including reorder, column archive, assignee, and card icons), space and pod admin, group membership and invites, pod join requests, profile display name and username, and financial planning (accounts, transactions, categories, parsers, imports, bill split, settings, auto-assign, and delete-all). Shopping and the contact stub stay off this surface. Business logic lives in the shared services, not in a separate MCP path.
