import { describe, expect, it } from "vitest";

import { buildDocumentNumber } from "./document-number";

describe("buildDocumentNumber", () => {
  it("formats the date as YYYYMMDD and pads the sequence to 4 digits", () => {
    const date = new Date(Date.UTC(2026, 1, 15)); // Feb 15, 2026
    expect(buildDocumentNumber("CGPL", "Q", date, 1)).toBe(
      "CGPL-Q-20260215-0001",
    );
  });

  it("pads single-digit month and day", () => {
    const date = new Date(Date.UTC(2026, 0, 5)); // Jan 5, 2026
    expect(buildDocumentNumber("CGPL", "SO", date, 42)).toBe(
      "CGPL-SO-20260105-0042",
    );
  });

  it("does not truncate a sequence beyond 4 digits", () => {
    const date = new Date(Date.UTC(2026, 0, 1));
    expect(buildDocumentNumber("CGPL", "PO", date, 12345)).toBe(
      "CGPL-PO-20260101-12345",
    );
  });

  it("uses the given entity short code and type letter", () => {
    const date = new Date(Date.UTC(2026, 0, 1));
    expect(buildDocumentNumber("ITP", "SO", date, 1)).toBe(
      "ITP-SO-20260101-0001",
    );
  });
});
