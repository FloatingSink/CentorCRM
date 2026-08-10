// Validates the `legal_entity.short_code` convention seen in the spec's
// examples (CGPL, ITP, TTE, CTG): 2-5 uppercase letters, no digits or spaces.
export function isValidShortCode(code: string): boolean {
  return /^[A-Z]{2,5}$/.test(code);
}
