import { pgEnum } from "drizzle-orm/pg-core";

// Mirrors quotation.quotationLanguageEnum's values exactly, but kept as a
// separate enum rather than reused — that enum's own comment states "no
// cross-table enum reuse elsewhere in this schema." Shared between
// sales_order and purchase_order specifically (like order-status.ts),
// since those two are already treated as one domain.
export const orderLanguageEnum = pgEnum("order_language", [
  "en",
  "zh",
  "bilingual",
]);
