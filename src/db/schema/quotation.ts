import { sql } from "drizzle-orm";
import {
  bigint,
  char,
  check,
  date,
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
import { contact } from "./contact";
import { legalEntity } from "./legal-entity";
import { opportunity } from "./opportunity";
import { product } from "./product";

// crm-spec.md §1/§4 — both list exactly these 5 incoterms.
export const incotermEnum = pgEnum("incoterm", [
  "EXW",
  "FOB",
  "CFR",
  "CIF",
  "DAP",
]);

// Separate from product_doc_language on purpose — same values, different
// table/domain, no cross-table enum reuse elsewhere in this schema.
export const quotationLanguageEnum = pgEnum("quotation_language", [
  "en",
  "zh",
  "bilingual",
]);

export const quotationStatusEnum = pgEnum("quotation_status", [
  "draft",
  "sent",
  "accepted",
  "rejected",
  "superseded",
]);

// crm-spec.md §6.4. No is_active — status already carries the lifecycle
// (draft/sent/accepted/rejected/superseded); nothing is ever hard-deleted,
// only superseded, same spirit as product_document's is_current pattern.
export const quotation = pgTable(
  "quotation",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    quoteNo: text("quote_no").notNull(),
    version: integer("version").notNull().default(1),
    opportunityId: uuid("opportunity_id")
      .notNull()
      .references(() => opportunity.id),
    legalEntityId: uuid("legal_entity_id")
      .notNull()
      .references(() => legalEntity.id),
    customerCompanyId: uuid("customer_company_id")
      .notNull()
      .references(() => company.id),
    // Nullable — the customer's contact may not be on file yet.
    contactId: uuid("contact_id").references(() => contact.id),
    issueDate: date("issue_date", { mode: "date" }).notNull(),
    validUntil: date("valid_until", { mode: "date" }),
    currency: char("currency", { length: 3 }).notNull(),
    incoterm: incotermEnum("incoterm"),
    // Required only for non-EXW incoterms (crm-spec.md §6.4) — enforced at the
    // application layer, not NOT NULL, since EXW rows legitimately leave it null.
    namedPlace: text("named_place"),
    paymentTerms: text("payment_terms"),
    leadTimeDays: integer("lead_time_days"),
    language: quotationLanguageEnum("language").notNull().default("en"),
    status: quotationStatusEnum("status").notNull().default("draft"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    createdBy: uuid("created_by").references(() => user.id),
  },
  (table) => [
    // DB-level backstop for getNextSequenceNumber's own uniqueness
    // guarantee (docs/decisions.md, remediation slice 3).
    uniqueIndex("quotation_legal_entity_quote_no_version_unique").on(
      table.legalEntityId,
      table.quoteNo,
      table.version,
    ),
  ],
);

export const quotationLine = pgTable(
  "quotation_line",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    quotationId: uuid("quotation_id")
      .notNull()
      .references(() => quotation.id),
    lineNo: integer("line_no").notNull(),
    productId: uuid("product_id")
      .notNull()
      .references(() => product.id),
    descriptionOverride: text("description_override"),
    quantity: integer("quantity").notNull(),
    uom: text("uom"),
    // Minor units; currency comes from the parent quotation.currency — one
    // currency per quotation, not per line, so no separate currency column here.
    // bigint, not integer: int4's ~$21.47M ceiling (in minor units) is too low
    // for a metro-scale line (docs/decisions.md, remediation slice 1).
    unitPrice: bigint("unit_price", { mode: "number" }).notNull(),
    // A rate, not money — NUMERIC is the right type, not integer minor units.
    discountPct: numeric("discount_pct", { precision: 5, scale: 2 }),
    lineTotal: bigint("line_total", { mode: "number" }).notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    createdBy: uuid("created_by").references(() => user.id),
  },
  (table) => [
    // DB-level backstop for the zod-level 0-100 check in
    // src/lib/validation/quotation.ts (remediation slice 4,
    // docs/decisions.md) — holds regardless of which code path writes it.
    check(
      "quotation_line_discount_pct_range",
      sql`${table.discountPct} IS NULL OR (${table.discountPct} >= 0 AND ${table.discountPct} <= 100)`,
    ),
  ],
);
