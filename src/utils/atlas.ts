import { getCollection } from "astro:content";
import { existsSync } from "node:fs";
import { resolve, sep } from "node:path";
import { resolveAtlas } from "./atlas-graph";
import { getPosts } from "./posts";
import { withBase } from "./urls";

let productionGraph: ReturnType<typeof loadAtlas> | undefined;

/** Reuse the derived graph within a production build, but never cache watched dev data. */
export function getAtlas() {
  if (import.meta.env.DEV) return loadAtlas();
  return productionGraph ??= loadAtlas();
}

/** Resolve only published Post summaries; no article bodies/drafts reach the client. */
async function loadAtlas() {
  const [places, trips, posts] = await Promise.all([
    getCollection("places"), getCollection("trips"), getPosts(),
  ]);
  const data = resolveAtlas(
    places.map((entry) => ({ source: entry.filePath ?? `${entry.id}.json`, data: entry.data })),
    trips.map((entry) => ({ source: entry.filePath ?? `${entry.id}.json`, data: entry.data })),
    posts.map((post) => ({
      id: post.id, title: post.data.title, url: withBase(`/posts/${post.id}/`),
      source: post.filePath ?? `Post ${post.id}`, draft: post.data.draft,
      relatedPlaces: post.data.relatedPlaces, relatedTrips: post.data.relatedTrips,
    })),
  );
  const mediaRoot = resolve("public/media");
  for (const place of data.places) {
    if (!place.coverImage) continue;
    const prefix = withBase("/media/");
    const relative = place.coverImage.startsWith(prefix) ? place.coverImage.slice(prefix.length)
      : place.coverImage.startsWith("/media/") ? place.coverImage.slice("/media/".length) : undefined;
    const file = relative ? resolve(mediaRoot, relative) : "";
    if (!file.startsWith(mediaRoot + sep) || !existsSync(file) || !/\.(jpe?g|png|webp|avif)$/i.test(file)) {
      throw new Error(`Place ${place.id}: coverImage must reference an existing image under public/media/.`);
    }
    place.coverImage = withBase(`/media/${relative}`);
  }
  return data;
}
