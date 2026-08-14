import { and, eq, sql } from "drizzle-orm";

import { db } from "@/db/client";
import { documentSequence } from "@/db/schema/document-sequence";

// Atomic, never-resetting, per-(legal entity, doc type) counter backing
// document numbers (crm-spec.md §7). Seeds the row on first use, locks it
// with SELECT ... FOR UPDATE so concurrent callers can't read the same
// number, then increments and returns the number just consumed.
export async function getNextSequenceNumber(
  legalEntityId: string,
  docType: string,
): Promise<number> {
  return db.transaction(async (tx) => {
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
  });
}
