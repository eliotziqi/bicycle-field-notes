import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const posts = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/posts" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    // Pages CMS may serialize a cleared optional date as an empty value.
    updatedDate: z.preprocess(
      (value) => value === "" || value === null ? undefined : value,
      z.coerce.date().optional(),
    ),
    tags: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
  }),
});

const galleryCategories = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "./src/content/gallery-categories" }),
  schema: z.object({ title: z.string().trim().min(1) }),
});

const gallery = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "./src/content/gallery" }),
  schema: z.object({
    image: z.string().min(1),
    title: z.string().trim().min(1),
    description: z.string().trim().min(1),
    categories: z.array(z.string().min(1)).min(1),
    relatedPost: z.preprocess(
      (value) => value === "" || value === null ? undefined : value,
      z.string().optional(),
    ),
    showOnHomepage: z.boolean().default(false),
  }),
});

export const collections = { posts, gallery, galleryCategories };
