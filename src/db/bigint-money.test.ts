// Unlike every other test in this suite (all pure functions, no DB — see
// CLAUDE.md: "domain logic in lib/, server actions stay thin"), this one
// needs a real Postgres connection: it's the only way to prove a value above
// the old int4 ceiling actually round-trips through the bigint columns
// (remediation slice 1, docs/decisions.md) via postgres-js + drizzle, not
// just through the pure-JS BigInt math in money.ts/quotation-math.ts (which
// never touched a column type and needed no change).
import { config } from "dotenv";

config({ path: ".env.local" });

import { TransactionRollbackError, eq, sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";

// Dynamic imports, after dotenv config() above — static imports would be
// hoisted above it, reading DATABASE_URL before it's populated (same
// reasoning as src/db/seed.ts).
async function loadDb() {
  const { db } = await import("./client");
  const { legalEntity } = await import("./schema/legal-entity");
  const { company } = await import("./schema/company");
  const { project } = await import("./schema/project");
  const { opportunity } = await import("./schema/opportunity");
  const { product } = await import("./schema/product");
  const { quotation, quotationLine } = await import("./schema/quotation");
  return {
    db,
    legalEntity,
    company,
    project,
    opportunity,
    product,
    quotation,
    quotationLine,
  };
}

// Above the old int4 ceiling (2,147,483,647).
const NINE_FIGURE = 7_147_483_647;

describe("bigint money columns (live DB integration)", () => {
  // Well above vitest's 5s default: this is a real round trip to Neon
  // (connection + 6 inserts + 2 selects in one transaction), not local.
  it(
    "survive insert -> select as a plain stored column and as a sum() aggregate, both as numbers",
    { timeout: 20000 },
    async () => {
      const {
        db,
        legalEntity,
        company,
        project,
        opportunity,
        product,
        quotation,
        quotationLine,
      } = await loadDb();

      let plainColumn: { estimatedValue: number | null } | undefined;
      let summed: { total: string } | undefined;

      await db
        .transaction(async (tx) => {
          const [entity] = await tx
            .insert(legalEntity)
            .values({
              nameEn: "Bigint Test Entity",
              shortCode: `BGT${Date.now()}`,
              jurisdiction: "SG",
              defaultCurrency: "USD",
            })
            .returning();

          const [cust] = await tx
            .insert(company)
            .values({ nameEn: "Bigint Test Company", country: "SG" })
            .returning();

          const [proj] = await tx
            .insert(project)
            .values({
              nameEn: "Bigint Test Project",
              clientCompanyId: cust.id,
              country: "SG",
            })
            .returning();

          const [opp] = await tx
            .insert(opportunity)
            .values({
              reference: "BGT-TEST-1",
              projectId: proj.id,
              customerCompanyId: cust.id,
              legalEntityId: entity.id,
              title: "Bigint test opportunity",
              // Plain stored bigint column, same shape as sales_order/
              // purchase_order.total_value.
              estimatedValue: NINE_FIGURE,
              currency: "USD",
            })
            .returning();

          const [prod] = await tx
            .insert(product)
            .values({ centorCode: "BGT-TEST", nameEn: "Bigint Test Product" })
            .returning();

          const [quote] = await tx
            .insert(quotation)
            .values({
              quoteNo: "BGT-TEST-Q-0001",
              opportunityId: opp.id,
              legalEntityId: entity.id,
              customerCompanyId: cust.id,
              issueDate: new Date(),
              currency: "USD",
            })
            .returning();

          await tx.insert(quotationLine).values([
            {
              quotationId: quote.id,
              lineNo: 1,
              productId: prod.id,
              quantity: 1,
              unitPrice: NINE_FIGURE,
              lineTotal: NINE_FIGURE,
            },
            {
              quotationId: quote.id,
              lineNo: 2,
              productId: prod.id,
              quantity: 1,
              unitPrice: NINE_FIGURE,
              lineTotal: NINE_FIGURE,
            },
          ]);

          const [oppRow] = await tx
            .select({ estimatedValue: opportunity.estimatedValue })
            .from(opportunity)
            .where(eq(opportunity.id, opp.id));
          plainColumn = oppRow;

          // Same sql<string> coalesce(sum(...), 0) shape as
          // src/server/quotations.ts's getQuotations().
          const [sumRow] = await tx
            .select({
              total:
                sql<string>`coalesce(sum(${quotationLine.lineTotal}), 0)`.as(
                  "total",
                ),
            })
            .from(quotationLine)
            .where(eq(quotationLine.quotationId, quote.id));
          summed = sumRow;

          tx.rollback();
        })
        .catch((err) => {
          if (!(err instanceof TransactionRollbackError)) throw err;
        });

      expect(typeof plainColumn?.estimatedValue).toBe("number");
      expect(plainColumn?.estimatedValue).toBe(NINE_FIGURE);

      expect(typeof summed?.total).toBe("string");
      expect(Number(summed?.total)).toBe(NINE_FIGURE * 2);
    },
  );
});
