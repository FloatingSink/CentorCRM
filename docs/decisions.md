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
