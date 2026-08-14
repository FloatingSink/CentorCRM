import { createSchemaFactory } from "drizzle-zod";
import { z } from "zod";

import {
  productDocLanguageEnum,
  productDocTypeEnum,
  productDocument,
} from "@/db/schema/product-document";

const { createInsertSchema } = createSchemaFactory({ coerce: { date: true } });

export const productDocumentUploadRequestSchema = z.object({
  productId: z.uuid(),
  docType: z.enum(productDocTypeEnum.enumValues),
  language: z.enum(productDocLanguageEnum.enumValues),
  filename: z.string().min(1, "Choose a file"),
  contentType: z.string().min(1),
});

export type ProductDocumentUploadRequestInput = z.infer<
  typeof productDocumentUploadRequestSchema
>;

export const productDocumentCreateSchema = createInsertSchema(productDocument, {
  fileKey: (schema) => schema.min(1),
}).omit({
  id: true,
  isCurrent: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
});

export type ProductDocumentCreateInput = z.infer<
  typeof productDocumentCreateSchema
>;
