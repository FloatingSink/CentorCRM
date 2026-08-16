import { z } from "zod";

import {
  dashboardWidgetSizeEnum,
  dashboardWidgetTypeEnum,
} from "@/db/schema/dashboard-widget";

export const dashboardWidgetTypeSchema = z.enum(
  dashboardWidgetTypeEnum.enumValues,
);

export const dashboardWidgetSizeSchema = z.enum(
  dashboardWidgetSizeEnum.enumValues,
);

export const dashboardWidgetIdSchema = z.uuid();

// 1 entry = move to an empty spot, 2 = swap two widgets — see
// setDashboardWidgetPositions in src/server/dashboard.ts.
export const setDashboardWidgetPositionsSchema = z
  .array(
    z.object({
      id: z.uuid(),
      position: z.number().int().nonnegative(),
    }),
  )
  .min(1)
  .max(2);
