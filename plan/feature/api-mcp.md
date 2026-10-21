# API keys, REST, and MCP — feature plan

Expose **current** SimpleOutcome features to agents and integrations the way EndureTrade does: API keys, REST, and hosted MCP, with **one shared code path**. Telegram and chat bridges are **out of this plan**.

**Repo:** [CoolColdUK/simpleOutcomeDev](https://github.com/CoolColdUK/simpleOutcomeDev)  
**Reference pattern:** [CoolColdUK/trading-journal](https://github.com/CoolColdUK/trading-journal) (`packages/model/src/apiKey`, hosted `POST /api/mcp` only — do **not** copy the local stdio package)

Checkbox grid and presets follow trading-journal:

- `packages/web/app/settings/SettingsPageApiKeysTab.tsx` (`PermissionGrid`)
- `packages/model/src/apiKey/apiKeyPermissionPresets.ts` (`ApiKeyPermissionPreset.AllOn`, `ApiKeyPermissionPreset.AllOff`)

That grid has per-cell checkboxes and All on / All off. It has no row or column bulk toggles. SimpleOutcome adds those.

This is a **plan / requirements** document. The first slice shipped space-scoped keys and `SpaceApiKeysPanel` on space settings. The decisions below replace that shape. Implementation of this revision lands in a later change.

---

## Goal

1. Users create and manage **API keys** (create / list / revoke; secret shown once) from **account settings**.
2. **REST** `/api/...` and **MCP** tools call the **same** service functions, Valibot schemas, and authz.
3. Tools and routes cover **existing** domains first: space/pod/group, todo, shopping_list, contact, profile, then financial_planning as that product solidifies.
4. MCP tools are organised by pod `FeatureKind`. **Permissions are per pod** the owner can access, including pods in more than one space. `space` and `group` are granted per space in the same key.

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

---

## Domain resources (matrix)

Align API key **resources** with model packages and `FeatureKind`:

| Resource (key scope) | Feature / package | Notes |
| --- | --- | --- |
| `space` | space / pod / invites | Per space, in the space section (see UI) |
| `group` | space members / roles / invites | Per space, same section. People-group admin (CRUD membership and roles). Today this lives under the space model — keep it as its own key resource so a bot can manage members without full space admin. If a first-class “groups” entity appears later, same slot. |
| `todo` | `todo_list` | One grant on that pod |
| `shopping` | `shopping_list` | One grant on that pod |
| `fp` | `financial_planning` | One matrix row per pod. Stored as the existing nested fp grant (accounts, transactions, categories, parsers, imports, settings) **and** the owner-custom CRUD matrix |
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
      space?: ApiKeyAction[]
      group?: ApiKeyAction[]
    }
  }
}
```

- A pod grant stores the resource that matches that pod’s `featureKind`. Checking Create / Read / Update / Delete on an fp row writes that action onto each nested fp resource the key can grant (`account`, `category`, `transaction`, `parser`, `import`, `bill_split`, `settings`). Omit `delete_all`.
- **Empty default (fail closed):** omit a pod or space that has no checked action. `pods: {}` and `spaces: {}` allow no pod, space, or group call. The create form starts from **All off**. There is no “empty means every pod” mode.
- One key may list pods from several spaces the owner can access.
- Status: active / revoked / expired; hashed secret; lookup prefix; created/last-used timestamps.
- Plaintext secret returned **once** on create.

### Every authenticated call

1. Parse Bearer token → lookup + verify hash → reject if revoked/expired.
2. Resolve **owner user id**.
3. Resolve target **space** / **pod** from the request (path, body, or tool args).
4. Pod call: `permissions.pods[podId]` must include the action for that pod’s feature resource. Space or group call: `permissions.spaces[spaceId]` must include the action on `space` or `group`. A missing id or action is deny.
5. Confirm the owner still has **live membership** on that space/pod.
6. Confirm pod `featureKind` matches the tool/route family (pod calls). A stored resource that no longer matches `featureKind` is deny.
7. The grant in step 4 is the explicit key permission.
8. Require the **pod role matrix** (and the space role for `space` / `group`) to allow that action for the owner’s role (especially the fp owner-custom matrix).

Fail closed with the same error shapes on REST and MCP.

Stale pod or space ids (deleted space, lost membership, archived pod) stay in JSON until the next save and fail closed on each call. Deleting a space does not delete the user-owned key.

### Introspection

- `GET /api/api-keys/me` and MCP `get_api_key_permissions` → **effective** capabilities for this key across the pods and spaces it grants, after membership, `featureKind`, and role-matrix intersection.

---

## Migration from the first slice

The first slice (`supabase/migrations/20261021120000_api_keys.sql`) created `public.api_key` with required `space_id`, `pod_ids uuid[]`, and `create_api_key(p_space_id, p_name, p_pod_ids, p_permissions, p_expires_at)`. An empty `pod_ids` list means every pod the owner can access **in that space**. Permissions may be space-level actions or `pods[podId]` grants. The settings UI is `SpaceApiKeysPanel` on `SpaceSettingsPage`.

**Chosen path: revoke active keys and require recreate.**

Plaintext secrets are stored only as a sha256 hash, so rewriting a row still cannot keep an existing MCP client working. Expanding an empty allowlist into a pod snapshot would also grant pods the owner never ticked. Revoke avoids both.

Next implementation slice (not this docs change):

1. Revoke every active row: `status = 'revoked'`, `revoked_at = now()` where `status = 'active'`. Leave revoked rows in place so the account list can show prefix, name, and last used.
2. Drop `space_id` (FK, `api_key_owner_space_idx`, `api_key_space_id_idx`) and `pod_ids`. Index `owner_user_id`.
3. Replace `create_api_key` with a user-scoped function: name, permissions jsonb, optional expiry. Validate server-side that every `podId` is a pod the caller can access, every `spaceId` is a space they belong to, and actions are the four CRUD verbs (plus the nested fp object). Reject unknown ids.
4. Keep RLS select and revoke limited to `owner_user_id = auth.uid()`.
5. Do not backfill `pods` or `spaces`. Owners create new keys on the account page.

---

## REST surface (phased)

Thin Next.js routes under `/api/...` that:

- Authenticate via Bearer API key (session JWT remains for the first-party app UI; agent traffic is key-based)
- Validate input with existing / new Valibot schemas in `packages/model`
- Call shared services
- Return the same JSON types the UI already understands where practical

### Phase order

1. **API keys** — model + DB + account-settings CRUD UI (create/list/revoke) + `me` permissions. Includes the migration above and removal of the space-settings panel.
2. **Auth middleware** shared by REST and MCP
3. **todo** end-to-end (clearest CRUD)
4. **space/pod** read + safe management subset
5. **shopping_list**
6. **contact** / **profile** as needed
7. **financial_planning** — mirror fp permission matrix; expose accounts → transactions → categories → parsers/imports as those APIs exist

Prefer list filters + pagination over bulk endpoints in v1.

The first slice already landed keys, middleware, todo, a space/group subset, and hosted MCP on the space-scoped model. The next keys change is the user-scoped matrix and migration. Later phases stay in this order.

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

Remove `SpaceApiKeysPanel` from `SpaceSettingsPage`. Leave one line on that page: API keys are managed in Account settings. Do not keep a second editor there.

### Create

- Name.
- Presets, in this order:
  - **All on** and **All off** (same idea as `ApiKeyPermissionPreset.AllOn` / `AllOff`). All on checks every visible pod row and every space-section row. All off clears them. This is the fail-closed default.
  - Keep the current shortcuts. Applying one **replaces** the grid (other cells clear):
    - Todo read and write — CRUD on visible `todo_list` pods
    - Todo read — Read on visible `todo_list` pods
    - Financial planning read — Read on each nested fp resource for visible `financial_planning` pods
    - Space read — Read on the Space row of every visible space section
    - Group read — Read on the Group row of every visible space section
- **Pod matrix.** One row per pod the owner can access (active pods only). Label `{spaceName} / {podName}` (example: `Family / Groceries`). Sort by space name, then pod name.
- Columns: **Create / Read / Update / Delete**.
- **Column toggle:** a header checkbox on each action. It sets that action on or off for every row **in that grid**. When the column is mixed, the control shows mixed and the next click turns the column on.
- **Row toggle:** a checkbox at the start of the row. It sets all four CRUD actions for that pod on or off. Mixed works the same way (next click turns the row on).
- The pod matrix column toggles do not change space sections.

### Space and group

`space` and `group` are **per-space sections** on the same account screen, under the pod matrix. They are separate from the pod rows so a “Read for all pods” toggle cannot grant space admin.

Each space the owner belongs to is a section titled with the space name. Inside it, two rows: **Space** and **Group**, with the same four columns, a row toggle, and column toggles that affect only those two rows.

Stored as `spaces[spaceId]`. All on / All off include these sections. The narrow space and group presets fill only their row.

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
- One key can grant a todo pod in one space and a shopping pod in another
- Todo MCP create and REST create produce identical DB rows and validation errors
- `get_api_key_permissions` does not claim actions the role matrix denies
- Create form opens all off
- A pod-matrix column toggle sets that action on every visible pod row and leaves space sections unchanged
- A row toggle sets all four actions on that pod
- All on fills every visible pod and every space section; All off clears them
- Delete on an fp row writes nested `delete` and does not write `delete_all`

---

## Decisions (locked)

1. **Same code** for REST and MCP.
2. **Hosted MCP only** — no local `packages/mcp` / stdio package.
3. **Call-time** deny; full tool catalog at register.
4. Include **`shopping_list`** in the resource matrix; add **`group`** (member/role admin) next to `space`.
5. Keys are **user-scoped** (`ownerUserId`). One key may grant pods in several spaces. Drop `space_id`.
6. Pod access is a **per-pod grant** (`podId` → resource actions; fp nested). A missing grant allows nothing. Create UI defaults to **all off**. Drop the pod allowlist and the “empty allowlist means every pod” rule.
7. `featureKind` gates which tools apply to a pod. The matrix still shows **one row per pod**; the stored resource follows that pod’s `featureKind`.
8. Authz: key ∧ membership ∧ featureKind ∧ key perms ∧ **role matrix**.
9. Principal = **key owner user id**.
10. Revoke checked **every call**.
11. Introspection = **effective** rights.
12. Build order stays: keys → middleware → **todo** → space/group → shopping → contact/profile → **fp**. Keys UI moves to **`AccountSettingsPage`**. Remove **`SpaceApiKeysPanel`** from space settings (one-line pointer only).
13. Pod matrix: rows labeled `{spaceName} / {podName}`, only pods the owner can access. Columns **Create / Read / Update / Delete**. Presets include **All on** and **All off**, plus the existing narrow shortcuts. Header toggle per action column (every row in that grid). Row toggle for all four actions. Reference: trading-journal `PermissionGrid` and `ApiKeyPermissionPreset.AllOn` / `AllOff`. Add the bulk toggles; the reference grid does not have them.
14. **`space` and `group`** live in **per-space sections** on the same account screen (`spaces[spaceId]`), with their own row and column toggles. They are separate from the pod matrix.
15. First-slice keys: **revoke active rows and recreate**. Do not translate empty allowlists into pod grants.
16. Parked: Telegram, bulk import tools, billing, EndureTrade-style local stdio MCP.

---

## Open (parked, not blocking draft)

- Distinct fp verbs (`import`, `undoImport`, `delete_all`) beyond the four CRUD columns. The grid writes CRUD onto the nested fp resources.
- Whether `profile` belongs on agent keys. If it does, one account-level row, default off.
- Whether `contact` is exposed, and on which row.
- Rate limits / audit log shape (add when abuse is real)

---

## Implementation notes (first slice, superseded for keys)

- Agent REST and `POST /api/mcp` use a server-only `SUPABASE_SECRET_KEY` (see `packages/web/env.example`). The settings UI creates and revokes keys with the signed-in session. There is no `packages/mcp` stdio package. That split stays.
- The hosted tool catalog shipped so far: todo columns, cards, comments, and tags; space read/update; group members and invites; `get_api_key_permissions`. Shopping has no tables yet. Financial planning authz is nested and tested; fp routes wait on that product. Card image upload is not in this API.
- Key storage and `SpaceApiKeysPanel` follow the first-slice space-scoped model. The auth, UI, and migration sections above replace that model. Until the migration ships, runtime behaviour is still the first slice.

---

## Success

An agent can, with one user-scoped API key: connect **hosted** MCP only, CRUD todos on a granted `todo_list` pod (and other granted pods, including pods in other spaces), manage a space’s **group** / membership when that space’s `group` row is granted, and later read/write fp data only where both the key and the owner’s role allow — with the same business logic behind REST and MCP.
