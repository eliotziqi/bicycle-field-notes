/** Only an explicit decorative choice produces an intentionally empty alternative. */
export function imageAlt(alt: string | undefined, decorative: boolean | undefined, legacyLabel: string): string {
  if (decorative === true) return "";
  return alt?.trim() || legacyLabel; // Temporary compatibility fallback; validation flags review.
}
