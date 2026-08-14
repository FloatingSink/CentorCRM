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

export const productCategoryEnum = pgEnum("product_category", [
  "tail_seal_grease",
  "soil_conditioner",
  "ep_grease",
  "polymer",
  "anti_wear",
  "other",
]);

// The CENTOR product catalogue (crm-spec.md §6.3). category/uom are nullable —
// unconfirmed per product until Jia Long supplies the full code list (CLAUDE.md
// "do not invent domain data").
export const product = pgTable("product", {
  id: uuid("id").primaryKey().defaultRandom(),
  centorCode: text("centor_code").notNull(),
  nameEn: text("name_en").notNull(),
  nameZh: text("name_zh"),
  category: productCategoryEnum("category"),
  uom: text("uom"),
  packSize: text("pack_size"),
  packDescription: text("pack_description"),
  manufacturerCompanyId: uuid("manufacturer_company_id").references(
    () => company.id,
  ),
  manufacturerPartNo: text("manufacturer_part_no"),
  hsCode: text("hs_code"),
  notes: text("notes"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  createdBy: uuid("created_by").references(() => user.id),
});
