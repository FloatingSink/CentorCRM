# Architectural decisions

Append-only. Do not rewrite past entries — if a decision changes, add a new entry that supersedes it and say so.

## 2026-08-10 — Postgres driver: postgres-js, not Neon's serverless driver

Using `postgres` (postgres.js) + `drizzle-orm/postgres-js` instead of `@neondatabase/serverless` +
`drizzle-orm/neon-http`, even though dev/prod database is Neon. Hosting is still `<TBD>` between
Vercel+Neon and a Docker VPS (crm-spec.md §9) — the wire-protocol driver works unchanged against
either, so nothing needs rewriting once hosting is decided. Trade-off: Neon's own driver pools
better on edge/serverless runtimes, which this app doesn't need yet (plain Node server, <20 users).
Revisit if we deploy to an edge runtime or hit connection-limit issues.

## 2026-08-10 — Auth email delivery: SMTP, not a vendor SDK

Auth.js's built-in Nodemailer/SMTP provider (`EMAIL_SERVER`/`EMAIL_FROM` env vars) is used for
magic-link delivery instead of a vendor SDK (e.g. Resend). Avoids an unjustified new dependency and
stays swappable to any SMTP relay the operator chooses.

## 2026-08-10 — Single `user` table, not two

`@auth/drizzle-adapter` requires a `user` table with `id, name, email, emailVerified, image`. That
same table is extended in place with the spec's `role`, `is_active`, `created_by`, `created_at`,
`updated_at` columns (crm-spec.md §6.6) rather than maintaining a parallel table, to avoid two
sources of truth for the same entity.

## 2026-08-10 — No middleware-based route protection in P0

`src/middleware.ts` was removed. Next.js always runs middleware in the Edge runtime, but the
Postgres driver (`postgres`) and SMTP provider (`nodemailer`) both depend on Node.js APIs
(`net`/`stream`/`tls`) that the Edge runtime doesn't support, so a middleware importing `src/lib/auth.ts`
fails to boot. With only one protected route so far, per-page `auth()` checks (see `src/app/page.tsx`)
cover it without that conflict. Revisit once there are enough protected routes that per-page checks
get repetitive — the standard fix is a split config (an Edge-safe `auth.config.ts` with no adapter,
used only for middleware route-gating, separate from the full Node-only `auth.ts`).

## 2026-08-10 — Auth check centralized in a shared `(app)` layout

P1 added 7 authenticated pages (companies, contacts, home) on top of P0's one, so the per-page
`auth()` redirect check from the previous entry got centralized into `src/app/(app)/layout.tsx`
instead of duplicated on every page — this is that follow-up. Still not middleware (same Edge/Node
conflict as before, unchanged); the layout runs in the Node runtime like any other server component.
The header/nav is also rendered once here rather than per page. `/sign-in` stays outside the route
group so it isn't gated.

## 2026-08-10 — File storage: Cloudflare R2

Cloudflare R2 is the S3-compatible object store (crm-spec.md §9) for `product_document.file_key`
and `document.file_key`, chosen by Jia Long over AWS S3, MinIO, and other alternatives. It's accessed
through the standard S3 API rather than a Cloudflare-specific SDK, so — like the Postgres driver
decision above — it works unchanged against either hosting path still open in spec §9 (Vercel+Neon
or a Docker VPS). Revisit if the data-residency question (spec §11 — does any customer contract
require Singapore-only storage) rules it out; R2 buckets can be pinned to a jurisdiction but this
hasn't been checked against that requirement yet.

## 2026-08-12 — PDF generation: @react-pdf/renderer, not headless Chromium

Quotation PDF export (crm-spec.md §6.4/§8) uses `@react-pdf/renderer` (JSX `Document`/`Page`/`View`/
`Text` components rendered server-side via `renderToBuffer`) instead of `puppeteer-core` +
`@sparticuz/chromium`, chosen by Jia Long. Same reasoning as the R2-over-Vercel-Blob decision above:
pure JS, no native binary, works identically on either hosting path still open in spec §9. A headless-
Chromium approach would have matched spec §9's literal "from HTML templates" wording more closely, but
would tie a real dependency (a ~50MB serverless-optimized Chromium build) to the Vercel-leaning hosting
guess — wrong trade if it ends up on a VPS instead. Spec §9 has been updated to name the actual
approach rather than left to silently diverge from the code.

Quotation PDFs need real Chinese-language support (`quotation.language`, cross-cutting rule: every
user-visible name has an `_en`/`_zh` variant) — react-pdf's built-in fonts have no CJK glyphs, so
Noto Sans SC is registered via `Font.register()` from a Google Fonts–hosted URL, fetched at render
time. Revisit with a bundled local font file if the per-render network fetch proves slow or unreliable.

## 2026-08-12 — sales_order: nullable customer_legal_entity_id alongside customer_company_id

Confirmed with Jia Long. Spec §5's own back-to-back example (CRTG → INFRA TECH/TUNNEL TECHNIC →
CENTOR Group → CHENGTUO → PRC supplier) has internal legs where the "customer" is one of our own
`legal_entity` rows (e.g. INFRA TECH selling to CENTOR Group), not an external `company`. Spec
§6.4's literal field list only has `customer_company_id`, which can't represent that. `sales_order`
gets both columns, nullable, with exactly one required per row (enforced by a CHECK constraint,
`sales_order_customer_xor`) — real FK integrity on both sides rather than the untyped
`related_type`/`related_id` polymorphic pattern spec already uses for `activity`/`document` (§6.6),
since the set of possible parents here is exactly two, not open-ended. Spec §6.4 updated to note
this. The same reasoning will apply to `purchase_order.supplier_company_id` /
`supplier_legal_entity_id` in P6 slice 2, and to `order_line`'s dual `sales_order_id`/
`purchase_order_id` parent columns.

`order_no` reuses `quotation`'s numbering mechanism exactly (`document_sequence`, per-legal-entity,
never resets) — `src/lib/quote-number.ts`'s date/sequence formatting was extracted into a general
`src/lib/document-number.ts` so both doc types (and P6 slice 2's purchase orders) share one
implementation instead of three near-identical copies.

## 2026-08-12 — P6 slice 2: purchase orders, back-to-back linking, margin view

Purchase orders (`purchase_order`) were built following through on the two schema decisions the
previous entry pre-committed to: `supplier_company_id`/`supplier_legal_entity_id` as a nullable
pair with a CHECK constraint (`purchase_order_supplier_xor`), same shape as `sales_order`'s
customer columns; and `order_line.purchase_order_id` added alongside the existing
`sales_order_id`, with a second CHECK (`order_line_purchase_type_matches`) mirroring the first.

`orderStatusEnum` was pulled out of `sales-order.ts` into its own `src/db/schema/order-status.ts`.
`purchase_order.linked_sales_order_id` needs to reference `sales_order`, and `order_line`
(defined in `sales-order.ts`) needs to reference `purchase_order` — those two are fine as a
circular import between the two schema files since both references live inside deferred
`.references(() => ...)` closures, but `orderStatusEnum` was being called eagerly
(`orderStatusEnum("status")`) in both files' table definitions, which a circular import can't
survive (TDZ error at module load). Splitting it into its own file removes the only eager
cross-reference.

**Margin view placement**, confirmed with Jia Long: a "linked purchase orders & margin" section
on the existing sales order detail page, not a new combined "Orders" screen (spec §8's literal
description). Consistent with how every other entity in this app surfaces its related records
(companies show contacts, products show documents, projects show machines) rather than
introducing a new screen pattern for this one case. Spec §8 updated to note the deviation.

**Margin math**: sales value and each linked purchase order's value are converted to SGD via
their own `fx_rate_to_sgd` before being compared (`convertMinorToSgd`, `src/lib/money.ts`) —
required because the two legs of a back-to-back chain are frequently in different currencies
(spec §5's own example chain spans SGD and HKD entities). Uses the same BigInt-based precision
approach as `parseMoneyToMinorUnits` rather than a float multiply, since `fx_rate_to_sgd` carries
up to 6 decimal places (`numeric(12,6)`) and this is real money math even though the result is
display-only and never stored.

A purchase order's `linked_sales_order_id` is nullable and editable after creation — not every
purchase is tied to one specific sale, and the link isn't asserted as immutable once set.

## 2026-08-12 — P7 (Shipments) put on hold, P8 built next instead

Shipments are currently outsourced and Jia Long hasn't confirmed the process yet, so there's no
real `shipment` schema to build against — spec §6.5's field list (`mode`, `container_no`,
`bl_awb_no`, ports, `etd`/`eta`, etc.) would just be a guess. Rather than build against a guess
now and likely rework it later, P7 is stubbed to a sidebar nav item and an empty placeholder page
(`src/app/(app)/shipments/page.tsx`) — no schema, no `shipment` table, `sales_order`/
`purchase_order` don't reference it. P8 (activities, document library, search) is being built
next instead, out of the spec's listed order. Revisit P7 for real once the outsourced shipping
process is confirmed.

## 2026-08-13 — P8 slice 3: search wires up existing per-list inputs, no global search yet

Every list page (Companies, Contacts, Projects, Products, Opportunities, Quotations, Sales
Orders, Purchase Orders) already shipped with a `<Search>`-icon input next to its status filter —
styled and placed since those pages were first built, but `disabled` and never wired to anything.
This slice wires all 8 up, layering a new `matchesQuery` (`src/lib/search-filter.ts`) on top of
each table's existing `useMemo` status/active filter rather than replacing that pattern.

A global cross-entity search bar was discussed and deliberately not built — spec doesn't call for
one and nothing else in the app hints at it, so it would have been scope creep. `matchesQuery` is
factored out as a single shared matcher specifically so that if a global search gets built later,
it reuses the same matching semantics instead of every entity re-deriving its own. The document
library's per-entity filter bar (added in the same slice, at Jia Long's request) also reuses it:
since `document.doc_type` is free text (no closed taxonomy, per the P8 slice 2 decision), its
segments are derived at render time from whatever `doc_type` values are actually present in that
entity's own documents, rather than a fixed list like the status filters use.

## 2026-08-14 — Hosting: Vercel + Neon

Confirmed by Jia Long, resolving the `<TBD>` spec §9 carried since P0. Every prior decision that
hedged against "either hosting path still open" (the Postgres driver choice, R2 over a
Vercel-specific blob store, `@react-pdf/renderer` over headless Chromium) was already written to
work unchanged under this outcome, so none of that code needs revisiting. Still open: the data
residency question (spec §11 — does any customer contract require Singapore-only storage), which
is independent of this choice and would affect the Neon project region and R2 bucket jurisdiction,
not the hosting platform itself.

## 2026-08-15 — P8.5: customizable dashboard, not the fixed three-widget one spec §8 described

Spec §8 listed "Dashboard" as screen 1 with three fixed widgets, but never actually scheduled it
in §10's build order (an oversight — every other screen has a phase; this one didn't). Jia Long
asked for a _customizable_ dashboard, which the spec doesn't describe at all — confirmed via
question that this means a genuine widget library: add/remove from a catalog, resize, drag-reorder,
saved per user, not just the fixed three. §8 and §10 updated to describe what was actually built
and to add the missing P8.5 slot.

**Widget catalog** (`src/lib/dashboard.ts`'s `WIDGET_CATALOG`, `dashboard_widget_type` enum):
the three spec-required widgets (`opportunities_by_stage`, `quotes_expiring`,
`shipments_placeholder`) plus four more grounded in already-built data (`my_open_opportunities`,
`purchase_orders_awaiting_confirmation`, `pipeline_value`, `recent_activity`). Adding a widget
type later is additive — one enum value + migration, one catalog entry, one query function, one
`case` in `dashboard-grid.tsx`'s render switch, one component — nothing else changes, since the
grid, picker dialog, and persistence all work off the registry rather than hardcoding widget
types anywhere.

**`shipments_placeholder`** confirmed as a static "coming soon" card, not a stubbed query —
shipments (P7) is on hold with no real schema (2026-08-12 entry above), so there's nothing real
to fetch. It still behaves like a real widget in the layout (addable, removable, resizable,
reorderable) rather than being hardcoded outside the widget system.

**Sizing is S/M/L column-span on a 3-column grid, not free-form resize.** A pixel-level
resizable grid (react-grid-layout-style) would need a much heavier layout library for no real
benefit here — three fixed spans cover every practical widget arrangement this app needs.

**Persistence is lazy ("write-on-read")**: `dashboard_widget` has one row per (user, widget)
instance; a user with zero rows has never customized anything, and `getDashboardWidgets`
materializes the three defaults on first read rather than via a seed script or per-page
"no rows yet" branching. `(user_id, widget_type)` is unique — each widget type appears at most
once per user's dashboard.

**New dependency: `@dnd-kit/core` + `@dnd-kit/sortable` + `@dnd-kit/utilities`**, for
drag-to-reorder. No drag-and-drop library was installed before this. Chose dnd-kit over
`react-beautiful-dnd` (deprecated, doesn't play well with React 18+ strict/concurrent rendering)
or hand-rolled HTML5 drag events (a lot of fiddly accessibility code for one feature) — dnd-kit is
the actively-maintained, accessible-by-default (keyboard + screen reader support) standard.
Its `DndContext` needs an explicit `id` prop; without one it generates aria ids from a
module-level counter that differs between the server and client render pass, causing an SSR
hydration mismatch on every load.

Everything else UI-side reused what was already installed: shadcn's `dialog` component
(generated via `npx shadcn add dialog`, not an npm install — backed by `@base-ui/react`, already
a dependency) for the "add widget" picker, matching how `select.tsx`/`segmented.tsx` were
already added.

No `config` column on `dashboard_widget` — nothing in the current widget set needs per-widget
settings (e.g. a user-chosen date range), and CLAUDE.md steers against building for hypothetical
future requirements. Adding one later is a small additive migration, not a redesign.

## 2026-08-15 — Dashboard grid: gap-preserving placement, not list reordering

Follow-up to the entry above, same day. The grid initially reordered widgets as a plain list
(`position` 0..n-1, dragging spliced the array) — removing or moving a widget always closed up
the gap, no way to leave a spot empty on purpose. Requested instead: dropping a widget onto a
spot puts it exactly there and leaves a gap behind.

**`dashboard_widget.position` is now a flat slot index into a virtual 3-column grid**, not a list
order: `row = floor(position / 3)`, `col = position % 3` (`slotToRowCol`/`rowColToSlot`,
`src/lib/dashboard.ts`). No migration needed — the column was already a plain integer, only its
meaning changed. A widget's start column is restricted to what actually fits its span
(`clampStartCol`): large (span 3) only at column 0, medium (span 2) at 0 or 1, small (span 1)
anywhere — this is what guarantees a widget's occupied cells never cross into the next row.
`canPlace` checks a candidate position against every other widget's occupied cells before a move
or swap commits.

`removeDashboardWidget` no longer renumbers remaining rows (a gap is the intended result now, not
something to close). `addDashboardWidget` places new widgets at column 0 of a fresh row below
everything, not bin-packed into an existing gap — predictable, and dragging into a specific gap
is what the drag interaction is for. `reorderDashboardWidgets` (array-order → `position = index`)
is replaced by `setDashboardWidgetPositions(userId, updates: {id, position}[])`, taking 1 update
(move) or 2 (swap two widgets) — the client validates the move with `canPlace`/`clampStartCol`
before calling it; the server just persists whatever it's given, ownership-checked per row like
every other mutation here.

**Unequal-size swaps need validating against the post-swap arrangement, not just each widget's
own new column.** Two widgets of the _same_ size trading spots can't newly overlap anything — the
occupied footprint is unchanged, just relabeled. Different sizes can: e.g. a small at column 0
swapped with a medium at column 1 (spanning 1–2) — after swapping, the small moves to column 1
(fits fine alone) but the medium moves to column 0 spanning 0–1, which now overlaps the small's
new column 1. `dashboard-grid.tsx`'s `handleDragEnd` builds the full hypothetical post-swap widget
list and validates each swapped widget against _all_ the others in that hypothetical list (which
includes the other swapped widget's new position), not a pairwise column-fit check between just
the two.

**UI moved from `@dnd-kit/sortable` to plain `@dnd-kit/core`** (`useDraggable` + `useDroppable`)
— sortable's `SortableContext`/`arrayMove`/`rectSortingStrategy` are a list-reordering
abstraction that doesn't fit free grid placement with intentional gaps. `@dnd-kit/sortable` is
now unused and removed (`@dnd-kit/core`/`@dnd-kit/utilities` stay). Each widget is both a drag
source and its own drop target (dropping another widget onto it swaps them) — dnd-kit tracks
draggables and droppables in separate registries, so reusing one id for both is a normal pattern,
not a conflict.

Grid placement is applied via a CSS custom property (`--dg-col`/`--dg-row`/`--dg-span`, set
inline per widget — the values are per-instance data, so they can't be static Tailwind classes)
consumed by a real `@media (width >= 64rem)` rule in `globals.css` (`.dashboard-grid-item`),
matching the grid's existing `lg` breakpoint. A JS `matchMedia` check was considered instead and
rejected: it would apply the layout post-hydration only, causing a flash of the mobile (unstyled)
layout on every desktop page load. The CSS-only approach applies during first paint like any other
responsive Tailwind class. Empty-cell drop targets are hidden entirely below `lg` — mobile is a
plain single-column stack (unchanged from before this entry), where a blank drop target between
widgets would just be dead space; dragging into a specific gap is a desktop pointer interaction.

**Known trade-off**: `@dnd-kit/sortable`'s `sortableKeyboardCoordinates` doesn't apply to free
grid placement (it's built specifically for list reordering), so keyboard-driven _repositioning_
has no equivalent in this model — pointer/touch drag is now the only way to move a widget. The
remove button, size buttons, and add/reset controls are unaffected (nothing about them changed).
Real keyboard-accessible free-grid placement would need custom arrow-key handling; not built here.

## 2026-08-15 — Dashboard resize overlap/disappearance bug, and a view/edit mode

Two follow-ups to the two entries above, same day.

**Bug**: `resizeDashboardWidget` only clamped a growing widget's column to the grid's own outer
width (`clampStartCol`) — it never checked whether the wider span now overlapped a _sibling_
widget already sitting in those cells. Two concrete failures from that one gap: visible overlap
(two widgets drawing in the same cell, when the clamped column left the resized widget's span
crossing into a neighbor's) and full disappearance (when the clamped column happened to land
_exactly_ on a sibling's own position — `dashboard-grid.tsx` renders from a
`Map<position, widget>`, so a duplicate position key means the later widget in array order
silently wins the map slot and the other is never visited by the render loop at all, not hidden
behind something). Fixed with a new pure helper, `findValidPosition` (`src/lib/dashboard.ts`):
tries every valid start column in the widget's own row via `canPlace` first, falling back to a
new row below everything if nothing in that row fits. Used both server-side
(`resizeDashboardWidget`) and client-side (`dashboard-grid.tsx`'s `handleSizeChange`, for the
optimistic update) so the two never disagree. The drag-move and drag-swap paths were re-checked
against the same class of bug and were already correct — this was a resize-only gap.

**View/edit mode**, requested so nothing gets rearranged, resized, or removed by accident: the
dashboard now loads in a locked "view" mode by default (`DashboardGrid`'s `mode` state, plain
`useState`, not persisted — a transient UI-safety toggle isn't dashboard data, doesn't need a
database round trip, and resetting to locked on every load is the safer default). An "Edit
dashboard" button switches to edit mode, revealing the drag handle, size picker, remove button per
widget, and the "Add widget"/"Reset to default" controls — all exactly as they behaved before this
entry. In view mode none of that renders at all (`WidgetCard`'s new `editable` prop), which also
means dragging is inert without any extra disable logic: with no drag handle button in the DOM,
there's nothing for a pointer-down to start a drag from.

First cut of this also hid `EmptyCell` entirely in view mode (no drag handles anywhere, so no
drop targets needed, or so the reasoning went) — that broke gap preservation the moment a user hit
"Done editing": with per-item explicit `grid-row`/`grid-column` placement and no fixed
`grid-template-rows`, a row nothing is placed in collapses to zero height. `EmptyCell` (invisible,
but `min-h-32`) was what had been reserving an empty row's space all along, not just serving as a
drop target — hiding it in view mode visibly snapped whatever came after the gap upward. Fixed by
always rendering it in both modes; staying registered as a droppable target in view mode is
harmless since nothing can ever be dragged there to begin with.

## 2026-08-16 — Remediation Slice 0: `next typegen` as a `pretypecheck` hook

First slice of `docs/centor-crm-remediation-prompt.md`'s eight-item audit. `pnpm typecheck` failed
on a clean clone (no `.next/` present) with `error TS2304: Cannot find name 'LayoutProps'` in
`src/app/layout.tsx` — `LayoutProps<"/">` is a Next 16 route-aware type helper, previously only
generated as a side effect of `next dev` / `next build`, so a fresh checkout running `tsc --noEmit`
directly (as CI or a first-time `pnpm typecheck` would) had nothing to satisfy it.

Checked `node_modules/next/dist/docs/01-app/03-api-reference/06-cli/next.md` per the brief's
instruction before picking an approach: Next 15.5+ (this repo: 16.3.0) ships a dedicated
`next typegen` command for exactly this — generates route types without a full build, and its own
docs recommend `next typegen && tsc --noEmit` for standalone type-checking. Reproduced the failure
live (`.next/` moved aside), confirmed `next typegen` alone fixes it, and confirmed `tsconfig.json`
already includes both possible output paths (`.next/types/**/*.ts`, `.next/dev/types/**/*.ts`) —
no tsconfig change needed.

Added `"pretypecheck": "next typegen"` to `package.json`. pnpm (11.21.0, this repo's pinned
version) auto-runs `pre<script>` hooks before the matching `pnpm run <script>` — confirmed
empirically in a scratch package rather than assumed, since this is exactly the kind of
behavior-not-signature question the brief calls out. `pnpm typecheck` alone is now sufficient from
a clean clone; no separate manual step or README instruction needed.

Rejected: hand-writing an explicit local prop type on `RootLayout` (the brief's fallback for if
typegen weren't available) — not needed here since the dedicated command exists and is already
installed. No new dependency; `next typegen` is part of the already-installed `next` CLI.

## 2026-08-16 — Remediation Slice 1: money columns widened to `bigint`

Every monetary column was `integer` (int4, ceiling ~$21.47M in minor units for a two-decimal
currency). `total_value` is a sum and hits that ceiling before any single line does — a metro-scale
CNY/USD purchase order can exceed it, and Postgres raises an overflow error on insert. Widened to
`bigint` (`mode: "number"`, so reads/writes stay plain JS `number`, never a string or BigInt at the
call site): `quotation_line.unit_price`/`line_total`, `order_line.unit_price`/`line_total`,
`sales_order.total_value`, `purchase_order.total_value`, `opportunity.estimated_value`. Confirmed
with Jia Long (section 10): bigint headroom is sufficient for every currency in this chain
(SGD/HKD/CNY/USD), no further re-check needed. `numeric(12,6)` FX rates and `numeric(5,2)`
percentages are untouched — already the right type, explicit non-goal.

**Verified empirically before writing the migration, not assumed** (live probe against the dev
Postgres via a session-scoped temp table, nothing persisted): postgres-js returns both `int8` and
`numeric` driver values as JS strings by default (no custom type parsers in `src/db/client.ts`);
`drizzle-orm`'s `bigint(name, { mode: "number" })` (`PgBigInt53`) maps that string back to a plain
`number` via `mapFromDriverValue`, confirmed live for a value above the old int4 ceiling. Since
`sum(int8)` returns Postgres `numeric`, and postgres-js already returns `numeric` as a string the
same way it returns `bigint` as a string today, `src/server/quotations.ts`'s existing
`sql<string>` SUM cast + `Number()` conversion in `quotations-table.tsx` needed no change — same
shape before and after. `src/lib/money.ts` and `src/lib/quotation-math.ts` do their own BigInt
arithmetic on plain JS `number`/`string`, entirely independent of the column type — confirmed by
reading both, no change. `src/lib/dashboard.ts`'s `sumByCurrency` accumulates in JS `number` (safe
to 2^53) and is never fed a string either — no change.

**First DB-integration test in the suite**: every one of the previous 79 tests is a pure function
test (`src/lib/*.test.ts`) — nothing touches a real database, matching CLAUDE.md's "domain logic in
`lib/`, server actions stay thin." Proving the store→read leg genuinely needs Postgres, so
`src/db/bigint-money.test.ts` was added, clearly named so its nature (and the fact that `pnpm test`
now needs `DATABASE_URL` for this one file) is obvious. Confirmed with Jia Long before building it —
the alternative considered was pure parse/format unit tests plus one-off manual verification, but
that can't actually prove the driver/ORM boundary this slice changes. Builds its fixture chain
directly against the schema tables inside one `db.transaction`, then calls `tx.rollback()`
(`TransactionRollbackError`) so nothing persists — not through `src/server/quotations.ts`'s
`createQuotation`, because that opens its _own_ `db.transaction`, which runs as an independent
top-level Postgres transaction on postgres-js (no true nesting across separate `db.transaction`
calls), so it would not roll back together with an outer wrapper. Needed an explicit 20s test
timeout (`{ timeout: 20000 }`) — well above vitest's 5s default — because a real round trip to Neon
(connection + six inserts + two selects in one transaction) genuinely takes longer than that.

Manually verified end to end on the real running dev server (throwaway script + Playwright,
deleted after — same pattern as the dashboard/logo verification earlier this project): created a
real quotation and a real purchase order (via the actual `createQuotation`/`createPurchaseOrder`
server functions, against CGPL/CRTG/Panama Metro Line 3 seed data) with a nine-figure line total,
fetched both PDFs through the authenticated route, and visually confirmed `$71,474,836.47` renders
correctly with no truncation or garbled digits on both documents. Test fixtures deleted afterward;
nothing left in the dev database.

## 2026-08-16 — Remediation Slice 2: authorization — a real boundary, then real roles

**2a — the real auth boundary moved into the data-access layer.** `src/app/(app)/layout.tsx` was
the only auth gate; `src/server/*` (16 files, ~60 exported functions) had zero auth checks of its
own, entirely trusting callers. This was not hypothetical: direct code search found **6 server
actions with no auth check at all** — `updateCompanyAction`, `updateContactAction`,
`updateOpportunityAction`, `updateProductAction`, `updateProjectAction`, `updateMachineAction` —
each missing the check its sibling `create*Action` had right above it, meaning any unauthenticated
request could edit any company, contact, opportunity, product, project, or machine record. Fixed
by adding the same `auth()` + `redirect("/sign-in")` block their sibling create-actions already
use (not a new pattern, just applying the one already established in the same file), **and**
adding a real boundary one layer deeper: `src/lib/authorization.ts` (pure, unit-tested —
`assertAuthenticated`/`assertAdmin`, following CLAUDE.md's "domain logic in `lib/`" convention)
wrapped by `src/server/auth.ts`'s `requireUser`/`requireAdmin`/`requireUserOrError`, called as the
first statement of every exported `src/server/*` function, reads included (brief's own acceptance
criterion: "no page renders commercial data without having gone through the helper"). This is
deliberately redundant with the action layer's own check on every request that goes through both —
that redundancy is the point: it's exactly what would have caught the 6-gap class of bug
automatically instead of relying on every action file remembering it. `document-sequence.ts`'s
`getNextSequenceNumber` and non-exported helpers (e.g. `quotations.ts`'s `insertLines`) are
excluded — only ever called from inside another `src/server/*` function's own transaction, after
that function's own `requireUser()` already ran.

The `(app)` layout's own `auth()` check is unchanged, kept as defence-in-depth per the brief — not
removed. Middleware-based gating was not reconsidered (Edge runtime can't load the Node-only
`postgres`/`nodemailer` deps `src/lib/auth.ts` needs — 2026-08-10 entry, brief explicitly said not
to reopen this).

**2b — role collapsed from three to two, and actually enforced.** Confirmed with Jia Long
(section 10): `user.role` drops `viewer` — `member` gets full commercial access, `admin`
additionally gets user management and legal-entity configuration, neither of which has any
mutation function built yet (`getUsers`/`getLegalEntities` are reads only, existing comments
already flagged both as "later Settings phase"). This is a genuine deviation from both
`crm-spec.md`'s prior "do not build role hierarchies beyond admin/member/viewer" line and the
brief's own suggested three-role starting position — confirmed directly, not defaulted to. No
`viewer` row ever existed (the only user-insert path, `src/db/seed.ts`, is hardcoded to `admin`;
confirmed against the live dev DB before migrating) — schema enum
(`src/db/schema/auth.ts`) actually narrowed to `["admin", "member"]`, not just stopped offering
`viewer` in the UI. Postgres has no `DROP VALUE` for enums; `pnpm db:generate` produced the
standard create-new-type-and-swap sequence (convert column to `text`, drop+recreate the enum,
convert back with a `USING` cast) — inspected before applying, safe either way since a `USING` cast
against a value outside the new enum fails loudly rather than corrupting data, and confirmed no
existing row would hit that path. `specs/crm-spec.md` §2/§6.6/§11 updated in the same commit
(spec's own §11 first open question, "how many users, read-only role?", is now resolved: ~5 users,
two roles, no read-only role).

`requireAdmin()` exists and is unit-tested but has no call site yet — deliberately: nothing in the
current codebase is actually admin-only (no user-management or legal-entity-config mutation exists
to gate), and the brief's own "what not to do" list forbids building a permissions admin UI or
speculative hooks. It's ready for that future work rather than force-fit onto anything today.

**E2E coverage — confirmed scope with Jia Long.** The brief's literal acceptance criterion
("sign in as a viewer, assert a mutation is rejected") no longer maps to anything real once
member/admin have identical commercial access and nothing is admin-gated. `e2e/unauthorized-
mutation.spec.ts` instead proves the actual, concrete fix: captures the exact POST a real
authenticated `updateCompanyAction` submission makes, then replays it — with a different value, so
a false pass is detectable — through a completely fresh, cookie-less connection, and confirms the
row is unchanged.

That test surfaced a real environment finding, unrelated to the auth fix itself: this exact
Next.js 16.3.0 dev build (the dev overlay itself flags it "stale", 16.3.1 available) has a
request-isolation bug in its Turbopack dev server — a cookie-less Server Action request can
incorrectly resolve a session if _any_ connection from the same Chromium browser **process** is
still open to the dev server, even a fully separate, unrelated `context.close()`'d one (Playwright
Test's shared per-worker browser doesn't fully close on `context.close()`). Confirmed by direct
A/B replay: browser process alive → mutation wrongly succeeds; browser process fully closed first
(plain Node `fetch`, zero shared connection state) → correctly rejected every time. Root-caused,
not just retried into passing — verified with a standalone script outside Playwright entirely, and
confirmed the equivalent plain-GET case (layout auth) was never affected, isolating it specifically
to the Server Action POST path. Worked around in the test by launching and fully closing its own
dedicated `chromium` instance before replaying, rather than the shared `page`/`context` fixtures.
Noted here rather than silently retried past, in case it resurfaces elsewhere — likely fixed by
upgrading to 16.3.1, which is a separate decision, not made as part of this slice.

## 2026-08-17 — Remediation Slice 3: integrity constraints and status guards

**Unique constraints.** `getNextSequenceNumber`'s `SELECT ... FOR UPDATE` was already the correct
concurrency mechanism (unchanged here) but the database itself asserted nothing — added
`uniqueIndex`es (same pattern as `product_document`/`dashboard_widget`):
`quotation(legal_entity_id, quote_no, version)`, `sales_order(order_no)`,
`purchase_order(order_no)`. Confirmed no existing duplicates before applying (direct query against
the dev DB) and confirmed the generated migration is a plain `CREATE UNIQUE INDEX`, nothing
destructive.

**Status state machine — corrected the brief's own premise first.** Direct code research (not
just the brief's description) found the UI gating the brief cited
(`quotation-builder.tsx:552` "hides the edit button") doesn't exist — that line only gates the
"Convert to sales order" link. Every status button in all three builders was always clickable
(only the current status disabled), any-to-any transition was allowed client-side, and the
header/line edit form was never gated by status at all — worse than described, not better.

The order-status lifecycle (`draft/confirmed/in_production/shipped/completed/cancelled`, shared by
`sales_order` and `purchase_order`) was explicitly flagged in the 2026-08-12 decision entry as "an
assumed generic order lifecycle, not asserted as CENTOR's real process" — genuinely ambiguous, so
the transition graph was confirmed with Jia Long rather than guessed at:

- Quotations: `draft→sent`; `sent→accepted`/`sent→rejected`; reverts `sent→draft` and
  `rejected→draft` allowed; `accepted` terminal (revise via `createQuotationVersion`, not a
  same-row transition); `superseded` stays system-only, never manually selectable.
- Orders (identical rules for sales and purchase orders, confirmed): linear
  `draft→confirmed→in_production→shipped→completed`, forward skips allowed, no reverting
  backward; `cancelled` reachable from any non-terminal status, never from `completed`.
- Header/line edits legal only while `draft`, for both quotations and orders — this is the actual
  bug: `update*HeaderAndLines` previously did a bare `UPDATE` with no status check at all.

Implemented as one pure module, `src/lib/status-transitions.ts`
(`isLegalQuotationTransition`/`canEditQuotation`/`isLegalOrderTransition`/`canEditOrder` +
`StatusTransitionError`), unit-tested exhaustively over every `(from, to)` pair for both status
types (the brief's literal acceptance criterion) — not sampled. `src/server/{quotations,sales-
orders,purchase-orders}.ts`'s `update*HeaderAndLines` and `update*Status` functions consult it as
the first thing they do (existence guard, then the relevant legality check) — `Error` for a
missing row, `StatusTransitionError` specifically for an illegal transition or edit-lock
violation, kept as two distinct error types rather than overloading one. `createQuotationVersion`
gets the missing-row guard the brief called out by name (`current.quoteNo` was dereferenced
without checking `current` existed); no new status precondition added there — it's the mechanism
for revising a non-draft quotation, so it deliberately doesn't require `draft` itself.

**UI reads from the same module** — the brief's stated intent (single source of truth between
client and server), even though there was no pre-existing gating to "keep": status buttons stay
visible (matches the existing design, shows the whole lifecycle at a glance) but now disable
illegal next-transitions, not just the current status; the header Card/line editor/Save button
disable when the row isn't editable, with a short note pointing at "Save as new version" for
quotations (orders have no versioning mechanism, so their note just says editing is draft-only).

**Verified**: exhaustive unit tests (every transition pair, both status types) green; a real
attempt to edit an `accepted` quotation, via a raw authenticated request that bypasses the now-
disabled UI Save button entirely (same capture-and-replay technique as the slice 2 e2e spec, minus
the cookie-stripping — this one's testing the business rule, not auth), correctly threw
`StatusTransitionError` and left the row unchanged; full e2e suite green including
`quotation-flow.spec.ts` and `back-to-back-flow.spec.ts` running concurrently, which is the actual
scenario the brief's "existing e2e parallel-worker scenario must still pass" acceptance criterion
refers to (there's no separate dedicated "parallel worker" spec) — both depend on
`draft→sent→accepted` staying clickable via `e2e/helpers/fixtures.ts`'s `acceptQuotation`, unaffected
since that's exactly the legal path confirmed above.

## 2026-08-17 — Remediation Slice 4: close the input-validation gaps

**Full audit, not just the known field.** The brief's own example — `discountPct`
(`src/lib/validation/quotation.ts`) as a bare `z.string().nullable()` feeding
`parsePercentToHundredths`'s unguarded `BigInt()` — checked out exactly as described. Auditing
every file in `src/lib/validation/` (brief: "assume it is not the only one") found one more real
gap not in the brief's own example: **`netWeightKg`** (`purchase-order.ts`), also a bare
`z.string().nullable()`, and arguably worse — it isn't JS-parsed at all, so a malformed value was
only ever caught by a raw Postgres error deep inside a transaction, no application-layer defense
whatsoever. Confirmed everything else in that directory is already safe: `unitPrice` looks
bare-ish (`.min(1)` only) but is backed by `parseMoneyToMinorUnits`, which already regex-validates
and returns `null` instead of throwing, and every call site checks for `null`; `fxRateToSgd`/
`inspectionDays` use `.refine()` against `Number()`, which never throws; every other validation
file infers numeric fields straight from `integer`/`bigint` columns via drizzle-zod, which already
produces `z.number()`, not a string.

Also found, not in the brief's framing: the crash isn't only a server-side risk.
`src/components/order-line-editor.tsx` (the live line-total preview used by all three builders)
calls `calculateLineTotal` directly from component state on every keystroke, entirely outside zod
— typing a stray character into Discount % threw mid-render before this slice, independent of any
server action ever running.

**Fix, one root cause for both gaps**: `parsePercentToHundredths` (`src/lib/quotation-math.ts`) now
mirrors `money.ts`'s `parseMoneyToMinorUnits` — regex-gate first, return `null` instead of throwing.
`calculateLineTotal` treats a `null` parse (absent or malformed) as "no discount." This single change
closes both the server path (now unreachable anyway once the zod fix below rejects bad input first)
and the client-side live-preview path (which has no zod gate and needed the function itself to be
non-throwing) — no try/catch needed at any of the ~8 `calculateLineTotal` call sites across
`src/server/{quotations,sales-orders,purchase-orders}.ts`.

`discountPct` and `netWeightKg` both get a `.refine()` at the zod boundary matching their column's
actual shape (`numeric(5,2)`, 0–100 only — confirmed with Jia Long, section 10: no negative/surcharge
case; `numeric(10,3)`, non-negative). `sales-order.ts`'s `orderLineInputSchema` re-exports
`quotationLineInputSchema` unchanged, so it inherits the `discountPct` fix automatically.

**DB CHECK constraints** (the brief's explicit ask for `discount_pct`, extended to `net_weight_kg`
since the audit found it's the same class of gap on a table already being touched):
`quotation_line_discount_pct_range`, `order_line_discount_pct_range` (0–100), and
`order_line_net_weight_kg_non_negative` — same `check(...)` pattern as the existing XOR constraints
in these files. Confirmed no existing row in the dev DB would violate any of the three before
applying.

**Verified**: extended `quotation-math.test.ts` with the brief's three concrete cases
(`"abc"`/`"1.2.3"`/`"-5"`) asserting `calculateLineTotal` degrades to the gross amount rather than
throwing or silently computing wrong; new `src/lib/validation/{quotation,purchase-order}.test.ts`
assert the same three cases are clean zod rejections, plus range/precision edges. Manually confirmed
on the running dev server: typing `"abc"`/`"1.2.3"`/`"-5"` into a live builder's Discount % field no
longer throws (zero page errors), and submitting `discountPct: "150"` shows a clean inline validation
message with no navigation and no crash — not a 500.

**Left alone**: `convertMinorToSgd` in `money.ts` has the same unguarded-`BigInt` shape the old
percent parser had, but its only current input is already-validated, already-stored
`fx_rate_to_sgd` — noted as worth hardening for consistency if that ever changes, not fixed now
since nothing currently feeds it unvalidated input and it's outside this slice's three concrete
failure cases.

## 2026-08-17 — Neon database moved from `us-east-2` to `ap-southeast-1`

Jia Long flagged that the Neon project was in `us-east-2` (Ohio) while every user and legal entity
this app serves is in Singapore, Hong Kong, or mainland China — every query was paying US round-trip
latency. Confirmed with him this is a **pure latency concern, not a compliance one**: it does not
answer, and is not intended to answer, the data-residency question already open in
`specs/crm-spec.md` §11. That question stays open until it's addressed on its own terms.

Neon has no in-place region migration, so this was a create-new-project-and-cut-over, done together
step by step rather than unilaterally:

1. Jia Long created a new Neon project in `ap-southeast-1` (Singapore) and added its connection
   string to `.env.local` as `DATABASE_URL_NEW`. First attempt was the pooled (`-pooler`) variant;
   swapped to the direct connection on request, since pooled connections front Postgres with
   PgBouncer in transaction mode, which resets session-level state between statements.
2. Schema brought up on the new project via the project's own `pnpm db:migrate` against
   `DATABASE_URL_NEW` (all 17 migrations, not a `pg_dump`/`psql` schema dump — neither tool nor
   Homebrew was available in this environment, and reusing the app's own migration path avoids
   introducing a new tool dependency while guaranteeing schema parity through the same mechanism
   the app already trusts).
3. Data copied with a throwaway Node script (`postgres` driver, already a project dependency) rather
   than `pg_dump`/`psql`, for the same tooling-availability reason. First attempt used
   `SET session_replication_role = replica` to bulk-load without regard to FK order; Neon's
   `neondb_owner` role is not a Postgres superuser and cannot set that GUC, even though it owns
   every table, so this failed immediately (zero rows copied — the whole transaction rolled back
   cleanly). Fixed by copying tables in an explicit order that respects the real FK dependency graph
   from `src/db/schema/*.ts` instead of bypassing the check. 162 rows across 16 non-empty tables
   copied; per-table `count(*)` verified equal between old and new before cutover.
4. `DATABASE_URL` in `.env.local` repointed at the new project; old project's connection string kept
   as `DATABASE_URL_OLD` for rollback. Verified with a fresh (not reused) dev server process — Next.js
   only reads `.env.local` at boot — plus a direct query against the new `DATABASE_URL` confirming
   expected row counts.

Old `us-east-2` project is still live, kept as a rollback path. Decommissioning it is Jia Long's
call, not scheduled here.

## 2026-08-17 — Remediation Slice 5: bundle the CJK font (supersedes 2026-08-12)

**Supersedes** the 2026-08-12 entry ("PDF generation: @react-pdf/renderer, not headless
Chromium"), specifically its line about Noto Sans SC being "registered via `Font.register()` from
a Google Fonts–hosted URL, fetched at render time... revisit with a bundled local font file if the
per-render network fetch proves slow or unreliable." That entry is left as-is; this one records
the revisit actually happening.

**Problem**: `quotation-document.tsx` and `purchase-order-document.tsx` each called an identical
`Font.register({ family: "Noto Sans SC", src: "https://fonts.gstatic.com/..." })` at module scope
— a network fetch on every Chinese-language PDF render. A gstatic outage or blocked egress on
whichever host ends up running this (spec §9's hosting question is still open) means broken
glyphs on a document going to a customer.

**Verified before changing anything, not assumed**:

- Downloaded the exact file the gstatic URL serves: 10.5MB TTF, `Noto Sans SC`, weight 400 only —
  matches what was registered before, no new weight introduced.
- Read its embedded `name` table via `fontkit` (already a transitive dependency through
  `@react-pdf/font`): copyright `(c) 2014-2021 Adobe (http://www.adobe.com/), with Reserved Font
Name 'Source'` — this is Source Han Sans/Noto Sans CJK's real lineage, SIL OFL 1.1-licensed.
  Pulled the license text from `notofonts/noto-cjk`'s own `Sans/LICENSE` (same family) rather than
  writing it from memory.
- Read `@react-pdf/font`'s actual source: a non-URL, non-data-URL `src` goes through
  `fontkit.open(this.src, ...)` — a plain local filesystem path, same mechanism
  `letterheadImagePath` (`src/lib/pdf/letterhead.ts`) already uses successfully for logos via
  `path.join(process.cwd(), "public", ...)`. No new mechanism, just reusing a proven one.
- Rendered a real PDF through the exact registration call the code now makes, with `fetch`
  instrumented to throw on any request to a `gstatic` host: rendered clean, `gstatic` never
  reached. Separately confirmed the actual `/quotations/[id]/pdf` route still returns a valid
  `200 application/pdf` end to end against the live dev server, unauthenticated-request paths
  aside (used a throwaway DB session row to authenticate the check, deleted immediately after).
  Could not exercise real Chinese _glyphs_ through actual seed data — every `name_zh` in the dev
  database is currently `null` (P9 spreadsheet import hasn't run) — so the glyph check used literal
  test Chinese text in an isolated render rather than inventing a fake company/product name.

**Change**: font + `public/fonts/LICENSE-NotoSansSC.txt` (OFL 1.1 text, with the copyright/Reserved
Font Name line confirmed above) committed to `public/fonts/`. New
`src/lib/pdf/register-cjk-font.ts` holds the one `Font.register()` call as a local-path lookup;
both document modules call it instead of duplicating the registration inline. Left
`Font.registerHyphenationCallback` (only present in `purchase-order-document.tsx` today) exactly
where it is — that asymmetry predates this slice and isn't what "dedupe the registration" asked
for.

**Repo weight, accepted knowingly**: the font is 10.5MB; `.git` history before this change was
4.5MB total. This commit more than doubles it, permanently (git doesn't shrink on its own). The
brief anticipated this trade-off explicitly; noting the number here rather than letting it pass
silently.

## 2026-08-17 — Remediation Slice 6: foreign-key indexes

**Premise correction**: the brief says "the schema has four indexes total." A full audit (every
`.where`/`.innerJoin`/`.leftJoin` in all 17 `src/server/*.ts` files, cross-checked against every
`.references(() => ...)` column in `src/db/schema/*.ts`, spot-verified independently rather than
taken on faith) found **7** index-backed constraints already in place: the two named in the brief
(`product_document_current_unique`, `dashboard_widget_user_type_unique`) plus `user.email`,
`legal_entity.short_code`, and three the brief predates from slice 3
(`quotation_legal_entity_quote_no_version_unique`, `sales_order_order_no_unique`,
`purchase_order_order_no_unique`). Doesn't change the brief's actual point — none of the 7 are on
a foreign-key column, and no plain (non-unique) index existed anywhere.

**Method**: derive the index list from the real queries, not from the schema in the abstract — the
brief is explicit that blanket-indexing every FK column is wrong. Walked every WHERE/JOIN in
`src/server/*` and matched it against the FK column it filters or joins on. Result: **26** FK
columns are actually queried and lacked an index; each got a plain btree index
(`<table>_<column>_idx`, mirroring the existing `<table>_<col>_unique` naming):

- `activity.user_id` — `activities.ts:getActivitiesForRelated`, `dashboard.ts:getRecentActivity`.
- `contact.company_id` — `contacts.ts` (3 functions) + `companies.ts:getCompanyById`.
- `machine.project_id` — `machines.ts` (2 functions), `projects.ts:getProjectById`.
- `opportunity.project_id`, `.customer_company_id` — `opportunities.ts:getOpportunities` (2 joins).
- `opportunity.owner_user_id` — `dashboard.ts:getMyOpenOpportunities`.
- `product.manufacturer_company_id` — `products.ts:getProducts`.
- `product_document.product_id` — `product-documents.ts:getProductDocuments`/`createProductDocument`
  (the existing `product_document_current_unique` is partial — `WHERE is_current` — so it can't
  serve a scan across historical rows too; this is a genuinely separate index, not a duplicate).
- `project.client_company_id` — `projects.ts:getProjects`.
- `purchase_order.legal_entity_id`, `.supplier_company_id`, `.supplier_legal_entity_id`,
  `.project_id`, `.linked_sales_order_id` — `purchase-orders.ts`: `getPurchaseOrders`,
  `getPurchaseOrderForPdf`, `getLinkedPurchaseOrders` (the sales-order-detail margin roll-up).
- `quotation.opportunity_id`, `.customer_company_id`, `.contact_id` — `quotations.ts:getQuotations`/
  `getQuotationForPdf`, `dashboard.ts:getExpiringQuotations`.
- `quotation_line.quotation_id`, `.product_id` — `getQuotations` join, `getQuotationById`/
  `getQuotationForPdf` filter, `updateQuotationHeaderAndLines`'s delete.
- `sales_order.quotation_id`, `.customer_company_id`, `.customer_legal_entity_id`, `.project_id` —
  `sales-orders.ts:getSalesOrders` (4 joins).
- `order_line.sales_order_id`, `.purchase_order_id`, `.product_id` — `getSalesOrderById`/
  `updateSalesOrderHeaderAndLines` filter, `purchase-orders.ts` (3 call sites),
  `getPurchaseOrderForPdf` join.

**Deliberately not indexed, already covered**: `company_role.company_id` and
`document_sequence.legal_entity_id` are each the leftmost column of their table's composite
primary key; `dashboard_widget.user_id` and `quotation.legal_entity_id` are each the leftmost
column of an existing unique index. A leftmost-column equality lookup can already use these —
adding a dedicated single-column index would be redundant.

**Deliberately not indexed, never queried**: every `created_by`/`uploaded_by` audit column on
every table, plus `opportunity.legal_entity_id`, `project.owner_user_id`,
`sales_order.legal_entity_id`, `sales_order.executed_document_id`,
`purchase_order.executed_document_id`, `document.uploaded_by`/`created_by`,
`legal_entity.created_by`, `user.created_by`, `account.user_id`, `session.user_id` (NextAuth's own
adapter owns `account`/`session`; nothing in `src/server/*` queries them directly). This is the
brief's "do not blanket-index" instruction applied, not just stated — these are real gaps in
principle but not in practice, since nothing filters or joins on them today.

**Pagination** (explicit non-goal for this slice): `specs/crm-spec.md` now notes list pages'
whole-table-select-plus-client-side-`useMemo`-filter pattern as a known, deliberately deferred
limitation, with a rough row-count threshold to revisit it — not built here, per the brief.

Migration `0017_old_whirlwind.sql` — 26 plain `CREATE INDEX` statements, no unique constraints, no
column changes. Verified against `pg_indexes` post-migration that all 26 exist with the expected
table/column. No behavior change expected or observed — all 111 existing tests still pass
unchanged; this is a pure read-performance change.

## 2026-08-17 — Remediation Slice 7: CI and a human-facing README

Two open decisions from the brief's section 10, asked directly rather than defaulted:

- **E2E in CI**: staying local-only for now. `.github/workflows/ci.yml` runs `lint`, `typecheck`,
  `test` on every push and pull request; `test:e2e` remains a local workflow (needs MailDev
  running, see below). Matches the brief's own fallback clause — full CI e2e (a Postgres service
  container plus a mail-catcher container) is real setup work, not something to half-do here.
  Revisit as a follow-up if e2e coverage gaps become a real problem.
- **Node version**: no version was pinned anywhere in the repo before this slice — no `engines`
  field, no `.nvmrc`, no `vercel.json` — and there's no way to read the actual Vercel project's
  configured Node version from inside the repo. CI is pinned to **Node 22**, matching this dev
  environment's installed version. This is a stated assumption, not a confirmed fact about
  production — worth checking against the real Vercel project setting at some point and updating
  the workflow if it's wrong.

**Correction after the first push**: the workflow was first written with no `env:` block at all,
on the claim that `lint`/`typecheck`/`test` need zero environment variables — based on running all
three locally with `DATABASE_URL` unset. That local check was silently invalid: this environment
has a global dotenvx auto-injection that reloads `.env.local` into every command's process
environment regardless of a shell-level `unset`, so the "unset" run was still secretly getting a
real `DATABASE_URL`. The actual push to CI failed at the `test` step. Root cause:
`src/db/bigint-money.test.ts` is a genuine live-DB integration test (remediation slice 1) — the
only way to prove a value above the old int4 ceiling round-trips through the real bigint columns,
not just through pure-JS `BigInt` math — and it needs a reachable, migrated Postgres. Confirmed
this precisely (not just theorized) by cloning the pushed branch fresh into an isolated directory
with no `.env.local` at all: `lint` and `typecheck` genuinely pass with zero environment
variables (that part of the original claim held), but `test` fails on exactly that one file with
`DATABASE_URL is not set`.

**Fix**: `.github/workflows/ci.yml` now runs a `postgres:16` service container for the job, sets
`DATABASE_URL` to point at it, and runs `pnpm db:migrate` before `pnpm test` so the schema exists.
This is deliberately **not** the e2e-in-CI question answered above — no MailDev, no Playwright
browsers, no running app server, just a bare Postgres reachable for one integration test that
inserts and rolls back inside a transaction (self-cleaning, no seed data needed). Verified for
real before pushing again: pointed the same clean clone at a real, already-migrated Postgres and
confirmed `db:migrate` (idempotent) plus the full test suite, including the bigint test, pass.

`pnpm/action-setup@v4` is used with no explicit `version` input, so it auto-detects from
`package.json`'s `packageManager` field (`pnpm@11.21.0`) instead of a second hand-pinned copy that
could drift out of sync.

**README.md** (new — repo had none) covers what the system is, the stack, prereqs, first-run
sequence (`.env.example` → `.env.local` → `pnpm install` → `db:migrate` → `db:seed` → `dev`), and
what e2e additionally needs (`npx maildev`, `npx playwright install`) — links out to
`specs/crm-spec.md`, `docs/decisions.md`, and `CLAUDE.md` rather than restating them, per the
brief's explicit instruction.

## 2026-08-17 — Data residency question resolved: no

Confirmed with Jia Long: no customer contract currently requires data to stay in Singapore. This
was the one open item under crm-spec.md §9/§11 blocking nothing in practice so far, but explicitly
left unresolved rather than guessed at throughout the remediation work (see, e.g., the R2 storage
decision, 2026-08-10, and the Neon region-move entry above, both of which took care to note they
don't answer this question). Spec updated to record the answer directly rather than `<TBD>`.
Revisit if a future contract changes this — nothing in the current architecture (Neon in
`ap-southeast-1`, R2 private bucket) assumes an answer either way, so nothing needs to change if it
does.

## 2026-08-17 — Old us-east-2 Neon project decommissioned

Following through on the region move above: Jia Long has decommissioned the old `us-east-2` Neon
project now that the `ap-southeast-1` cutover has been running cleanly. `DATABASE_URL_OLD` removed
from `.env.local` — it was only ever a rollback pointer, and there's nothing left to roll back to.
Deleting the Neon project itself was done directly in the Neon dashboard — outside this repo, and
outside anything Claude Code has access to (no Neon API key configured in this environment); this
entry just records that it happened and why the env var disappeared.

## 2026-08-17 — Product code list resolved against centorglobal.com/products

Closes the `<TBD: confirm full CENTOR code for each>` on crm-spec.md §6.3/§11 that
`src/db/seed.ts` had been carrying since P3 — the 9 originally-given codes had no confirmed
category, pack size, or (for several of them) full code at all. Jia Long pointed at
centorglobal.com/products as the source. Fetched twice with different prompts, identical results
both times — confident it's the complete page (7 products, two sections, no pagination or hidden
categories), not a partial render.

**Mapping, confirmed with Jia Long, not guessed**:

- `EP1`→`CTR-MBG-EP1`, `EP2`→`CTR-MBG-EP2`, `IS-C`→`CTR-ISF-C`, `IS-D`→`CTR-ISF-D`,
  `IS-P`→`CTR-ISF-P` — the site's fuller codes for 5 of the original 9. `CTR-TSG-P` already
  matched exactly.
- `PX2350`, `TM-T100`, `PA` aren't on the site — confirmed legacy/discontinued. Set
  `is_active: false` rather than removed (`CLAUDE.md`: nothing commercial hard-deleted), with a
  `pack_description` note recording why and when.
- `CTR-MBS-P` (Main Bearing Sealant) and `CTR-TSG-H` (Tail Sealant Hand-coat) are on the site but
  weren't in the original 9 — added, since the site is being treated as the authoritative current
  catalogue rather than the original spec list as a hard ceiling.

**Left null, not guessed**: `CTR-MBS-P`'s `category` — it's grease-like but not `EP`-branded like
the two that map cleanly to `ep_grease`, and sits under a distinct site heading (Sealants, not
Grease) from `CTR-MBG-EP1`/`EP2`. Doesn't map unambiguously onto the six-value enum, so left null
rather than picking the closest-sounding option. `uom`, `manufacturer_part_no`, `hs_code` stay
null for every row — nothing on the site gives a single unambiguous value for any of them.
`manufacturer_company_id` stays null too, but that's not a gap: these are CENTOR's own `CTR`-line
products, and CENTOR's own entities are `legal_entity` rows, never `company` rows (`CLAUDE.md`
hard rule) — there's no valid row to point at.

`src/db/seed.ts` updated to seed this resolved 11-row list on a fresh database. Since `db:seed`
only ever inserts (existence-checked by `centor_code`, never updates), editing the seed script
alone wouldn't touch the rows already sitting in the dev database under the old `EP1`-style codes
— a one-off script ran the equivalent `UPDATE`s directly against the live dev DB so it matches
what the corrected seed script now produces, rather than drifting from it.

Out of scope: fetching each product's individual detail page (main-bearing-sealant.html etc.) for
TDS/SDS/COC documents — a separate, larger task involving real `product_document` rows and file
uploads to R2, not part of resolving the code list itself.

## 2026-08-17 — Auth switched from email magic link to Microsoft Entra ID SSO

Confirmed with Jia Long: replaces magic link entirely (not offered alongside), restricted to
CENTOR's own Entra tenant for now (a single env var — `AUTH_MICROSOFT_ENTRA_ID_ISSUER` — away from
opening it to any Microsoft account later, not a code change), and no self-service signup — a
Microsoft account must match an existing, active `user` row before it can sign in, same as magic
link only ever authenticated existing rows, never created them itself.

**Zero new dependencies**: `next-auth@5.0.0-beta.32` already bundles
`providers/microsoft-entra-id`. `nodemailer`/`@types/nodemailer` removed (`pnpm remove`, not a
hand-edit).

**Verified two things against the installed `@auth/core@0.41.3` source before relying on them, not
assumed:**

1. The `signIn` callback runs _before_ the adapter can create a user row. Traced
   `lib/actions/callback/index.js`: for OAuth, `handleAuthorized()` (which calls the app's
   `signIn` callback) runs first; `handleLoginOrRegister()` (which calls `adapter.createUser`)
   only runs if that approves. A rejection throws `AccessDenied` immediately — no row is ever
   written. This is what makes rejecting a not-yet-provisioned account in `signIn` safe: no
   orphaned-row cleanup needed, because nothing gets written in the first place.
2. A `Credentials` provider does **not** work with this app's `session: { strategy: "database" }`.
   Traced the same file's `credentials` branch: it always builds a JWT session
   (`callbacks.jwt(...)`) and never calls `createSession`/the adapter at all, regardless of the
   app-wide session strategy. Originally planned to add a test-only Credentials provider for e2e;
   dropped once this was confirmed, since it would have produced a session the rest of the app —
   which reads sessions from the `session` table — couldn't recognize.

**Real bug hit and fixed while verifying this manually, not just in theory**: the first attempt
failed with a generic `Configuration` error. Server log showed the actual cause:
`OperationProcessingError: "response" body "issuer" property does not match the expected value`.
Fetched CENTOR's tenant's real OIDC discovery document directly
(`https://login.microsoftonline.com/<tenant>/v2.0/.well-known/openid-configuration`) and confirmed
its `issuer` field has **no trailing slash** — `https://login.microsoftonline.com/<tenant>/v2.0` —
even though both Microsoft's own docs and the Auth.js provider's own doc comment show the
`AUTH_MICROSOFT_ENTRA_ID_ISSUER` example _with_ a trailing slash. Auth.js validates these as an
exact string match, so the trailing slash caused every sign-in attempt to fail. Fixed in
`.env.local` and noted directly in `.env.example`'s comment so this doesn't get rediscovered the
hard way again. Confirmed fixed by driving the actual `/api/auth/signin/microsoft-entra-id`
flow (CSRF token + POST) and inspecting the resulting redirect: correct tenant, correct
`client_id`, correct `redirect_uri`, correct scopes (`openid profile email User.Read`). Completing
the interactive Microsoft login itself is Jia Long's to do — no automated tool can complete a real
Microsoft MFA/browser login.

**E2e**: only `e2e/global-setup.ts` ever performed a sign-in (every other spec reuses its saved
`e2e/.auth/user.json` storage state) — replaced the MailDev magic-link round trip with directly
inserting a `session` row for the seeded admin user and setting it as a cookie
(`authjs.session-token`, no `__Secure-` prefix on non-HTTPS `localhost` — matches
`@auth/core`'s `defaultCookies()`), the same mechanism already proven working during the Neon
region-move verification earlier in this project. `e2e/helpers/maildev.ts` deleted. Ran the full
suite locally after the change — all 12 tests pass, confirming the new mechanism actually produces
a session every other spec can reuse, not just that it doesn't error.

## 2026-08-17 — User activity tracking, Slice 1: login history + online presence

First of two slices for "log login timings, who's online, and what each user has done." Split in
two — this slice is login history and presence only; the full "everything" audit log is a separate
plan, since it touches ~26 mutation functions across 13 files in `src/server/*` (confirmed by a
full audit of every `db.insert/update/delete` call site) and is too large to review as one change
with this slice.

**Presence, without new infrastructure**: `requireUser()` (`src/server/auth.ts`) already sits at
the top of nearly every exported `src/server/*` function — confirmed ~69 call sites across the
codebase. Added a `touchLastActive(userId)` call there that does a single conditional
`UPDATE "user" SET last_active_at = now() WHERE ... AND (last_active_at IS NULL OR last_active_at
< now() - interval '60 seconds')`, not awaited and with errors swallowed — this is best-effort
presence data, and a page load must never be slowed or broken by it. The 60-second throttle matters
because a single page view can call `requireUser()` 1-3 times (one per `get*` call); without it,
every page view would be 1-3 unconditional writes instead of at most one. "Online" is computed at
read time (`last_active_at > now() - interval '5 minutes'`), not stored — no new state machine.

**Login history, not just a single "last login"**: new `login_event` table, one row per successful
sign-in, populated via a new `events.signIn` hook in `src/lib/auth.ts`. Relies on something already
verified against the installed `@auth/core` source during the Microsoft SSO work: `events.signIn`
fires with the fully-resolved DB user (`user.id` is real), not the raw provider profile.

**Admin-only, new territory**: `requireAdmin()` already existed in `src/server/auth.ts` but had
zero call sites anywhere in the app — this is the first thing to actually use it. No existing
"admin-only page" precedent to follow, so the new `/admin` page mirrors the layered pattern the
`(app)` layout already uses for "signed in at all": the page itself checks
`session.user.role === "admin"` and redirects to `/` as a UX guard, while `requireAdmin()` inside
`getUserPresence()`/`getLoginHistory()` (`src/server/users.ts`, `src/server/login-event.ts`) stays
the real boundary — same shape, one role tighter. Nav entry in `sidebar-nav.tsx` is conditional on
`isAdmin`, passed down from the layout (which already has the session).

**Verified for real, not just via typecheck**: no `member`-role user existed in the dev DB to test
the redirect against, so a throwaway one was created, session-injected, hit `/admin` (clean 307 to
`/`), then deleted — same pattern as the FK-indexes and SSO verification work earlier this project.
Also drove an actual magic-link sign-in through MailDev (not a manually-inserted session, since
that would bypass `events.signIn` entirely and prove nothing about the login-history hook) and
confirmed both a `login_event` row and `last_active_at` update landed correctly, then confirmed the
admin page renders both sections with real data.

**Deferred to Slice 2's own plan**: the full audit log of every create/update/status-change across
every entity. Flagged there as candidates to exclude: `dashboard_widget` mutations (personal UI
layout, not a shared CRM record — would just be drag/resize noise) and `activity`-table creation
(would be a log entry about a log entry).
