/** Prefix internal paths with Astro's configured deployment base. */
export function withBase(path: string): string {
  if (!path.startsWith("/") || path.startsWith("//")) return path;
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  if (path === base || path.startsWith(base + "/")) return path;
  return `${base}${path}`;
}

/** Call withBase() at the UI boundary; this path never asks Atlas to Focus. */
export function atlasSelectionPath(type: "place" | "trip", id: string): string {
  return `/atlas/?${new URLSearchParams({ [type]: id })}`;
}
