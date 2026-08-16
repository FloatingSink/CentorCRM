import { describe, expect, it } from "vitest";

import {
  activityRelatedHref,
  canPlace,
  clampStartCol,
  findValidPosition,
  isExpiringSoon,
  rowColToSlot,
  slotToRowCol,
  sumByCurrency,
} from "./dashboard";

describe("isExpiringSoon", () => {
  const now = new Date("2026-08-14T00:00:00Z");

  it("returns false when there's no valid-until date", () => {
    expect(isExpiringSoon(null, now)).toBe(false);
  });

  it("returns false for a date well beyond the window", () => {
    expect(isExpiringSoon(new Date("2026-09-30T00:00:00Z"), now)).toBe(false);
  });

  it("returns true exactly at the window boundary", () => {
    expect(isExpiringSoon(new Date("2026-08-28T00:00:00Z"), now, 14)).toBe(
      true,
    );
  });

  it("returns true for a date already in the past", () => {
    expect(isExpiringSoon(new Date("2026-08-01T00:00:00Z"), now)).toBe(true);
  });

  it("respects a custom window", () => {
    // 11 days out from `now` — outside a 7-day window, inside a 14-day one.
    const soon = new Date("2026-08-25T00:00:00Z");
    expect(isExpiringSoon(soon, now, 7)).toBe(false);
    expect(isExpiringSoon(soon, now, 14)).toBe(true);
  });
});

describe("sumByCurrency", () => {
  it("sums amounts within the same currency", () => {
    expect(
      sumByCurrency([
        { amountMinor: 10000, currency: "SGD" },
        { amountMinor: 5000, currency: "SGD" },
      ]),
    ).toEqual([{ currency: "SGD", totalMinor: 15000 }]);
  });

  it("keeps different currencies separate rather than blending them", () => {
    expect(
      sumByCurrency([
        { amountMinor: 10000, currency: "SGD" },
        { amountMinor: 7000, currency: "USD" },
        { amountMinor: 5000, currency: "SGD" },
      ]),
    ).toEqual([
      { currency: "SGD", totalMinor: 15000 },
      { currency: "USD", totalMinor: 7000 },
    ]);
  });

  it("returns an empty array for no amounts", () => {
    expect(sumByCurrency([])).toEqual([]);
  });
});

describe("activityRelatedHref", () => {
  it("maps each related type to its real route, not a guessed plural", () => {
    expect(activityRelatedHref("company", "1")).toBe("/companies/1");
    expect(activityRelatedHref("sales_order", "1")).toBe("/sales-orders/1");
    expect(activityRelatedHref("purchase_order", "1")).toBe(
      "/purchase-orders/1",
    );
  });
});

describe("slotToRowCol / rowColToSlot", () => {
  it("round-trips through both directions", () => {
    for (const position of [0, 1, 2, 3, 4, 8, 29]) {
      const { row, col } = slotToRowCol(position);
      expect(rowColToSlot(row, col)).toBe(position);
    }
  });

  it("wraps to a new row every 3 columns", () => {
    expect(slotToRowCol(0)).toEqual({ row: 0, col: 0 });
    expect(slotToRowCol(2)).toEqual({ row: 0, col: 2 });
    expect(slotToRowCol(3)).toEqual({ row: 1, col: 0 });
  });
});

describe("clampStartCol", () => {
  it("leaves a column unchanged when the widget already fits", () => {
    expect(clampStartCol(0, "large")).toBe(0);
    expect(clampStartCol(1, "medium")).toBe(1);
    expect(clampStartCol(2, "small")).toBe(2);
  });

  it("pulls a column back to the largest valid start for the size", () => {
    // large (span 3) only fits starting at column 0
    expect(clampStartCol(1, "large")).toBe(0);
    expect(clampStartCol(2, "large")).toBe(0);
    // medium (span 2) only fits starting at column 0 or 1
    expect(clampStartCol(2, "medium")).toBe(1);
  });

  it("never returns a negative column", () => {
    expect(clampStartCol(-1, "small")).toBe(0);
  });
});

describe("canPlace", () => {
  it("allows placement in a fully empty grid", () => {
    expect(canPlace(0, "large", [])).toBe(true);
  });

  it("rejects a start column that doesn't fit the size", () => {
    // large (span 3) can't start at column 1 — would overflow past col 3
    expect(canPlace(1, "large", [])).toBe(false);
  });

  it("rejects overlap with an existing widget", () => {
    const others = [{ position: 0, size: "medium" as const }]; // cols 0-1
    expect(canPlace(1, "small", others)).toBe(false); // col 1 overlaps
    expect(canPlace(2, "small", others)).toBe(true); // col 2 is free
  });

  it("does not treat widgets in a different row as overlapping", () => {
    const others = [{ position: 0, size: "large" as const }]; // row 0, cols 0-2
    expect(canPlace(3, "large", others)).toBe(true); // row 1, cols 0-2
  });
});

describe("findValidPosition", () => {
  it("keeps a widget where it is when it already fits", () => {
    expect(findValidPosition(0, "medium", [])).toBe(0);
  });

  it("tries the next column in the same row before falling back to a new one", () => {
    const others = [{ position: 0, size: "small" as const }]; // col 0 taken
    expect(findValidPosition(0, "small", others)).toBe(1);
  });

  it("prevents the overlap bug: growing over an already-occupied neighbor", () => {
    // Row 0: small at col 0 (being resized to medium) + small at col 1.
    // The naive clampStartCol-only fix would leave the resized widget at
    // col 0 (still within grid width) even though it now overlaps col 1.
    const others = [{ position: 1, size: "small" as const }];
    const result = findValidPosition(0, "medium", others);
    expect(canPlace(result, "medium", others)).toBe(true);
    expect(result).not.toBe(0); // col 0 would overlap the neighbor at col 1
  });

  it("prevents the disappearance bug: clamped column landing on a sibling", () => {
    // Row 0: small at col 1, small at col 2 (being resized to medium).
    // clampStartCol(2, "medium") alone would produce col 1 — exactly
    // where the other widget already is (identical position = one of them
    // never renders at all, not just visually overlapping).
    const others = [{ position: 1, size: "small" as const }];
    const result = findValidPosition(2, "medium", others);
    expect(result).not.toBe(1); // would collide exactly with the sibling
    expect(canPlace(result, "medium", others)).toBe(true);
  });

  it("falls back to a new row when nothing in the current row fits", () => {
    const others = [{ position: 0, size: "large" as const }]; // row 0 full
    expect(findValidPosition(0, "small", others)).toBe(3); // row 1, col 0
  });

  it("falls back past the widget's own row even if `others` is empty", () => {
    // A widget alone in its row should always fit there — this only
    // guards the defensive fallback path itself, not a reachable bug.
    expect(findValidPosition(3, "large", [])).toBe(3);
  });
});
