import { alias } from "drizzle-orm/pg-core";
import { asc, desc, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { company } from "@/db/schema/company";
import { legalEntity } from "@/db/schema/legal-entity";
import { orderLine, salesOrder } from "@/db/schema/sales-order";
import { project } from "@/db/schema/project";
import { quotation } from "@/db/schema/quotation";
import { calculateLineTotal } from "@/lib/quotation-math";
import { buildDocumentNumber } from "@/lib/document-number";
import type {
  OrderLineInput,
  SalesOrderHeaderInput,
} from "@/lib/validation/sales-order";
import { getNextSequenceNumber } from "./document-sequence";

const DOC_TYPE = "sales_order";

const customerLegalEntity = alias(legalEntity, "customer_legal_entity");

export function getSalesOrders() {
  return db
    .select({
      id: salesOrder.id,
      orderNo: salesOrder.orderNo,
      status: salesOrder.status,
      signedDate: salesOrder.signedDate,
      currency: salesOrder.currency,
      totalValue: salesOrder.totalValue,
      customerCompanyId: salesOrder.customerCompanyId,
      customerCompanyName: company.nameEn,
      customerLegalEntityId: salesOrder.customerLegalEntityId,
      customerLegalEntityName: customerLegalEntity.nameEn,
      projectId: salesOrder.projectId,
      projectName: project.nameEn,
      quotationId: salesOrder.quotationId,
      quoteNo: quotation.quoteNo,
    })
    .from(salesOrder)
    .leftJoin(company, eq(salesOrder.customerCompanyId, company.id))
    .leftJoin(
      customerLegalEntity,
      eq(salesOrder.customerLegalEntityId, customerLegalEntity.id),
    )
    .innerJoin(project, eq(salesOrder.projectId, project.id))
    .innerJoin(quotation, eq(salesOrder.quotationId, quotation.id))
    .orderBy(desc(salesOrder.createdAt));
}

export async function getSalesOrderById(id: string) {
  const [orderRow] = await db
    .select()
    .from(salesOrder)
    .where(eq(salesOrder.id, id));
  if (!orderRow) return null;

  const lines = await db
    .select()
    .from(orderLine)
    .where(eq(orderLine.salesOrderId, id))
    .orderBy(asc(orderLine.lineNo));

  return { order: orderRow, lines };
}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function insertSalesOrderLines(
  tx: Tx,
  salesOrderId: string,
  lines: (OrderLineInput & { unitPriceMinor: number })[],
  createdBy: string,
) {
  if (lines.length === 0) return;

  await tx.insert(orderLine).values(
    lines.map((line, index) => ({
      orderType: "sales" as const,
      salesOrderId,
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
      createdBy,
    })),
  );
}

function sumLineTotals(
  lines: (OrderLineInput & { unitPriceMinor: number })[],
): number {
  return lines.reduce(
    (sum, line) =>
      sum +
      calculateLineTotal(line.quantity, line.unitPriceMinor, line.discountPct),
    0,
  );
}

export async function createSalesOrder(
  header: SalesOrderHeaderInput,
  lines: (OrderLineInput & { unitPriceMinor: number })[],
  createdBy: string,
) {
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
      "SO",
      new Date(),
      sequence,
    );
    const totalValue = sumLineTotals(lines);

    const [created] = await tx
      .insert(salesOrder)
      .values({ ...header, orderNo, totalValue, status: "draft", createdBy })
      .returning();

    await insertSalesOrderLines(tx, created.id, lines, createdBy);

    return created;
  });
}

export async function updateSalesOrderHeaderAndLines(
  id: string,
  header: SalesOrderHeaderInput,
  lines: (OrderLineInput & { unitPriceMinor: number })[],
  createdBy: string,
) {
  return db.transaction(async (tx) => {
    const totalValue = sumLineTotals(lines);

    const [updated] = await tx
      .update(salesOrder)
      .set({ ...header, totalValue })
      .where(eq(salesOrder.id, id))
      .returning();

    await tx.delete(orderLine).where(eq(orderLine.salesOrderId, id));
    await insertSalesOrderLines(tx, id, lines, createdBy);

    return updated;
  });
}

export async function updateSalesOrderStatus(
  id: string,
  status:
    | "draft"
    | "confirmed"
    | "in_production"
    | "shipped"
    | "completed"
    | "cancelled",
) {
  const [updated] = await db
    .update(salesOrder)
    .set({ status })
    .where(eq(salesOrder.id, id))
    .returning();

  return updated;
}
