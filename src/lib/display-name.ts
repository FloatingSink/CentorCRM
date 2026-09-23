// Moved out of src/lib/pdf/format.ts (which re-exports it, so the PDF call
// sites are unchanged) once the web UI needed it too: importing a module
// under pdf/ from a list page would have read as a mistake. Behaviour is
// untouched.
//
// Serves two callers with different meanings of `language`: a document's own
// `language` column (en | zh | bilingual) for PDFs, and the UI Locale
// (en | zh) for screens. The "bilingual" branch is unreachable from the UI
// side, which is fine — one function, no second copy.
export function pickName(
  nameEn: string,
  nameZh: string | null,
  language: string,
) {
  if (language === "en") return nameEn;
  if (language === "zh") return nameZh || nameEn;
  return nameZh ? `${nameEn} / ${nameZh}` : nameEn;
}
