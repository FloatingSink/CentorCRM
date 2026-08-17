"use server";

import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { taskFormSchema } from "@/lib/validation/task";
import { completeTask, createTask } from "@/server/tasks";

// The central /tasks page always creates a freestanding task — a task tied
// to a specific record is created from that record's own detail page (see
// src/components/task-panel.tsx / task-panel-actions.ts), not here.
function parseTaskForm(formData: FormData) {
  const dueDateRaw = formData.get("dueDate");

  return taskFormSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || null,
    assigneeUserId: formData.get("assigneeUserId"),
    dueDate: dueDateRaw ? dueDateRaw : null,
    relatedType: null,
    relatedId: null,
  });
}

export async function createTaskAction(
  _prevState: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const parsed = parseTaskForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const session = await auth();
  if (!session?.user) {
    redirect("/sign-in");
  }

  await createTask(parsed.data, session.user.id);
  redirect("/tasks");
}

export async function completeTaskAction(id: string): Promise<void> {
  await completeTask(id);
}
