import { describe, expect, it } from "vitest";

import {
  AuthorizationError,
  assertAdmin,
  assertAuthenticated,
  type SessionUser,
} from "./authorization";

const admin: SessionUser = { id: "1", role: "admin", isActive: true };
const member: SessionUser = { id: "2", role: "member", isActive: true };

describe("assertAuthenticated", () => {
  it("does not throw for a real user", () => {
    expect(() => assertAuthenticated(member)).not.toThrow();
  });

  it("throws AuthorizationError for null or undefined", () => {
    expect(() => assertAuthenticated(null)).toThrow(AuthorizationError);
    expect(() => assertAuthenticated(undefined)).toThrow(AuthorizationError);
  });
});

describe("assertAdmin", () => {
  it("does not throw for an admin", () => {
    expect(() => assertAdmin(admin)).not.toThrow();
  });

  it("throws AuthorizationError for a member", () => {
    expect(() => assertAdmin(member)).toThrow(AuthorizationError);
  });
});
