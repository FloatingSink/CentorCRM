import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { user } from "./auth";
import { project } from "./project";

export const machineTypeEnum = pgEnum("machine_type", [
  "EPB",
  "slurry",
  "TBM_hard_rock",
  "other",
]);

// TBMs on a project (crm-spec.md §6.2) — always belongs to a project.
export const machine = pgTable(
  "machine",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => project.id),
    designation: text("designation").notNull(),
    manufacturer: text("manufacturer"),
    diameterMm: integer("diameter_mm"),
    machineType: machineTypeEnum("machine_type").notNull(),
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
    // machines.ts:getMachineById/getMachinesByProject,
    // projects.ts:getProjectById (remediation slice 6, docs/decisions.md).
    index("machine_project_id_idx").on(table.projectId),
  ],
);
