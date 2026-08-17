import { and, desc, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { document, type documentRelatedTypeEnum } from "@/db/schema/document";
import type { DocumentCreateInput } from "@/lib/validation/document";
import { requireUser } from "./auth";
import { logActivity } from "./audit-log";

type RelatedType = (typeof documentRelatedTypeEnum.enumValues)[number];

export async function getDocumentsForRelated(
  relatedType: RelatedType,
  relatedId: string,
) {
  await requireUser();
  return db
    .select()
    .from(document)
    .where(
      and(
        eq(document.relatedType, relatedType),
        eq(document.relatedId, relatedId),
      ),
    )
    .orderBy(desc(document.createdAt));
}

export async function getDocumentById(id: string) {
  await requireUser();
  const [row] = await db.select().from(document).where(eq(document.id, id));
  return row ?? null;
}

export async function createDocument(
  input: DocumentCreateInput,
  uploadedBy: string,
  createdBy: string,
) {
  const actor = await requireUser();
  return db.transaction(async (tx) => {
    const [created] = await tx
      .insert(document)
      .values({ ...input, uploadedBy, createdBy })
      .returning();

    await logActivity(tx, {
      userId: actor.id,
      action: "create",
      entityType: "document",
      entityId: created.id,
      message: `uploaded document "${created.title}"`,
    });

    return created;
  });
}
