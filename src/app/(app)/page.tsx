import { DashboardGrid, type DashboardWidgetData } from "./dashboard-grid";
import { auth } from "@/lib/auth";
import { t } from "@/lib/i18n/dictionary";
import { getLocale } from "@/lib/i18n/server";
import {
  getDashboardWidgets,
  getExpiringQuotations,
  getMyOpenOpportunities,
  getOpportunitiesByStage,
  getPipelineValueByCurrency,
  getPurchaseOrdersAwaitingConfirmation,
  getRecentActivity,
} from "@/server/dashboard";
import { getMyTasks } from "@/server/tasks";

export default async function HomePage() {
  const locale = await getLocale();
  const session = await auth();
  const userId = session!.user.id;

  const widgets = await getDashboardWidgets(userId);
  const present = new Set(widgets.map((w) => w.widgetType));

  // Only query for widget types actually on this user's dashboard.
  const [
    opportunitiesByStage,
    expiringQuotations,
    myOpenOpportunities,
    purchaseOrdersAwaitingConfirmation,
    pipelineValue,
    recentActivity,
    myTasks,
  ] = await Promise.all([
    present.has("opportunities_by_stage") ? getOpportunitiesByStage() : [],
    present.has("quotes_expiring") ? getExpiringQuotations() : [],
    present.has("my_open_opportunities") ? getMyOpenOpportunities(userId) : [],
    present.has("purchase_orders_awaiting_confirmation")
      ? getPurchaseOrdersAwaitingConfirmation()
      : [],
    present.has("pipeline_value") ? getPipelineValueByCurrency() : [],
    present.has("recent_activity") ? getRecentActivity() : [],
    present.has("my_tasks") ? getMyTasks() : [],
  ]);

  const data: DashboardWidgetData = {
    opportunities_by_stage: opportunitiesByStage,
    quotes_expiring: expiringQuotations,
    shipments_placeholder: undefined,
    my_open_opportunities: myOpenOpportunities,
    purchase_orders_awaiting_confirmation: purchaseOrdersAwaitingConfirmation,
    pipeline_value: pipelineValue,
    recent_activity: recentActivity,
    my_tasks: myTasks,
  };

  // Keys DashboardGrid by the widget list's identity (ids + sizes, order
  // included since array order is significant) so a remount — not a
  // useEffect syncing prop -> state — is what picks up a fresh layout
  // after router.refresh() following any add/remove/resize/reorder/reset.
  const widgetsKey = widgets.map((w) => `${w.id}:${w.size}`).join(",");

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-2xl">{t(locale, "dashboard.title")}</h2>
      <DashboardGrid key={widgetsKey} widgets={widgets} data={data} />
    </div>
  );
}
