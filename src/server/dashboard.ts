import {
  and,
  count,
  desc,
  eq,
  inArray,
  lte,
  max,
  ne,
  notInArray,
} from "drizzle-orm";

import { db } from "@/db/client";
import { activity } from "@/db/schema/activity";
import { company } from "@/db/schema/company";
import {
  dashboardWidget,
  type dashboardWidgetTypeEnum,
} from "@/db/schema/dashboard-widget";
import { opportunity } from "@/db/schema/opportunity";
import { purchaseOrder } from "@/db/schema/purchase-order";
import { quotation } from "@/db/schema/quotation";
import { user } from "@/db/schema/auth";
import {
  DEFAULT_WIDGET_TYPES,
  QUOTE_EXPIRY_WINDOW_DAYS,
  findValidPosition,
  rowColToSlot,
  slotToRowCol,
  sumByCurrency,
  type DashboardWidgetSize,
} from "@/lib/dashboard";

const CLOSED_STAGES = ["won", "lost"] as const;

// Returns the caller's saved widget layout, materializing the spec-required
// defaults on first read for a user who's never customized anything —
// see docs/decisions.md, dashboard entry, on why this is write-on-read
// rather than a seed script or per-page "no rows yet" branching.
export async function getDashboardWidgets(userId: string) {
  const existing = await db
    .select()
    .from(dashboardWidget)
    .where(eq(dashboardWidget.userId, userId))
    .orderBy(dashboardWidget.position);
  if (existing.length > 0) return existing;

  return db.transaction(async (tx) => {
    const inserted = await tx
      .insert(dashboardWidget)
      .values(
        DEFAULT_WIDGET_TYPES.map((widgetType, index) => ({
          userId,
          widgetType,
          // One per row, each at column 0 — a "large" (full-width) widget
          // only validly starts there (src/lib/dashboard.ts's
          // clampStartCol), so position has to advance by a whole row
          // (GRID_COLS), not by 1 like a plain list index would.
          position: rowColToSlot(index, 0),
          // Full-width, not the "medium" column default: three widgets at
          // 2-of-3 columns each wrap with a dead 1-column gap on every row
          // (2+2+2 doesn't fit 3 per row) — full-width stacks cleanly.
          // Widgets added later via the picker still default to "medium".
          size: "large" as const,
          createdBy: userId,
        })),
      )
      // Another concurrent first-read could race this insert — the
      // (userId, widgetType) unique index makes that a no-op, not an
      // error, and the caller still gets a consistent result below.
      .onConflictDoNothing()
      .returning();
    return inserted.length > 0
      ? inserted.sort((a, b) => a.position - b.position)
      : tx
          .select()
          .from(dashboardWidget)
          .where(eq(dashboardWidget.userId, userId))
          .orderBy(dashboardWidget.position);
  });
}

export function getOpportunitiesByStage() {
  return db
    .select({ stage: opportunity.stage, count: count() })
    .from(opportunity)
    .where(eq(opportunity.isActive, true))
    .groupBy(opportunity.stage);
}

export function getExpiringQuotations() {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() + QUOTE_EXPIRY_WINDOW_DAYS);

  return db
    .select({
      id: quotation.id,
      quoteNo: quotation.quoteNo,
      customerCompanyName: company.nameEn,
      validUntil: quotation.validUntil,
    })
    .from(quotation)
    .innerJoin(company, eq(quotation.customerCompanyId, company.id))
    .where(
      and(
        inArray(quotation.status, ["draft", "sent"]),
        lte(quotation.validUntil, cutoff),
      ),
    )
    .orderBy(quotation.validUntil);
}

export function getMyOpenOpportunities(userId: string) {
  return db
    .select({
      id: opportunity.id,
      reference: opportunity.reference,
      title: opportunity.title,
      stage: opportunity.stage,
    })
    .from(opportunity)
    .where(
      and(
        eq(opportunity.isActive, true),
        eq(opportunity.ownerUserId, userId),
        notInArray(opportunity.stage, [...CLOSED_STAGES]),
      ),
    )
    .orderBy(desc(opportunity.createdAt));
}

export function getPurchaseOrdersAwaitingConfirmation() {
  return db
    .select({
      id: purchaseOrder.id,
      orderNo: purchaseOrder.orderNo,
      currency: purchaseOrder.currency,
      totalValue: purchaseOrder.totalValue,
    })
    .from(purchaseOrder)
    .where(eq(purchaseOrder.status, "draft"))
    .orderBy(desc(purchaseOrder.createdAt));
}

export async function getPipelineValueByCurrency() {
  const rows = await db
    .select({
      estimatedValue: opportunity.estimatedValue,
      currency: opportunity.currency,
    })
    .from(opportunity)
    .where(
      and(
        eq(opportunity.isActive, true),
        notInArray(opportunity.stage, [...CLOSED_STAGES]),
      ),
    );

  // Filtered here rather than pushed into sumByCurrency's signature:
  // estimatedValue/currency are nullable in the schema (not always known at
  // enquiry stage), sumByCurrency itself stays a plain non-nullable reducer.
  const amounts = rows
    .filter(
      (r): r is { estimatedValue: number; currency: string } =>
        r.estimatedValue !== null && r.currency !== null,
    )
    .map((r) => ({ amountMinor: r.estimatedValue, currency: r.currency }));

  return sumByCurrency(amounts);
}

export function getRecentActivity(limit = 8) {
  return db
    .select({
      id: activity.id,
      type: activity.type,
      subject: activity.subject,
      occurredAt: activity.occurredAt,
      relatedType: activity.relatedType,
      relatedId: activity.relatedId,
      userName: user.name,
    })
    .from(activity)
    .innerJoin(user, eq(activity.userId, user.id))
    .orderBy(desc(activity.occurredAt))
    .limit(limit);
}

type DashboardWidgetTypeValue =
  (typeof dashboardWidgetTypeEnum.enumValues)[number];

// Ownership is checked inline (`userId` in every WHERE) rather than trusted
// from the caller — dashboard-actions.ts already re-checks auth() before
// calling these, but a widget id is just a uuid a client could pass for any
// row, so the query itself must not touch another user's dashboard.

export async function addDashboardWidget(
  userId: string,
  widgetType: DashboardWidgetTypeValue,
) {
  const [row] = await db
    .select({ maxPosition: max(dashboardWidget.position) })
    .from(dashboardWidget)
    .where(eq(dashboardWidget.userId, userId));

  // Always a new row at column 0, not bin-packed into an existing gap —
  // predictable "adds to the bottom" behavior; fitting a new widget into
  // a specific gap is what dragging it there afterwards is for.
  const nextRow =
    row.maxPosition === null ? 0 : slotToRowCol(row.maxPosition).row + 1;

  await db
    .insert(dashboardWidget)
    .values({
      userId,
      widgetType,
      position: rowColToSlot(nextRow, 0),
      createdBy: userId,
    })
    // The (userId, widgetType) unique index already prevents duplicates —
    // the "add widget" dialog also only ever offers types not already
    // present, so this only guards a race between two rapid clicks.
    .onConflictDoNothing();
}

// No renumbering of remaining rows: an emptied slot is meant to stay
// empty, not get closed up (that's the whole point of this grid model —
// see src/lib/dashboard.ts's grid-placement comment).
export async function removeDashboardWidget(userId: string, widgetId: string) {
  await db
    .delete(dashboardWidget)
    .where(
      and(eq(dashboardWidget.id, widgetId), eq(dashboardWidget.userId, userId)),
    );
}

export async function resizeDashboardWidget(
  userId: string,
  widgetId: string,
  size: DashboardWidgetSize,
) {
  const [existing] = await db
    .select({ position: dashboardWidget.position })
    .from(dashboardWidget)
    .where(
      and(eq(dashboardWidget.id, widgetId), eq(dashboardWidget.userId, userId)),
    );
  if (!existing) return;

  // A bigger size might not fit where the widget currently is — not just
  // against the grid's own width (a widget at column 2 growing to medium
  // needs to move left regardless), but against a sibling already
  // occupying the cells it would grow into. Clamping the column alone
  // caused both overlapping widgets and, when the clamped column happened
  // to land exactly on a sibling's own position, one of them silently
  // never rendering at all (two widgets sharing one position — see
  // docs/decisions.md, this fix's entry).
  const others = await db
    .select({ position: dashboardWidget.position, size: dashboardWidget.size })
    .from(dashboardWidget)
    .where(
      and(eq(dashboardWidget.userId, userId), ne(dashboardWidget.id, widgetId)),
    );
  const position = findValidPosition(existing.position, size, others);

  await db
    .update(dashboardWidget)
    .set({ size, position })
    .where(
      and(eq(dashboardWidget.id, widgetId), eq(dashboardWidget.userId, userId)),
    );
}

// `updates` is either one entry (move to an empty spot) or two (swap two
// widgets) — the caller (dashboard-grid.tsx) has already validated the
// resulting positions with src/lib/dashboard.ts's `canPlace`/
// `clampStartCol`; this just persists whatever it's given, ownership
// checked per row like every other mutation here.
export async function setDashboardWidgetPositions(
  userId: string,
  updates: { id: string; position: number }[],
) {
  await db.transaction(async (tx) => {
    for (const { id, position } of updates) {
      await tx
        .update(dashboardWidget)
        .set({ position })
        .where(
          and(eq(dashboardWidget.id, id), eq(dashboardWidget.userId, userId)),
        );
    }
  });
}

// Deletes the user's whole saved layout — the next getDashboardWidgets call
// re-materializes the spec-required defaults, same as a brand new user.
export async function resetDashboard(userId: string) {
  await db.delete(dashboardWidget).where(eq(dashboardWidget.userId, userId));
}
