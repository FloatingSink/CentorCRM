"use server";

import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { machineFormSchema } from "@/lib/validation/machine";
import { createMachine, updateMachine } from "@/server/machines";

function parseMachineForm(formData: FormData, projectId: string) {
  const diameterRaw = formData.get("diameterMm");

  return machineFormSchema.safeParse({
    projectId,
    designation: formData.get("designation"),
    manufacturer: formData.get("manufacturer") || null,
    diameterMm: diameterRaw ? Number(diameterRaw) : null,
    machineType: formData.get("machineType"),
    notes: formData.get("notes") || null,
    isActive: formData.get("isActive") === "true",
  });
}

export async function createMachineAction(
  projectId: string,
  _prevState: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const parsed = parseMachineForm(formData, projectId);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const session = await auth();
  if (!session?.user) {
    redirect("/sign-in");
  }

  await createMachine(parsed.data, session.user.id);
  redirect(`/projects/${projectId}`);
}

export async function updateMachineAction(
  id: string,
  projectId: string,
  _prevState: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const parsed = parseMachineForm(formData, projectId);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await updateMachine(id, parsed.data);
  redirect(`/projects/${projectId}`);
}
