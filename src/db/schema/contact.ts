import {
  boolean,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { user } from "./auth";
import { company } from "./company";

export const preferredLanguageEnum = pgEnum("preferred_language", ["en", "zh"]);

// Always belongs to a company (crm-spec.md §6.1) — never exists standalone.
// isActive/audit columns aren't in the spec's per-entity field list but
// follow §7's cross-cutting rules (audit on every table, soft delete only),
// same precedent as legal_entity and company.
export const contact = pgTable("contact", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id")
    .notNull()
    .references(() => company.id),
  nameEn: text("name_en").notNull(),
  nameZh: text("name_zh"),
  jobTitle: text("job_title"),
  email: text("email"),
  phone: text("phone"),
  wechatId: text("wechat_id"),
  preferredLanguage: preferredLanguageEnum("preferred_language")
    .notNull()
    .default("en"),
  isPrimary: boolean("is_primary").notNull().default(false),
  notes: text("notes"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  createdBy: uuid("created_by").references(() => user.id),
});
