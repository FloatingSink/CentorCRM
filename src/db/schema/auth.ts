import type { AdapterAccountType } from "next-auth/adapters";

import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";

// Two roles, not three (remediation slice 2, docs/decisions.md): member gets
// full commercial access, admin additionally gets user management and
// legal-entity configuration. No viewer row ever existed (src/db/seed.ts is
// the only insert path, hardcoded to admin).
export const userRole = pgEnum("user_role", ["admin", "member"]);

// Required columns (id, name, email, emailVerified, image) come from the
// @auth/drizzle-adapter Postgres schema contract. role/is_active/created_at/
// updated_at/created_by are the spec's `user` entity (crm-spec.md §6.6),
// added to the same table rather than kept as a separate one.
export const user = pgTable("user", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"),
  role: userRole("role").notNull().default("member"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  // Nullable: the bootstrap admin seeded in P0 has no creator.
  createdBy: uuid("created_by").references((): AnyPgColumn => user.id),
});

export const account = pgTable(
  "account",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    // Property names below must match @auth/drizzle-adapter's
    // DefaultPostgresAccountsTable exactly (it types against these literal
    // keys) — kept snake_case as the adapter itself uses, unlike the
    // camelCase columns elsewhere in this table.
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (table) => [
    primaryKey({ columns: [table.provider, table.providerAccountId] }),
  ],
);

export const session = pgTable("session", {
  sessionToken: text("session_token").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationToken = pgTable(
  "verification_token",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (table) => [primaryKey({ columns: [table.identifier, table.token] })],
);
