import { getCollection } from "astro:content";
import { getImage } from "astro:assets";
import type { ImageMetadata } from "astro";
import { getPosts } from "./posts";
import { relatedGalleryPosts } from "./gallery-posts";
import { imageAlt } from "./image-accessibility";
import { withBase } from "./urls";

// Imports only supply metadata/transforms for explicit entries; uploads are never entries.
const uploads = import.meta.glob<{ default: ImageMetadata }>(
  "/public/media/**/*.{jpg,jpeg,png,webp,avif,JPG,JPEG,PNG,WEBP,AVIF}",
);

function imageSet(candidates: [string, number][]) {
  // Small originals can collapse multiple target sizes to the same width.
  return [...new Map(candidates.map(([src, width]) => [width, src]))]
    .map(([width, src]) => `${src} ${width}w`).join(", ");
}

export async function getGallery() {
  const [entries, categories, posts] = await Promise.all([
    getCollection("gallery"), getCollection("galleryCategories"), getPosts(),
  ]);
  const categoryNames = categories.map((entry) => entry.data.title).sort((a, b) => a.localeCompare(b));
  if (new Set(categoryNames).size !== categoryNames.length) {
    throw new Error("Gallery category titles must be unique.");
  }
  const photos = await Promise.all(entries.sort((a, b) => a.data.title.localeCompare(b.data.title)).map(async (entry) => {
    const path = entry.data.image.replace(/^.*?(?=\/media\/)/, "");
    const load = uploads[`/public${path}`];
    if (!load) throw new Error(`Gallery entry ${entry.id}: select an existing image under public/media/.`);
    for (const category of entry.data.categories) {
      if (!categoryNames.includes(category)) throw new Error(`Gallery entry ${entry.id}: unknown category "${category}".`);
    }
    const { default: image } = await load();
    const thumbnail = await getImage({ src: image, width: Math.min(640, image.width), format: "webp", quality: 80 });
    const thumbnailSmall = await getImage({ src: image, width: Math.min(320, image.width), format: "webp", quality: 80 });
    const hero = await getImage({ src: image, width: Math.min(1600, image.width), format: "webp", quality: 85 });
    const heroSmall = await getImage({ src: image, width: Math.min(800, image.width), format: "webp", quality: 85 });
    return {
      ...entry.data, id: entry.id,
      alt: imageAlt(entry.data.alt, entry.data.decorative),
      original: withBase(path), width: image.width, height: image.height,
      thumbnail: thumbnail.src,
      thumbnailSet: imageSet([[thumbnailSmall.src, Math.min(320, image.width)], [thumbnail.src, Math.min(640, image.width)]]),
      hero: hero.src,
      heroSet: imageSet([[heroSmall.src, Math.min(800, image.width)], [hero.src, Math.min(1600, image.width)]]),
      related: relatedGalleryPosts(entry.data.relatedPost, posts).map((post) => ({ ...post, url: withBase(post.url) })),
    };
  }));
  return { photos, categories: categoryNames };
}

export type GalleryPhoto = Awaited<ReturnType<typeof getGallery>>["photos"][number];
