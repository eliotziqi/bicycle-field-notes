import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { postsSchema, postTagsSchema, gallerySchema, galleryCategoriesSchema, placesSchema, tripsSchema, wikiSchema } from "./schemas/content";

const posts = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/posts" }),
  schema: postsSchema,
});
const postTags = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "./src/content/post-tags" }),
  schema: postTagsSchema,
});
const galleryCategories = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "./src/content/gallery-categories" }),
  schema: galleryCategoriesSchema,
});
const gallery = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "./src/content/gallery" }),
  schema: gallerySchema,
});
const places = defineCollection({
  // File IDs keep duplicate authored IDs visible to cross-record validation.
  loader: glob({ pattern: "**/*.json", base: "./src/content/places", generateId: ({ entry }) => entry.replace(/\.json$/i, "") }),
  schema: placesSchema,
});
const trips = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "./src/content/trips", generateId: ({ entry }) => entry.replace(/\.json$/i, "") }),
  schema: tripsSchema,
});
const wiki = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/wiki" }),
  schema: wikiSchema,
});
export const collections = { posts, postTags, gallery, galleryCategories, places, trips, wiki };
