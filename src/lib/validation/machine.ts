import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

import { machine } from "@/db/schema/machine";

export const machineFormSchema = createInsertSchema(machine, {
  designation: (schema) => schema.min(1, "Designation is required"),
}).omit({ id: true, createdAt: true, updatedAt: true, createdBy: true });

export type MachineFormInput = z.infer<typeof machineFormSchema>;
