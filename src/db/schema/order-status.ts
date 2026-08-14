import { pgEnum } from "drizzle-orm/pg-core";

// Not enumerated in crm-spec.md (unlike opportunity.stage) — an assumed
// generic order lifecycle, not asserted as CENTOR's real process. See
// docs/decisions.md, 2026-08-12. Shared by sales_order and purchase_order
// (spec §6.4: purchase_order is "same shape" as sales_order) — split into
// its own file so sales-order.ts and purchase-order.ts can both import it
// without a circular dependency (purchase_order.linked_sales_order_id
// references sales_order, and order_line.purchase_order_id references
// purchase_order — those two are fine circular since they're only used
// inside deferred `.references(() => ...)` closures, but this enum is
// called eagerly at table-definition time in both files, which a circular
// import can't survive).
export const orderStatusEnum = pgEnum("order_status", [
  "draft",
  "confirmed",
  "in_production",
  "shipped",
  "completed",
  "cancelled",
]);
