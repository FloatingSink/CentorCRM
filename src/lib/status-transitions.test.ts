import { describe, expect, it } from "vitest";

import {
  canEditOrder,
  canEditQuotation,
  isLegalOrderTransition,
  isLegalQuotationTransition,
  type OrderStatus,
  type QuotationStatus,
} from "./status-transitions";

const QUOTATION_STATUSES: QuotationStatus[] = [
  "draft",
  "sent",
  "accepted",
  "rejected",
  "superseded",
];

const ORDER_STATUSES: OrderStatus[] = [
  "draft",
  "confirmed",
  "in_production",
  "shipped",
  "completed",
  "cancelled",
];

// Every legal quotation transition, confirmed with Jia Long.
const LEGAL_QUOTATION_TRANSITIONS = new Set([
  "draft->sent",
  "sent->accepted",
  "sent->rejected",
  "sent->draft",
  "rejected->draft",
]);

describe("isLegalQuotationTransition", () => {
  it("covers the full transition table, every pair", () => {
    for (const from of QUOTATION_STATUSES) {
      for (const to of QUOTATION_STATUSES) {
        const expected = LEGAL_QUOTATION_TRANSITIONS.has(`${from}->${to}`);
        expect(isLegalQuotationTransition(from, to), `${from} -> ${to}`).toBe(
          expected,
        );
      }
    }
  });

  it("rejects a same-status no-op transition", () => {
    for (const status of QUOTATION_STATUSES) {
      expect(isLegalQuotationTransition(status, status)).toBe(false);
    }
  });

  it("never allows a manual transition into or out of superseded", () => {
    for (const status of QUOTATION_STATUSES) {
      expect(isLegalQuotationTransition(status, "superseded")).toBe(false);
      expect(isLegalQuotationTransition("superseded", status)).toBe(false);
    }
  });

  it("treats accepted as terminal", () => {
    for (const status of QUOTATION_STATUSES) {
      expect(isLegalQuotationTransition("accepted", status)).toBe(false);
    }
  });
});

describe("canEditQuotation", () => {
  it("is only true for draft", () => {
    for (const status of QUOTATION_STATUSES) {
      expect(canEditQuotation(status)).toBe(status === "draft");
    }
  });
});

// Every legal order transition (sales_order and purchase_order share this
// table — confirmed identical rules for both), confirmed with Jia Long:
// forward skips allowed, no reverting, cancelled reachable from any
// non-terminal status, completed and cancelled are both terminal.
const LEGAL_ORDER_TRANSITIONS = new Set([
  "draft->confirmed",
  "draft->in_production",
  "draft->shipped",
  "draft->completed",
  "draft->cancelled",
  "confirmed->in_production",
  "confirmed->shipped",
  "confirmed->completed",
  "confirmed->cancelled",
  "in_production->shipped",
  "in_production->completed",
  "in_production->cancelled",
  "shipped->completed",
  "shipped->cancelled",
]);

describe("isLegalOrderTransition", () => {
  it("covers the full transition table, every pair", () => {
    for (const from of ORDER_STATUSES) {
      for (const to of ORDER_STATUSES) {
        const expected = LEGAL_ORDER_TRANSITIONS.has(`${from}->${to}`);
        expect(isLegalOrderTransition(from, to), `${from} -> ${to}`).toBe(
          expected,
        );
      }
    }
  });

  it("rejects a same-status no-op transition", () => {
    for (const status of ORDER_STATUSES) {
      expect(isLegalOrderTransition(status, status)).toBe(false);
    }
  });

  it("treats completed and cancelled as terminal", () => {
    for (const status of ORDER_STATUSES) {
      expect(isLegalOrderTransition("completed", status)).toBe(false);
      expect(isLegalOrderTransition("cancelled", status)).toBe(false);
    }
  });

  it("allows forward skips", () => {
    expect(isLegalOrderTransition("draft", "shipped")).toBe(true);
    expect(isLegalOrderTransition("confirmed", "completed")).toBe(true);
  });

  it("never allows reverting backward", () => {
    expect(isLegalOrderTransition("shipped", "confirmed")).toBe(false);
    expect(isLegalOrderTransition("completed", "shipped")).toBe(false);
  });
});

describe("canEditOrder", () => {
  it("is only true for draft", () => {
    for (const status of ORDER_STATUSES) {
      expect(canEditOrder(status)).toBe(status === "draft");
    }
  });
});
