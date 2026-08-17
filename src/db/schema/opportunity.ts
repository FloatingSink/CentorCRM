import {
  bigint,
  boolean,
  char,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { user } from "./auth";
import { company } from "./company";
import { legalEntity } from "./legal-entity";
import { project } from "./project";

export const opportunityStageEnum = pgEnum("opportunity_stage", [
  "enquiry",
  "technical_review",
  "quoted",
  "negotiation",
  "won",
  "lost",
]);

// The commercial pipeline, anchored to a project (crm-spec.md §6.4). No
// numbering format is specified for `reference` (unlike quote/order numbers in
// §7, still <TBD>), so it's plain user-entered text, not auto-generated.
export const opportunity = pgTable(
  "opportunity",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reference: text("reference").notNull(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => project.id),
    customerCompanyId: uuid("customer_company_id")
      .notNull()
      .references(() => company.id),
    legalEntityId: uuid("legal_entity_id")
      .notNull()
      .references(() => legalEntity.id),
    title: text("title").notNull(),
    stage: opportunityStageEnum("stage").notNull().default("enquiry"),
    // Minor units + ISO 4217 code, both nullable together — not always known at
    // enquiry stage (CLAUDE.md: money is integer minor units + currency, never a float).
    // bigint, not integer: int4's ~$21.47M ceiling (in minor units) is too low
    // for a metro-scale opportunity (docs/decisions.md, remediation slice 1).
    estimatedValue: bigint("estimated_value", { mode: "number" }),
    currency: char("currency", { length: 3 }),
    probability: integer("probability"),
    expectedCloseDate: date("expected_close_date", { mode: "date" }),
    ownerUserId: uuid("owner_user_id").references(() => user.id),
    lostReason: text("lost_reason"),
    notes: text("notes"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    createdBy: uuid("created_by").references(() => user.id),
  },
  (table) => [
    // opportunities.ts:getOpportunities (remediation slice 6,
    // docs/decisions.md).
    index("opportunity_project_id_idx").on(table.projectId),
    index("opportunity_customer_company_id_idx").on(table.customerCompanyId),
    // dashboard.ts:getMyOpenOpportunities.
    index("opportunity_owner_user_id_idx").on(table.ownerUserId),
  ],
);
