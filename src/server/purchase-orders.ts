import { alias } from "drizzle-orm/pg-core";
import { asc, desc, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { company } from "@/db/schema/company";
import { legalEntity } from "@/db/schema/legal-entity";
import { orderLine } from "@/db/schema/sales-order";
import { product } from "@/db/schema/product";
import { purchaseOrder } from "@/db/schema/purchase-order";
import { project } from "@/db/schema/project";
import { salesOrder } from "@/db/schema/sales-order";
import { calculateLineTotal } from "@/lib/quotation-math";
import { buildDocumentNumber } from "@/lib/document-number";
import {
  canEditOrder,
  isLegalOrderTransition,
  StatusTransitionError,
} from "@/lib/status-transitions";
import type {
  PurchaseOrderHeaderInput,
  PurchaseOrderLineInput,
} from "@/lib/validation/purchase-order";
import { requireUser } from "./auth";
import { getNextSequenceNumber } from "./document-sequence";

const DOC_TYPE = "purchase_order";

const supplierLegalEntity = alias(legalEntity, "supplier_legal_entity");

export async function getPurchaseOrders() {
  await requireUser();
  return db
    .select({
      id: purchaseOrder.id,
      orderNo: purchaseOrder.orderNo,
      status: purchaseOrder.status,
      signedDate: purchaseOrder.signedDate,
      currency: purchaseOrder.currency,
      totalValue: purchaseOrder.totalValue,
      supplierCompanyId: purchaseOrder.supplierCompanyId,
      supplierCompanyName: company.nameEn,
      supplierLegalEntityId: purchaseOrder.supplierLegalEntityId,
      supplierLegalEntityName: supplierLegalEntity.nameEn,
      projectId: purchaseOrder.projectId,
      projectName: project.nameEn,
      linkedSalesOrderId: purchaseOrder.linkedSalesOrderId,
      linkedSalesOrderNo: salesOrder.orderNo,
    })
    .from(purchaseOrder)
    .leftJoin(company, eq(purchaseOrder.supplierCompanyId, company.id))
    .leftJoin(
      supplierLegalEntity,
      eq(purchaseOrder.supplierLegalEntityId, supplierLegalEntity.id),
    )
    .innerJoin(project, eq(purchaseOrder.projectId, project.id))
    .leftJoin(salesOrder, eq(purchaseOrder.linkedSalesOrderId, salesOrder.id))
    .orderBy(desc(purchaseOrder.createdAt));
}

// Bundles everything the PDF template needs in one place, so
// purchase-order-document.tsx does no data access of its own — same
// rationale as getQuotationForPdf in src/server/quotations.ts.
export async function getPurchaseOrderForPdf(id: string) {
  await requireUser();
  const [row] = await db
    .select({
      order: purchaseOrder,
      legalEntity,
      supplierCompany: company,
      supplierLegalEntity,
    })
    .from(purchaseOrder)
    .innerJoin(legalEntity, eq(purchaseOrder.legalEntityId, legalEntity.id))
    .leftJoin(company, eq(purchaseOrder.supplierCompanyId, company.id))
    .leftJoin(
      supplierLegalEntity,
      eq(purchaseOrder.supplierLegalEntityId, supplierLegalEntity.id),
    )
    .where(eq(purchaseOrder.id, id));
  if (!row) return null;

  const lines = await db
    .select({ line: orderLine, product })
    .from(orderLine)
    .innerJoin(product, eq(orderLine.productId, product.id))
    .where(eq(orderLine.purchaseOrderId, id))
    .orderBy(asc(orderLine.lineNo));

  return { ...row, lines };
}

// For the live PDF preview (src/components/pdf-preview-panel.tsx) — same
// reasoning as getQuotationPdfDataFromDraft in src/server/quotations.ts:
// resolves legalEntity/supplier (company or legal entity, matching the XOR
// pair) /each line's product from ids in an *unsaved* draft header+lines,
// and returns the exact same shape getPurchaseOrderForPdf does so
// PurchaseOrderDocument needs no changes.
export async function getPurchaseOrderPdfDataFromDraft(
  header: PurchaseOrderHeaderInput,
  lines: (PurchaseOrderLineInput & { unitPriceMinor: number })[],
  orderNo: string,
) {
  await requireUser();
  const [legalEntityRow] = header.legalEntityId
    ? await db
        .select()
        .from(legalEntity)
        .where(eq(legalEntity.id, header.legalEntityId))
    : [];
  if (!legalEntityRow) return null;

  const supplierCompanyRow = header.supplierCompanyId
    ? ((
        await db
          .select()
          .from(company)
          .where(eq(company.id, header.supplierCompanyId))
      )[0] ?? null)
    : null;
  const supplierLegalEntityRow = header.supplierLegalEntityId
    ? ((
        await db
          .select()
          .from(legalEntity)
          .where(eq(legalEntity.id, header.supplierLegalEntityId))
      )[0] ?? null)
    : null;
  if (!supplierCompanyRow && !supplierLegalEntityRow) return null;

  const lineProducts: {
    line: typeof orderLine.$inferSelect;
    product: typeof product.$inferSelect;
  }[] = [];
  for (const [index, line] of lines.entries()) {
    const [productRow] = await db
      .select()
      .from(product)
      .where(eq(product.id, line.productId));
    if (!productRow) return null;
    lineProducts.push({
      line: {
        id: `draft-line-${index}`,
        orderType: "purchase",
        salesOrderId: null,
        purchaseOrderId: "draft",
        lineNo: index + 1,
        productId: line.productId,
        descriptionOverride: line.descriptionOverride,
        quantity: line.quantity,
        uom: line.uom,
        unitPrice: line.unitPriceMinor,
        discountPct: line.discountPct,
        lineTotal: calculateLineTotal(
          line.quantity,
          line.unitPriceMinor,
          line.discountPct,
        ),
        netWeightKg: line.netWeightKg,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: null,
      },
      product: productRow,
    });
  }

  const draftPurchaseOrderRow: typeof purchaseOrder.$inferSelect = {
    id: "draft",
    orderNo,
    contractNo: header.contractNo ?? null,
    legalEntityId: header.legalEntityId,
    supplierCompanyId: header.supplierCompanyId ?? null,
    supplierLegalEntityId: header.supplierLegalEntityId ?? null,
    projectId: header.projectId,
    linkedSalesOrderId: header.linkedSalesOrderId ?? null,
    signedDate: header.signedDate ?? null,
    deliveryLocation: header.deliveryLocation ?? null,
    requiredDeliveryDate: header.requiredDeliveryDate ?? null,
    currency: header.currency,
    fxRateToSgd: header.fxRateToSgd,
    incoterm: header.incoterm ?? null,
    namedPlace: header.namedPlace ?? null,
    totalValue: sumLineTotals(lines),
    governingLaw: header.governingLaw ?? null,
    arbitrationRules: header.arbitrationRules ?? null,
    deliveryMethod: header.deliveryMethod ?? null,
    paymentMethod: header.paymentMethod ?? null,
    inspectionDays: header.inspectionDays ?? null,
    status: "draft",
    executedDocumentId: header.executedDocumentId ?? null,
    language: header.language ?? "en",
    notes: header.notes ?? null,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: null,
  };

  return {
    order: draftPurchaseOrderRow,
    legalEntity: legalEntityRow,
    supplierCompany: supplierCompanyRow,
    supplierLegalEntity: supplierLegalEntityRow,
    lines: lineProducts,
  };
}

export async function getPurchaseOrderById(id: string) {
  await requireUser();
  const [orderRow] = await db
    .select()
    .from(purchaseOrder)
    .where(eq(purchaseOrder.id, id));
  if (!orderRow) return null;

  const lines = await db
    .select()
    .from(orderLine)
    .where(eq(orderLine.purchaseOrderId, id))
    .orderBy(asc(orderLine.lineNo));

  return { order: orderRow, lines };
}

// Used by the sales order detail page's margin section (crm-spec.md §6.4 —
// linked_sales_order_id "is what makes the margin roll-up work").
export async function getLinkedPurchaseOrders(salesOrderId: string) {
  await requireUser();
  return db
    .select({
      id: purchaseOrder.id,
      orderNo: purchaseOrder.orderNo,
      status: purchaseOrder.status,
      currency: purchaseOrder.currency,
      totalValue: purchaseOrder.totalValue,
      fxRateToSgd: purchaseOrder.fxRateToSgd,
      supplierCompanyId: purchaseOrder.supplierCompanyId,
      supplierCompanyName: company.nameEn,
      supplierLegalEntityId: purchaseOrder.supplierLegalEntityId,
      supplierLegalEntityName: supplierLegalEntity.nameEn,
    })
    .from(purchaseOrder)
    .leftJoin(company, eq(purchaseOrder.supplierCompanyId, company.id))
    .leftJoin(
      supplierLegalEntity,
      eq(purchaseOrder.supplierLegalEntityId, supplierLegalEntity.id),
    )
    .where(eq(purchaseOrder.linkedSalesOrderId, salesOrderId))
    .orderBy(desc(purchaseOrder.createdAt));
}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function insertPurchaseOrderLines(
  tx: Tx,
  purchaseOrderId: string,
  lines: (PurchaseOrderLineInput & { unitPriceMinor: number })[],
  createdBy: string,
) {
  if (lines.length === 0) return;

  await tx.insert(orderLine).values(
    lines.map((line, index) => ({
      orderType: "purchase" as const,
      purchaseOrderId,
      lineNo: index + 1,
      productId: line.productId,
      descriptionOverride: line.descriptionOverride,
      quantity: line.quantity,
      uom: line.uom,
      unitPrice: line.unitPriceMinor,
      discountPct: line.discountPct,
      netWeightKg: line.netWeightKg,
      lineTotal: calculateLineTotal(
        line.quantity,
        line.unitPriceMinor,
        line.discountPct,
      ),
      createdBy,
    })),
  );
}

function sumLineTotals(
  lines: (PurchaseOrderLineInput & { unitPriceMinor: number })[],
): number {
  return lines.reduce(
    (sum, line) =>
      sum +
      calculateLineTotal(line.quantity, line.unitPriceMinor, line.discountPct),
    0,
  );
}

export async function createPurchaseOrder(
  header: PurchaseOrderHeaderInput,
  lines: (PurchaseOrderLineInput & { unitPriceMinor: number })[],
  createdBy: string,
) {
  await requireUser();
  return db.transaction(async (tx) => {
    const [entity] = await tx
      .select()
      .from(legalEntity)
      .where(eq(legalEntity.id, header.legalEntityId));

    const sequence = await getNextSequenceNumber(
      tx,
      header.legalEntityId,
      DOC_TYPE,
    );
    const orderNo = buildDocumentNumber(
      entity.shortCode,
      "PO",
      new Date(),
      sequence,
    );
    const totalValue = sumLineTotals(lines);

    const [created] = await tx
      .insert(purchaseOrder)
      .values({ ...header, orderNo, totalValue, status: "draft", createdBy })
      .returning();

    await insertPurchaseOrderLines(tx, created.id, lines, createdBy);

    return created;
  });
}

export async function updatePurchaseOrderHeaderAndLines(
  id: string,
  header: PurchaseOrderHeaderInput,
  lines: (PurchaseOrderLineInput & { unitPriceMinor: number })[],
  createdBy: string,
) {
  await requireUser();
  return db.transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(purchaseOrder)
      .where(eq(purchaseOrder.id, id));
    if (!current) {
      throw new Error(`Purchase order ${id} not found`);
    }
    if (!canEditOrder(current.status)) {
      throw new StatusTransitionError(
        `Cannot edit a purchase order in status "${current.status}"`,
      );
    }

    const totalValue = sumLineTotals(lines);

    const [updated] = await tx
      .update(purchaseOrder)
      .set({ ...header, totalValue })
      .where(eq(purchaseOrder.id, id))
      .returning();

    await tx.delete(orderLine).where(eq(orderLine.purchaseOrderId, id));
    await insertPurchaseOrderLines(tx, id, lines, createdBy);

    return updated;
  });
}

export async function updatePurchaseOrderStatus(
  id: string,
  status:
    | "draft"
    | "confirmed"
    | "in_production"
    | "shipped"
    | "completed"
    | "cancelled",
) {
  await requireUser();
  const [current] = await db
    .select()
    .from(purchaseOrder)
    .where(eq(purchaseOrder.id, id));
  if (!current) {
    throw new Error(`Purchase order ${id} not found`);
  }
  if (!isLegalOrderTransition(current.status, status)) {
    throw new StatusTransitionError(
      `Cannot transition purchase order from "${current.status}" to "${status}"`,
    );
  }

  const [updated] = await db
    .update(purchaseOrder)
    .set({ status })
    .where(eq(purchaseOrder.id, id))
    .returning();

  return updated;
}
