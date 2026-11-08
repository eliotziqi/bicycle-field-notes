/** Prefix internal paths with Astro's configured deployment base. */
export function withBase(path: string): string {
  if (!path.startsWith("/") || path.startsWith("//")) return path;
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  if (path === base || path.startsWith(base + "/")) return path;
  return `${base}${path}`;
}
