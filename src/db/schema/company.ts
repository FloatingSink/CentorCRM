import {
  boolean,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { COMPANY_ROLES } from "@/lib/company-roles";

import { user } from "./auth";

export const companyRoleEnum = pgEnum("company_role_type", COMPANY_ROLES);

// External organisations (crm-spec.md §6.1) — never a `legal_entity` row.
export const company = pgTable("company", {
  id: uuid("id").primaryKey().defaultRandom(),
  nameEn: text("name_en").notNull(),
  nameZh: text("name_zh"),
  country: text("country").notNull(),
  registrationNo: text("registration_no"),
  address: text("address"),
  website: text("website"),
  notes: text("notes"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  createdBy: uuid("created_by").references(() => user.id),
});

// Many-to-many tag: a company can be more than one of these at once
// (crm-spec.md §6.1). Pure join table, no own id — current-state flags,
// not history, so a save fully replaces a company's role rows.
export const companyRole = pgTable(
  "company_role",
  {
    companyId: uuid("company_id")
      .notNull()
      .references(() => company.id),
    role: companyRoleEnum("role").notNull(),
  },
  (table) => [primaryKey({ columns: [table.companyId, table.role] })],
);
