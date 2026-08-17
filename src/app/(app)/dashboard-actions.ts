"use server";

import {
  dashboardWidgetIdSchema,
  dashboardWidgetSizeSchema,
  dashboardWidgetTypeSchema,
  setDashboardWidgetPositionsSchema,
} from "@/lib/validation/dashboard";
import { requireUserOrError } from "@/server/auth";
import {
  addDashboardWidget,
  removeDashboardWidget,
  resetDashboard,
  resizeDashboardWidget,
  setDashboardWidgetPositions,
} from "@/server/dashboard";

// Not form-bound — dashboard-grid.tsx calls these directly from drag/click
// handlers, same precedent as quotations/actions.tsx's live-preview actions.

export async function addDashboardWidgetAction(
  widgetType: unknown,
): Promise<{ error?: string }> {
  const parsed = dashboardWidgetTypeSchema.safeParse(widgetType);
  if (!parsed.success) return { error: "Invalid widget type" };

  const user = await requireUserOrError();
  if ("error" in user) return user;

  await addDashboardWidget(user.id, parsed.data);
  return {};
}

export async function removeDashboardWidgetAction(
  widgetId: unknown,
): Promise<{ error?: string }> {
  const parsed = dashboardWidgetIdSchema.safeParse(widgetId);
  if (!parsed.success) return { error: "Invalid widget id" };

  const user = await requireUserOrError();
  if ("error" in user) return user;

  await removeDashboardWidget(user.id, parsed.data);
  return {};
}

export async function resizeDashboardWidgetAction(
  widgetId: unknown,
  size: unknown,
): Promise<{ error?: string }> {
  const parsedId = dashboardWidgetIdSchema.safeParse(widgetId);
  const parsedSize = dashboardWidgetSizeSchema.safeParse(size);
  if (!parsedId.success || !parsedSize.success) {
    return { error: "Invalid input" };
  }

  const user = await requireUserOrError();
  if ("error" in user) return user;

  await resizeDashboardWidget(user.id, parsedId.data, parsedSize.data);
  return {};
}

export async function setDashboardWidgetPositionsAction(
  updates: unknown,
): Promise<{ error?: string }> {
  const parsed = setDashboardWidgetPositionsSchema.safeParse(updates);
  if (!parsed.success) return { error: "Invalid input" };

  const user = await requireUserOrError();
  if ("error" in user) return user;

  await setDashboardWidgetPositions(user.id, parsed.data);
  return {};
}

export async function resetDashboardAction(): Promise<{ error?: string }> {
  const user = await requireUserOrError();
  if ("error" in user) return user;

  await resetDashboard(user.id);
  return {};
}
