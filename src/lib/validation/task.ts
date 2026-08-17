import { createSchemaFactory } from "drizzle-zod";
import { z } from "zod";

import { task } from "@/db/schema/task";

// coerce.date so "YYYY-MM-DD" strings from <input type="date"> validate
// directly, same reasoning as project.ts's startDate/expectedEndDate.
const { createInsertSchema } = createSchemaFactory({ coerce: { date: true } });

// relatedType/relatedId omitted — Slice 1 only creates freestanding tasks;
// the columns exist (nullable, CHECK-paired) for Slice 2 to populate later.
export const taskFormSchema = createInsertSchema(task, {
  title: (schema) => schema.min(1, "Title is required"),
}).omit({
  id: true,
  status: true,
  relatedType: true,
  relatedId: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
});

export type TaskFormInput = z.infer<typeof taskFormSchema>;
