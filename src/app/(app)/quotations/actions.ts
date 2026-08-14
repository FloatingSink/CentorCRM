"use server";

import { auth } from "@/lib/auth";
import { parseMoneyToMinorUnits } from "@/lib/money";
import {
  quotationCreateSchema,
  type QuotationLineInput,
} from "@/lib/validation/quotation";
import {
  createQuotation,
  createQuotationVersion,
  updateQuotationHeaderAndLines,
  updateQuotationStatus,
} from "@/server/quotations";

// Not form-bound — the builder manages header + a dynamic line-item array in
// client state and calls these directly, same precedent as
// products/[id]/documents/actions.ts's presigned-upload flow.

function convertLines(
  lines: QuotationLineInput[],
  currency: string,
):
  | { success: true; data: (QuotationLineInput & { unitPriceMinor: number })[] }
  | { success: false; error: string } {
  const converted: (QuotationLineInput & { unitPriceMinor: number })[] = [];

  for (const line of lines) {
    const unitPriceMinor = parseMoneyToMinorUnits(line.unitPrice, currency);
    if (unitPriceMinor === null) {
      return {
        success: false,
        error: `Invalid unit price: "${line.unitPrice}"`,
      };
    }
    converted.push({ ...line, unitPriceMinor });
  }

  return { success: true, data: converted };
}

function checkNamedPlace(
  incoterm: string | null | undefined,
  namedPlace: string | null | undefined,
): string | undefined {
  if (incoterm && incoterm !== "EXW" && !namedPlace) {
    return "Named place is required for this incoterm";
  }
  return undefined;
}

export async function createQuotationAction(
  input: unknown,
): Promise<{ id: string } | { error: string }> {
  const parsed = quotationCreateSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const namedPlaceError = checkNamedPlace(
    parsed.data.header.incoterm,
    parsed.data.header.namedPlace,
  );
  if (namedPlaceError) {
    return { error: namedPlaceError };
  }

  const session = await auth();
  if (!session?.user) {
    return { error: "Not signed in" };
  }

  const linesResult = convertLines(
    parsed.data.lines,
    parsed.data.header.currency,
  );
  if (!linesResult.success) {
    return { error: linesResult.error };
  }

  const created = await createQuotation(
    parsed.data.header,
    linesResult.data,
    session.user.id,
  );
  return { id: created.id };
}

export async function updateQuotationAction(
  id: string,
  input: unknown,
): Promise<{ id: string } | { error: string }> {
  const parsed = quotationCreateSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const namedPlaceError = checkNamedPlace(
    parsed.data.header.incoterm,
    parsed.data.header.namedPlace,
  );
  if (namedPlaceError) {
    return { error: namedPlaceError };
  }

  const session = await auth();
  if (!session?.user) {
    return { error: "Not signed in" };
  }

  const linesResult = convertLines(
    parsed.data.lines,
    parsed.data.header.currency,
  );
  if (!linesResult.success) {
    return { error: linesResult.error };
  }

  const updated = await updateQuotationHeaderAndLines(
    id,
    parsed.data.header,
    linesResult.data,
    session.user.id,
  );
  return { id: updated.id };
}

export async function createQuotationVersionAction(
  quotationId: string,
  input: unknown,
): Promise<{ id: string } | { error: string }> {
  const parsed = quotationCreateSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const namedPlaceError = checkNamedPlace(
    parsed.data.header.incoterm,
    parsed.data.header.namedPlace,
  );
  if (namedPlaceError) {
    return { error: namedPlaceError };
  }

  const session = await auth();
  if (!session?.user) {
    return { error: "Not signed in" };
  }

  const linesResult = convertLines(
    parsed.data.lines,
    parsed.data.header.currency,
  );
  if (!linesResult.success) {
    return { error: linesResult.error };
  }

  const created = await createQuotationVersion(
    quotationId,
    parsed.data.header,
    linesResult.data,
    session.user.id,
  );
  return { id: created.id };
}

export async function updateQuotationStatusAction(
  id: string,
  status: "draft" | "sent" | "accepted" | "rejected",
): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user) {
    return { error: "Not signed in" };
  }

  await updateQuotationStatus(id, status);
  return {};
}
