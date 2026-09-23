// Validation messages are i18n dictionary keys, resolved by the form
// through t() — see src/lib/i18n/dictionary.ts.
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

import { contact } from "@/db/schema/contact";

export const contactFormSchema = createInsertSchema(contact, {
  nameEn: (schema) => schema.min(1, "error.nameRequired"),
  email: (schema) => schema.email("error.invalidEmail"),
}).omit({ id: true, createdAt: true, updatedAt: true, createdBy: true });

export type ContactFormInput = z.infer<typeof contactFormSchema>;
