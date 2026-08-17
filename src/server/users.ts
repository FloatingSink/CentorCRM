import { asc, sql } from "drizzle-orm";

import { db } from "@/db/client";
import { user } from "@/db/schema/auth";
import { requireAdmin, requireUser } from "./auth";

// Just the lookup the project-owner <Select> needs — a full Users
// management screen is a later Settings phase (crm-spec.md §8).
export async function getUsers() {
  await requireUser();
  return db
    .select({ id: user.id, name: user.name })
    .from(user)
    .orderBy(asc(user.name));
}

// "Online" is computed at query time from last_active_at (touched by
// requireUser(), src/server/auth.ts) rather than stored as a boolean — no
// separate state machine, just a threshold comparison. 5 minutes: coarser
// than a real-time indicator, matching what was asked for (piggyback on
// existing requests, not a new heartbeat/websocket mechanism).
export async function getUserPresence() {
  await requireAdmin();
  return db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      lastActiveAt: user.lastActiveAt,
      isOnline: sql<boolean>`${user.lastActiveAt} > now() - interval '5 minutes'`,
    })
    .from(user)
    .orderBy(asc(user.name));
}
