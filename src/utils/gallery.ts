import { getCollection } from "astro:content";
import { getPosts } from "./posts";
import { relatedGalleryPosts } from "./gallery-posts";
import { imageAlt } from "./image-accessibility";
import { withBase } from "./urls";
import { responsiveMedia } from "./responsive-media";

export async function getGallery() {
  const [entries, categories, posts] = await Promise.all([
    getCollection("gallery"), getCollection("galleryCategories"), getPosts(),
  ]);
  const categoryNames = categories.map((entry) => entry.data.title).sort((a, b) => a.localeCompare(b));
  if (new Set(categoryNames).size !== categoryNames.length) {
    throw new Error("Gallery category titles must be unique.");
  }
  const photos = await Promise.all(entries.sort((a, b) => a.data.title.localeCompare(b.data.title)).map(async (entry) => {
    const image = await responsiveMedia(entry.data.image);
    for (const category of entry.data.categories) {
      if (!categoryNames.includes(category)) throw new Error(`Gallery entry ${entry.id}: unknown category "${category}".`);
    }
    return {
      ...entry.data, id: entry.id,
      alt: imageAlt(entry.data.alt, entry.data.decorative),
      ...image,
      related: relatedGalleryPosts(entry.data.relatedPost, posts).map((post) => ({ ...post, url: withBase(post.url) })),
    };
  }));
  return { photos, categories: categoryNames };
}

export type GalleryPhoto = Awaited<ReturnType<typeof getGallery>>["photos"][number];
