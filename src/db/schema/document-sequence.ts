import { integer, pgTable, primaryKey, text, uuid } from "drizzle-orm/pg-core";

import { legalEntity } from "./legal-entity";

// Backs auto-generated document numbers (crm-spec.md §7 — "quote/order
// references are generated per legal entity"). Generic across doc types on
// purpose: quotations use it now, sales/purchase orders (P6) reuse it
// unchanged. No id/audit columns — this is a pure counter, not a record.
export const documentSequence = pgTable(
  "document_sequence",
  {
    legalEntityId: uuid("legal_entity_id")
      .notNull()
      .references(() => legalEntity.id),
    docType: text("doc_type").notNull(),
    nextNumber: integer("next_number").notNull().default(1),
  },
  (table) => [primaryKey({ columns: [table.legalEntityId, table.docType] })],
);
