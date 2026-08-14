// Shared by every list page's search input (each filters its own
// already-loaded data client-side, same useMemo pattern as the existing
// status/active Segmented filters) and the document library's search —
// pulled into one function so a future global search, if built, reuses the
// same matching semantics rather than re-deriving them per entity.
export function matchesQuery(
  values: (string | null | undefined)[],
  query: string,
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return values.some((v) => v?.toLowerCase().includes(q));
}
