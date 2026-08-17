# CENTOR CRM

Internal CRM for CENTOR Global — TBM consumables supply and technical services across Singapore,
Hong Kong and mainland China. Deals are anchored to tunnelling projects and flow back-to-back
through CENTOR's own legal entities.

**Stack**: Next.js (App Router) · TypeScript · PostgreSQL · Drizzle ORM · Tailwind · shadcn/ui ·
Auth.js (email magic link) · Vitest · Playwright.

## Prerequisites

- Node 22
- pnpm, via [corepack](https://nodejs.org/api/corepack.html) (`corepack enable`)
- A Postgres database — [Neon](https://neon.tech) is what this project uses (see
  `specs/crm-spec.md` §9); any Postgres connection string works for local dev.

## First run

```bash
cp .env.example .env.local
# fill in DATABASE_URL and AUTH_SECRET (openssl rand -base64 32) — see
# .env.example for what every other key is for and whether it's optional locally

pnpm install
pnpm db:migrate
pnpm db:seed
pnpm dev
```

The app is now running at `localhost:3000`. Sign in with a magic link sent to the address you seed
with — see `pnpm db:seed`'s output, or `src/db/seed.ts`.

## Testing

```bash
pnpm lint        # eslint + prettier check — no database needed
pnpm typecheck   # tsc --noEmit — no database needed
pnpm test        # vitest, unit + integration — uses the DATABASE_URL from .env.local
```

Almost all of `pnpm test` is pure-function unit tests with no database involved, but
`src/db/bigint-money.test.ts` does a real round trip against Postgres (self-cleaning — it inserts
inside a transaction and rolls back), so `test` needs a migrated, reachable database. All three
run in CI (`.github/workflows/ci.yml`) on every push and pull request, against a throwaway
`postgres:16` service container, not your dev database.

End-to-end tests (`pnpm test:e2e`, Playwright) additionally need:

```bash
npx maildev              # catches magic-link emails sent during sign-in — REST API on :1080
npx playwright install   # once, to fetch browser binaries
pnpm test:e2e
```

Not run in CI yet — see `docs/decisions.md`.

## Learn more

- [`specs/crm-spec.md`](specs/crm-spec.md) — the source of truth for scope, data model and build
  order.
- [`docs/decisions.md`](docs/decisions.md) — architectural decisions and why they were made.
- [`CLAUDE.md`](CLAUDE.md) — working conventions for this repo.
