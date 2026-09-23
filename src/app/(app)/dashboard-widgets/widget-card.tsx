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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  WIDGET_CATALOG,
  type DashboardWidgetSize,
  type DashboardWidgetType,
} from "@/lib/dashboard";
import { useT } from "@/lib/i18n/client";

// `label` is a dictionary key.
const SIZE_OPTIONS: { value: DashboardWidgetSize; label: string }[] = [
  { value: "small", label: "widgetSize.small" },
  { value: "medium", label: "widgetSize.medium" },
  { value: "large", label: "widgetSize.large" },
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
  const { t } = useT();

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          {editable && (
            <Tooltip>
              <TooltipTrigger render={<span className="inline-block" />}>
                <button
                  type="button"
                  className="cursor-grab touch-none text-muted-foreground active:cursor-grabbing"
                  aria-label={t("dashboard.reorderWidget", {
                    name: t(WIDGET_CATALOG[widgetType].label),
                  })}
                  {...dragHandleAttributes}
                  {...dragHandleListeners}
                >
                  <GripVertical className="size-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>{t("dashboard.dragHelp")}</TooltipContent>
            </Tooltip>
          )}
          <CardTitle>{t(WIDGET_CATALOG[widgetType].label)}</CardTitle>
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
                  {t(option.label)}
                </SegmentedItem>
              ))}
            </Segmented>
            <Tooltip>
              <TooltipTrigger render={<span className="inline-block" />}>
                <button
                  type="button"
                  onClick={onRemove}
                  aria-label={t("dashboard.removeWidget", {
                    name: t(WIDGET_CATALOG[widgetType].label),
                  })}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>{t("dashboard.removeHelp")}</TooltipContent>
            </Tooltip>
          </CardAction>
        )}
      </CardHeader>

      <CardContent>{children}</CardContent>
    </Card>
  );
}
