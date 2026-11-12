/** Shared browser semantics; no DOM, Astro or search-engine dependency. */
export type Dimension = "tags" | "places" | "trips";
export type PostSort = "published-desc" | "experience-desc" | "experience-asc";
export interface PostFilters {
  query: string;
  tags: Set<string>;
  places: Set<string>;
  trips: Set<string>;
  sort: PostSort;
}
export interface DiscoverablePost {
  id: string;
  tags: string[];
  placeIds: string[];
  tripIds: string[];
  published: string;
  experience?: string;
}

export function readPostFilters(params: URLSearchParams): PostFilters {
  return {
    query: params.get("q") ?? "",
    // Keep legacy tags links and repeated `tag` values for comma-containing names.
    tags: new Set(params.has("tag") ? params.getAll("tag") : params.getAll("tags").flatMap((value) => value.split(",")).filter(Boolean)),
    places: new Set(params.getAll("place").filter(Boolean)),
    trips: new Set(params.getAll("trip").filter(Boolean)),
    sort: params.get("sort") === "experience-desc" || params.get("sort") === "experience-asc" ? params.get("sort") as PostSort : "published-desc",
  };
}

export function writePostFilters(params: URLSearchParams, state: PostFilters): URLSearchParams {
  const next = new URLSearchParams(params);
  for (const key of ["q", "tags", "tag", "type", "place", "trip", "sort"]) next.delete(key);
  if (state.query.trim()) next.set("q", state.query.trim());
  if ([...state.tags].some((tag) => tag.includes(","))) state.tags.forEach((tag) => next.append("tag", tag));
  else if (state.tags.size) next.set("tags", [...state.tags].join(","));
  state.places.forEach((value) => next.append("place", value));
  state.trips.forEach((value) => next.append("trip", value));
  if (state.sort !== "published-desc") next.set("sort", state.sort);
  return next;
}

export function matchesPost(post: DiscoverablePost, state: PostFilters): boolean {
  const any = (selected: Set<string>, values: string[]) => !selected.size || values.some((value) => selected.has(value));
  return any(state.tags, post.tags)
    && any(state.places, post.placeIds) && any(state.trips, post.tripIds);
}

export function comparePosts(a: DiscoverablePost, b: DiscoverablePost, sort: PostSort): number {
  if (sort !== "published-desc") {
    if (!a.experience && b.experience) return 1;
    if (a.experience && !b.experience) return -1;
    if (a.experience && b.experience && a.experience !== b.experience) {
      return sort === "experience-asc" ? a.experience.localeCompare(b.experience) : b.experience.localeCompare(a.experience);
    }
  }
  return b.published.localeCompare(a.published) || a.id.localeCompare(b.id);
}

export function postYear(post: DiscoverablePost, sort: PostSort): string {
  return sort === "published-desc" ? (post.published.slice(0, 4) || "Undated publication") : post.experience?.slice(0, 4) ?? "Undated experience";
}

export function isPostVisible(data: { draft?: boolean }, development = false): boolean {
  return development || !data.draft;
}
