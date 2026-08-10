import {
  boolean,
  char,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { user } from "./auth";

// Our own contracting entities (crm-spec.md §6.1) — never a `company` row.
export const legalEntity = pgTable("legal_entity", {
  id: uuid("id").primaryKey().defaultRandom(),
  nameEn: text("name_en").notNull(),
  nameZh: text("name_zh"),
  shortCode: text("short_code").notNull().unique(),
  jurisdiction: text("jurisdiction").notNull(),
  // Nullable: several entities' registration numbers are still <TBD> per
  // crm-spec.md §11 — do not fill in a guessed value here or in the seed.
  registrationNo: text("registration_no"),
  registeredAddress: text("registered_address"),
  defaultCurrency: char("default_currency", { length: 3 }).notNull(),
  // Not wired to file storage yet — that lands with document handling (P3+).
  letterheadAsset: text("letterhead_asset"),
  bankDetails: jsonb("bank_details"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  createdBy: uuid("created_by").references(() => user.id),
});
