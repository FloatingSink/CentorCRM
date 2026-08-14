import { createSchemaFactory } from "drizzle-zod";
import { z } from "zod";

import { product } from "@/db/schema/product";

const { createInsertSchema } = createSchemaFactory();

export const productFormSchema = createInsertSchema(product, {
  centorCode: (schema) => schema.min(1, "CENTOR code is required"),
  nameEn: (schema) => schema.min(1, "Name is required"),
}).omit({ id: true, createdAt: true, updatedAt: true, createdBy: true });

export type ProductFormInput = z.infer<typeof productFormSchema>;
