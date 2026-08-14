"use server";

import { auth } from "@/lib/auth";
import { parseMoneyToMinorUnits } from "@/lib/money";
import {
  salesOrderCreateSchema,
  type OrderLineInput,
} from "@/lib/validation/sales-order";
import {
  createSalesOrder,
  updateSalesOrderHeaderAndLines,
  updateSalesOrderStatus,
} from "@/server/sales-orders";

// Not form-bound — same precedent as quotations/actions.ts.

function convertLines(
  lines: OrderLineInput[],
  currency: string,
):
  | { success: true; data: (OrderLineInput & { unitPriceMinor: number })[] }
  | { success: false; error: string } {
  const converted: (OrderLineInput & { unitPriceMinor: number })[] = [];

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

// Mirrors the DB CHECK constraint (sales_order_customer_xor) with a
// friendlier pre-save error, same pattern as checkNamedPlace above.
function checkCustomerXor(
  customerCompanyId: string | null | undefined,
  customerLegalEntityId: string | null | undefined,
): string | undefined {
  const hasCompany = !!customerCompanyId;
  const hasLegalEntity = !!customerLegalEntityId;
  if (hasCompany === hasLegalEntity) {
    return "Select exactly one customer: either a company or one of our own legal entities";
  }
  return undefined;
}

export async function createSalesOrderAction(
  input: unknown,
): Promise<{ id: string } | { error: string }> {
  const parsed = salesOrderCreateSchema.safeParse(input);
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

  const customerError = checkCustomerXor(
    parsed.data.header.customerCompanyId,
    parsed.data.header.customerLegalEntityId,
  );
  if (customerError) {
    return { error: customerError };
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

  const created = await createSalesOrder(
    parsed.data.header,
    linesResult.data,
    session.user.id,
  );
  return { id: created.id };
}

export async function updateSalesOrderAction(
  id: string,
  input: unknown,
): Promise<{ id: string } | { error: string }> {
  const parsed = salesOrderCreateSchema.safeParse(input);
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

  const customerError = checkCustomerXor(
    parsed.data.header.customerCompanyId,
    parsed.data.header.customerLegalEntityId,
  );
  if (customerError) {
    return { error: customerError };
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

  const updated = await updateSalesOrderHeaderAndLines(
    id,
    parsed.data.header,
    linesResult.data,
    session.user.id,
  );
  return { id: updated.id };
}

export async function updateSalesOrderStatusAction(
  id: string,
  status:
    | "draft"
    | "confirmed"
    | "in_production"
    | "shipped"
    | "completed"
    | "cancelled",
): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user) {
    return { error: "Not signed in" };
  }

  await updateSalesOrderStatus(id, status);
  return {};
}
