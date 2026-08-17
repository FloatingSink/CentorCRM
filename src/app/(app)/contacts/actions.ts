"use server";

import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { contactFormSchema } from "@/lib/validation/contact";
import { createContact, updateContact } from "@/server/contacts";

function parseContactForm(formData: FormData) {
  return contactFormSchema.safeParse({
    companyId: formData.get("companyId"),
    nameEn: formData.get("nameEn"),
    nameZh: formData.get("nameZh") || null,
    jobTitle: formData.get("jobTitle") || null,
    email: formData.get("email") || null,
    phone: formData.get("phone") || null,
    wechatId: formData.get("wechatId") || null,
    preferredLanguage: formData.get("preferredLanguage") || "en",
    isPrimary: formData.get("isPrimary") === "true",
    notes: formData.get("notes") || null,
    isActive: formData.get("isActive") === "true",
  });
}

export async function createContactAction(
  _prevState: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const parsed = parseContactForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const session = await auth();
  if (!session?.user) {
    redirect("/sign-in");
  }

  const created = await createContact(parsed.data, session.user.id);
  redirect(`/companies/${created.companyId}`);
}

export async function updateContactAction(
  id: string,
  companyId: string,
  _prevState: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const parsed = parseContactForm(formData);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const session = await auth();
  if (!session?.user) {
    redirect("/sign-in");
  }

  await updateContact(id, parsed.data);
  redirect(`/companies/${companyId}`);
}
