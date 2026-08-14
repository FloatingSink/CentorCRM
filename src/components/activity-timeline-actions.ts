"use server";

import { auth } from "@/lib/auth";
import { activityCreateSchema } from "@/lib/validation/activity";
import { createActivity } from "@/server/activities";

// Not form-bound — same precedent as product-documents/actions.ts and the
// order builders' manual-pending-state actions.

export async function createActivityAction(
  input: unknown,
): Promise<{ id: string } | { error: string }> {
  const parsed = activityCreateSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const session = await auth();
  if (!session?.user) {
    return { error: "Not signed in" };
  }

  const created = await createActivity(
    parsed.data,
    session.user.id,
    session.user.id,
  );
  return { id: created.id };
}
