import { describe, expect, it } from "vitest";

import { purchaseOrderLineInputSchema } from "./purchase-order";

// Baseline valid line, only netWeightKg varies per test.
const base = {
  productId: "550e8400-e29b-41d4-a716-446655440000",
  descriptionOverride: null,
  quantity: 1,
  uom: null,
  unitPrice: "100.00",
  discountPct: null,
};

function parseWithNetWeight(netWeightKg: string | null) {
  return purchaseOrderLineInputSchema.safeParse({ ...base, netWeightKg });
}

describe("purchaseOrderLineInputSchema netWeightKg", () => {
  it("accepts null (not stated)", () => {
    expect(parseWithNetWeight(null).success).toBe(true);
  });

  it("accepts whole and fractional non-negative weights", () => {
    expect(parseWithNetWeight("0").success).toBe(true);
    expect(parseWithNetWeight("13000").success).toBe(true);
    expect(parseWithNetWeight("250.5").success).toBe(true);
    expect(parseWithNetWeight("250.505").success).toBe(true);
  });

  // Previously a bare z.string() with zero validation — a malformed value
  // was only ever caught by a raw Postgres error deep inside a transaction
  // (docs/decisions.md, remediation slice 4).
  it("rejects a non-numeric string", () => {
    expect(parseWithNetWeight("abc").success).toBe(false);
  });

  it("rejects a multi-dot string", () => {
    expect(parseWithNetWeight("1.2.3").success).toBe(false);
  });

  it("rejects a negative string", () => {
    expect(parseWithNetWeight("-5").success).toBe(false);
  });

  it("rejects more than 3 decimal places", () => {
    expect(parseWithNetWeight("250.5051").success).toBe(false);
  });
});
