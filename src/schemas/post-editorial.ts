import { z } from "astro/zod";
import { CONTENT_TYPES } from "../utils/post-discovery.ts";

const absent = (value: unknown) => value === "" || value === null ? undefined : value;
const stableId = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/);
// Astro's Markdown YAML parser may turn unquoted date-only values into Dates.
const optionalDate = z.preprocess((value) => value instanceof Date && !Number.isNaN(value.valueOf())
  ? value.toISOString().slice(0, 10) : absent(value), z.string().date().optional());
const optionalList = <T extends z.ZodType>(item: T) => z.preprocess(
  (value) => value === "" || value === null || value === undefined ? [] : value,
  z.array(item),
);

export const postEditorialSchema = z.object({
  contentType: z.preprocess(absent, z.enum(CONTENT_TYPES).optional()),
  relatedPlaces: optionalList(z.object({ place: stableId })),
  relatedTrips: optionalList(z.object({ trip: stableId })),
  experience: z.preprocess(absent, z.object({ startDate: optionalDate, endDate: optionalDate })
    .refine((range) => !range.startDate || !range.endDate || range.endDate >= range.startDate, {
      message: "Experience end date must not be before start date.", path: ["endDate"],
    }).transform((range) => range.startDate || range.endDate ? range : undefined).optional()),
});
