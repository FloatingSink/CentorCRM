import { describe, expect, it } from "vitest";

import { quotationLineInputSchema } from "./quotation";

// Baseline valid line, only discountPct varies per test.
const base = {
  productId: "550e8400-e29b-41d4-a716-446655440000",
  descriptionOverride: null,
  quantity: 1,
  uom: null,
  unitPrice: "100.00",
};

function parseWithDiscount(discountPct: string | null) {
  return quotationLineInputSchema.safeParse({ ...base, discountPct });
}

describe("quotationLineInputSchema discountPct", () => {
  it("accepts null (no discount)", () => {
    expect(parseWithDiscount(null).success).toBe(true);
  });

  it("accepts whole and fractional percentages within 0-100", () => {
    expect(parseWithDiscount("0").success).toBe(true);
    expect(parseWithDiscount("100").success).toBe(true);
    expect(parseWithDiscount("12.5").success).toBe(true);
    expect(parseWithDiscount("99.99").success).toBe(true);
  });

  // The three concrete failure cases from the remediation brief
  // (docs/decisions.md, remediation slice 4) — each must be a clean
  // validation error, not a throw or a silently-wrong accepted value.
  it("rejects a non-numeric string", () => {
    const result = parseWithDiscount("abc");
    expect(result.success).toBe(false);
  });

  it("rejects a multi-dot string instead of silently truncating it", () => {
    const result = parseWithDiscount("1.2.3");
    expect(result.success).toBe(false);
  });

  it("rejects a negative string instead of treating it as a markup", () => {
    const result = parseWithDiscount("-5");
    expect(result.success).toBe(false);
  });

  it("rejects a value over 100", () => {
    expect(parseWithDiscount("150").success).toBe(false);
    expect(parseWithDiscount("100.01").success).toBe(false);
  });

  it("rejects more than 2 decimal places", () => {
    expect(parseWithDiscount("12.345").success).toBe(false);
  });
});
