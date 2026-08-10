import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

import { contact } from "@/db/schema/contact";

export const contactFormSchema = createInsertSchema(contact, {
  nameEn: (schema) => schema.min(1, "Name is required"),
  email: (schema) => schema.email("Enter a valid email"),
}).omit({ id: true, createdAt: true, updatedAt: true, createdBy: true });

export type ContactFormInput = z.infer<typeof contactFormSchema>;
