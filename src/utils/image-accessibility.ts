/** Only an explicit decorative choice permits an empty alternative. */
export function imageAlt(alt: string | undefined, decorative: boolean | undefined): string {
  if (decorative === true) return "";
  if (!alt?.trim()) throw new Error("Informative images require meaningful alt text.");
  return alt.trim();
}
