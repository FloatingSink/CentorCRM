import { describe, expect, it } from "vitest";

import { calculateLineTotal } from "./quotation-math";

describe("calculateLineTotal", () => {
  it("returns the gross amount when discount is null", () => {
    expect(calculateLineTotal(10, 1000, null)).toBe(10000);
  });

  it("returns the gross amount for a 0% discount", () => {
    expect(calculateLineTotal(10, 1000, "0.00")).toBe(10000);
  });

  it("applies a whole-number percent discount", () => {
    // 10 x $10.00 = $100.00, less 10% = $90.00
    expect(calculateLineTotal(10, 1000, "10.00")).toBe(9000);
  });

  it("applies a fractional percent discount", () => {
    // 4 x $2.50 = $10.00, less 12.5% = $8.75
    expect(calculateLineTotal(4, 250, "12.50")).toBe(875);
  });

  it("rounds half up instead of truncating", () => {
    // 1 x $1.05 = $1.05, less 50% = $0.525 -> rounds to $0.53, not $0.52
    expect(calculateLineTotal(1, 105, "50.00")).toBe(53);
  });

  // Malformed discountPct should never reach this function through the save
  // path (src/lib/validation/quotation.ts rejects it first), but
  // order-line-editor.tsx's live preview calls this directly from component
  // state on every keystroke, entirely outside zod — these three cases
  // (remediation slice 4, docs/decisions.md) must degrade to "no discount"
  // rather than throw or silently compute a wrong number.
  describe("malformed discountPct (must not throw)", () => {
    it("treats a non-numeric string as no discount", () => {
      expect(() => calculateLineTotal(10, 1000, "abc")).not.toThrow();
      expect(calculateLineTotal(10, 1000, "abc")).toBe(10000);
    });

    it("treats a multi-dot string as no discount, not a silently truncated one", () => {
      // A naive split(".") would read this as "1.2" (12%) and silently
      // discard the trailing ".3" — must be rejected outright instead.
      expect(() => calculateLineTotal(10, 1000, "1.2.3")).not.toThrow();
      expect(calculateLineTotal(10, 1000, "1.2.3")).toBe(10000);
    });

    it("treats a negative string as no discount, not a markup", () => {
      expect(() => calculateLineTotal(10, 1000, "-5")).not.toThrow();
      expect(calculateLineTotal(10, 1000, "-5")).toBe(10000);
    });
  });
});
