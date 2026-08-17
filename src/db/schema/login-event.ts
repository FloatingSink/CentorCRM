import { index, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";

import { user } from "./auth";

// One row per successful sign-in (src/lib/auth.ts's events.signIn hook) —
// a history, not just a single "last login" timestamp on `user`.
export const loginEvent = pgTable(
  "login_event",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id),
    occurredAt: timestamp("occurred_at", { mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("login_event_user_id_idx").on(table.userId)],
);
