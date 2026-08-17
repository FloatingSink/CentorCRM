import {
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { user } from "./auth";

export const auditAction = pgEnum("audit_action", [
  "create",
  "update",
  "status_change",
]);

export const auditEntityType = pgEnum("audit_entity_type", [
  "company",
  "contact",
  "project",
  "machine",
  "opportunity",
  "quotation",
  "sales_order",
  "purchase_order",
  "product",
  "product_document",
  "document",
  "task",
]);

// Event feed, not a field-level diff — "Jia Long updated quotation Q-0004",
// not before/after values. Deliberately excludes dashboard_widget mutations
// (personal UI layout, not a shared CRM record) and activity-table creation
// (would be a log entry about a log entry) — see docs/decisions.md.
export const auditLog = pgTable(
  "audit_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id),
    action: auditAction("action").notNull(),
    entityType: auditEntityType("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(),
    message: text("message").notNull(),
    occurredAt: timestamp("occurred_at", { mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("audit_log_user_id_idx").on(table.userId)],
);
