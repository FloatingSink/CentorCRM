// Pure status-transition rules for quotations, sales orders, and purchase
// orders (remediation slice 3, docs/decisions.md) — the single source of
// truth src/server/{quotations,sales-orders,purchase-orders}.ts and the
// three builder UIs both consult, rather than each re-deriving its own
// notion of what's legal.

export class StatusTransitionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StatusTransitionError";
  }
}

export type QuotationStatus =
  "draft" | "sent" | "accepted" | "rejected" | "superseded";

// Confirmed with Jia Long: sent/rejected can revert to draft (a mistake or
// a revision-in-place), accepted is terminal (revising an accepted quote
// means createQuotationVersion, not a same-row transition), superseded is
// system-only — never a manually selectable target, matching the builder's
// own STATUSES array already excluding it.
const QUOTATION_TRANSITIONS: Record<
  QuotationStatus,
  readonly QuotationStatus[]
> = {
  draft: ["sent"],
  sent: ["accepted", "rejected", "draft"],
  accepted: [],
  rejected: ["draft"],
  superseded: [],
};

export function isLegalQuotationTransition(
  from: QuotationStatus,
  to: QuotationStatus,
): boolean {
  if (from === to) return false;
  return QUOTATION_TRANSITIONS[from].includes(to);
}

// Header/line edits only while draft — the actual bug this slice fixes
// (updateQuotationHeaderAndLines previously rewrote an accepted quotation's
// prices with no check at all). Revising a non-draft quotation means
// createQuotationVersion, not editing the row in place.
export function canEditQuotation(status: QuotationStatus): boolean {
  return status === "draft";
}

// Hover-tooltip copy for the status buttons in quotation-builder.tsx — kept
// alongside the rules it describes rather than duplicated per caller.
export const QUOTATION_STATUS_HELP: Record<QuotationStatus, string> = {
  draft: "Being prepared — header and lines can still be edited.",
  sent: "Sent to the customer. Can be accepted, rejected, or pulled back to draft.",
  accepted:
    'Customer accepted — locked from further edits. A "Convert to sales order" link appears below. To change prices or lines, save as a new version instead.',
  rejected: "Customer rejected. Can be reopened as draft to revise and resend.",
  superseded:
    "Replaced by a newer version, kept for history — not a status you set manually.",
};

export type OrderStatus =
  | "draft"
  | "confirmed"
  | "in_production"
  | "shipped"
  | "completed"
  | "cancelled";

// Shared by sales_order and purchase_order — confirmed identical rules for
// both. This lifecycle isn't spec'd (docs/decisions.md, 2026-08-12: "an
// assumed generic order lifecycle, not asserted as CENTOR's real process"),
// so the graph below was confirmed with Jia Long rather than guessed at.
const ORDER_STATUS_SEQUENCE: readonly OrderStatus[] = [
  "draft",
  "confirmed",
  "in_production",
  "shipped",
  "completed",
];

export function isLegalOrderTransition(
  from: OrderStatus,
  to: OrderStatus,
): boolean {
  if (from === to) return false;
  if (from === "completed" || from === "cancelled") return false;
  if (to === "cancelled") return true;

  const fromIndex = ORDER_STATUS_SEQUENCE.indexOf(from);
  const toIndex = ORDER_STATUS_SEQUENCE.indexOf(to);
  if (fromIndex === -1 || toIndex === -1) return false;
  // Forward skips allowed (e.g. confirmed -> shipped directly), no
  // reverting backward.
  return toIndex > fromIndex;
}

export function canEditOrder(status: OrderStatus): boolean {
  return status === "draft";
}

// Hover-tooltip copy for the status buttons in sales-order-builder.tsx and
// purchase-order-builder.tsx — one definition, shared by both (identical
// transition rules, confirmed with Jia Long — see the comment above).
export const ORDER_STATUS_HELP: Record<OrderStatus, string> = {
  draft: "Being prepared — header and lines can still be edited.",
  confirmed: "Confirmed with the counterparty. Locked from further edits.",
  in_production: "Goods are being manufactured/prepared.",
  shipped: "Goods have left for delivery.",
  completed:
    "Delivered and closed out — a terminal status, no further changes.",
  cancelled: "Cancelled — a terminal status, no further changes.",
};
