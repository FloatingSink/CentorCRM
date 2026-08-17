// Pure permission logic — no auth()/DB/Next.js request context here, so this
// is unit-testable with plain objects. src/server/auth.ts wraps this with
// the actual session lookup (remediation slice 2, docs/decisions.md).

export class AuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthorizationError";
  }
}

export type SessionUser = {
  id: string;
  role: "admin" | "member";
  isActive: boolean;
};

export function assertAuthenticated(
  user: SessionUser | null | undefined,
): asserts user is SessionUser {
  if (!user) {
    throw new AuthorizationError("Not signed in");
  }
}

export function assertAdmin(user: SessionUser): void {
  if (user.role !== "admin") {
    throw new AuthorizationError("Admin role required");
  }
}
