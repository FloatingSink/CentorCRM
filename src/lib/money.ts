// CLAUDE.md: money is integer minor units + an ISO 4217 currency code, never a
// float. These are the only two places that convert between the minor-unit
// integer stored in the DB and the major-unit string a human types/reads.

export function minorUnitDigits(currency: string): number {
  return (
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).resolvedOptions().maximumFractionDigits ?? 2
  );
}

export function formatMoney(amountMinor: number, currency: string): string {
  const digits = minorUnitDigits(currency);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amountMinor / 10 ** digits);
}

const MONEY_PATTERN = /^-?\d+(\.\d+)?$/;

// Parses a user-typed major-unit amount ("72000.00") into an integer minor-unit
// amount. Deliberately avoids float multiplication (1.005 * 100 === 100.49999999999999
// in IEEE 754, which would silently round 1.005 down to 100 instead of 101) —
// works on the decimal string directly and finishes with BigInt arithmetic.
// Returns null for anything that isn't a valid decimal amount, rather than
// guessing — callers should surface that as a validation error.
export function parseMoneyToMinorUnits(
  input: string,
  currency: string,
): number | null {
  const trimmed = input.trim();
  if (!MONEY_PATTERN.test(trimmed)) {
    return null;
  }

  const digits = minorUnitDigits(currency);
  const negative = trimmed.startsWith("-");
  const unsigned = negative ? trimmed.slice(1) : trimmed;
  const [integerPart, fractionPart = ""] = unsigned.split(".");

  // One extra digit of precision to round on, then discard it.
  const padded = (fractionPart + "0".repeat(digits + 1)).slice(0, digits + 1);
  const kept = padded.slice(0, digits);
  const roundUp = padded[digits] >= "5";

  let minorUnits = BigInt(integerPart + kept);
  if (roundUp) {
    minorUnits += BigInt(1);
  }

  return Number(minorUnits) * (negative ? -1 : 1);
}

const FX_RATE_SCALE = BigInt(1_000_000); // matches numeric(12,6) columns

// Converts an amount already in minor units of its own currency into minor
// units of SGD, using a display-only snapshot rate (crm-spec.md §7: fx_rate_to_sgd
// is stored on the document, never recomputed from live rates). Same
// BigInt-based precision discipline as parseMoneyToMinorUnits above — the
// rate is a decimal string with up to 6 fractional digits, so a float
// multiply here would reintroduce the exact rounding bug that function
// exists to avoid. Used only for the margin section's display math; nothing
// stores this result.
export function convertMinorToSgd(
  amountMinor: number,
  fxRateToSgd: string,
): number {
  const trimmed = fxRateToSgd.trim();
  const negative = trimmed.startsWith("-");
  const unsigned = negative ? trimmed.slice(1) : trimmed;
  const [intPart, fracPart = ""] = unsigned.split(".");
  const fracPadded = (fracPart + "000000").slice(0, 6);
  const rateScaled =
    BigInt(intPart || "0") * FX_RATE_SCALE + BigInt(fracPadded);

  const product = BigInt(amountMinor) * (negative ? -rateScaled : rateScaled);
  const half = FX_RATE_SCALE / BigInt(2);
  const zero = BigInt(0);
  const rounded =
    product >= zero
      ? (product + half) / FX_RATE_SCALE
      : (product - half) / FX_RATE_SCALE;

  return Number(rounded);
}
