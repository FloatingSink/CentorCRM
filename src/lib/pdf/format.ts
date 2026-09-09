// Shared by every document in this directory — moved here (rather than kept
// as private per-file copies) once document-header.tsx needed pickName too,
// which would've made a third copy.
export function pickName(
  nameEn: string,
  nameZh: string | null,
  language: string,
) {
  if (language === "en") return nameEn;
  if (language === "zh") return nameZh || nameEn;
  return nameZh ? `${nameEn} / ${nameZh}` : nameEn;
}

export function formatDate(date: Date | null): string {
  if (!date) return "—";
  return date.toISOString().slice(0, 10);
}

// react-pdf's line-breaker only splits on a literal ASCII space
// (@react-pdf/textkit splits words on /([ ]+)/g — confirmed by reading its
// source) and has no awareness of Chinese punctuation as a break
// opportunity. Without any spaces, an entire unbroken Chinese sentence is
// one "word" to it: too long to fit a line, it either gets hyphenated with
// a nonsensical "-" or silently clipped rather than wrapped (observed both
// ways while building purchase-order-document.tsx). Inserting a real space
// after natural CJK punctuation gives it valid break points, same practical
// workaround used elsewhere for CJK text in non-CJK-aware line-breaking
// engines.
export function cjkWrap(text: string): string {
  return text.replace(/([，。；：、])/g, "$1 ");
}
