import { and, eq, sql } from "drizzle-orm";

import { db } from "@/db/client";
import { documentSequence } from "@/db/schema/document-sequence";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

// Atomic, never-resetting, per-(legal entity, doc type) counter backing
// document numbers (crm-spec.md §7). Seeds the row on first use, locks it
// with SELECT ... FOR UPDATE so concurrent callers can't read the same
// number, then increments and returns the number just consumed.
//
// Takes the caller's own transaction rather than opening a second, nested
// one of its own — every caller (createQuotation, createSalesOrder,
// createPurchaseOrder) already calls this from inside its own
// db.transaction(). Independently starting a second transaction here
// meant each call held one pool connection (the outer transaction) while
// waiting on a second (this function's own transaction) to open — under
// real concurrent load (two callers hitting the same legal entity/doc type
// at once, e.g. two real users, or this app's own e2e suite running
// several flows in parallel) that's a pool-starvation deadlock: every
// connection is an outer transaction waiting on an inner one that can
// never acquire a connection because none are free. Found by the e2e
// suite hanging under parallel workers.
export async function getNextSequenceNumber(
  tx: Tx,
  legalEntityId: string,
  docType: string,
): Promise<number> {
  await tx
    .insert(documentSequence)
    .values({ legalEntityId, docType, nextNumber: 1 })
    .onConflictDoNothing({
      target: [documentSequence.legalEntityId, documentSequence.docType],
    });

  const [row] = await tx
    .select()
    .from(documentSequence)
    .where(
      and(
        eq(documentSequence.legalEntityId, legalEntityId),
        eq(documentSequence.docType, docType),
      ),
    )
    .for("update");

  const assigned = row.nextNumber;

  await tx
    .update(documentSequence)
    .set({ nextNumber: sql`${documentSequence.nextNumber} + 1` })
    .where(
      and(
        eq(documentSequence.legalEntityId, legalEntityId),
        eq(documentSequence.docType, docType),
      ),
    );

  return assigned;
}
