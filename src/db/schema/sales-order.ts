import { sql } from "drizzle-orm";
import {
  bigint,
  char,
  check,
  date,
  index,
  integer,
  numeric,
  pgEnum,
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
import { product } from "./product";
import { incotermEnum, quotation } from "./quotation";
import { project } from "./project";
import { purchaseOrder } from "./purchase-order";

// crm-spec.md §6.4. Deviation from the spec's literal field list — see
// docs/decisions.md, 2026-08-12: back-to-back chains can have one of our own
// legal entities as the customer on an internal leg, not just an external
// company, so customer_legal_entity_id sits alongside customer_company_id
// (exactly one set, enforced below).
export const salesOrder = pgTable(
  "sales_order",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderNo: text("order_no").notNull(),
    contractNo: text("contract_no"),
    quotationId: uuid("quotation_id")
      .notNull()
      .references(() => quotation.id),
    legalEntityId: uuid("legal_entity_id")
      .notNull()
      .references(() => legalEntity.id),
    customerCompanyId: uuid("customer_company_id").references(() => company.id),
    customerLegalEntityId: uuid("customer_legal_entity_id").references(
      () => legalEntity.id,
    ),
    projectId: uuid("project_id")
      .notNull()
      .references(() => project.id),
    signedDate: date("signed_date", { mode: "date" }),
    currency: char("currency", { length: 3 }).notNull(),
    // crm-spec.md §7 cross-cutting FX rule — snapshot at issue/signed date,
    // never recomputed from live rates.
    fxRateToSgd: numeric("fx_rate_to_sgd", {
      precision: 12,
      scale: 6,
    }).notNull(),
    incoterm: incotermEnum("incoterm"),
    namedPlace: text("named_place"),
    // Stored (unlike quotation, which computes its total via SUM on read) —
    // spec §6.4 lists total_value as an explicit column for sales_order.
    // bigint, not integer: int4's ~$21.47M ceiling (in minor units) is too
    // low for a metro-scale order (docs/decisions.md, remediation slice 1).
    totalValue: bigint("total_value", { mode: "number" }).notNull(),
    governingLaw: text("governing_law"),
    // Free text, not a closed enum — spec's "e.g. SIAC/HKIAC" isn't exhaustive.
    arbitrationRules: text("arbitration_rules"),
    status: orderStatusEnum("status").notNull().default("draft"),
    // References the general document library (spec §6.6, P8 slice 2) —
    // which uploaded document (if any) is the signed/executed contract.
    // Nullable: not every order has one yet, and no UI sets this column yet
    // (P8 slice 2 only adds it; a picker is a separate follow-up).
    executedDocumentId: uuid("executed_document_id").references(
      () => document.id,
    ),
    // Mirrors quotation.language — no PDF export for sales orders yet, but
    // added now alongside purchase_order.language so both order types are
    // consistent (docs/decisions.md).
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
      "sales_order_customer_xor",
      sql`(${table.customerCompanyId} IS NOT NULL) <> (${table.customerLegalEntityId} IS NOT NULL)`,
    ),
    // DB-level backstop for getNextSequenceNumber's own uniqueness
    // guarantee (docs/decisions.md, remediation slice 3).
    uniqueIndex("sales_order_order_no_unique").on(table.orderNo),
    // sales-orders.ts:getSalesOrders (remediation slice 6,
    // docs/decisions.md).
    index("sales_order_quotation_id_idx").on(table.quotationId),
    index("sales_order_customer_company_id_idx").on(table.customerCompanyId),
    index("sales_order_customer_legal_entity_id_idx").on(
      table.customerLegalEntityId,
    ),
    index("sales_order_project_id_idx").on(table.projectId),
  ],
);

// crm-spec.md §6.4 — "shared by both, discriminated by order_type". Uses two
// nullable FK columns + a CHECK constraint rather than the untyped
// related_type/related_id polymorphic pattern spec uses for activity/
// document (§6.6) — see docs/decisions.md, 2026-08-12. purchase_order_id was
// added in P6 slice 2 once purchase_order existed (couldn't reference a
// table that didn't exist yet in slice 1).
export const orderTypeEnum = pgEnum("order_type", ["sales", "purchase"]);

export const orderLine = pgTable(
  "order_line",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderType: orderTypeEnum("order_type").notNull(),
    salesOrderId: uuid("sales_order_id").references(() => salesOrder.id),
    purchaseOrderId: uuid("purchase_order_id").references(
      () => purchaseOrder.id,
    ),
    lineNo: integer("line_no").notNull(),
    productId: uuid("product_id")
      .notNull()
      .references(() => product.id),
    descriptionOverride: text("description_override"),
    quantity: integer("quantity").notNull(),
    uom: text("uom"),
    // bigint, not integer — same reasoning as sales_order.total_value above.
    unitPrice: bigint("unit_price", { mode: "number" }).notNull(),
    discountPct: numeric("discount_pct", { precision: 5, scale: 2 }),
    lineTotal: bigint("line_total", { mode: "number" }).notNull(),
    // The real purchase-order template prints a line's total net weight as a
    // remark (e.g. 52 drums x 250kg = 13,000kg) — stored as the already-
    // computed total, not a per-unit weight the app multiplies out, since
    // product.pack_size isn't reliably parseable into a number. Nullable and
    // left null for sales-order lines (this table is shared by both).
    netWeightKg: numeric("net_weight_kg", { precision: 10, scale: 3 }),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    createdBy: uuid("created_by").references(() => user.id),
  },
  (table) => [
    check(
      "order_line_sales_type_matches",
      sql`(${table.orderType} = 'sales') = (${table.salesOrderId} IS NOT NULL)`,
    ),
    check(
      "order_line_purchase_type_matches",
      sql`(${table.orderType} = 'purchase') = (${table.purchaseOrderId} IS NOT NULL)`,
    ),
    // DB-level backstop for the zod-level checks in
    // src/lib/validation/{quotation,purchase-order}.ts (remediation slice 4,
    // docs/decisions.md) — holds regardless of which code path writes it.
    check(
      "order_line_discount_pct_range",
      sql`${table.discountPct} IS NULL OR (${table.discountPct} >= 0 AND ${table.discountPct} <= 100)`,
    ),
    check(
      "order_line_net_weight_kg_non_negative",
      sql`${table.netWeightKg} IS NULL OR ${table.netWeightKg} >= 0`,
    ),
    // getSalesOrderById/updateSalesOrderHeaderAndLines filter,
    // purchase-orders.ts (3 call sites), getPurchaseOrderForPdf join
    // (remediation slice 6, docs/decisions.md).
    index("order_line_sales_order_id_idx").on(table.salesOrderId),
    index("order_line_purchase_order_id_idx").on(table.purchaseOrderId),
    index("order_line_product_id_idx").on(table.productId),
  ],
);
