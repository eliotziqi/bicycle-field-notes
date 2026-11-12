import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";
import { postEditorialSchema, postMonthSchema } from "./schemas/post-editorial";

const posts = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/posts" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: postMonthSchema,
    updatedDate: postMonthSchema,
    tags: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
    ...postEditorialSchema.shape,
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
  // File-based loader IDs keep duplicate data.id values visible to graph validation.
  loader: glob({ pattern: "**/*.json", base: "./src/content/places", generateId: ({ entry }) => entry.replace(/\.json$/i, "") }),
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
  loader: glob({ pattern: "**/*.json", base: "./src/content/trips", generateId: ({ entry }) => entry.replace(/\.json$/i, "") }),
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

const wiki = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/wiki" }),
  schema: z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    section: z.enum(["user", "publishing", "developer"]).optional(),
    order: z.number().int().nonnegative(),
  }),
});

export const collections = { posts, gallery, galleryCategories, places, trips, wiki };
