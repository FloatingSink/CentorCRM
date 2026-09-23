// Validation messages are i18n dictionary keys, resolved by the form
// through t() — see src/lib/i18n/dictionary.ts.
import { createSchemaFactory } from "drizzle-zod";
import { z } from "zod";

import { project } from "@/db/schema/project";

// coerce.date so "YYYY-MM-DD" strings from <input type="date"> validate
// directly, instead of requiring a pre-parsed Date object.
const { createInsertSchema } = createSchemaFactory({ coerce: { date: true } });

export const projectFormSchema = createInsertSchema(project, {
  nameEn: (schema) => schema.min(1, "error.nameRequired"),
  country: (schema) => schema.min(1, "error.countryRequired"),
}).omit({ id: true, createdAt: true, updatedAt: true, createdBy: true });

export type ProjectFormInput = z.infer<typeof projectFormSchema>;
