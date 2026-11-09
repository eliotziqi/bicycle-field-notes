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

const stableId = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/);
const optionalText = z.preprocess(
  (value) => value === "" || value === null ? undefined : value,
  z.string().trim().min(1).optional(),
);
const optionalDate = z.preprocess(
  (value) => value === "" || value === null ? undefined : value,
  z.string().date().optional(),
);

const places = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "./src/content/places" }),
  schema: z.object({
    id: stableId,
    name: z.string().trim().min(1),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    description: z.string().trim().min(1),
    status: z.array(z.enum(["ridden", "visited", "wishlist"])).min(1),
    coverImage: optionalText,
  }),
});

const trips = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "./src/content/trips" }),
  schema: z.object({
    id: stableId,
    name: z.string().trim().min(1),
    startDate: optionalDate,
    endDate: optionalDate,
    // Keep one object per visit: A → B → A must retain both visits to A.
    places: z.array(z.object({ place: stableId })).min(1),
    description: optionalText,
  }).refine((trip) => !trip.startDate || !trip.endDate || trip.endDate >= trip.startDate, {
    message: "End date must not be before start date.",
    path: ["endDate"],
  }),
});

export const collections = { posts, gallery, galleryCategories, places, trips };
