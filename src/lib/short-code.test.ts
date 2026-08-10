import { describe, expect, it } from "vitest";

import { isValidShortCode } from "./short-code";

describe("isValidShortCode", () => {
  it("accepts known entity short codes", () => {
    expect(isValidShortCode("CGPL")).toBe(true);
    expect(isValidShortCode("ITP")).toBe(true);
    expect(isValidShortCode("TTE")).toBe(true);
    expect(isValidShortCode("CTG")).toBe(true);
  });

  it("rejects lowercase letters", () => {
    expect(isValidShortCode("cgpl")).toBe(false);
  });

  it("rejects digits", () => {
    expect(isValidShortCode("CG1L")).toBe(false);
  });

  it("rejects empty strings", () => {
    expect(isValidShortCode("")).toBe(false);
  });

  it("rejects codes longer than 5 letters", () => {
    expect(isValidShortCode("ABCDEF")).toBe(false);
  });

  it("rejects a single letter", () => {
    expect(isValidShortCode("A")).toBe(false);
  });
});
