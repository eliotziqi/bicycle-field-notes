import { getCollection, type CollectionEntry } from "astro:content";
import { isPostVisible } from "./post-discovery";

export type Post = CollectionEntry<"posts">;

/** All published posts, newest first. Drafts are hidden in production builds. */
export async function getPosts(): Promise<Post[]> {
  const [posts, tags] = await Promise.all([
    getCollection("posts", ({ data }) => isPostVisible(data, import.meta.env.DEV)),
    getCollection("postTags"),
  ]);
  const titles = new Set(tags.map((tag) => tag.data.title));
  if (new Set(tags.map((tag) => tag.data.title.toLowerCase())).size !== tags.length) {
    throw new Error("Post Tag titles must be unique, including letter-case variants.");
  }
  for (const post of posts) for (const tag of post.data.tags) {
    if (!titles.has(tag)) throw new Error(`Post ${post.id}: unknown Post Tag "${tag}". Select an existing Post Tag or restore its record.`);
  }
  return posts.sort((a, b) => (b.data.pubDate ?? "").localeCompare(a.data.pubDate ?? "") || a.id.localeCompare(b.id));
}

export function tagCounts(posts: Post[]): { tag: string; count: number }[] {
  const map = new Map<string, number>();
  for (const p of posts) for (const t of p.data.tags) map.set(t, (map.get(t) ?? 0) + 1);
  return [...map]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

export function readingTime(body = ""): number {
  const words = body.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 225));
}

export { formatMonth as formatDate, formatMonth as formatShort } from "./post-dates";
