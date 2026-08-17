import {
  integer,
  pgEnum,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { user } from "./auth";

// Catalog of buildable widget types (docs/decisions.md, dashboard entry).
// "shipments_placeholder" has no backing data — shipments (P7) is on hold —
// but behaves like a real widget in the layout (removable/resizable/
// reorderable) rather than being hardcoded into the grid.
export const dashboardWidgetTypeEnum = pgEnum("dashboard_widget_type", [
  "opportunities_by_stage",
  "quotes_expiring",
  "shipments_placeholder",
  "my_open_opportunities",
  "purchase_orders_awaiting_confirmation",
  "pipeline_value",
  "recent_activity",
  "my_tasks",
]);

// Column span on the dashboard's 3-column grid — not free-form pixel
// resize, which would need a heavier layout library for no real benefit
// here (docs/decisions.md, dashboard entry).
export const dashboardWidgetSizeEnum = pgEnum("dashboard_widget_size", [
  "small",
  "medium",
  "large",
]);

// One row per widget instance on a user's own dashboard. No is_active/
// archived_at — these rows aren't commercial records (CLAUDE.md's
// never-hard-delete rule is about business data), just UI state; removing
// a widget deletes its row outright.
export const dashboardWidget = pgTable(
  "dashboard_widget",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id),
    widgetType: dashboardWidgetTypeEnum("widget_type").notNull(),
    // Renumbered 0..n-1 within a transaction on every add/remove/reorder —
    // see src/server/dashboard.ts. No uniqueness constraint on it: it's
    // only ever written by that one code path, which already guarantees
    // no duplicates.
    position: integer("position").notNull(),
    size: dashboardWidgetSizeEnum("size").notNull().default("medium"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    createdBy: uuid("created_by").references(() => user.id),
  },
  (table) => [
    // Each widget type can only appear once per user's dashboard.
    uniqueIndex("dashboard_widget_user_type_unique").on(
      table.userId,
      table.widgetType,
    ),
  ],
);
