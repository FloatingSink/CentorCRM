import { describe, expect, it } from "vitest";

import { buildQuoteNumber } from "./quote-number";

describe("buildQuoteNumber", () => {
  it("formats the date as YYYYMMDD and pads the sequence to 4 digits", () => {
    const date = new Date(Date.UTC(2026, 1, 15)); // Feb 15, 2026
    expect(buildQuoteNumber("CGPL", date, 1)).toBe("CGPL-Q-20260215-0001");
  });

  it("pads single-digit month and day", () => {
    const date = new Date(Date.UTC(2026, 0, 5)); // Jan 5, 2026
    expect(buildQuoteNumber("CGPL", date, 42)).toBe("CGPL-Q-20260105-0042");
  });

  it("does not truncate a sequence beyond 4 digits", () => {
    const date = new Date(Date.UTC(2026, 0, 1));
    expect(buildQuoteNumber("CGPL", date, 12345)).toBe("CGPL-Q-20260101-12345");
  });

  it("uses the given entity short code", () => {
    const date = new Date(Date.UTC(2026, 0, 1));
    expect(buildQuoteNumber("ITP", date, 1)).toBe("ITP-Q-20260101-0001");
  });
});
