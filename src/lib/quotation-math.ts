// Parses a NUMERIC(5,2) percent string ("12.50") into hundredths-of-a-percent
// ("1250") using string arithmetic, not float — same reasoning as
// money.ts's parseMoneyToMinorUnits (a fixed 2-decimal-place NUMERIC never
// has a float-parsing edge case, but staying consistent avoids reintroducing
// one later if the column's scale ever changes).
function parsePercentToHundredths(pct: string): bigint {
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
  if (!discountPct) {
    return Number(gross);
  }

  const hundredths = parsePercentToHundredths(discountPct);
  const denominator = BigInt(10000);
  const numerator = gross * (denominator - hundredths);
  const rounded = (numerator + denominator / BigInt(2)) / denominator;

  return Number(rounded);
}
