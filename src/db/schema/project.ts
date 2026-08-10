import {
  boolean,
  date,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { user } from "./auth";
import { company } from "./company";

export const projectStatusEnum = pgEnum("project_status", [
  "prospect",
  "active",
  "on_hold",
  "completed",
]);

// The anchor object for everything commercial (crm-spec.md §6.2).
export const project = pgTable("project", {
  id: uuid("id").primaryKey().defaultRandom(),
  nameEn: text("name_en").notNull(),
  nameZh: text("name_zh"),
  clientCompanyId: uuid("client_company_id")
    .notNull()
    .references(() => company.id),
  country: text("country").notNull(),
  city: text("city"),
  status: projectStatusEnum("status").notNull().default("prospect"),
  startDate: date("start_date", { mode: "date" }),
  expectedEndDate: date("expected_end_date", { mode: "date" }),
  ownerUserId: uuid("owner_user_id").references(() => user.id),
  notes: text("notes"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  createdBy: uuid("created_by").references(() => user.id),
});
