# CENTOR CRM

Internal CRM for CENTOR Global — TBM consumables supply and technical services
across Singapore, Hong Kong and mainland China. Deals are anchored to **tunnelling
projects**, and most flow back-to-back through more than one of our own legal
entities.

**Read `specs/crm-spec.md` before any non-trivial change.** It is the source of
truth for scope, data model and build order. If the spec and the code disagree,
the spec wins — fix the code, or update the spec first and say so.

Architectural decisions and their reasoning live in `docs/decisions.md`. Append,
never rewrite.

## Commands

```bash
pnpm dev              # dev server on :3000
pnpm build            # production build
pnpm test             # vitest, unit + integration
pnpm test:e2e         # playwright
pnpm lint             # eslint + prettier check
pnpm typecheck        # tsc --noEmit
pnpm db:generate      # generate migration from schema changes
pnpm db:migrate       # apply migrations
pnpm db:seed          # reset + seed dev data
pnpm db:studio        # drizzle studio
```

Run `pnpm typecheck && pnpm test` before declaring any task done.

## Stack

Next.js (App Router) · TypeScript · PostgreSQL · Drizzle ORM · Tailwind ·
shadcn/ui · Auth.js (Microsoft Entra ID SSO) · Vitest · Playwright

## Layout

```
src/
  app/                 # routes; grouped by feature
  components/          # shared UI; feature components live beside their route
  db/
    schema/            # drizzle schema, one file per domain area
    migrations/        # generated — never hand-edit
    seed.ts
  lib/                 # domain logic, pure and unit-tested
  server/              # server actions and data access
specs/crm-spec.md
docs/decisions.md
```

## Hard rules

- **Never hand-edit a migration in `src/db/migrations/`.** Change the schema and
  regenerate. If a migration has already run anywhere, write a new one.
- **Never commit secrets.** Config comes from env vars; `.env.example` documents
  every key with a dummy value.
- **Money is integer minor units plus an ISO 4217 currency code.** No floats, no
  bare numbers. Every amount column has a currency column next to it.
- **Nothing commercial is hard-deleted.** Use `is_active` / `archived_at`.
- **Do not add dependencies** without saying why first. Prefer the standard library
  and what is already installed.
- **Do not build anything in the spec's non-goals list**, even if it seems like a
  natural extension.
- **Do not invent domain data.** Registration numbers, product codes, project names
  and pack sizes come from the spec or from Jia Long. If it is not there, ask —
  do not fill in a plausible-looking value.

## Conventions

- Files `kebab-case.ts`; React components `PascalCase`; DB tables and columns
  `snake_case`, tables singular.
- Domain logic goes in `src/lib/` as pure functions and gets unit tests. Route
  handlers and server actions stay thin.
- Every user-visible name field has `_en` and `_zh` variants. Never drop the
  Chinese field because it seems optional.
- Timestamps stored UTC, rendered Asia/Singapore.
- `created_at`, `updated_at`, `created_by` on every table.
- Validate all input at the boundary with zod; infer types from the schema rather
  than declaring them twice.

## Working style

- Build in **vertical slices**: schema → data access → API → UI → test for one
  entity, then stop and let me review. Do not scaffold every model at once.
- Use plan mode for anything touching more than two or three files. Show the plan
  before writing code.
- Write tests for anything involving money, quantities, currency conversion, or
  document numbering. UI polish does not need tests.
- Small commits, conventional commit messages, one slice per branch.
- When something in the spec is ambiguous, ask rather than picking a
  reasonable-sounding default. The ambiguities in this domain are usually where
  the real requirement is hiding.

## Domain glossary

TBM (tunnel boring machine) · EPB / slurry (TBM types) · tail seal grease (seals
the tail shield) · soil conditioner / foam (injected at the cutterhead) · EP
grease (extreme pressure, main bearing) · CRTG (China Railway Tunnel Group, our
main contractor customer) · TDS / SDS / COC (technical data sheet, safety data
sheet, certificate of conformity) · Incoterm (EXW, FOB, CFR, CIF, DAP) · UEN
(Singapore company registration number) · back-to-back (same goods sold down a
chain of our own entities) · drum/barrel (200 L) · pail (20 L)

Our legal entities: **CENTOR Group Pte. Ltd.** (SG), **INFRA TECH PROFESSIONALS
PTE. LTD.** (SG), **TUNNEL TECHNIC ENGINEERING PTE. LTD.** (SG), **CHENGTUO GROUP
LIMITED** (HK). These are *ours* — they are `legal_entity` rows, never `company`
rows.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
