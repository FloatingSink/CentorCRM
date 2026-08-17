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
  return user;
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
