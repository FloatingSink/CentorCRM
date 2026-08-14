"use server";

import { renderToBuffer } from "@react-pdf/renderer";

import { auth } from "@/lib/auth";
import { parseMoneyToMinorUnits } from "@/lib/money";
import { PurchaseOrderDocument } from "@/lib/pdf/purchase-order-document";
import {
  purchaseOrderCreateSchema,
  purchaseOrderPreviewSchema,
  type PurchaseOrderLineInput,
} from "@/lib/validation/purchase-order";
import {
  createPurchaseOrder,
  getPurchaseOrderPdfDataFromDraft,
  updatePurchaseOrderHeaderAndLines,
  updatePurchaseOrderStatus,
} from "@/server/purchase-orders";

// Not form-bound — same precedent as sales-orders/actions.ts.

function convertLines(
  lines: PurchaseOrderLineInput[],
  currency: string,
):
  | {
      success: true;
      data: (PurchaseOrderLineInput & { unitPriceMinor: number })[];
    }
  | { success: false; error: string } {
  const converted: (PurchaseOrderLineInput & { unitPriceMinor: number })[] = [];

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

// Mirrors the DB CHECK constraint (purchase_order_supplier_xor) with a
// friendlier pre-save error, same pattern as checkCustomerXor in
// sales-orders/actions.ts.
function checkSupplierXor(
  supplierCompanyId: string | null | undefined,
  supplierLegalEntityId: string | null | undefined,
): string | undefined {
  const hasCompany = !!supplierCompanyId;
  const hasLegalEntity = !!supplierLegalEntityId;
  if (hasCompany === hasLegalEntity) {
    return "Select exactly one supplier: either a company or one of our own legal entities";
  }
  return undefined;
}

export async function createPurchaseOrderAction(
  input: unknown,
): Promise<{ id: string } | { error: string }> {
  const parsed = purchaseOrderCreateSchema.safeParse(input);
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

  const supplierError = checkSupplierXor(
    parsed.data.header.supplierCompanyId,
    parsed.data.header.supplierLegalEntityId,
  );
  if (supplierError) {
    return { error: supplierError };
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

  const created = await createPurchaseOrder(
    parsed.data.header,
    linesResult.data,
    session.user.id,
  );
  return { id: created.id };
}

export async function updatePurchaseOrderAction(
  id: string,
  input: unknown,
): Promise<{ id: string } | { error: string }> {
  const parsed = purchaseOrderCreateSchema.safeParse(input);
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

  const supplierError = checkSupplierXor(
    parsed.data.header.supplierCompanyId,
    parsed.data.header.supplierLegalEntityId,
  );
  if (supplierError) {
    return { error: supplierError };
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

  const updated = await updatePurchaseOrderHeaderAndLines(
    id,
    parsed.data.header,
    linesResult.data,
    session.user.id,
  );
  return { id: updated.id };
}

export async function updatePurchaseOrderStatusAction(
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

  await updatePurchaseOrderStatus(id, status);
  return {};
}

// Called on every debounced keystroke by pdf-preview-panel.tsx (via the
// purchase order builder's buildPreviewPayload) — same reasoning as
// previewQuotationPdfAction in quotations/actions.ts: an incomplete draft is
// the common case here, not an error.
export async function previewPurchaseOrderPdfAction(
  input: unknown,
): Promise<{ pdfBase64: string } | { incomplete: true } | { error: string }> {
  const parsed = purchaseOrderPreviewSchema.safeParse(input);
  if (!parsed.success) {
    return { incomplete: true };
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
    return { incomplete: true };
  }

  const data = await getPurchaseOrderPdfDataFromDraft(
    parsed.data.header,
    linesResult.data,
    parsed.data.orderNo,
  );
  if (!data) {
    return { incomplete: true };
  }

  const buffer = await renderToBuffer(<PurchaseOrderDocument data={data} />);
  return { pdfBase64: buffer.toString("base64") };
}
