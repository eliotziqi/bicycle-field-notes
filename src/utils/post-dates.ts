export const MONTH_PATTERN = /^[0-9]{4}-(0[1-9]|1[0-2])$/;

export interface ExperienceRange { start?: string; end?: string }

/** Accept historical day precision without inventing a day for month-only values. */
export function toMonth(value: unknown): string | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  if (value instanceof Date && !Number.isNaN(value.valueOf())) value = value.toISOString();
  if (typeof value !== "string") throw new Error("Use a month in YYYY-MM format.");
  if (MONTH_PATTERN.test(value)) return value;
  if (/^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(value)) {
    const day = value.slice(0, 10);
    const parsed = new Date(value.length === 10 ? `${day}T00:00:00Z` : value);
    if (!Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === day) return day.slice(0, 7);
  }
  throw new Error("Use a valid month in YYYY-MM format.");
}

export function formatMonth(value: string, lang = "en"): string {
  return new Date(`${value}-01T00:00:00Z`).toLocaleDateString(lang, { month: "short", year: "numeric", timeZone: "UTC" });
}

export function formatMonthRange({ start, end }: ExperienceRange, lang = "en"): string {
  if (!start) return end ? `Until ${formatMonth(end, lang)}` : "";
  if (!end) return `From ${formatMonth(start, lang)}`;
  if (start === end) return formatMonth(start, lang);
  if (start.slice(0, 4) === end.slice(0, 4)) {
    const short = new Date(`${start}-01T00:00:00Z`).toLocaleDateString(lang, { month: "short", timeZone: "UTC" });
    return `${short}–${formatMonth(end, lang)}`;
  }
  return `${formatMonth(start, lang)} – ${formatMonth(end, lang)}`;
}

/** Sorting uses the latest known range start, independently of authored display order. */
export function experienceMonth(ranges: ExperienceRange[]): string | undefined {
  return ranges.map((range) => range.start ?? range.end).filter((value): value is string => !!value).sort().at(-1);
}
