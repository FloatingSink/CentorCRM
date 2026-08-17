"use server";

import { auth } from "@/lib/auth";
import { taskFormSchema } from "@/lib/validation/task";
import { createTask } from "@/server/tasks";

// Not form-bound — same precedent as activity-timeline-actions.ts (this
// panel doesn't navigate away on submit, so a redirect-based action like
// tasks/actions.ts's createTaskAction doesn't fit here).

export async function createTaskForRelatedAction(
  input: unknown,
): Promise<{ id: string } | { error: string }> {
  const parsed = taskFormSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const session = await auth();
  if (!session?.user) {
    return { error: "Not signed in" };
  }

  const created = await createTask(parsed.data, session.user.id);
  return { id: created.id };
}
