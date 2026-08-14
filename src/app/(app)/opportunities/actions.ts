"use server";

import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { parseMoneyToMinorUnits } from "@/lib/money";
import { opportunityFormSchema } from "@/lib/validation/opportunity";
import { createOpportunity, updateOpportunity } from "@/server/opportunities";

function parseOpportunityForm(formData: FormData) {
  const currencyRaw = (formData.get("currency") as string | null)?.trim();
  const estimatedValueRaw = (
    formData.get("estimatedValue") as string | null
  )?.trim();

  let estimatedValue: number | null = null;
  let currency: string | null = null;
  let moneyError: string | undefined;

  if (estimatedValueRaw) {
    if (!currencyRaw) {
      moneyError = "Currency is required when estimated value is set";
    } else {
      const minorUnits = parseMoneyToMinorUnits(estimatedValueRaw, currencyRaw);
      if (minorUnits === null) {
        moneyError = "Invalid estimated value";
      } else {
        estimatedValue = minorUnits;
        currency = currencyRaw;
      }
    }
  } else if (currencyRaw) {
    currency = currencyRaw;
  }

  if (moneyError) {
    return { success: false as const, error: moneyError };
  }

  const probabilityRaw = formData.get("probability");
  const probability = probabilityRaw ? Number(probabilityRaw) : null;

  const parsed = opportunityFormSchema.safeParse({
    reference: formData.get("reference"),
    projectId: formData.get("projectId"),
    customerCompanyId: formData.get("customerCompanyId"),
    legalEntityId: formData.get("legalEntityId"),
    title: formData.get("title"),
    stage: formData.get("stage") || "enquiry",
    estimatedValue,
    currency,
    probability,
    expectedCloseDate: formData.get("expectedCloseDate") || null,
    ownerUserId:
      formData.get("ownerUserId") === "unassigned"
        ? null
        : formData.get("ownerUserId"),
    lostReason: formData.get("lostReason") || null,
    notes: formData.get("notes") || null,
    isActive: formData.get("isActive") === "true",
  });

  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  return { success: true as const, data: parsed.data };
}

export async function createOpportunityAction(
  _prevState: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const parsed = parseOpportunityForm(formData);
  if (!parsed.success) {
    return { error: parsed.error };
  }

  const session = await auth();
  if (!session?.user) {
    redirect("/sign-in");
  }

  const created = await createOpportunity(parsed.data, session.user.id);
  redirect(`/opportunities/${created.id}`);
}

export async function updateOpportunityAction(
  id: string,
  _prevState: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const parsed = parseOpportunityForm(formData);
  if (!parsed.success) {
    return { error: parsed.error };
  }

  await updateOpportunity(id, parsed.data);
  redirect(`/opportunities/${id}`);
}
