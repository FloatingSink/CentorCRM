import { describe, expect, it } from "vitest";

import {
  convertMinorToSgd,
  formatMoney,
  parseMoneyToMinorUnits,
} from "./money";

describe("parseMoneyToMinorUnits", () => {
  it("converts a major-unit amount to minor units for a 2-decimal currency", () => {
    expect(parseMoneyToMinorUnits("72000.00", "USD")).toBe(7200000);
    expect(parseMoneyToMinorUnits("72000", "SGD")).toBe(7200000);
    expect(parseMoneyToMinorUnits("1.5", "USD")).toBe(150);
  });

  it("rounds fractional minor units instead of truncating", () => {
    expect(parseMoneyToMinorUnits("1.005", "USD")).toBe(101);
  });

  it("returns null for non-numeric input", () => {
    expect(parseMoneyToMinorUnits("not a number", "USD")).toBeNull();
    expect(parseMoneyToMinorUnits("", "USD")).toBeNull();
  });

  it("returns null for non-finite input", () => {
    expect(parseMoneyToMinorUnits("Infinity", "USD")).toBeNull();
  });
});

describe("formatMoney", () => {
  it("formats minor units back into a currency string", () => {
    expect(formatMoney(7200000, "USD")).toBe("$72,000.00");
  });

  it("round-trips through parseMoneyToMinorUnits", () => {
    const minor = parseMoneyToMinorUnits("42.50", "SGD");
    expect(minor).toBe(4250);
    expect(formatMoney(minor as number, "SGD")).toContain("42.50");
  });
});

describe("convertMinorToSgd", () => {
  it("is the identity when the rate is 1", () => {
    expect(convertMinorToSgd(500000, "1.000000")).toBe(500000);
  });

  it("converts exactly when the product has no remainder", () => {
    expect(convertMinorToSgd(10000, "1.350000")).toBe(13500);
  });

  it("rounds to the nearest minor unit instead of truncating", () => {
    // 100 * 0.333333 = 33.3333 -> 33
    expect(convertMinorToSgd(100, "0.333333")).toBe(33);
    // 3 * 0.333333 = 0.999999 -> 1
    expect(convertMinorToSgd(3, "0.333333")).toBe(1);
  });

  it("rounds half up at the exact midpoint", () => {
    // 2 * 0.25 = 0.5 -> 1
    expect(convertMinorToSgd(2, "0.25")).toBe(1);
  });

  it("accepts rates with fewer than 6 decimal places", () => {
    expect(convertMinorToSgd(1000, "1.5")).toBe(1500);
    expect(convertMinorToSgd(1000, "2")).toBe(2000);
  });
});
