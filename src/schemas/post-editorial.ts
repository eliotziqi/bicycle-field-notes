import { z } from "astro/zod";
import { toMonth, MONTH_PATTERN } from "../utils/post-dates.ts";

const absent = (value: unknown) => value === "" || value === null ? undefined : value;
const stableId = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/);
export const postMonthSchema = z.unknown().transform((value, ctx) => {
  try { return toMonth(value); }
  catch (error) { ctx.addIssue({ code: "custom", message: (error as Error).message }); return z.NEVER; }
}).optional();
const range = z.object({
  start: z.string().regex(MONTH_PATTERN, "Enter a start month in YYYY-MM format."),
  end: z.string().regex(MONTH_PATTERN, "Enter an end month in YYYY-MM format."),
}).refine((value) => value.end >= value.start, { message: "Experience end must not be before start.", path: ["end"] });
const legacyRange = z.object({ startDate: postMonthSchema, endDate: postMonthSchema }).strict()
  .refine((value) => !value.startDate || !value.endDate || value.endDate >= value.startDate, {
    message: "Experience end must not be before start.", path: ["endDate"],
  }).transform((value) => value.startDate || value.endDate ? [{ start: value.startDate, end: value.endDate }] : []);
const optionalList = <T extends z.ZodType>(item: T) => z.preprocess(
  (value) => value === "" || value === null || value === undefined ? [] : value,
  z.array(item),
);

export const postEditorialSchema = z.object({
  relatedPlaces: optionalList(z.object({ place: stableId })),
  relatedTrips: optionalList(z.object({ trip: stableId })),
  experience: z.preprocess((value) => absent(value) ?? [], z.union([z.array(range), legacyRange])),
});
