import type {
  dashboardWidgetSizeEnum,
  dashboardWidgetTypeEnum,
} from "@/db/schema/dashboard-widget";
import type { activityRelatedTypeEnum } from "@/db/schema/activity";

export type DashboardWidgetType =
  (typeof dashboardWidgetTypeEnum.enumValues)[number];
export type DashboardWidgetSize =
  (typeof dashboardWidgetSizeEnum.enumValues)[number];

// Drives the "add widget" picker and each widget card's header — the
// single place widget metadata lives, so adding a new widget type never
// means hunting through the UI for every spot its label is hardcoded.
export const WIDGET_CATALOG: Record<
  DashboardWidgetType,
  { label: string; description: string }
> = {
  opportunities_by_stage: {
    label: "Opportunities by stage",
    description: "Count of open opportunities in each pipeline stage.",
  },
  quotes_expiring: {
    label: "Quotes expiring",
    description: "Sent quotations whose valid-until date is coming up.",
  },
  shipments_placeholder: {
    label: "Shipments in transit",
    description: "Coming soon — shipments (P7) is on hold.",
  },
  my_open_opportunities: {
    label: "My open opportunities",
    description: "Opportunities you own that aren't won or lost yet.",
  },
  purchase_orders_awaiting_confirmation: {
    label: "Purchase orders awaiting confirmation",
    description: "Draft purchase orders not yet confirmed with the supplier.",
  },
  pipeline_value: {
    label: "Pipeline value",
    description: "Open opportunity value, totalled per currency.",
  },
  recent_activity: {
    label: "Recent activity",
    description: "The latest notes, calls, meetings and emails logged.",
  },
  my_tasks: {
    label: "My tasks",
    description: "Open tasks assigned to you.",
  },
};

export const DEFAULT_WIDGET_TYPES: DashboardWidgetType[] = [
  "opportunities_by_stage",
  "quotes_expiring",
  "shipments_placeholder",
];

// Quotes within this many days of their valid-until date (or already past
// it) are "expiring soon" — crm-spec.md §8's dashboard widget doesn't
// specify a window, so this is a plain, named constant rather than a
// buried magic number.
export const QUOTE_EXPIRY_WINDOW_DAYS = 14;

// Pure so the boundary (exactly N days out, already overdue, no
// valid-until at all) is unit-testable without a database.
export function isExpiringSoon(
  validUntil: Date | null,
  now: Date,
  windowDays: number = QUOTE_EXPIRY_WINDOW_DAYS,
): boolean {
  if (!validUntil) return false;
  const msPerDay = 24 * 60 * 60 * 1000;
  const daysUntil = (validUntil.getTime() - now.getTime()) / msPerDay;
  return daysUntil <= windowDays;
}

// CLAUDE.md: never sum money across currencies. Returns one total per
// currency rather than a single blended figure — order is insertion order
// of first occurrence, stable enough for a small, fixed set of currencies.
export function sumByCurrency(
  amounts: { amountMinor: number; currency: string }[],
): { currency: string; totalMinor: number }[] {
  const totals = new Map<string, number>();
  for (const { amountMinor, currency } of amounts) {
    totals.set(currency, (totals.get(currency) ?? 0) + amountMinor);
  }
  return Array.from(totals, ([currency, totalMinor]) => ({
    currency,
    totalMinor,
  }));
}

// --- Grid placement ---
//
// dashboard_widget.position is a flat slot index into a virtual grid with
// GRID_COLS columns, not a list-order index: row = floor(position / 3),
// col = position % 3. A widget occupies `slotSpan(size)` consecutive
// columns starting at its own col. Every caller that sets a position runs
// it through `clampStartCol` first, so a widget's start column is always
// one `GRID_COLS - span` allows — `position + span - 1` therefore never
// crosses into the next row. This is what lets the dashboard grid leave a
// dropped-from gap empty instead of repacking everything, unlike a plain
// ordered list.

export const GRID_COLS = 3;

export function slotSpan(size: DashboardWidgetSize): number {
  return size === "small" ? 1 : size === "medium" ? 2 : 3;
}

export function slotToRowCol(position: number): { row: number; col: number } {
  return {
    row: Math.floor(position / GRID_COLS),
    col: position % GRID_COLS,
  };
}

export function rowColToSlot(row: number, col: number): number {
  return row * GRID_COLS + col;
}

// The largest start column `size` can occupy without spanning past
// GRID_COLS — e.g. a "large" (span 3) widget can only start at column 0.
export function clampStartCol(col: number, size: DashboardWidgetSize): number {
  const maxCol = GRID_COLS - slotSpan(size);
  return Math.min(Math.max(col, 0), maxCol);
}

// True if every cell a widget of `size` at `position` would occupy is
// free of every widget in `others` (each already-placed widget's own
// span is derived from its own size the same way).
export function canPlace(
  position: number,
  size: DashboardWidgetSize,
  others: { position: number; size: DashboardWidgetSize }[],
): boolean {
  const { col } = slotToRowCol(position);
  const span = slotSpan(size);
  if (col !== clampStartCol(col, size)) return false;

  const occupied = new Set<number>();
  for (let i = 0; i < span; i++) occupied.add(position + i);

  for (const other of others) {
    const otherSpan = slotSpan(other.size);
    for (let i = 0; i < otherSpan; i++) {
      if (occupied.has(other.position + i)) return false;
    }
  }
  return true;
}

// Finds somewhere `size` actually fits without overlapping `others` —
// prefers staying in `preferredPosition`'s own row (tried left to right),
// falling back to a brand new row below everything else if nothing in
// that row works. Used by resize, which can't just clamp the column to
// the grid's own width like a fresh placement can: the widget might be
// growing into cells a sibling already occupies, not just off the edge
// of the grid (docs/decisions.md, this fix's entry).
export function findValidPosition(
  preferredPosition: number,
  size: DashboardWidgetSize,
  others: { position: number; size: DashboardWidgetSize }[],
): number {
  const { row } = slotToRowCol(preferredPosition);
  const span = slotSpan(size);

  for (let col = 0; col <= GRID_COLS - span; col++) {
    const candidate = rowColToSlot(row, col);
    if (canPlace(candidate, size, others)) return candidate;
  }

  const maxRow = others.reduce(
    (max, other) => Math.max(max, slotToRowCol(other.position).row),
    row,
  );
  return rowColToSlot(maxRow + 1, 0);
}

type ActivityRelatedType = (typeof activityRelatedTypeEnum.enumValues)[number];

// activity.related_type is polymorphic with no FK (docs/decisions.md,
// 2026-08-12) — this is the one place that maps it back to a real route,
// so the recent-activity widget doesn't need its own copy.
const RELATED_TYPE_PATHS: Record<ActivityRelatedType, string> = {
  company: "companies",
  contact: "contacts",
  project: "projects",
  opportunity: "opportunities",
  sales_order: "sales-orders",
  purchase_order: "purchase-orders",
};

export function activityRelatedHref(
  relatedType: ActivityRelatedType,
  relatedId: string,
): string {
  return `/${RELATED_TYPE_PATHS[relatedType]}/${relatedId}`;
}
