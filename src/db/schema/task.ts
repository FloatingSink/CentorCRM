import { sql } from "drizzle-orm";
import {
  check,
  date,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { user } from "./auth";

// Binary complete/not-complete, not a multi-stage workflow — this is the
// lightweight "ping" (confirmed with Jia Long), not a ticketing system.
export const taskStatusEnum = pgEnum("task_status", ["open", "done"]);

// Same 6 values as activity_related_type, for consistency — unlike
// activity/document (always required), this pair is nullable: freestanding
// tasks are a real, supported case here. Slice 1 always writes both null;
// Slice 2 populates them for record-tied tasks — schema is ready for that
// from day one so it doesn't need its own migration later.
export const taskRelatedTypeEnum = pgEnum("task_related_type", [
  "company",
  "contact",
  "project",
  "opportunity",
  "sales_order",
  "purchase_order",
]);

export const task = pgTable(
  "task",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    description: text("description"),
    // The "ping" target.
    assigneeUserId: uuid("assignee_user_id")
      .notNull()
      .references(() => user.id),
    status: taskStatusEnum("status").notNull().default("open"),
    dueDate: date("due_date", { mode: "date" }),
    relatedType: taskRelatedTypeEnum("related_type"),
    relatedId: uuid("related_id"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    createdBy: uuid("created_by").references(() => user.id),
  },
  (table) => [
    // tasks.ts:getMyTasks/getMyOpenTaskCount.
    index("task_assignee_user_id_idx").on(table.assigneeUserId),
    check(
      "task_related_pair",
      sql`(${table.relatedType} IS NULL) = (${table.relatedId} IS NULL)`,
    ),
  ],
);
