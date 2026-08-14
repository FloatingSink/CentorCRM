// Avatar/chip initials — first letter of the first two words, uppercase
// ("Alpine Distributors" → "AD"). UI polish, not tested per CLAUDE.md's
// testing-scope rule (money/quantities/currency/numbering only).
export function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}
