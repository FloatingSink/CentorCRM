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

