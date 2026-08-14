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
});
