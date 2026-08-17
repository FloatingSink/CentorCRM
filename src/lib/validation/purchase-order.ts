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

// Shape of the net_weight_kg NUMERIC(10,3) column, non-negative.
const NET_WEIGHT_PATTERN = /^\d{1,7}(\.\d{1,3})?$/;

// Extends the shared quotation/sales-order line shape with net_weight_kg —
// purchase-order-specific (the real source template's 净重合计 remark), not
// added to quotationLineInputSchema itself since quotation_line has no such
// column. Previously a bare z.string() with zero validation of any kind —
// not even JS-parsed, so a malformed value was only ever caught by a raw
// Postgres error deep inside a transaction (remediation slice 4,
// docs/decisions.md).
export const purchaseOrderLineInputSchema = quotationLineInputSchema.extend({
  netWeightKg: z
    .string()
    .nullable()
    .refine(
      (v) => v === null || NET_WEIGHT_PATTERN.test(v),
      "Net weight must be a non-negative number, up to 3 decimal places",
    ),
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
