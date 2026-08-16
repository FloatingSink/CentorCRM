import path from "node:path";

// legal_entity.letterhead_asset stores just a filename (e.g. "CGPL.png",
// public/logos/README.md's own convention) — react-pdf's <Image> reads
// straight off disk server-side, so this resolves it to an absolute path
// under public/logos/ rather than a URL. Most entities have no logo yet
// (column is null until each one's asset lands), so callers only render
// the image when this returns non-null.
export function letterheadImagePath(
  letterheadAsset: string | null,
): string | null {
  if (!letterheadAsset) return null;
  return path.join(process.cwd(), "public", "logos", letterheadAsset);
}
