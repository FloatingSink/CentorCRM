import { createSchemaFactory } from "drizzle-zod";
import { z } from "zod";

import { salesOrder } from "@/db/schema/sales-order";
import { quotationLineInputSchema } from "./quotation";

const { createInsertSchema } = createSchemaFactory({ coerce: { date: true } });

// orderNo/totalValue/status are assigned by the server (numbering, computed
// from lines, status-transition action), never user input here.
export const salesOrderHeaderSchema = createInsertSchema(salesOrder, {
  currency: (schema) => schema.length(3, "Currency must be a 3-letter code"),
  fxRateToSgd: (schema) =>
    schema.refine(
      (v) => Number(v) > 0,
      "FX rate to SGD must be a positive number",
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

export type SalesOrderHeaderInput = z.infer<typeof salesOrderHeaderSchema>;

// Same shape as a quotation line — reused rather than redefined.
export { quotationLineInputSchema as orderLineInputSchema };
export type { QuotationLineInput as OrderLineInput } from "./quotation";

export const salesOrderCreateSchema = z.object({
  header: salesOrderHeaderSchema,
  lines: z
    .array(quotationLineInputSchema)
    .min(1, "At least one line item is required"),
});
