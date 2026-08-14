import { createSchemaFactory } from "drizzle-zod";
import { z } from "zod";

import { opportunity } from "@/db/schema/opportunity";

const { createInsertSchema } = createSchemaFactory({ coerce: { date: true } });

export const opportunityFormSchema = createInsertSchema(opportunity, {
  reference: (schema) => schema.min(1, "Reference is required"),
  title: (schema) => schema.min(1, "Title is required"),
}).omit({ id: true, createdAt: true, updatedAt: true, createdBy: true });

export type OpportunityFormInput = z.infer<typeof opportunityFormSchema>;
