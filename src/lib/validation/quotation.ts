import { createSchemaFactory } from "drizzle-zod";
import { z } from "zod";

import { quotation } from "@/db/schema/quotation";

const { createInsertSchema } = createSchemaFactory({ coerce: { date: true } });

// quoteNo/version/status are assigned by the server (numbering, versioning,
// status-transition actions), never user input here.
export const quotationHeaderSchema = createInsertSchema(quotation, {
  currency: (schema) => schema.length(3, "Currency must be a 3-letter code"),
}).omit({
  id: true,
  quoteNo: true,
  version: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
});

export type QuotationHeaderInput = z.infer<typeof quotationHeaderSchema>;

// Not table-derived: unitPrice arrives as a major-unit string (converted via
// parseMoneyToMinorUnits against the header's currency in the action layer,
// same pattern as opportunities/actions.ts), and lineTotal is computed
// server-side (quotation-math.ts), never supplied by the client.
export const quotationLineInputSchema = z.object({
  productId: z.uuid(),
  descriptionOverride: z.string().nullable(),
  quantity: z.number().int("Quantity must be a whole number").positive(),
  uom: z.string().nullable(),
  unitPrice: z.string().min(1, "Unit price is required"),
  discountPct: z.string().nullable(),
});

export type QuotationLineInput = z.infer<typeof quotationLineInputSchema>;

export const quotationCreateSchema = z.object({
  header: quotationHeaderSchema,
  lines: z
    .array(quotationLineInputSchema)
    .min(1, "At least one line item is required"),
});

// For the live PDF preview (unsaved draft) — quoteNo/version are real
// values from the builder's props when editing, or "DRAFT"/1 placeholders
// in create mode; never persisted, purely for display in the ephemeral
// preview render. Not .min(1) on lines — an empty-lines draft is a normal
// mid-typing state the preview action treats as "incomplete", not invalid.
export const quotationPreviewSchema = z.object({
  header: quotationHeaderSchema,
  lines: z.array(quotationLineInputSchema),
  quoteNo: z.string(),
  version: z.number().int().positive(),
});
