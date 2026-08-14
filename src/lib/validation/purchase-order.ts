import { createSchemaFactory } from "drizzle-zod";
import { z } from "zod";

import { purchaseOrder } from "@/db/schema/purchase-order";
import { quotationLineInputSchema } from "./quotation";

const { createInsertSchema } = createSchemaFactory({ coerce: { date: true } });

// orderNo/totalValue/status are assigned by the server (numbering, computed
// from lines, status-transition action), never user input here — mirrors
// salesOrderHeaderSchema in ./sales-order.ts.
export const purchaseOrderHeaderSchema = createInsertSchema(purchaseOrder, {
  currency: (schema) => schema.length(3, "Currency must be a 3-letter code"),
  fxRateToSgd: (schema) =>
    schema.refine(
      (v) => Number(v) > 0,
      "FX rate to SGD must be a positive number",
    ),
  inspectionDays: (schema) =>
    schema.refine(
      (v) => Number.isInteger(v) && v > 0,
      "Inspection days must be a positive integer",
    ),
}).omit({
  id: true,
  orderNo: true,
  totalValue: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
});

export type PurchaseOrderHeaderInput = z.infer<
  typeof purchaseOrderHeaderSchema
>;

// Extends the shared quotation/sales-order line shape with net_weight_kg —
// purchase-order-specific (the real source template's 净重合计 remark), not
// added to quotationLineInputSchema itself since quotation_line has no such
// column.
export const purchaseOrderLineInputSchema = quotationLineInputSchema.extend({
  netWeightKg: z.string().nullable(),
});
export type PurchaseOrderLineInput = z.infer<
  typeof purchaseOrderLineInputSchema
>;

export const purchaseOrderCreateSchema = z.object({
  header: purchaseOrderHeaderSchema,
  lines: z
    .array(purchaseOrderLineInputSchema)
    .min(1, "At least one line item is required"),
});

// For the live PDF preview (unsaved draft) — same reasoning as
// quotationPreviewSchema in ./quotation.ts: orderNo is a real value from
// the builder's props when editing, or a "DRAFT" placeholder in create
// mode, never persisted; lines aren't required to be non-empty since an
// empty-lines draft is a normal mid-typing state, not invalid input.
export const purchaseOrderPreviewSchema = z.object({
  header: purchaseOrderHeaderSchema,
  lines: z.array(purchaseOrderLineInputSchema),
  orderNo: z.string(),
});
