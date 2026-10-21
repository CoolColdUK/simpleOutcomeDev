# API keys, REST, and MCP — feature plan

Expose **current** SimpleOutcome features to agents and integrations the way EndureTrade does: API keys, REST, and hosted MCP, with **one shared code path**. Telegram and chat bridges are **out of this plan**.

**Repo:** [CoolColdUK/simpleOutcomeDev](https://github.com/CoolColdUK/simpleOutcomeDev)  
**Reference pattern:** [CoolColdUK/trading-journal](https://github.com/CoolColdUK/trading-journal) (`packages/model/src/apiKey`, hosted `POST /api/mcp` only — do **not** copy the local stdio package)

This is a **plan / requirements** document. Implementation notes can land later as `api-mcp-implementation.md` when we start building.

---

## Goal

1. Users create and manage **API keys** (create / list / revoke; secret shown once).
2. **REST** `/api/...` and **MCP** tools call the **same** service functions, Valibot schemas, and authz.
3. Tools and routes cover **existing** domains first: space/pod/group, todo, shopping_list, contact, profile, then financial_planning as that product solidifies.
4. MCP tools are organised by pod `FeatureKind`, but **permissions are per pod instance** (when allowlisted), plus space/group resources.

---

## Principles

| Principle | Detail |
| --- | --- |
| Same code | One service layer per resource. REST handlers and MCP tools are thin adapters. No duplicated business logic. |
| Hosted MCP only | `POST /api/mcp` only. **No** local `packages/mcp` / stdio package in the success path. |
| Authz is layered | Every call: **key valid** ∧ **live space/pod membership** ∧ **pod `featureKind` matches tool family** ∧ **key permission** ∧ **pod role matrix** (owner-custom CRUD on fp, existing pod roles elsewhere). |
| Acting principal | Membership and role checks use the **key owner’s user id**, not a fake service account. Invites and role changes apply immediately. |
| Revoke is live | Validate the key (hash / status) on **every** request. Do not cache “connected = forever” for MCP sessions. |
| Effective permissions | `get_api_key_permissions` returns **effective** rights: key bits ∩ role matrix ∩ accessible pods (and allowlist), not raw key bits alone. |
| Tool catalog | Register the **full** tool catalog. **Deny at call time**. Prefer filtering list/responses when the protocol allows; do not rely on connect-time subset alone (clients cache tools). |
| Space + pods | Keys are **space-scoped**. Empty pod allowlist = **all pods the owner can access** (not none). Least privilege comes from **explicit resource actions** (never implicit write-all) plus **per-pod grants** when an allowlist is set (`podId → resource → actions`). |

---

## Out of scope (this plan)

- Telegram / WhatsApp / chat bridges
- Bulk-only import tools (until a concrete agent need)
- Billing / marketplace
- Streaming chat over MCP
- Shipping bank parser presets or Open Banking

---

## Domain resources (matrix)

Align API key **resources** with model packages and `FeatureKind`:

| Resource (key scope) | Feature / package | Notes |
| --- | --- | --- |
| `space` | space / pod / invites | Space-scoped management subset |
| `group` | space members / roles / invites | People-group admin (CRUD membership & roles). Today this lives under space model — keep as its own key resource so bots can manage members without full space admin. If a first-class “groups” entity appears later, same slot. |
| `todo` | `todo_list` | Per-pod when allowlisted; columns, cards, comments, tags, reorder, images |
| `shopping` | `shopping_list` | Per-pod when allowlisted |
| `fp` | `financial_planning` | Per-pod when allowlisted; accounts, transactions, categories, parsers, imports, settings — **AND** owner-custom CRUD per resource |
| `contact` | contact | Threads / messages if exposed |
| `profile` | profile | Me / prefs only if agents need it |

**Actions** (EndureTrade-style): `read` / `create` / `update` / `delete` (extend only when a resource needs a distinct verb, e.g. `import` / `undoImport` for fp).

**MCP tool naming:** stable verb_resource names, grouped by feature family for docs and key UI presets, e.g. `list_todo_cards`, `create_todo_card`, `list_fp_accounts`, `create_fp_transaction`, `list_space_pods`. Tool family must match the target pod’s `featureKind`.

---

## Auth model

### Key record (sketch)

- Belongs to a **user** (owner) and a **space**
- Optional **`podIds[]`** allowlist
- **Permissions shape:**
  - **Allowlist empty:** applies to **all pods the owner can access** in that space. Resource actions are still **explicit** on the key (no implicit write-all) — space-level feature presets (`resource → actions[]`) only.
  - **Allowlist set:** only those pods; required **per-pod grants** — `podId → resource → actions[]` (fp may nest further: account / transaction / category / …)
- Space-level resources (`space`, `group`) stay on the key at space scope (not per pod)
- Status: active / revoked / expired; hashed secret; lookup prefix; created/last-used timestamps
- Plaintext secret returned **once** on create

### Every authenticated call

1. Parse Bearer token → lookup + verify hash → reject if revoked/expired  
2. Resolve **owner user id**  
3. Resolve target **space** / **pod** from request (path, body, or tool args)  
4. Enforce space match on the key; resolve which pods this key may touch (allowlist if set, else all owner-accessible pods); if allowlist set, pod id must be listed **and** that pod’s grant must include the resource+action  
5. Confirm owner still has **live membership** on that space/pod  
6. Confirm pod `featureKind` matches the tool/route family  
7. Require **explicit** key permission for resource+action (from that pod’s map, or space-level preset if allowlist empty — never implicit write-all)  
8. Require **pod role matrix** allows that action for the owner’s role (esp. fp owner-custom matrix)  

Fail closed with the same error shapes on REST and MCP.

### Introspection

- `GET /api/api-keys/me` and MCP `get_api_key_permissions` → **effective** capabilities for this key in this space (and optionally per listed pod).

---

## REST surface (phased)

Thin Next.js (or existing web API) routes under `/api/...` that:

- Authenticate via Bearer API key (session JWT may remain for the first-party app UI; agent traffic is key-based)
- Validate input with existing / new Valibot schemas in `packages/model`
- Call shared services
- Return the same JSON types the UI already understands where practical

### Phase order

1. **API keys** — model + DB + CRUD UI (create/list/revoke) + `me` permissions  
2. **Auth middleware** shared by REST and MCP  
3. **todo** end-to-end (clearest CRUD)  
4. **space/pod** read + safe management subset  
5. **shopping_list**  
6. **contact** / **profile** as needed  
7. **financial_planning** — mirror fp permission matrix; expose accounts → transactions → categories → parsers/imports as those APIs exist  

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

- Settings (or space settings): manage API keys for a space  
- Create: name, permission presets (e.g. todo read-write, fp read-only), optional pod allowlist  
- Show secret once; copy MCP config  
- List: prefix, status, last used, revoke  

---

## Testing / acceptance (v1)

- Same service unit tests cover REST and MCP adapters  
- Revoked key fails mid-session on next call  
- Key with `fp.transaction.delete` still fails when the owner’s pod role cannot delete  
- Key allowlisted to pod A cannot touch pod B  
- Todo MCP create + REST create produce identical DB rows and validation errors  
- `get_api_key_permissions` does not claim actions the role matrix denies  

---

## Decisions (locked)

1. **Same code** for REST and MCP.  
2. **Hosted MCP only** — no local `packages/mcp` / stdio package.  
3. **Call-time** deny; full tool catalog at register.  
4. Include **`shopping_list`** in the resource matrix; add **`group`** (member/role admin) next to `space`.  
5. Keys: **space-scoped + optional pod id allowlist**.  
6. **Empty allowlist = all pods the owner can access** (not none); actions still explicit (no write-all). **Per-pod grants required when allowlist is set** (`podId → resource → actions`).  
7. `featureKind` gates which tools apply to a pod; it is **not** the permission grain.  
8. Authz: key ∧ membership ∧ featureKind ∧ key perms ∧ **role matrix**.  
9. Principal = **key owner user id**.  
10. Revoke checked **every call**.  
11. Introspection = **effective** rights.  
12. Build order: keys → middleware → **todo** → space/group → shopping → contact/profile → **fp**.  
13. Parked: Telegram, bulk import tools, billing, EndureTrade-style local stdio MCP.

---

## Open (parked, not blocking draft)

- Exact fp nested permission keys vs flat `fp` + action (prefer nested to match owner-custom matrix once implementation starts)
- Whether profile belongs on agent keys at all
- Rate limits / audit log shape (add when abuse is real)

---

## Success

An agent can, with one space-scoped API key: connect **hosted** MCP only, list only pods it may access, CRUD todos on a specific `todo_list` pod under that pod’s grants, manage space **group**/membership when `group` is granted, and later read/write fp data only where both the key and the owner’s role allow — without any business logic living only in MCP or only in REST.
