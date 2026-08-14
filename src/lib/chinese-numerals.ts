// 人民币大写 — the capital-numeral amount Chinese financial/legal documents
// spell out alongside the numeral total, specifically to prevent alteration
// (e.g. changing "100" to "1000" is easy; changing "壹佰" to "壹仟" is not).
// Deliberately CNY-specific — this convention doesn't generalize to other
// currencies, so callers should only invoke it when currency === "CNY".

const DIGITS = ["零", "壹", "贰", "叁", "肆", "伍", "陆", "柒", "捌", "玖"];
const SMALL_UNITS = ["", "拾", "佰", "仟"]; // position within a 4-digit group
const BIG_UNITS = ["", "万", "亿", "万亿"]; // every 4 digits; "万亿" covers amounts far beyond any real PO

// Converts a non-negative integer to Chinese capital numerals, handling the
// zero-bridging rules the convention requires: a single 零 is inserted
// wherever digits are skipped between two non-zero digits (e.g. 10005 ->
// 壹万零伍), but never for purely trailing zeros (1050 -> 壹仟零伍拾, not
// 壹仟零伍拾零) or a fully-zero group that isn't followed by more non-zero
// digits (130000 -> 壹拾叁万, not 壹拾叁万零).
function numberToChineseInteger(num: number): string {
  if (num === 0) return DIGITS[0];

  const digitsStr = String(num);
  const n = digitsStr.length;

  let result = "";
  let zeroPending = false;
  let groupHasDigits = false;

  for (let i = 0; i < n; i++) {
    const d = Number(digitsStr[i]);
    const posFromRight = n - 1 - i;
    const smallUnitIdx = posFromRight % 4;
    const groupIdx = Math.floor(posFromRight / 4);

    if (d === 0) {
      zeroPending = true;
    } else {
      if (zeroPending && result !== "") {
        result += DIGITS[0];
      }
      zeroPending = false;
      result += DIGITS[d] + SMALL_UNITS[smallUnitIdx];
      groupHasDigits = true;
    }

    if (smallUnitIdx === 0) {
      if (groupHasDigits) {
        result += BIG_UNITS[groupIdx];
        zeroPending = false;
      }
      groupHasDigits = false;
    }
  }

  return result;
}

// amountMinor is integer fen (1/100 yuan), matching this codebase's
// integer-minor-units money convention (src/lib/money.ts).
export function rmbAmountToCapitalWords(amountMinor: number): string {
  if (!Number.isInteger(amountMinor) || amountMinor < 0) {
    throw new Error("amountMinor must be a non-negative integer");
  }

  const yuan = Math.floor(amountMinor / 100);
  const jiao = Math.floor((amountMinor % 100) / 10);
  const fen = amountMinor % 10;

  let result = numberToChineseInteger(yuan) + "元";

  // Official rule (人民银行结算办法): "整" follows 元 only for a whole-yuan
  // amount, follows 角 only when there are no fen at all, and never appears
  // when fen is present — 100.50 -> 壹佰元伍角整, not 壹佰元伍角.
  if (jiao === 0 && fen === 0) {
    result += "整";
  } else if (fen === 0) {
    result += DIGITS[jiao] + "角整";
  } else {
    result += jiao === 0 ? "零" : DIGITS[jiao] + "角";
    result += DIGITS[fen] + "分";
  }

  return result;
}
