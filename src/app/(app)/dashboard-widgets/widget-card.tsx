"use client";

import { GripVertical, X } from "lucide-react";
import type {
  DraggableAttributes,
  DraggableSyntheticListeners,
} from "@dnd-kit/core";

import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Segmented, SegmentedItem } from "@/components/ui/segmented";
import {
  WIDGET_CATALOG,
  type DashboardWidgetSize,
  type DashboardWidgetType,
} from "@/lib/dashboard";

const SIZE_OPTIONS: { value: DashboardWidgetSize; label: string }[] = [
  { value: "small", label: "S" },
  { value: "medium", label: "M" },
  { value: "large", label: "L" },
];

// Shared chrome for every widget: title from the catalog (single source of
// truth for labels — see src/lib/dashboard.ts), a size picker, a remove
// button, and a drag handle wired to dashboard-grid.tsx's dnd-kit
// `useDraggable`. Grid placement (row/column) lives on the caller's
// wrapping element, not here — dnd-kit's draggable ref has to sit on the
// actual grid item, which dashboard-grid.tsx's GridWidget owns.
//
// `editable` gates all of that chrome at once: in view (locked) mode
// dashboard-grid.tsx doesn't pass drag listeners down at all, so there's
// nothing rendered here to accidentally rearrange, resize, or remove a
// widget from — not just visually hidden, actually inert.
export function WidgetCard({
  widgetType,
  size,
  editable,
  onRemove,
  onSizeChange,
  dragHandleAttributes,
  dragHandleListeners,
  children,
}: {
  widgetType: DashboardWidgetType;
  size: DashboardWidgetSize;
  editable: boolean;
  onRemove: () => void;
  onSizeChange: (size: DashboardWidgetSize) => void;
  dragHandleAttributes?: DraggableAttributes;
  dragHandleListeners?: DraggableSyntheticListeners;
  children: React.ReactNode;
}) {
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          {editable && (
            <button
              type="button"
              className="cursor-grab touch-none text-muted-foreground active:cursor-grabbing"
              aria-label={`Reorder ${WIDGET_CATALOG[widgetType].label}`}
              {...dragHandleAttributes}
              {...dragHandleListeners}
            >
              <GripVertical className="size-4" />
            </button>
          )}
          <CardTitle>{WIDGET_CATALOG[widgetType].label}</CardTitle>
        </div>
        {editable && (
          <CardAction className="flex items-center gap-2">
            <Segmented
              value={size}
              onValueChange={(value) =>
                onSizeChange(value as DashboardWidgetSize)
              }
            >
              {SIZE_OPTIONS.map((option) => (
                <SegmentedItem key={option.value} value={option.value}>
                  {option.label}
                </SegmentedItem>
              ))}
            </Segmented>
            <button
              type="button"
              onClick={onRemove}
              aria-label={`Remove ${WIDGET_CATALOG[widgetType].label}`}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </CardAction>
        )}
      </CardHeader>

      <CardContent>{children}</CardContent>
    </Card>
  );
}
