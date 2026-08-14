import {
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { user } from "./auth";

// Same six related types as activity.activityRelatedTypeEnum, but a
// separate enum rather than shared — matches the established precedent
// (quotation.quotationLanguageEnum's own comment: "no cross-table enum
// reuse elsewhere in this schema"). order-status.ts/order-language.ts's
// sharing between sales_order/purchase_order was the deliberate exception,
// justified by those two being treated as one domain everywhere else
// (order_line, orderTypeEnum) — activity and document don't have that
// relationship, they're separate features that happen to attach to the
// same six entity types.
export const documentRelatedTypeEnum = pgEnum("document_related_type", [
  "company",
  "contact",
  "project",
  "opportunity",
  "sales_order",
  "purchase_order",
]);

// crm-spec.md §6.6 — "general file store". doc_type is free text
// (confirmed with Jia Long, 2026-08-12) — unlike product_document.doc_type,
// spec never encloses this one in a closed list, and TDS/SDS/COC/etc. don't
// apply to contracts/certificates/misc files the way they do to products.
export const document = pgTable("document", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  docType: text("doc_type"),
  fileKey: text("file_key").notNull(),
  mimeType: text("mime_type").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  uploadedBy: uuid("uploaded_by")
    .notNull()
    .references(() => user.id),
  relatedType: documentRelatedTypeEnum("related_type").notNull(),
  relatedId: uuid("related_id").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  createdBy: uuid("created_by").references(() => user.id),
});
