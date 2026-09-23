// Validation messages are i18n dictionary keys, resolved by the form
// through t() — see src/lib/i18n/dictionary.ts.
import { createSchemaFactory } from "drizzle-zod";
import { z } from "zod";

import { opportunity } from "@/db/schema/opportunity";

const { createInsertSchema } = createSchemaFactory({ coerce: { date: true } });

export const opportunityFormSchema = createInsertSchema(opportunity, {
  reference: (schema) => schema.min(1, "error.referenceRequired"),
  title: (schema) => schema.min(1, "error.titleRequired"),
}).omit({ id: true, createdAt: true, updatedAt: true, createdBy: true });

export type OpportunityFormInput = z.infer<typeof opportunityFormSchema>;
