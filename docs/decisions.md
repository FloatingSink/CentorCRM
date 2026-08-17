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
