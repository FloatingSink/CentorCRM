import {
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { user } from "./auth";

// crm-spec.md §6.6 — "note, call, meeting, email log".
export const activityTypeEnum = pgEnum("activity_type", [
  "note",
  "call",
  "meeting",
  "email",
]);

// crm-spec.md §6.6 — activity's polymorphic link targets: "company /
// contact / project / opportunity / order". "order" splits into the two
// real tables we have.
export const activityRelatedTypeEnum = pgEnum("activity_related_type", [
  "company",
  "contact",
  "project",
  "opportunity",
  "sales_order",
  "purchase_order",
]);

// Untyped related_type/related_id (no FK on related_id) — spec's own
// polymorphic pattern for activity/document (§6.6), deliberately not the
// dual-FK-plus-CHECK pattern used for sales_order/purchase_order's
// customer/supplier columns and order_line's parent columns — that pattern
// only fits an exactly-two-option case; activity's parent set is six
// options wide. See docs/decisions.md, 2026-08-12.
export const activity = pgTable(
  "activity",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    type: activityTypeEnum("type").notNull(),
    subject: text("subject").notNull(),
    body: text("body"),
    occurredAt: timestamp("occurred_at", { mode: "date" }).notNull(),
    // Who performed the activity (spec's own field) — distinct from
    // created_by below, which is pure audit (who created the row).
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id),
    relatedType: activityRelatedTypeEnum("related_type").notNull(),
    relatedId: uuid("related_id").notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    createdBy: uuid("created_by").references(() => user.id),
  },
  (table) => [
    // activities.ts:getActivitiesForRelated, dashboard.ts:getRecentActivity
    // (remediation slice 6, docs/decisions.md).
    index("activity_user_id_idx").on(table.userId),
  ],
);
