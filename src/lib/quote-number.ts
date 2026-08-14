import { buildDocumentNumber } from "./document-number";

// Thin wrapper — the general date/sequence formatting lives in
// document-number.ts (docs/decisions.md, 2026-08-12), shared with sales/
// purchase order numbering. Kept as its own named function since call sites
// read more clearly as buildQuoteNumber(...) than
// buildDocumentNumber(..., "Q", ...).
export function buildQuoteNumber(
  shortCode: string,
  issueDate: Date,
  sequence: number,
): string {
  return buildDocumentNumber(shortCode, "Q", issueDate, sequence);
}
