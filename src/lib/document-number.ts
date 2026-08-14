// crm-spec.md §7: quote/order references are generated per legal entity,
// e.g. "CGPL-Q-2026-0042". Format confirmed with Jia Long: entity short
// code, doc type letter, full issue date, then a per-entity sequence that
// never resets. Shared by quote-number.ts and sales/purchase order numbering
// (docs/decisions.md, 2026-08-12) rather than reimplemented per doc type.
export function buildDocumentNumber(
  shortCode: string,
  typeLetter: string,
  issueDate: Date,
  sequence: number,
): string {
  const year = issueDate.getUTCFullYear();
  const month = String(issueDate.getUTCMonth() + 1).padStart(2, "0");
  const day = String(issueDate.getUTCDate()).padStart(2, "0");
  const paddedSequence = String(sequence).padStart(4, "0");

  return `${shortCode}-${typeLetter}-${year}${month}${day}-${paddedSequence}`;
}
