import { sql } from "drizzle-orm";

import { db } from "@/db/client";
import { auth } from "@/lib/auth";
import {
  AuthorizationError,
  assertAdmin,
  assertAuthenticated,
  type SessionUser,
} from "@/lib/authorization";

// The real auth boundary for the data-access layer (remediation slice 2,
// docs/decisions.md) — every exported src/server/* function calls this,
// rather than relying solely on the (app) layout's auth() redirect (which
// doesn't cover route handlers or server actions) or on each action file
// remembering its own check.
export async function requireUser(): Promise<SessionUser> {
  const session = await auth();
  const user = session?.user ?? null;
  assertAuthenticated(user);
  touchLastActive(user.id);
  return user;
}

// Best-effort presence tracking, piggybacked on the one choke point nearly
// every authenticated request already passes through — no new polling or
// websocket infrastructure. Not awaited and errors are swallowed
// deliberately: this is presence data, not part of the request's
// correctness, and must never slow down or break a page load. Throttled to
// once per ~60s per user — a single page view can call requireUser()
// (and therefore this) 1-3 times, and this should cost at most one cheap
// conditional UPDATE, not several unconditional ones.
function touchLastActive(userId: string): void {
  db.execute(
    sql`
      update "user" set last_active_at = now()
      where id = ${userId}
        and (last_active_at is null or last_active_at < now() - interval '60 seconds')
    `,
  ).catch(() => {});
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  assertAdmin(user);
  return user;
}

// For server actions that need a clean { error } return instead of a thrown
// exception (e.g. to surface inline in a form) — generalizes the private
// requireUserId pattern dashboard-actions.ts already used.
export async function requireUserOrError(): Promise<
  SessionUser | { error: string }
> {
  try {
    return await requireUser();
  } catch (err) {
    if (err instanceof AuthorizationError) return { error: err.message };
    throw err;
  }
}
