"use server";

import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { projectFormSchema } from "@/lib/validation/project";
import { createProject, updateProject } from "@/server/projects";

function parseProjectForm(formData: FormData) {
  return projectFormSchema.safeParse({
    nameEn: formData.get("nameEn"),
    nameZh: formData.get("nameZh") || null,
    clientCompanyId: formData.get("clientCompanyId"),
    country: formData.get("country"),
    city: formData.get("city") || null,
    status: formData.get("status") || "prospect",
    startDate: formData.get("startDate") || null,
    expectedEndDate: formData.get("expectedEndDate") || null,
    ownerUserId:
      formData.get("ownerUserId") === "unassigned"
        ? null
        : formData.get("ownerUserId"),
    notes: formData.get("notes") || null,
    isActive: formData.get("isActive") === "true",
  });
}

export async function createProjectAction(
  _prevState: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const parsed = parseProjectForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const session = await auth();
  if (!session?.user) {
    redirect("/sign-in");
  }

  const created = await createProject(parsed.data, session.user.id);
  redirect(`/projects/${created.id}`);
}

export async function updateProjectAction(
  id: string,
  _prevState: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const parsed = parseProjectForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await updateProject(id, parsed.data);
  redirect(`/projects/${id}`);
}
