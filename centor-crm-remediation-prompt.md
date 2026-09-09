# Remediation brief — CENTOR CRM

Paste this whole file into Claude Code as the opening message of a fresh session at
the repo root. It is written to be read alongside `CLAUDE.md`, not instead of it.

---

## Role and framing

You are picking up a code audit on this repository. Eight findings came out of it,
listed below in dependency order. Your job is to work through them as a sequence of
**small, independently mergeable slices** — not one large refactor.

Everything in `CLAUDE.md` still applies and takes precedence over anything here that
contradicts it. In particular:

- **Read `specs/crm-spec.md` before any non-trivial change.** Where a fix below
  changes behaviour the spec describes, update the spec in the same commit and say
  so in the commit body.
- **Append a `docs/decisions.md` entry for every slice**, in the existing style:
  what was decided, what was rejected and why, what trade-off was accepted. Never
  rewrite past entries.
- **Never hand-edit a file in `src/db/migrations/`.** Change `src/db/schema/*` and
  run `pnpm db:generate`.
- **Use plan mode.** Every slice below touches more than three files. Show me the
  plan and stop before writing code.
- **Do not invent domain data.** No guessed UENs, product codes, thresholds or
  currency limits.
- **Ask rather than defaulting.** Section 10 lists the decisions that are mine to
  make, not yours. Do not pick a reasonable-sounding answer for any of them.

Work **one slice at a time**. After each slice: `pnpm typecheck && pnpm test`, then
stop and let me review before starting the next. Conventional commits, one slice per
branch, branch names as given.

---

## 1. Slice 0 — make the verification gate work on a clean clone

**Branch:** `fix/typecheck-clean-clone`

**Problem.** `pnpm typecheck` fails on a fresh checkout:

```
src/app/layout.tsx(20,50): error TS2304: Cannot find name 'LayoutProps'.
```

`LayoutProps<"/">` is a Next-generated global that only exists once `.next/types`
has been written by `next dev` or `next build`. `CLAUDE.md` instructs you to run
`pnpm typecheck && pnpm test` before declaring any task done — that instruction
currently cannot be satisfied from a clean clone, which makes every subsequent
slice's acceptance criteria unverifiable. This is why it goes first.

**Required outcome.** `git clone && pnpm install && pnpm typecheck` succeeds with
no prior build step.

Investigate the options before choosing. Check `node_modules/next/dist/docs/` for
this Next version's guidance on generated route types — there may be a dedicated
typegen command, in which case a `pretypecheck` script is the clean fix. Falling
back to an explicit local prop type on `RootLayout` is acceptable if typegen is not
available, but say in the decision entry that you checked.

**Acceptance criteria.**
- `pnpm typecheck` passes from a clean clone with no `.next/` present.
- `pnpm lint` still clean.
- No new dependency.

---

## 2. Slice 1 — widen money columns to `bigint`

**Branch:** `fix/money-bigint`

**Problem.** Every monetary column is `integer` (int4), which caps at 2,147,483,647
minor units — about **$21.47M** in a two-decimal currency. `total_value` is a sum,
so it hits the ceiling well before any single line does. A CNY- or USD-denominated
purchase order on a metro-scale package exceeds this, and Postgres raises an
overflow error on insert. It fails loudly rather than corrupting data, but it blocks
the transaction.

Affected columns:

| File | Column |
|---|---|
| `src/db/schema/quotation.ts:97,100` | `unit_price`, `line_total` |
| `src/db/schema/sales-order.ts:62` | `total_value` |
| `src/db/schema/sales-order.ts:118,120` | `unit_price`, `line_total` (`order_line`) |
| `src/db/schema/purchase-order.ts:68` | `total_value` |
| `src/db/schema/opportunity.ts:46` | `estimated_value` |

This is cheap now — the database holds seed data only, and P9 (import of existing
spreadsheets) has not run. It gets materially more expensive after real data lands.

**Required outcome.** All seven columns are `bigint`, reads and writes still produce
plain JS `number`, and nothing downstream silently starts receiving strings.

**Things to actually verify, not assume:**

- `postgres-js` returns int8 as a **string** by default. Confirm how Drizzle's
  `bigint("col", { mode: "number" })` behaves against this driver in this version —
  test it, don't infer it from the type signature.
- `src/server/quotations.ts:39` already casts its `SUM` as `sql<string>`. Postgres
  `sum(int4)` returns bigint and `sum(int8)` returns numeric; confirm the existing
  string handling and `Number()` conversion still hold after the change.
- `src/lib/dashboard.ts:77` `sumByCurrency` accumulates in JS `number`. That is safe
  to 2^53 and does not need BigInt, but confirm nothing upstream now feeds it a
  string.
- `src/lib/money.ts` and `src/lib/quotation-math.ts` already do BigInt arithmetic
  internally and return `number`. They should need no change — confirm that.

**Acceptance criteria.**
- New migration generated via `pnpm db:generate`, not hand-written.
- A unit test in `src/lib/money.test.ts` (or a new integration test) exercising an
  amount above the old int4 ceiling end to end: parse → store → read → format.
- `pnpm db:migrate && pnpm db:seed` clean on a fresh database.
- Quotation and PO PDF render correctly with a nine-figure minor-unit total.
- Existing 79 tests still pass.

**Non-goal.** Do not change `numeric(12,6)` FX rates or `numeric(5,2)` percentages.
Those are the right types already.

---

## 3. Slice 2 — authorization: a real boundary, then real roles

**Branch:** `fix/authorization`

Two related problems. Do them as two commits on one branch.

### 2a. The auth boundary is in the wrong layer

`src/app/(app)/layout.tsx` is currently the only page-level gate. Next's own guidance
is not to treat layouts as the security boundary — they do not re-run on client-side
navigations within the group. In practice this repo is not exploitable today, because
every server action and route handler re-checks `auth()` individually. But
`src/server/*` is unauthenticated by construction, so it is one carelessly written
page away from a leak.

**Required outcome.** A single `requireUser()` (or similar) helper that returns the
session user or throws/redirects, called from the data-access layer rather than
depended on from a layout. Keep the layout check as defence in depth — do not remove
it. Every function in `src/server/*` that reads or writes commercial data goes
through it.

Note the constraint already recorded in `docs/decisions.md` (2026-08-10): middleware
runs in the Edge runtime and the `postgres` driver plus Nodemailer need Node APIs, so
a middleware-based gate is still off the table. Do not reopen that.

### 2b. `role` is stored and never enforced

`user.role` is `admin | member | viewer`, surfaced in the sidebar and in the session
callback at `src/lib/auth.ts`, and enforced **nowhere**. Every server action checks
only `session?.user`. A `viewer` can create quotations, edit line prices and change
order statuses.

**Required outcome.** Role is enforced server-side in the data-access layer, in the
same place as 2a — not in the UI, and not only in the action wrappers. The UI should
additionally hide controls the current role cannot use, but that is cosmetic and
secondary.

**See section 10 first — the role matrix is my call, not yours.**

**Acceptance criteria.**
- A `viewer` session receives a clean authorization failure (not a 500, not a silent
  no-op) from every mutating server action.
- Playwright coverage: one spec signing in as a `viewer` and asserting a mutation is
  rejected and the corresponding UI control is absent.
- Unit tests for the permission-check helper itself.
- No page renders commercial data without having gone through the helper.

---

## 4. Slice 3 — integrity constraints and status guards

**Branch:** `fix/document-integrity`

**Problem A — document numbers are unique only by convention.** There is no unique
constraint on `(legal_entity_id, quote_no, version)` or on `order_no`. Uniqueness
rests entirely on `getNextSequenceNumber` in `src/server/document-sequence.ts`. That
function is correct — the `SELECT ... FOR UPDATE` plus caller-transaction fix from
2026-08-14 is sound — but for a system whose purpose is auditable contract chains,
the database should be the one asserting this, not a single function.

**Problem B — no server-side status state machine.**
`updateQuotationHeaderAndLines` (`src/server/quotations.ts`) will happily rewrite the
prices and lines of an `accepted` or `sent` quotation. The builder UI hides the
button (`quotation-builder.tsx:552`), but the action does not check. The same gap
exists on the sales-order and purchase-order paths.

`createQuotationVersion` also reads `const [current] = ...` without checking the row
exists before dereferencing `current.quoteNo`.

**Required outcome.**
- Unique constraints added via schema change and `pnpm db:generate`.
- A single, tested, pure transition-rules module in `src/lib/` (per `CLAUDE.md`:
  domain logic lives in `lib/` as pure functions with unit tests) describing which
  status transitions and which mutations are legal from each state, for quotations
  and both order types.
- `src/server/*` mutations consult it and reject illegally. The UI keeps its existing
  gating and reads from the same module rather than duplicating the rules.
- Missing-row guards on the read-then-write paths.

**Acceptance criteria.**
- Unit tests covering the full transition table, including every rejected transition.
- Attempting to edit an `accepted` quotation via the server action fails with a
  domain error, with the UI bypassed.
- Concurrent creation of two documents for the same legal entity still yields
  distinct numbers — the existing e2e parallel-worker scenario must still pass.

**Non-goal.** Do not build an approval workflow, an audit-trail table, or
status-change notifications. Reject illegal transitions; nothing more.

---

## 5. Slice 4 — close the input-validation gaps

**Branch:** `fix/input-validation`

**Problem.** `src/lib/validation/quotation.ts:34` declares
`discountPct: z.string().nullable()` — no pattern, no range, no bound. That string
goes straight into `parsePercentToHundredths` in `src/lib/quotation-math.ts`, which
calls `BigInt()` on it, and then into a `numeric(5,2)` column. Concretely:

- `"abc"` → `BigInt()` throws → unhandled 500 from a server action.
- `"1.2.3"` → parses silently wrong (`split(".")` discards the third part).
- `"-5"` → becomes a **markup**, not a discount, and the sign is dropped by
  `parsePercentToHundredths` anyway.

This contradicts `CLAUDE.md`'s own rule: validate all input at the boundary with zod.

**Required outcome.** Audit **every** zod schema in `src/lib/validation/` for the
same class of gap — bare `z.string()` on a field that is parsed numerically or
written to a constrained column. Fix them at the schema boundary. `discountPct` is
the one I found; assume it is not the only one.

Add a matching database `CHECK` constraint on `discount_pct` so the invariant holds
regardless of which code path writes it.

`parsePercentToHundredths` should also be made total — it should not be capable of
throwing on input that reached it, even though after this slice it should never see
bad input.

**Acceptance criteria.**
- Unit tests for each of the three failure cases above, asserting a validation error
  rather than a throw or a wrong number.
- No server action can be made to return a 500 by any string in a numeric-ish field.
- `pnpm test` green.

---

## 6. Slice 5 — bundle the CJK font

**Branch:** `fix/bundled-cjk-font`

**Problem.** `src/lib/pdf/quotation-document.tsx:18` and
`purchase-order-document.tsx:19` register Noto Sans SC from a `fonts.gstatic.com`
URL, fetched at render time. `docs/decisions.md` (2026-08-12) already flags this as
a revisit item. On Vercel that is a network round trip on every Chinese-language PDF
render, and a gstatic outage or a blocked egress means broken glyphs on a document
going to a customer.

**Required outcome.** The TTF is committed to the repo and registered from the local
file. Registration is deduplicated between the two document modules rather than
copy-pasted a third time.

**Check before committing:** confirm the SIL Open Font License terms and include the
licence file alongside the font. Note the added repo weight in the decision entry.

**Acceptance criteria.**
- Chinese and bilingual quotation and PO PDFs render correct glyphs with network
  egress to `fonts.gstatic.com` blocked.
- Supersedes the 2026-08-12 entry — new entry, say so explicitly, do not edit the old one.

---

## 7. Slice 6 — foreign-key indexes

**Branch:** `perf/fk-indexes`

**Problem.** The schema has four indexes total (`product_document_current_unique`,
`user.email`, `dashboard_widget_user_type_unique`, `legal_entity.short_code`). None
of the foreign-key columns are indexed, and the detail pages fan out across them
(`getCompanyById` alone joins roles and contacts; every order detail page walks
several).

**Required outcome.** Indexes on the FK columns actually used in `WHERE` and `JOIN`
clauses in `src/server/*`. Derive the list from the queries in that directory — do
not blanket-index every FK column in the schema.

**Acceptance criteria.**
- Migration generated, not hand-written.
- The decision entry lists which columns were indexed and, briefly, which query
  motivated each.

**Explicit non-goal for this slice: pagination.** Every list page currently selects
the whole table and filters client-side in `useMemo`. That is a real limit, but it
is the right trade at under 20 users and hundreds of rows, and changing it touches
all eight list pages plus `matchesQuery`. Leave it. Note it in `specs/crm-spec.md`
as a known deferred item with the rough row count at which it should be revisited,
and move on.

---

## 8. Slice 7 — CI and a human-facing README

**Branch:** `chore/ci-and-readme`

**Problem.** Four quality scripts exist (`lint`, `typecheck`, `test`, `test:e2e`) and
nothing runs them automatically. And `CLAUDE.md` is addressed to Claude, not to a
person — there is no human setup path anywhere in the repo.

**Required outcome.**

*CI:* a GitHub Actions workflow running `pnpm lint`, `pnpm typecheck` and
`pnpm test` on push and pull request, using the pinned pnpm version from
`packageManager` and matching the Node version Vercel runs. Add e2e as a separate
job only if it can be made reliable in CI — it needs Postgres and a mail catcher
(see `e2e/helpers/maildev.ts` and `e2e/global-setup.ts`). If that turns into a
yak-shave, ship the three fast checks and open a follow-up rather than blocking this
slice on it.

*README:* a short human-facing `README.md` — what the system is, the stack, prereqs,
and the actual first-run sequence (env from `.env.example`, database create,
`db:migrate`, `db:seed`, `dev`), plus what extra is needed to run the e2e suite. Link
to `specs/crm-spec.md`, `docs/decisions.md` and `CLAUDE.md` rather than restating
them. Keep it under a screen.

**Acceptance criteria.**
- CI green on the branch.
- A person following the README on a clean machine reaches a running, seeded app
  without reading any other file.

---

## 9. Global acceptance criteria

Applies to every slice:

- `pnpm typecheck && pnpm test && pnpm lint` green.
- `docs/decisions.md` entry appended, in house style, including what you rejected.
- `specs/crm-spec.md` updated wherever the fix changes what the spec describes.
- No new runtime dependency without asking first (`CLAUDE.md`).
- Money stays integer minor units plus a currency code throughout. No floats anywhere
  in these changes.
- Nothing commercial hard-deleted.
- Migrations generated, never hand-edited.

---

## 10. Open decisions — ask me before coding, do not default

1. **Role matrix.** What exactly can `viewer` and `member` do? My starting position:
   `viewer` reads everything and writes nothing; `member` does everything except user
   management and legal-entity configuration; `admin` does everything. Confirm with
   me before implementing — this also answers spec §11's first open question, so the
   answer goes into the spec.
2. **Owner-scoped access.** Does a `member` see other people's opportunities and
   margins, or only their own? `opportunity.owner_user_id` and `project.owner_user_id`
   exist and are currently ignored for access purposes. This changes the shape of the
   permission helper significantly, so ask before building it.
3. **Money ceiling.** Is `bigint` sufficient headroom, or is there a currency in the
   chain (IDR, VND, JPY at scale) where you want me to re-check the arithmetic? Do
   not guess a figure.
4. **Discount bounds.** Is a discount ever legitimately above 100%, or negative as a
   surcharge? If surcharges are real, that is a differently-named field, not a
   negative discount — tell me which.
5. **E2E in CI.** Are you willing to run a Postgres service container and a mail
   catcher in CI, or should e2e stay local-only for now?

---

## 11. What not to do

- Do not combine slices. Do not start slice N+1 before I have reviewed slice N.
- Do not refactor adjacent code you happen to be reading. If something looks wrong
  and is not in this list, tell me — do not fix it.
- Do not build pagination, an audit-trail table, an approval workflow, global search,
  a permissions admin UI, or anything else in the spec's §3 non-goals list.
- Do not add "future-proofing" hooks for any of the above.
- Do not touch the dashboard grid placement logic. Three decision entries went into
  getting it right and nothing in this brief concerns it.
