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
