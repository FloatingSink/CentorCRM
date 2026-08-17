import { desc, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { loginEvent, user } from "@/db/schema";
import { requireAdmin } from "./auth";

// Called from src/lib/auth.ts's events.signIn hook — not reachable from the
// UI directly, so no requireUser() gate here (same reasoning as
// document-sequence.ts's getNextSequenceNumber).
export async function recordLogin(userId: string) {
  await db.insert(loginEvent).values({ userId });
}

// Admin-only (crm-spec.md's role split — user management is an admin-only
// concern). Bounded LIMIT rather than real pagination — same reasoning as
// every other list page in this app (remediation slice 6, docs/decisions.md).
export async function getLoginHistory(limit = 200) {
  await requireAdmin();
  return db
    .select({
      id: loginEvent.id,
      occurredAt: loginEvent.occurredAt,
      userId: loginEvent.userId,
      userName: user.name,
      userEmail: user.email,
    })
    .from(loginEvent)
    .innerJoin(user, eq(loginEvent.userId, user.id))
    .orderBy(desc(loginEvent.occurredAt))
    .limit(limit);
}
