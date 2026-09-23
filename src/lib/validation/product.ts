// Validation messages are i18n dictionary keys, resolved by the form
// through t() — see src/lib/i18n/dictionary.ts.
import { createSchemaFactory } from "drizzle-zod";
import { z } from "zod";

import { product } from "@/db/schema/product";

const { createInsertSchema } = createSchemaFactory();

export const productFormSchema = createInsertSchema(product, {
  centorCode: (schema) => schema.min(1, "error.centorCodeRequired"),
  nameEn: (schema) => schema.min(1, "error.nameRequired"),
}).omit({ id: true, createdAt: true, updatedAt: true, createdBy: true });

export type ProductFormInput = z.infer<typeof productFormSchema>;
