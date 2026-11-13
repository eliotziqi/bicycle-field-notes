import { z } from "astro/zod";
import { postEditorialSchema, postMonthSchema } from "./post-editorial.ts";

const stableId = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/);
const optionalText = z.preprocess(
  (value) => value === "" || value === null ? undefined : value,
  z.string().trim().min(1).optional(),
);
const optionalDate = z.preprocess(
  (value) => value === "" || value === null ? undefined : value,
  z.string().date().optional(),
);


export const postsSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().trim().min(1),
  pubDate: postMonthSchema,
  updatedDate: postMonthSchema,
  tags: z.array(z.string().trim().min(1)).default([]),
  featured: z.boolean().default(false),
  draft: z.boolean().default(false),
  ...postEditorialSchema.shape,
});

function checkImageAlt(data: { alt?: string; decorative?: boolean }, ctx: z.RefinementCtx, field = "alt") {
  if (data.decorative && data.alt?.trim()) ctx.addIssue({ code: "custom", path: [field], message: "Decorative images must have blank alt text; clear it or turn Decorative off." });
  if (!data.decorative && !data.alt?.trim()) ctx.addIssue({ code: "custom", path: [field], message: "Enter meaningful visual alt text, or explicitly mark this image decorative. Missing alt is not decorative." });
}

export const gallerySchema = z.object({
  image: z.string().min(1),
  alt: z.string().optional(),
  decorative: z.boolean().default(false),
  title: z.string().trim().min(1),
  description: z.string().trim().min(1),
  categories: z.array(z.string().min(1)).min(1),
  relatedPost: z.preprocess(
    (value) => value === "" || value == null ? [] : Array.isArray(value) ? value : [value],
    z.array(z.string().trim().min(1)),
  ),
  showOnHomepage: z.boolean().default(false),
}).superRefine((data, ctx) => checkImageAlt(data, ctx));

export const placesSchema = z.object({
  id: stableId,
  name: z.string().trim().min(1),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  description: z.string().trim().min(1),
  status: z.array(z.enum(["ridden", "visited", "wishlist"])).min(1),
  coverImage: optionalText,
  coverAlt: z.string().optional(),
  coverDecorative: z.boolean().default(false),
}).superRefine((data, ctx) => {
  if (data.coverImage) checkImageAlt({ alt: data.coverAlt, decorative: data.coverDecorative }, ctx, "coverAlt");
});

export const tripsSchema = z.object({
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
});

export const wikiSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  section: z.enum(["user", "publishing", "developer"]).optional(),
  order: z.number().int().nonnegative(),
});

export const galleryCategoriesSchema = z.object({ title: z.string().trim().min(1) });
