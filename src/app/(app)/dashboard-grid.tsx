"use client";

import {
  DndContext,
  PointerSensor,
  pointerWithin,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { Pencil, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  addDashboardWidgetAction,
  removeDashboardWidgetAction,
  resetDashboardAction,
  resizeDashboardWidgetAction,
  setDashboardWidgetPositionsAction,
} from "./dashboard-actions";
import { AddWidgetDialog } from "./dashboard-widgets/add-widget-dialog";
import { MyOpenOpportunitiesWidget } from "./dashboard-widgets/my-open-opportunities-widget";
import { OpportunitiesByStageWidget } from "./dashboard-widgets/opportunities-by-stage-widget";
import { PipelineValueWidget } from "./dashboard-widgets/pipeline-value-widget";
import { PurchaseOrdersAwaitingConfirmationWidget } from "./dashboard-widgets/purchase-orders-widget";
import { QuotesExpiringWidget } from "./dashboard-widgets/quotes-expiring-widget";
import { RecentActivityWidget } from "./dashboard-widgets/recent-activity-widget";
import { ShipmentsPlaceholderWidget } from "./dashboard-widgets/shipments-placeholder-widget";
import { WidgetCard } from "./dashboard-widgets/widget-card";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  GRID_COLS,
  canPlace,
  findValidPosition,
  rowColToSlot,
  slotSpan,
  slotToRowCol,
  type DashboardWidgetSize,
  type DashboardWidgetType,
} from "@/lib/dashboard";
import type {
  getExpiringQuotations,
  getMyOpenOpportunities,
  getOpportunitiesByStage,
  getPipelineValueByCurrency,
  getPurchaseOrdersAwaitingConfirmation,
  getRecentActivity,
} from "@/server/dashboard";

// Data for every widget type a user could have, keyed the same way — the
// caller only needs to populate the entries for widget types actually
// present (see page.tsx), everything else stays undefined and unused.
export type DashboardWidgetData = {
  opportunities_by_stage: Awaited<ReturnType<typeof getOpportunitiesByStage>>;
  quotes_expiring: Awaited<ReturnType<typeof getExpiringQuotations>>;
  shipments_placeholder: undefined;
  my_open_opportunities: Awaited<ReturnType<typeof getMyOpenOpportunities>>;
  purchase_orders_awaiting_confirmation: Awaited<
    ReturnType<typeof getPurchaseOrdersAwaitingConfirmation>
  >;
  pipeline_value: Awaited<ReturnType<typeof getPipelineValueByCurrency>>;
  recent_activity: Awaited<ReturnType<typeof getRecentActivity>>;
};

// `position` is a grid slot index (see src/lib/dashboard.ts), not a list
// order — two widgets are never adjacent in an array sense, only adjacent
// in grid cells, which is what lets a gap stay a gap.
export type DashboardWidgetItem = {
  id: string;
  widgetType: DashboardWidgetType;
  size: DashboardWidgetSize;
  position: number;
};

function renderWidget(
  widgetType: DashboardWidgetType,
  data: DashboardWidgetData,
) {
  switch (widgetType) {
    case "opportunities_by_stage":
      return <OpportunitiesByStageWidget rows={data.opportunities_by_stage} />;
    case "quotes_expiring":
      return <QuotesExpiringWidget rows={data.quotes_expiring} />;
    case "shipments_placeholder":
      return <ShipmentsPlaceholderWidget />;
    case "my_open_opportunities":
      return <MyOpenOpportunitiesWidget rows={data.my_open_opportunities} />;
    case "purchase_orders_awaiting_confirmation":
      return (
        <PurchaseOrdersAwaitingConfirmationWidget
          rows={data.purchase_orders_awaiting_confirmation}
        />
      );
    case "pipeline_value":
      return <PipelineValueWidget rows={data.pipeline_value} />;
    case "recent_activity":
      return <RecentActivityWidget rows={data.recent_activity} />;
  }
}

// A widget is both a drag source and its own drop target (dropping
// another widget on it swaps the two) — dnd-kit tracks draggables and
// droppables in separate registries, so reusing the same id for both is
// fine and is dnd-kit's own pattern for "things that can trade places".
function GridWidget({
  widget,
  data,
  editable,
  onRemove,
  onSizeChange,
}: {
  widget: DashboardWidgetItem;
  data: DashboardWidgetData;
  editable: boolean;
  onRemove: (id: string) => void;
  onSizeChange: (id: string, size: DashboardWidgetSize) => void;
}) {
  const {
    setNodeRef: setDragRef,
    attributes,
    listeners,
    transform,
    isDragging,
  } = useDraggable({ id: widget.id });
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: widget.id });
  const { row, col } = slotToRowCol(widget.position);

  return (
    <div
      ref={(node) => {
        setDragRef(node);
        setDropRef(node);
      }}
      style={
        {
          "--dg-col": col + 1,
          "--dg-span": slotSpan(widget.size),
          "--dg-row": row + 1,
          transform: transform
            ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
            : undefined,
          zIndex: isDragging ? 10 : undefined,
        } as React.CSSProperties
      }
      className={cn(
        "dashboard-grid-item",
        isOver && "outline-2 outline-offset-2 outline-primary",
      )}
    >
      <WidgetCard
        widgetType={widget.widgetType}
        size={widget.size}
        editable={editable}
        onRemove={() => onRemove(widget.id)}
        onSizeChange={(size) => onSizeChange(widget.id, size)}
        dragHandleAttributes={attributes}
        dragHandleListeners={listeners}
      >
        {renderWidget(widget.widgetType, data)}
      </WidgetCard>
    </div>
  );
}

// An empty grid cell — invisible unless something's being dragged over
// it, just a drop target so a widget can be placed exactly here. Hidden
// below `lg`: the mobile layout is a plain single-column stack (matching
// the pre-existing `grid-cols-1 lg:grid-cols-3` behavior), where a blank
// drop target between widgets would just be confusing dead space —
// dragging widgets into specific gaps is a desktop pointer interaction.
function EmptyCell({ position }: { position: number }) {
  const { row, col } = slotToRowCol(position);
  const { setNodeRef, isOver } = useDroppable({ id: `cell-${position}` });

  return (
    <div
      ref={setNodeRef}
      style={
        { "--dg-col": col + 1, "--dg-row": row + 1 } as React.CSSProperties
      }
      className={cn(
        "dashboard-grid-item hidden min-h-32 rounded-xl border border-dashed border-transparent lg:block",
        isOver && "border-primary bg-primary/5",
      )}
    />
  );
}

// Every mutation persists via a server action, then calls router.refresh()
// so page.tsx re-runs with fresh widgets/data. To pick that up, page.tsx
// keys this component by the widget list's identity — React's own
// recommended way to reset state from a changed prop (not a useEffect
// syncing prop -> state, which the lint rule flags as an anti-pattern) —
// so a remount, not a manual sync, is what replaces `initialWidgets` here.
export function DashboardGrid({
  widgets: initialWidgets,
  data,
}: {
  widgets: DashboardWidgetItem[];
  data: DashboardWidgetData;
}) {
  const router = useRouter();
  const [widgets, setWidgets] = useState(initialWidgets);
  // Defaults to "view" (locked) on every load — the dashboard shouldn't be
  // rearrangeable by accident. Deliberately not persisted anywhere: this
  // is a transient UI-safety toggle, not dashboard data.
  const [mode, setMode] = useState<"view" | "edit">("view");
  const editable = mode === "edit";
  const sensors = useSensors(useSensor(PointerSensor));
  const presentTypes = new Set(widgets.map((w) => w.widgetType));

  const maxRow = widgets.reduce(
    (max, w) => Math.max(max, slotToRowCol(w.position).row),
    -1,
  );
  // Always one fully-empty row past the last occupied one, so there's
  // somewhere to drop a widget into a new row rather than a dead end.
  const rowCount = maxRow + 2;

  const occupiedAnchors = new Map(widgets.map((w) => [w.position, w]));
  const coveredSlots = new Set<number>();
  for (const w of widgets) {
    const span = slotSpan(w.size);
    for (let i = 1; i < span; i++) coveredSlots.add(w.position + i);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const dragged = widgets.find((w) => w.id === active.id);
    if (!dragged) return;

    if (typeof over.id === "string" && over.id.startsWith("cell-")) {
      const targetPosition = Number(over.id.slice("cell-".length));
      const others = widgets
        .filter((w) => w.id !== dragged.id)
        .map((w) => ({ position: w.position, size: w.size }));
      if (!canPlace(targetPosition, dragged.size, others)) return;

      commitPositions([{ id: dragged.id, position: targetPosition }]);
      return;
    }

    const target = widgets.find((w) => w.id === over.id);
    if (!target || target.id === dragged.id) return;

    // Validate against the hypothetical *post-swap* arrangement, not the
    // current one — sizes can differ, so a swap can change how much space
    // each widget needs at its new spot (see docs/decisions.md, this
    // entry's "unequal-size swap" note).
    const hypothetical = widgets.map((w) => {
      if (w.id === dragged.id) return { ...w, position: target.position };
      if (w.id === target.id) return { ...w, position: dragged.position };
      return w;
    });
    const draggedHyp = hypothetical.find((w) => w.id === dragged.id)!;
    const targetHyp = hypothetical.find((w) => w.id === target.id)!;
    const validForDragged = canPlace(
      draggedHyp.position,
      draggedHyp.size,
      hypothetical
        .filter((w) => w.id !== dragged.id)
        .map((w) => ({ position: w.position, size: w.size })),
    );
    const validForTarget = canPlace(
      targetHyp.position,
      targetHyp.size,
      hypothetical
        .filter((w) => w.id !== target.id)
        .map((w) => ({ position: w.position, size: w.size })),
    );
    if (!validForDragged || !validForTarget) return;

    commitPositions([
      { id: dragged.id, position: target.position },
      { id: target.id, position: dragged.position },
    ]);
  }

  function commitPositions(updates: { id: string; position: number }[]) {
    setWidgets((prev) =>
      prev.map((w) => {
        const update = updates.find((u) => u.id === w.id);
        return update ? { ...w, position: update.position } : w;
      }),
    );
    void setDashboardWidgetPositionsAction(updates).then(() =>
      router.refresh(),
    );
  }

  function handleRemove(id: string) {
    setWidgets((prev) => prev.filter((w) => w.id !== id));
    void removeDashboardWidgetAction(id).then(() => router.refresh());
  }

  function handleSizeChange(id: string, size: DashboardWidgetSize) {
    const widget = widgets.find((w) => w.id === id);
    if (!widget) return;

    // Growing a widget can overlap a sibling already occupying the cells
    // it would grow into, not just the grid's own outer width — mirrors
    // resizeDashboardWidget's server-side logic (src/server/dashboard.ts)
    // so the optimistic update lands in the same spot the server will
    // persist, instead of flashing an overlapping layout until
    // router.refresh() corrects it.
    const others = widgets
      .filter((w) => w.id !== id)
      .map((w) => ({ position: w.position, size: w.size }));
    const position = findValidPosition(widget.position, size, others);

    setWidgets((prev) =>
      prev.map((w) => (w.id === id ? { ...w, size, position } : w)),
    );
    void resizeDashboardWidgetAction(id, size).then(() => router.refresh());
  }

  function handleAdd(widgetType: DashboardWidgetType) {
    // No optimistic insert: the new widget's data was never fetched (it
    // wasn't present when page.tsx ran its queries), so there's nothing
    // real to render yet — router.refresh() re-runs the server component
    // with the new widget list and its data together.
    void addDashboardWidgetAction(widgetType).then(() => router.refresh());
  }

  function handleReset() {
    setWidgets([]);
    void resetDashboardAction().then(() => router.refresh());
  }

  const cells: React.ReactNode[] = [];
  for (let row = 0; row < rowCount; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      const position = rowColToSlot(row, col);
      const anchor = occupiedAnchors.get(position);
      if (anchor) {
        cells.push(
          <GridWidget
            key={anchor.id}
            widget={anchor}
            data={data}
            editable={editable}
            onRemove={handleRemove}
            onSizeChange={handleSizeChange}
          />,
        );
      } else if (!coveredSlots.has(position)) {
        // Rendered in both modes, not just edit: with explicit per-item
        // grid-row/grid-column placement and no fixed grid-template-rows,
        // a row with nothing placed in it collapses to zero height — this
        // is what actually reserves an empty row's space, not just a drop
        // target. Dropping it in view mode previously made a gap's height
        // vanish, snapping whatever came after it upward. Harmless to
        // still register as droppable there too: with no drag handle
        // rendered anywhere in view mode (see WidgetCard's `editable`
        // prop), nothing can ever be picked up to drop onto it.
        cells.push(<EmptyCell key={position} position={position} />);
      }
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-end gap-2">
        {editable && (
          <>
            <Button variant="ghost" onClick={handleReset}>
              Reset to default
            </Button>
            <AddWidgetDialog presentTypes={presentTypes} onAdd={handleAdd} />
          </>
        )}
        <Tooltip>
          <TooltipTrigger render={<span className="inline-block" />}>
            <Button
              variant="outline"
              onClick={() => setMode(editable ? "view" : "edit")}
            >
              {editable ? (
                <>
                  <Check /> Done editing
                </>
              ) : (
                <>
                  <Pencil /> Edit dashboard
                </>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {editable
              ? "Locks the dashboard again so it can't be rearranged by accident."
              : "Dashboard starts locked so it can't be rearranged by accident — unlock to drag, resize, or add/remove widgets."}
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Explicit id: without one, dnd-kit generates aria ids from a
          module-level counter that starts fresh per render pass, causing an
          SSR/client hydration mismatch on every load. */}
      <DndContext
        id="dashboard-grid"
        sensors={sensors}
        collisionDetection={pointerWithin}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">{cells}</div>
      </DndContext>
    </div>
  );
}
