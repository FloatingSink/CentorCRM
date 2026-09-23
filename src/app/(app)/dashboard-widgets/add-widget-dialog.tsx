"use client";

import { PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { WIDGET_CATALOG, type DashboardWidgetType } from "@/lib/dashboard";
import { useT } from "@/lib/i18n/client";

// Only offers widget types not already on the dashboard — the
// (userId, widgetType) unique index backs this up server-side, but the
// picker shouldn't offer a choice it's just going to reject.
export function AddWidgetDialog({
  presentTypes,
  onAdd,
}: {
  presentTypes: Set<DashboardWidgetType>;
  onAdd: (widgetType: DashboardWidgetType) => void;
}) {
  const { t } = useT();
  const available = (
    Object.keys(WIDGET_CATALOG) as DashboardWidgetType[]
  ).filter((type) => !presentTypes.has(type));

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button variant="outline">
            <PlusIcon />
            {t("dashboard.addWidget")}
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("dashboard.addAWidget")}</DialogTitle>
          <DialogDescription>{t("dashboard.chooseWidget")}</DialogDescription>
        </DialogHeader>
        {available.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t("dashboard.allWidgetsAdded")}
          </p>
        ) : (
          <ul className="flex flex-col gap-1">
            {available.map((type) => (
              <li key={type}>
                <DialogClose
                  render={
                    <button
                      type="button"
                      onClick={() => onAdd(type)}
                      className="flex w-full flex-col items-start gap-0.5 rounded-md px-2 py-1.5 text-left hover:bg-muted"
                    >
                      <span className="text-sm font-medium">
                        {t(WIDGET_CATALOG[type].label)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {t(WIDGET_CATALOG[type].description)}
                      </span>
                    </button>
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
