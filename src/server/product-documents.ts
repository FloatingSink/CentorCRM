import { and, asc, desc, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { productDocument } from "@/db/schema/product-document";
import type { ProductDocumentCreateInput } from "@/lib/validation/product-document";
import { requireUser } from "./auth";
import { logActivity } from "./audit-log";

export async function getProductDocuments(productId: string) {
  await requireUser();
  return db
    .select()
    .from(productDocument)
    .where(eq(productDocument.productId, productId))
    .orderBy(
      asc(productDocument.docType),
      asc(productDocument.language),
      desc(productDocument.createdAt),
    );
}

export async function getProductDocumentById(id: string) {
  await requireUser();
  const [row] = await db
    .select()
    .from(productDocument)
    .where(eq(productDocument.id, id));
  return row ?? null;
}

// crm-spec.md §6.3 — only one is_current per (product_id, doc_type, language).
// Supersede the existing current row (if any) in the same transaction as the
// insert, rather than deleting it, so document history is kept.
export async function createProductDocument(
  input: ProductDocumentCreateInput,
  createdBy: string,
) {
  const actor = await requireUser();
  return db.transaction(async (tx) => {
    await tx
      .update(productDocument)
      .set({ isCurrent: false })
      .where(
        and(
          eq(productDocument.productId, input.productId),
          eq(productDocument.docType, input.docType),
          eq(productDocument.language, input.language),
          eq(productDocument.isCurrent, true),
        ),
      );

    const [created] = await tx
      .insert(productDocument)
      .values({ ...input, isCurrent: true, createdBy })
      .returning();

    await logActivity(tx, {
      userId: actor.id,
      action: "create",
      entityType: "product_document",
      entityId: created.id,
      message: `uploaded ${created.docType} (${created.language}) product document${created.version ? ` v${created.version}` : ""}`,
    });

    return created;
  });
}
