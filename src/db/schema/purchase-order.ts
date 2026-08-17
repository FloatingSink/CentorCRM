import { sql } from "drizzle-orm";
import {
  bigint,
  char,
  check,
  date,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { user } from "./auth";
import { company } from "./company";
import { document } from "./document";
import { legalEntity } from "./legal-entity";
import { orderLanguageEnum } from "./order-language";
import { orderStatusEnum } from "./order-status";
import { incotermEnum } from "./quotation";
import { project } from "./project";
import { salesOrder } from "./sales-order";

// crm-spec.md §6.4 — "Same shape [as sales_order], with supplier_company_id
// (or supplier_legal_entity_id...) replacing the customer field, plus
// linked_sales_order_id for back-to-back chains". Same
// supplier_company_id/supplier_legal_entity_id nullable-pair-plus-CHECK
// pattern as sales_order's customer columns — see docs/decisions.md,
// 2026-08-12, which pre-committed to this for P6 slice 2.
export const purchaseOrder = pgTable(
  "purchase_order",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderNo: text("order_no").notNull(),
    contractNo: text("contract_no"),
    legalEntityId: uuid("legal_entity_id")
      .notNull()
      .references(() => legalEntity.id),
    supplierCompanyId: uuid("supplier_company_id").references(() => company.id),
    supplierLegalEntityId: uuid("supplier_legal_entity_id").references(
      () => legalEntity.id,
    ),
    projectId: uuid("project_id")
      .notNull()
      .references(() => project.id),
    // Nullable — a purchase order can exist standalone, not every purchase
    // is tied to a specific sale. When set, this is what makes the margin
    // roll-up on the sales order detail page work (spec §6.4).
    linkedSalesOrderId: uuid("linked_sales_order_id").references(
      () => salesOrder.id,
    ),
    signedDate: date("signed_date", { mode: "date" }),
    // Surfaced by comparing against a real, previously-used CENTOR PO
    // template (交货地点 / 要求交货日期) — distinct from named_place, which
    // is the Incoterm-specific named place, not a plain delivery
    // address/date. See docs/decisions.md.
    deliveryLocation: text("delivery_location"),
    requiredDeliveryDate: date("required_delivery_date", { mode: "date" }),
    currency: char("currency", { length: 3 }).notNull(),
    // crm-spec.md §7 cross-cutting FX rule — snapshot at issue/signed date,
    // never recomputed from live rates.
    fxRateToSgd: numeric("fx_rate_to_sgd", {
      precision: 12,
      scale: 6,
    }).notNull(),
    incoterm: incotermEnum("incoterm"),
    namedPlace: text("named_place"),
    // bigint, not integer: int4's ~$21.47M ceiling (in minor units) is too
    // low for a metro-scale order (docs/decisions.md, remediation slice 1).
    totalValue: bigint("total_value", { mode: "number" }).notNull(),
    governingLaw: text("governing_law"),
    arbitrationRules: text("arbitration_rules"),
    // 交货方式 / 付款方式 / 验收方式's "within ___ working days" blank — real
    // fill-in-the-blank fields on the source template, structured rather
    // than folded into notes. Breach-liability and catch-all clauses from
    // the same template are fixed boilerplate instead (see
    // src/lib/pdf/purchase-order-document.tsx), not stored here.
    deliveryMethod: text("delivery_method"),
    paymentMethod: text("payment_method"),
    inspectionDays: integer("inspection_days"),
    status: orderStatusEnum("status").notNull().default("draft"),
    // References the general document library (spec §6.6, P8 slice 2) —
    // same reasoning as sales_order.executed_document_id.
    executedDocumentId: uuid("executed_document_id").references(
      () => document.id,
    ),
    // Mirrors quotation.language — drives purchase-order PDF export.
    language: orderLanguageEnum("language").notNull().default("en"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    createdBy: uuid("created_by").references(() => user.id),
  },
  (table) => [
    check(
      "purchase_order_supplier_xor",
      sql`(${table.supplierCompanyId} IS NOT NULL) <> (${table.supplierLegalEntityId} IS NOT NULL)`,
    ),
    // DB-level backstop for getNextSequenceNumber's own uniqueness
    // guarantee (docs/decisions.md, remediation slice 3).
    uniqueIndex("purchase_order_order_no_unique").on(table.orderNo),
  ],
);
