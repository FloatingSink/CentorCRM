// Format only (0-100 range is a validation-boundary concern, enforced by
// src/lib/validation/quotation.ts's discountPct schema, not here) — shape
// of a NUMERIC(5,2) column, non-negative.
const PERCENT_PATTERN = /^\d{1,3}(\.\d{1,2})?$/;

// Parses a NUMERIC(5,2) percent string ("12.50") into hundredths-of-a-percent
// ("1250") using string arithmetic, not float — same reasoning as
// money.ts's parseMoneyToMinorUnits (a fixed 2-decimal-place NUMERIC never
// has a float-parsing edge case, but staying consistent avoids reintroducing
// one later if the column's scale ever changes). Total, not partial: returns
// null for anything that doesn't match rather than throwing (remediation
// slice 4, docs/decisions.md) — this is called from order-line-editor.tsx's
// live preview on every keystroke, entirely outside zod, so it must not be
// capable of crashing on a stray character mid-type. The actual save path
// rejects malformed input earlier, at the zod boundary.
function parsePercentToHundredths(pct: string): bigint | null {
  if (!PERCENT_PATTERN.test(pct)) return null;
  const [intPart, fracPart = ""] = pct.split(".");
  const fracPadded = (fracPart + "00").slice(0, 2);
  return BigInt(intPart) * BigInt(100) + BigInt(fracPadded);
}

// Computes a quotation line's total in minor units: quantity * unit price,
// less the discount percentage, rounded half up. Entirely BigInt arithmetic
// to avoid float rounding (CLAUDE.md: money is integer minor units, never a
// float) — used both server-side (authoritative, on save) and client-side
// (live preview in the builder).
export function calculateLineTotal(
  quantity: number,
  unitPriceMinor: number,
  discountPct: string | null,
): number {
  const gross = BigInt(quantity) * BigInt(unitPriceMinor);
  const hundredths = discountPct ? parsePercentToHundredths(discountPct) : null;
  if (hundredths === null) {
    // Absent discount, or a malformed one that reached here anyway (only
    // possible from the un-gated live preview) — treat as no discount
    // rather than throwing.
    return Number(gross);
  }

  const denominator = BigInt(10000);
  const numerator = gross * (denominator - hundredths);
  const rounded = (numerator + denominator / BigInt(2)) / denominator;

  return Number(rounded);
}
