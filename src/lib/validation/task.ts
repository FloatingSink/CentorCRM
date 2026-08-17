import { createSchemaFactory } from "drizzle-zod";
import { z } from "zod";

import { task } from "@/db/schema/task";

// coerce.date so "YYYY-MM-DD" strings from <input type="date"> validate
// directly, same reasoning as project.ts's startDate/expectedEndDate.
const { createInsertSchema } = createSchemaFactory({ coerce: { date: true } });

// relatedType/relatedId are an optional pair — freestanding tasks (the
// central /tasks page's form) omit both; a task embedded on a record's
// detail page (src/components/task-panel.tsx) supplies both. Mirrors the
// DB's own task_related_pair CHECK at the zod boundary too (CLAUDE.md:
// validate at the boundary, don't rely on the DB catching it first).
export const taskFormSchema = createInsertSchema(task, {
  title: (schema) => schema.min(1, "Title is required"),
})
  .omit({
    id: true,
    status: true,
    createdAt: true,
    updatedAt: true,
    createdBy: true,
  })
  .refine((v) => (v.relatedType == null) === (v.relatedId == null), {
    message: "relatedType and relatedId must both be set, or both omitted",
    path: ["relatedType"],
  });

export type TaskFormInput = z.infer<typeof taskFormSchema>;
