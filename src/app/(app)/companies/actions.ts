"use server";

import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { companyFormSchema } from "@/lib/validation/company";
import { createCompany, updateCompany } from "@/server/companies";

function parseCompanyForm(formData: FormData) {
  return companyFormSchema.safeParse({
    nameEn: formData.get("nameEn"),
    nameZh: formData.get("nameZh") || null,
    country: formData.get("country"),
    registrationNo: formData.get("registrationNo") || null,
    address: formData.get("address") || null,
    website: formData.get("website") || null,
    notes: formData.get("notes") || null,
    isActive: formData.get("isActive") === "true",
    roles: formData.getAll("roles"),
  });
}

export async function createCompanyAction(
  _prevState: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const parsed = parseCompanyForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const session = await auth();
  if (!session?.user) {
    redirect("/sign-in");
  }

  const created = await createCompany(parsed.data, session.user.id);
  redirect(`/companies/${created.id}`);
}

export async function updateCompanyAction(
  id: string,
  _prevState: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const parsed = parseCompanyForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const session = await auth();
  if (!session?.user) {
    redirect("/sign-in");
  }

  await updateCompany(id, parsed.data);
  redirect(`/companies/${id}`);
}
