import { asc, desc, eq, sql } from "drizzle-orm";

import { db } from "@/db/client";
import { company } from "@/db/schema/company";
import { contact } from "@/db/schema/contact";
import { legalEntity } from "@/db/schema/legal-entity";
import { opportunity } from "@/db/schema/opportunity";
import { product } from "@/db/schema/product";
import {
  quotation,
  quotationLine,
  type quotationStatusEnum,
} from "@/db/schema/quotation";
import { calculateLineTotal } from "@/lib/quotation-math";
import { buildQuoteNumber } from "@/lib/quote-number";
import {
  canEditQuotation,
  isLegalQuotationTransition,
  StatusTransitionError,
} from "@/lib/status-transitions";
import type {
  QuotationHeaderInput,
  QuotationLineInput,
} from "@/lib/validation/quotation";
import { requireUser } from "./auth";
import { logActivity } from "./audit-log";
import { getNextSequenceNumber } from "./document-sequence";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

const DOC_TYPE = "quotation";

export async function getQuotations() {
  await requireUser();
  return db
    .select({
      id: quotation.id,
      quoteNo: quotation.quoteNo,
      version: quotation.version,
      status: quotation.status,
      issueDate: quotation.issueDate,
      currency: quotation.currency,
      customerCompanyId: quotation.customerCompanyId,
      customerCompanyName: company.nameEn,
      opportunityId: quotation.opportunityId,
      opportunityTitle: opportunity.title,
      total: sql<string>`coalesce(sum(${quotationLine.lineTotal}), 0)`.as(
        "total",
      ),
    })
    .from(quotation)
    .innerJoin(company, eq(quotation.customerCompanyId, company.id))
    .innerJoin(opportunity, eq(quotation.opportunityId, opportunity.id))
    .leftJoin(quotationLine, eq(quotationLine.quotationId, quotation.id))
    .groupBy(quotation.id, company.nameEn, opportunity.title)
    .orderBy(desc(quotation.createdAt));
}

export async function getQuotationById(id: string) {
  await requireUser();
  const [quotationRow] = await db
    .select()
    .from(quotation)
    .where(eq(quotation.id, id));
  if (!quotationRow) return null;

  const lines = await db
    .select()
    .from(quotationLine)
    .where(eq(quotationLine.quotationId, id))
    .orderBy(asc(quotationLine.lineNo));

  return { quotation: quotationRow, lines };
}

// Bundles everything the PDF template needs in one place, so
// quotation-document.tsx does no data access of its own.
export async function getQuotationForPdf(id: string) {
  await requireUser();
  const [row] = await db
    .select({ quotation, legalEntity, company, contact })
    .from(quotation)
    .innerJoin(legalEntity, eq(quotation.legalEntityId, legalEntity.id))
    .innerJoin(company, eq(quotation.customerCompanyId, company.id))
    .leftJoin(contact, eq(quotation.contactId, contact.id))
    .where(eq(quotation.id, id));
  if (!row) return null;

  const lines = await db
    .select({ line: quotationLine, product })
    .from(quotationLine)
    .innerJoin(product, eq(quotationLine.productId, product.id))
    .where(eq(quotationLine.quotationId, id))
    .orderBy(asc(quotationLine.lineNo));

  return { ...row, lines };
}

// For the live PDF preview (src/components/pdf-preview-panel.tsx) —
// resolves legalEntity/company/contact/each line's product from ids in an
// *unsaved* draft header+lines, and returns the exact same shape
// getQuotationForPdf does so QuotationDocument needs no changes. Deliberately
// additive rather than a refactor of getQuotationForPdf — that function is
// already shipped and tested against real saved quotations; this one only
// needs to satisfy the preview path, and duplicating a few joins is a much
// smaller risk than changing shared, working code.
export async function getQuotationPdfDataFromDraft(
  header: QuotationHeaderInput,
  lines: (QuotationLineInput & { unitPriceMinor: number })[],
  quoteNo: string,
  version: number,
) {
  await requireUser();
  const [legalEntityRow] = header.legalEntityId
    ? await db
        .select()
        .from(legalEntity)
        .where(eq(legalEntity.id, header.legalEntityId))
    : [];
  const [companyRow] = header.customerCompanyId
    ? await db
        .select()
        .from(company)
        .where(eq(company.id, header.customerCompanyId))
    : [];
  if (!legalEntityRow || !companyRow) return null;

  const contactRow = header.contactId
    ? ((
        await db.select().from(contact).where(eq(contact.id, header.contactId))
      )[0] ?? null)
    : null;

  const lineProducts: {
    line: typeof quotationLine.$inferSelect;
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
        quotationId: "draft",
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
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: null,
      },
      product: productRow,
    });
  }

  const draftQuotationRow: typeof quotation.$inferSelect = {
    id: "draft",
    quoteNo,
    version,
    opportunityId: header.opportunityId,
    legalEntityId: header.legalEntityId,
    customerCompanyId: header.customerCompanyId,
    contactId: header.contactId ?? null,
    issueDate: header.issueDate,
    validUntil: header.validUntil ?? null,
    currency: header.currency,
    incoterm: header.incoterm ?? null,
    namedPlace: header.namedPlace ?? null,
    paymentTerms: header.paymentTerms ?? null,
    leadTimeDays: header.leadTimeDays ?? null,
    language: header.language ?? "en",
    status: "draft",
    notes: header.notes ?? null,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: null,
  };

  return {
    quotation: draftQuotationRow,
    legalEntity: legalEntityRow,
    company: companyRow,
    contact: contactRow,
    lines: lineProducts,
  };
}

async function insertLines(
  tx: Tx,
  quotationId: string,
  lines: (QuotationLineInput & { unitPriceMinor: number })[],
  createdBy: string,
) {
  if (lines.length === 0) return;

  await tx.insert(quotationLine).values(
    lines.map((line, index) => ({
      quotationId,
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

export async function createQuotation(
  header: QuotationHeaderInput,
  lines: (QuotationLineInput & { unitPriceMinor: number })[],
  createdBy: string,
) {
  const actor = await requireUser();
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
    const quoteNo = buildQuoteNumber(
      entity.shortCode,
      header.issueDate,
      sequence,
    );

    const [created] = await tx
      .insert(quotation)
      .values({ ...header, quoteNo, version: 1, status: "draft", createdBy })
      .returning();

    await insertLines(tx, created.id, lines, createdBy);

    await logActivity(tx, {
      userId: actor.id,
      action: "create",
      entityType: "quotation",
      entityId: created.id,
      message: `created quotation ${created.quoteNo}`,
    });

    return created;
  });
}

export async function updateQuotationHeaderAndLines(
  id: string,
  header: QuotationHeaderInput,
  lines: (QuotationLineInput & { unitPriceMinor: number })[],
  createdBy: string,
) {
  const actor = await requireUser();
  return db.transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(quotation)
      .where(eq(quotation.id, id));
    if (!current) {
      throw new Error(`Quotation ${id} not found`);
    }
    if (!canEditQuotation(current.status)) {
      throw new StatusTransitionError(
        `Cannot edit a quotation in status "${current.status}" — create a new version instead`,
      );
    }

    const [updated] = await tx
      .update(quotation)
      .set(header)
      .where(eq(quotation.id, id))
      .returning();

    await tx.delete(quotationLine).where(eq(quotationLine.quotationId, id));
    await insertLines(tx, id, lines, createdBy);

    await logActivity(tx, {
      userId: actor.id,
      action: "update",
      entityType: "quotation",
      entityId: updated.id,
      message: `updated quotation ${updated.quoteNo}`,
    });

    return updated;
  });
}

// Supersede-on-revise, mirroring server/product-documents.ts's is_current
// pattern: the old row is never deleted, just flipped to "superseded", and
// the new row keeps the same quoteNo with version + 1.
export async function createQuotationVersion(
  quotationId: string,
  header: QuotationHeaderInput,
  lines: (QuotationLineInput & { unitPriceMinor: number })[],
  createdBy: string,
) {
  const actor = await requireUser();
  return db.transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(quotation)
      .where(eq(quotation.id, quotationId));
    if (!current) {
      throw new Error(`Quotation ${quotationId} not found`);
    }

    await tx
      .update(quotation)
      .set({ status: "superseded" })
      .where(eq(quotation.id, quotationId));

    const [created] = await tx
      .insert(quotation)
      .values({
        ...header,
        quoteNo: current.quoteNo,
        version: current.version + 1,
        status: "draft",
        createdBy,
      })
      .returning();

    await insertLines(tx, created.id, lines, createdBy);

    await logActivity(tx, {
      userId: actor.id,
      action: "create",
      entityType: "quotation",
      entityId: created.id,
      message: `created quotation ${created.quoteNo} v${created.version} (superseding v${current.version})`,
    });

    return created;
  });
}

export async function updateQuotationStatus(
  id: string,
  status: (typeof quotationStatusEnum.enumValues)[number],
) {
  const actor = await requireUser();
  return db.transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(quotation)
      .where(eq(quotation.id, id));
    if (!current) {
      throw new Error(`Quotation ${id} not found`);
    }
    if (!isLegalQuotationTransition(current.status, status)) {
      throw new StatusTransitionError(
        `Cannot transition quotation from "${current.status}" to "${status}"`,
      );
    }

    const [updated] = await tx
      .update(quotation)
      .set({ status })
      .where(eq(quotation.id, id))
      .returning();

    await logActivity(tx, {
      userId: actor.id,
      action: "status_change",
      entityType: "quotation",
      entityId: updated.id,
      message: `${updated.quoteNo} status ${current.status} → ${status}`,
    });

    return updated;
  });
}
