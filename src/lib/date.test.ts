import { describe, expect, it } from "vitest";

import { formatDateTime } from "./date";

describe("formatDateTime", () => {
  it("renders in Asia/Singapore (UTC+8), not UTC", () => {
    // 2026-08-12T16:30:00Z is 2026-08-13T00:30:00 in Singapore — a date
    // that only shows up if the UTC+8 offset was actually applied.
    const result = formatDateTime(new Date("2026-08-12T16:30:00Z"));
    expect(result).toContain("2026");
    expect(result).toContain("13");
  });

  it("keeps the same calendar day when the UTC+8 shift doesn't cross midnight", () => {
    const result = formatDateTime(new Date("2026-08-12T02:00:00Z"));
    expect(result).toContain("12");
  });
});
