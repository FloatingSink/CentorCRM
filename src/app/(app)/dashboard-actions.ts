"use server";

import { auth } from "@/lib/auth";
import {
  dashboardWidgetIdSchema,
  dashboardWidgetSizeSchema,
  dashboardWidgetTypeSchema,
  setDashboardWidgetPositionsSchema,
} from "@/lib/validation/dashboard";
import {
  addDashboardWidget,
  removeDashboardWidget,
  resetDashboard,
  resizeDashboardWidget,
  setDashboardWidgetPositions,
} from "@/server/dashboard";

// Not form-bound — dashboard-grid.tsx calls these directly from drag/click
// handlers, same precedent as quotations/actions.tsx's live-preview actions.

async function requireUserId(): Promise<string | { error: string }> {
  const session = await auth();
  if (!session?.user) return { error: "Not signed in" };
  return session.user.id;
}

export async function addDashboardWidgetAction(
  widgetType: unknown,
): Promise<{ error?: string }> {
  const parsed = dashboardWidgetTypeSchema.safeParse(widgetType);
  if (!parsed.success) return { error: "Invalid widget type" };

  const userId = await requireUserId();
  if (typeof userId !== "string") return userId;

  await addDashboardWidget(userId, parsed.data);
  return {};
}

export async function removeDashboardWidgetAction(
  widgetId: unknown,
): Promise<{ error?: string }> {
  const parsed = dashboardWidgetIdSchema.safeParse(widgetId);
  if (!parsed.success) return { error: "Invalid widget id" };

  const userId = await requireUserId();
  if (typeof userId !== "string") return userId;

  await removeDashboardWidget(userId, parsed.data);
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

  const userId = await requireUserId();
  if (typeof userId !== "string") return userId;

  await resizeDashboardWidget(userId, parsedId.data, parsedSize.data);
  return {};
}

export async function setDashboardWidgetPositionsAction(
  updates: unknown,
): Promise<{ error?: string }> {
  const parsed = setDashboardWidgetPositionsSchema.safeParse(updates);
  if (!parsed.success) return { error: "Invalid input" };

  const userId = await requireUserId();
  if (typeof userId !== "string") return userId;

  await setDashboardWidgetPositions(userId, parsed.data);
  return {};
}

export async function resetDashboardAction(): Promise<{ error?: string }> {
  const userId = await requireUserId();
  if (typeof userId !== "string") return userId;

  await resetDashboard(userId);
  return {};
}
