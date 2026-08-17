import { sql } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { user } from "./auth";
import { product } from "./product";

export const productDocTypeEnum = pgEnum("product_doc_type", [
  "TDS",
  "SDS",
  "COC",
  "test_report",
  "other",
]);

export const productDocLanguageEnum = pgEnum("product_doc_language", [
  "en",
  "zh",
  "bilingual",
]);

// A product's TDS/SDS/COC/test report files (crm-spec.md §6.3). Old versions are
// never deleted, only superseded — createProductDocument() flips the previous
// current row's is_current to false in the same transaction that inserts the new
// one. The partial unique index below is the DB-level backstop for the spec's
// "only one is_current per (product, doc_type, language)" rule.
export const productDocument = pgTable(
  "product_document",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => product.id),
    docType: productDocTypeEnum("doc_type").notNull(),
    language: productDocLanguageEnum("language").notNull(),
    version: text("version"),
    issuedDate: date("issued_date", { mode: "date" }),
    fileKey: text("file_key").notNull(),
    isCurrent: boolean("is_current").notNull().default(true),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    createdBy: uuid("created_by").references(() => user.id),
  },
  (table) => [
    uniqueIndex("product_document_current_unique")
      .on(table.productId, table.docType, table.language)
      .where(sql`${table.isCurrent} = true`),
    // product-documents.ts:getProductDocuments/createProductDocument
    // (remediation slice 6, docs/decisions.md) — the unique index above is
    // partial (WHERE is_current), so it can't serve a plain product_id scan
    // across historical rows too.
    index("product_document_product_id_idx").on(table.productId),
  ],
);
