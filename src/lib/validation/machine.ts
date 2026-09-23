// Validation messages are i18n dictionary keys, resolved by the form
// through t() — see src/lib/i18n/dictionary.ts.
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

import { machine } from "@/db/schema/machine";

export const machineFormSchema = createInsertSchema(machine, {
  designation: (schema) => schema.min(1, "error.designationRequired"),
}).omit({ id: true, createdAt: true, updatedAt: true, createdBy: true });

export type MachineFormInput = z.infer<typeof machineFormSchema>;
