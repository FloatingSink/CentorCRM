import { and, asc, count, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { task } from "@/db/schema/task";
import type { TaskFormInput } from "@/lib/validation/task";
import { requireUser } from "./auth";
import { logActivity } from "./audit-log";

export async function createTask(input: TaskFormInput, createdBy: string) {
  const actor = await requireUser();
  return db.transaction(async (tx) => {
    const [created] = await tx
      .insert(task)
      .values({ ...input, createdBy })
      .returning();

    await logActivity(tx, {
      userId: actor.id,
      action: "create",
      entityType: "task",
      entityId: created.id,
      message: `assigned task "${created.title}"`,
    });

    return created;
  });
}

// Only the assignee can complete their own task — scoped in the WHERE
// itself, not trusted from the caller, same reasoning dashboard widget
// mutations already use for per-user ownership.
export async function completeTask(id: string) {
  const actor = await requireUser();
  return db.transaction(async (tx) => {
    const [updated] = await tx
      .update(task)
      .set({ status: "done" })
      .where(and(eq(task.id, id), eq(task.assigneeUserId, actor.id)))
      .returning();

    if (!updated) {
      throw new Error("Task not found, or you're not its assignee");
    }

    await logActivity(tx, {
      userId: actor.id,
      action: "status_change",
      entityType: "task",
      entityId: updated.id,
      message: `completed task "${updated.title}"`,
    });

    return updated;
  });
}

export async function getMyTasks() {
  const actor = await requireUser();
  return db
    .select()
    .from(task)
    .where(and(eq(task.assigneeUserId, actor.id), eq(task.status, "open")))
    .orderBy(asc(task.dueDate), asc(task.createdAt));
}

// Dedicated count query for the nav badge, rather than fetching full rows
// just to read .length.
export async function getMyOpenTaskCount() {
  const actor = await requireUser();
  const [row] = await db
    .select({ count: count() })
    .from(task)
    .where(and(eq(task.assigneeUserId, actor.id), eq(task.status, "open")));
  return row?.count ?? 0;
}
