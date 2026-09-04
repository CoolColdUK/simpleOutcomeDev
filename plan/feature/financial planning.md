# Financial planning — feature / requirements

Personal money tracking inside a SimpleOutcome **pod**: accounts (opening balance), imported and manual transactions, categories, reusable CSV parsers, auto-categorisation with confirmation, and a date-ranged view that switches between a **category report** and a **transaction list** (same pattern as Trading Journal session detail: Report / Trades).

This is a **requirements** document. Implementation: [`financial planning-implementation.md`](./financial%20planning-implementation.md).

**Reference:** GoalJar (`product-management/packages/appGoalJar`) is a prior personal finance app. Use it for lessons, not as a spec to copy. Improvements called out below.

---

## Problem

Bank CSVs are the source of truth for “what happened”, but they are noisy: different column layouts, duplicate rows on re-import, and merchants that need grouping. GoalJar mixed hardcoded bank parsers, a global transaction list with no accounts, stringly-typed category filters, and a savings-jar product that was only loosely tied to spend. This feature should make **accounts + import + categorise + review** the core loop, and keep savings-goal “jars” out unless we add them later.

## Who it is for

Someone who exports statements (CSV) from one or more banks/cards, wants a running picture of spend by purpose (category), and is willing to set up parsers and category rules once so later imports are mostly automatic.

## In scope (this feature)

- Accounts with an opening fund
- Transactions (imported and manual), each on exactly one account; **archive** (excluded from calculations; find them on a separate page); **delete all** transactions (settings, confirmed)
- Categories (one per transaction) including a virtual **Uncategorised** bucket; direction: transfer, income, expense, saving; optional **monthly or yearly budget** (visual / percentage); **favourite** and/or **sort order**
- Named, reusable **parsers** for CSV, built in the UI from an example file (optional header identifier + column map with parse transforms). **No** shipped bank presets
- Import: drag one or more files, auto-match parser (overridable), choose account, store an import report; file hash to detect re-upload; **undo import**
- Filter report and list by **account** and **date range**
- Duplicate detection **within the same account** that still allows genuine same-day repeats
- Bulk assign to category; **one confirmation flag** for auto-assigned rows
- **Bill split:** keep the parent; add **child** transactions (user sets portion count and recurrence, e.g. monthly × 12); date filter shows in-range children as separate rows
- Date ranges (preset + custom)
- Report tab (spend by category) and list tab (individual transactions)
- Pod **settings**: display **currency**; **owner-customisable permissions** (CRUD per resource per role) with a **sensible default matrix**
- Feature catalog kind: **`financial_planning`**

## Out of scope (unless later decided)

- Open Banking / live bank sync
- Multi-currency conversion (one display currency per pod is enough for v1)
- Split one transaction across several categories (GoalJar allowed `categoryId=amount`; this product does **not**)
- Savings goal jars, milestones, and contributions as a separate product (GoalJar Jars)
- Receipts / attachments
- A full budget *engine* (envelopes, rollover, alerts). Optional category monthly/yearly budget for a visual/percentage is **in** scope
- Recurring transaction templates, bills calendar, net-worth charts beyond account balances
- Tax / VAT reporting
- Hardcoded parser presets for named banks (Monzo/HSBC/Amex, etc.)
- Linked transfer *pairs* (two accounts joined as one move). A **transfer** category is enough: those rows are not income or expense

Bill split (below) is **not** a generic bills calendar. It is spreading one existing parent payment across dated child entries.

---

## Product context (SimpleOutcome)

Lives in a **pod** of feature kind **`financial_planning`**. Data is scoped to that pod. Only people who can access the pod see money data.

### Permissions

Tighter than “every member can do everything”. The **space/pod owner** configures, in **pod settings**, which **role** may **create / read / update / delete** each resource:

- Account
- Transaction (including archive / unarchive)
- Category
- Parser
- Import (run import / view reports / **undo import**)
- Bill split (create/edit children on a parent)
- Settings (currency, permission matrix — typically owner-only)
- Delete all transactions (danger zone)

**Default matrix ships with the feature** (e.g. members can create/edit transactions; admin/owner can delete parsers, undo import, delete-all, and change settings). The owner can then customise. Permissions are per action per resource, not a single “view-only” switch.

Read of the board still follows existing pod access (if you cannot see the pod, you see no money data).

### Settings

- **Currency:** one display currency for the pod (symbol/code). All amounts are stored and shown in that currency. No conversion between currencies in v1.
- **Permission matrix:** defaults + owner overrides, as above.
- **Delete all transactions:** confirmed destructive action.
- Date display can follow existing app/user date format if one exists.

---

## Improvements vs GoalJar (do not copy)

| GoalJar | This product |
| --- | --- |
| No accounts; `source` enum on each row | First-class **accounts**; transactions belong to one account |
| Hardcoded parsers (Monzo, HSBC, Amex) auto-detected from headers | User-built **parser** in UI; optional identifier from CSV first row; column map is target field → transform. **No bank presets** |
| Parser implied the bank; no account | Parser **does not** bind to an account; import chooses parser then account |
| Duplicate signature: date + description + amount + source; bank `id` used as signature when present | Prefer **external id** when the file has one; else date/time + description + recipient + amount. **Same account only**. **Repeats inside the same import stay**. **File hash** to warn on re-upload |
| Category stored as `id=amount` strings; split possible | **One category** per transaction (or uncategorised). Direction: transfer / income / expense / saving |
| Auto filters: newline strings; assign was a dialog | Structured filters; auto-assign sets **unconfirmed**; confirm or manual assign **confirms** (one flag) |
| Date UI: custom range + previous/next month | **Presets** plus custom range; filter by **account** |
| Dashboard = category budget jars; transactions on another page | **One surface**: report + list tabs. Optional **monthly or yearly** category budget for visual/percentage only |
| localStorage currency; favourite; no first-class archive page | **Currency in pod settings**. Favourite and/or sort order. **Archive** excluded from totals; **archived page** to find them. **Delete all** |
| Savings jars | Not in this feature. Category direction **saving** is a label, not GoalJar jars |
| All members equal | Owner-customisable **CRUD per resource per role**, with defaults |
| Import with no undo | Stored import report + **undo import** |

---

## Data types

### Account

A bank account, card, cash pot, or envelope/budget pot the user wants a balance for.

| Field | Requirement |
| --- | --- |
| Name | Required, unique within the pod |
| Kind | e.g. current, savings, credit card, cash, other (labels, not a second product) |
| Opening fund | Amount at the moment tracking starts (can be 0). **Not** a transaction |
| Archived / closed | Hidden from default pickers; historical transactions remain |
| Notes | Optional |

Amounts use the **pod currency**. No per-account currency in v1.

**Balance (derived):** opening fund + sum of **non-archived** transactions on that account (sign convention below). Do not store a mutable “current balance” as source of truth. Archived transactions are omitted from this sum.

### Transaction

Each account has zero or more transactions. A transaction belongs to **exactly one** account.

| Field | Requirement |
| --- | --- |
| Account | Required |
| Posted date | Required (calendar date in the user’s statement; store UTC/ISO as elsewhere in SO) |
| Time | Optional; used in duplicate matching when present |
| Amount | Required; **positive = income, negative = expense** (stored after the parser has applied sign transforms) |
| Description | Statement narrative / merchant text |
| Recipient / payee | Optional distinct field (banks often split this from description) |
| Category | Optional FK; empty = uncategorised |
| Confirmed | **One flag.** `false` when category was **auto-assigned**; **confirm** sets `true`. **Manual** assign (including bulk assign) sets `true` immediately. Uncategorised: no category, flag unused / treat as not needing review |
| Notes | Optional user note (not from CSV unless mapped) |
| External id | Optional bank/export id |
| Parser | Optional; which parser produced this row (not which account) |
| Import batch | Optional; which import created it (needed for undo) |
| Archived | If true: **excluded from all calculations** (balances, report totals). Still stored; listed only on the **archived transactions** page |
| Split parent | If this row is a **child**, FK to the parent transaction |

**Sign convention:** in stored transactions, **positive is income, negative is expense**. The parser (not the ledger) converts the bank’s CSV signs into this convention. Credit-card “spend” is still negative on that account. UI can show absolute spend on the report where useful.

**Manual create/edit/delete:** required. Import is not the only path.

**No split across categories.** One transaction, one category. Spreading a bill over time is parent + children, below.

**Archive:** not a hard delete. Archived rows drop out of report, list (default), and account balance. Restore from the archived page (permission: update transaction).

### Bill split (parent + children)

Keep the **parent** (the real bank row). Add **child** transactions for period allocation.

- User sets **number of portions** and **recurrence duration** (e.g. **monthly**, **12** portions).
- Children get their own dates (e.g. month 1…12 from the parent date or a start the user picks). Amounts sum to the parent (equal shares; remainder on the last child).
- Children share the parent’s **account** (v1). Category typically copied from the parent; user can change later.
- **Date-range filter applies to children by child date.** If the range covers two of twelve months, list and **category report** show **two** child entries, not the annual lump and not twelve.

**Double-count:** parent remains so the **account balance** still matches the statement (one money movement). Children are **allocation rows**, not extra money: they **must not** be added again into account balance. For **income/expense/saving report and the default list in a date range**, use **in-range children** for a split bill; do not also add the parent’s full amount into those category totals. The parent can still appear on its posted date in the list, labelled as a split parent (so the statement line is visible), without being summed twice in spend-by-category.

Undo/edit split: update portion count or recurrence regenerates children (or delete children and recreate). Deleting the parent: decide with cascade vs block if children exist — **block delete until children are removed**, unless undo-import cascades the batch.

### Category

The **purpose** of a transaction. One transaction → at most one category; one category → many transactions.

| Field | Requirement |
| --- | --- |
| Name | Required, unique within the pod |
| Direction | Required: **transfer**, **income**, **expense**, or **saving** |
| Budget | Optional. Either a **monthly** amount **or** a **yearly** amount (not a full budget product). Report shows visual / **percentage** used vs that period |
| Favourite | Optional. Together with **sort order**, favourite categories surface first (favourite *or* sort order is enough if we only implement one; both is fine) |
| Colour / icon | Optional, for the report |
| Sort order | Optional |
| Filters | Zero or more auto-assign rules (below) |

**Uncategorised** is not a stored category. The report groups those rows as **Uncategorised**.

**Direction behaviour**

- **Income / expense:** feed income and expense totals; expense categories drive the spend-by-category report.
- **Saving:** purpose is saving (not GoalJar jars). Counts toward saving, not day-to-day spend, on the report.
- **Transfer:** category type only. **Not calculated as income or expense.** No linked pair between two accounts in v1. If the user categorises one or both sides as transfer, those amounts stay out of income/spend. Importing the same economic move into two accounts without marking transfer is a **user issue**.

Deleting a category: transactions become uncategorised (do not delete money rows).

### Parser

Reusable mapping from a CSV layout to ledger-sign transactions. Named so “HSBC current CSV” vs “Amex” is obvious.

**A parser is not linked to an account.** It only converts file rows → transaction fields. The user picks the account at import time.

| Field | Requirement |
| --- | --- |
| Name / label | Required |
| Identifier | Optional. If set, match against the **first row** of the CSV (typically the header line). Some files have **no header**; identifier can be left unused |
| File type | CSV for v1 (delimiter, quote, header vs no header, skip N rows) |
| Column map | **Key = target transaction field** (date, time, amount, description, recipient, external id, notes, …). **Value = how to derive it** from the file: source column(s) plus transforms |
| Transforms (on a mapping) | Examples: leave as-is; **invert sign**; **treat all values as negative** (expenses); treat all as positive; debit/credit columns combined; date format |
| Date format | Part of the date field mapping; preview must show parsed dates |

No shipped bank-specific presets. The identifier + example-file builder is the only matching mechanism.

### Import (batch)

A user-triggered job: one or more files + **one parser** + **one account** → commit. Persist an **import report** in the database (not only a toast).

| Field | Requirement |
| --- | --- |
| Parser, account | Which converter and which account were used (same for every file in that job if the user dragged multiple files with the same settings) |
| Per file | File name, **content hash**, parsed / created / skipped-as-duplicates / failed row counts, per-row errors if useful |
| Overall | Totals, who, when |
| Outcome | Enough to answer “what did this import do?” later and to **undo** |

**File hash:** hash the uploaded bytes. If that hash was already imported for this pod, show a **dialog**: the file has been uploaded before; confirm whether to import again. User can proceed (then row-level duplicate detection still applies) or cancel.

**Undo import:** delete (or archive — **delete**) transactions created by that batch, including children created later on those rows if we cascade, and keep or mark the report as undone. Confirm in UI. Row-level duplicates on a later import then behave as if those rows were never there.

---

## Feature requirements

### Accounts

- Create, rename, set opening fund, archive/close, delete only if there are no transactions (or after explicit “move/delete transactions”).
- List accounts with derived **current balance** (opening fund + non-archived transactions). Date range is for the report/list, not for rewriting the account-list balance.
- Report and list can **filter by account** (one account or all).

### Parser builder (UI)

Dedicated UI to create/edit a parser. Not a JSON dump.

1. User **drags an example CSV** into the builder.
2. From the **first row**, the UI **proposes an identifier**. The user **chooses whether to use it** (optional — files without a header skip this).
3. Remaining rows / header names: show **column names** (or column indexes if no header).
4. User **assigns columns to transaction fields by drag and drop** (column → date, amount, description, …).
5. For each mapped field, **checkboxes / options** for how the data is parsed (invert sign, all negative, date format, etc.).
6. **Live example:** show a sample source row from the uploaded file **and** the **resulting transaction** (signs already converted to + income / − expense).

Save stores name, optional identifier, and the column map (target field → source + transforms).

### Import (UI)

1. User **drags one or more CSV files** (same parser + account for the batch).
2. A **matching parser is selected automatically** when a file’s first row matches a parser identifier. User can **choose a different parser**.
3. User **selects the account** to import into (required; not stored on the parser).
4. User clicks **import**.
5. If any file **hash** already exists for this pod → **dialog** asking whether to import again.
6. After import, the **report is stored** (counts, skips, failures) and shown. User can **undo** that import from the report (or import history).

Matching when there is no identifier: user must pick the parser manually (no silent wrong parser).

Row-level duplicate detection still runs on commit (below).

### Duplicate detection (row-level)

Apply when committing an import, against **existing non-archived transactions on the same account only**. The same description/amount/date on a **different** account is allowed; that is a user issue if they import the same file into two accounts.

1. If the row has an **external id**, match on that id **and account**.
2. Else match on **date**, **time** (if both sides have time), **description**, **recipient**, **amount**, **and account**.

**Same-file repeats:** if the CSV contains several rows that look identical (e.g. two coffees the same day, no ids), **all of them import**. Dedup is “already in the ledger on this account”, not “unique within the file”. If the user re-imports the same file (after confirming the hash dialog), those rows are skipped as duplicates of what is already stored (ids first, then the composite key). Count of skipped duplicates belongs in the stored import report.

Do not use GoalJar’s `source` in the key.

**File hash** is a second, coarser check (“this exact file was uploaded before”), not a replacement for row-level dedup.

### Categories and bulk assign

- CRUD categories, including direction, optional budget, favourite and/or sort order.
- From the transaction list: multi-select → assign one category (**confirmed** immediately).
- Assign one row at a time (inline or dialog) — also **confirmed**.
- Filter the list by category, including Uncategorised, and by **account**.
- Search description / recipient / notes.

### Category filters and auto-assign

Each category can have filters used to find transactions that **should** get that category.

**Filter shape (structured, not `desc=amount` strings):**

- **String match** on description and/or recipient (contains, case-insensitive). Optional later: starts-with, exact.
- **Optional amount:** exact match within a small epsilon (e.g. 0.01), or omit amount to match any value.
- Multiple filters on one category: a row matches if **any** filter matches (OR).

**When auto-assign runs**

- After a successful import, on new rows that are still uncategorised.
- User can **re-run rules** on uncategorised (and optionally on unconfirmed) rows.

**Conflict:** if two categories match, do **not** pick silently. Leave uncategorised **or** flag “multiple matches” for review (prefer leave uncategorised + list the candidates). GoalJar applied filters independently and last-write-wins in the assign dialog; that is not good enough.

**Only uncategorised** rows are auto-assigned. **Confirmed** categorised rows are never overwritten by rules.

**One flag (`confirmed`):**

- Auto-assign → category set, **`confirmed = false`** (needs review).
- User **confirms** (single or bulk) → **`confirmed = true`**.
- **Manual** assign (single or bulk) → **`confirmed = true`** automatically.

(Equivalent model: an `auto_assigned` flag that is set on rule assign and **cleared** on confirm; same behaviour, one flag.)

User can still **preview matches** for a category (GoalJar’s assign dialog) as a way to bulk-apply or inspect a rule, without being the only way rules apply.

### Date range

Applies to both report and list (same range). **Archived** transactions are excluded here; they live on the archived page (that page may still use a date filter of its own).

**Presets:** this month, last month, last 30 days, this year, all time (or “as far as data goes”).

**Custom:** start and end dates. Optional previous/next period that shifts by the current span (month-sized if a month preset is selected).

Default: **this month**.

**Bill-split children:** include a child iff **its** date is in range. Two in-range children → two rows / two amounts in the category report.

### Report and list (one page, tabs / button group)

Same idea as Trading Journal session detail (`Report` / `Trades`).

Shared filters: **date range** and **account** (all or one).

**Report**

- Group by category (and direction) for the range; archived excluded.
- **Uncategorised** is one group.
- Totals: income, expenses, saving; **transfer categories are not income or expense**; uncategorised amount.
- Optional category **budget**: bar or percentage vs monthly budget (for this month / prorate) or yearly budget (for this year / selected range as appropriate). Categories without a budget just show spent.
- Empty and loading states.

**List**

- Individual **non-archived** transactions (including in-range split children) for the range: date, account, description/recipient, amount, category, unconfirmed badge.
- Sort: date, amount, absolute amount.
- Pagination or virtualised list if large (GoalJar loaded a date window; keep that).
- Bulk select + category assign (confirmed); confirm auto-assigned.
- Archive selected; action to **split a bill** (portions + recurrence) on a parent.

Account opening fund is **not** a row in the list.

### Archived transactions page

Separate from the main report/list. Lists **archived** rows (filters: date, account, search). Restore (unarchive) puts them back into calculations. Archived rows are **not** in balances or the main report.

### Delete all transactions

Settings (danger zone): delete every transaction in the pod (and their children), with confirmation. Does not have to delete accounts, categories, or parsers. Easy, explicit, irreversible in the UI (same idea as GoalJar).

---

## UX notes

- Compact enough for the `/app` PWA on a phone: account switcher, import, and categorise must work on a small screen. Parser builder (drag-and-drop mapping) may be more comfortable on a larger screen but should not be desktop-only if avoidable.
- Import report is persisted; **undo** is available from that history.
- Currency lives in **pod settings**, not GoalJar-style localStorage-only settings.
- Destructive actions (delete account with history, delete parser, re-import after hash warning, undo import, delete all, archive) need confirmation.

---

## Edge cases and failure modes

- CSV with mixed encodings, extra header rows, or footer totals → parser skip rows + per-row errors in the import report.
- Timezone: statement date is a **calendar date**; do not shift the day because of UTC conversion.
- Amount: commas vs dots; parser transforms (invert / all negative) applied before store.
- Re-import after the user edited a category: skip as duplicate **on that account**; **do not** reset category. Hash dialog still fires if the file bytes match.
- Genuine same-day same-merchant same-amount: keep all from one import; skip on re-import of the same rows **on that account**.
- Same file imported into **two accounts**: both succeed if hashes/rows are per-account; treated as user error, not blocked.
- Empty description: still match on date/time/recipient/amount; allow import.
- Opening fund vs first imported transaction: do not double-count; opening fund is the balance **before** imported history.
- Credit accounts: balance may be negative; that is OK.
- Category rename: transactions stay linked by id.
- Parser deleted: historical transactions keep their fields; parser id may be empty; identifier matching no longer uses that parser.
- Two parsers with the same identifier: import UI must let the user pick; do not silently pick the wrong one.
- Bill split: range covering none of the children shows no child rows from that bill; covering two months shows two children. Parent still on the statement date for balance; not double-counted in category spend.
- Transfer category: excluded from income/expense even if only one side is tagged.
- Undo import: transactions already archived, recategorised, or split — undo should still remove batch-created rows (and their children) after confirm; say so in the confirm copy if those exist.
- Permission denied: UI hides or disables actions the role cannot perform.

---

## Success (v1)

A user can: set pod currency and (as owner) customise the default permission matrix; add two accounts with opening funds; build a parser from an example CSV (optional identifier, drag-and-drop columns, sign transforms, live preview) with **no** bank preset pack; import one or more files with auto-matched parser + chosen account; be warned if the same file hash was imported before; see the import report stored and **undo** the import; see duplicates skipped on a second import **to the same account** while same-day repeats from the first file remain; auto-categorise with rules (**unconfirmed** until confirm; manual assign confirmed); bulk-assign the rest; set an optional monthly or yearly category budget and see a percentage; favourite / sort categories; keep a parent bill and add monthly children (e.g. 12 portions) and see only in-range children on the report; archive a row (it leaves totals) and find it on the archived page; delete all transactions from settings; filter by account; switch Report / List, with Uncategorised visible and **transfer** categories omitted from income/expense.

---

## Decisions (was open questions)

1. **Confirmation — one flag.** Auto-assign → unconfirmed; confirm clears the needs-review state. Manual assign is confirmed immediately. (`confirmed` or `auto_assigned` that is removed on confirm — same behaviour.)
2. **Optional monthly *or* yearly budget** on a category: visual / percentage only, not a budget engine.
3. **Duplicates: same account only.** Same transaction imported into a different account is a user issue.
4. **Undo import:** yes.
5. **Parser presets:** no.
6. **Favourite** (and/or sort order): yes. **Archive** transactions: yes — out of calculations; separate page. **Delete all:** yes.
7. **Feature kind:** `financial_planning`.
8. **Bill split:** keep the **parent**; add **child** transactions. User sets **portion count** and **recurrence** (e.g. monthly, 12 portions).
9. **Transfers:** category direction `transfer` only; not counted as income or expense. No paired-leg model in v1.
10. **Default permission matrix:** yes, then owner customises.
