// Validation messages are i18n dictionary keys, resolved by the form
// through t() — see src/lib/i18n/dictionary.ts.
import { createSchemaFactory } from "drizzle-zod";
import { z } from "zod";

import { activity } from "@/db/schema/activity";

const { createInsertSchema } = createSchemaFactory({ coerce: { date: true } });

// userId/createdBy come from the session, not client input — same pattern
// as every other create action in this app (see e.g.
// src/lib/validation/purchase-order.ts).
export const activityCreateSchema = createInsertSchema(activity, {
  subject: (schema) => schema.min(1, "error.subjectRequired"),
}).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
});

export type ActivityCreateInput = z.infer<typeof activityCreateSchema>;
