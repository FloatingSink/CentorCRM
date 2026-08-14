import { createSchemaFactory } from "drizzle-zod";
import { z } from "zod";

import { document, documentRelatedTypeEnum } from "@/db/schema/document";

const { createInsertSchema } = createSchemaFactory({ coerce: { date: true } });

// Mirrors productDocumentUploadRequestSchema in ./product-document.ts.
export const documentUploadRequestSchema = z.object({
  relatedType: z.enum(documentRelatedTypeEnum.enumValues),
  relatedId: z.uuid(),
  filename: z.string().min(1, "Choose a file"),
  contentType: z.string().min(1),
});

export type DocumentUploadRequestInput = z.infer<
  typeof documentUploadRequestSchema
>;

// uploadedBy/createdBy come from the session, not client input — same
// pattern as activity.userId in ./activity.ts.
export const documentCreateSchema = createInsertSchema(document, {
  title: (schema) => schema.min(1, "Title is required"),
  fileKey: (schema) => schema.min(1),
}).omit({
  id: true,
  uploadedBy: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
});

export type DocumentCreateInput = z.infer<typeof documentCreateSchema>;
