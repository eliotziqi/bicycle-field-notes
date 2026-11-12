import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { isDeepStrictEqual } from "node:util";
import { pathToFileURL } from "node:url";
import { parsePost } from "./content-source.mjs";
import { postsSchema } from "../src/schemas/content.ts";
export { parsePost } from "./content-source.mjs";
import { toMonth } from "../src/utils/post-dates.ts";

export const STAMP_COMMIT = "chore(posts): maintain month metadata";

function normalizeData(data) {
  const result = { ...data };
  for (const field of ["pubDate", "updatedDate"]) {
    const month = toMonth(result[field]);
    if (month) result[field] = month;
    else delete result[field];
  }
  delete result.contentType;
  if (result.experience && !Array.isArray(result.experience)) {
    const { startDate, endDate } = result.experience;
    const start = toMonth(startDate), end = toMonth(endDate);
    // Never invent the missing endpoint of a historical open range.
    result.experience = start && end ? [{ start, end }] : start || end ? { startDate: start, endDate: end } : [];
  }
  if (Array.isArray(result.experience)) {
    result.experience = result.experience.map(({ start, end }) => {
      const range = { start: toMonth(start), end: toMonth(end) };
      if (!range.start || !range.end || range.end < range.start) throw new Error("Experience ranges require valid YYYY-MM start/end with end >= start.");
      return range;
    });
    if (!result.experience.length) delete result.experience;
  }
  return result;
}

/** Only managed metadata is rewritten; Markdown/MDX bodies and other fields stay intact. */
export function maintainPost(source, previous, month, migrateOnly = false) {
  if (toMonth(month) !== month) throw new Error("Expected YYYY-MM stamping month.");
  const current = parsePost(source);
  const raw = current.document.toJS();
  const checked = postsSchema.safeParse(raw);
  if (!checked.success) throw new Error(`Post metadata is incomplete or invalid; correct the saved source before automatic updates. ${checked.error.message}`);
  const data = normalizeData(raw);
  let old;
  if (previous !== undefined) {
    try { old = parsePost(previous); }
    catch { old = { document: { toJS: () => ({}) }, body: previous }; }
  }
  let oldData;
  if (old) {
    try { oldData = normalizeData(old.document.toJS()); }
    catch { oldData = old.document.toJS(); } // A corrected edit must recover from an invalid parent.
  }
  if (!migrateOnly) {
    if (!data.pubDate) data.pubDate = month;
    const edited = old && (!isDeepStrictEqual(normalizeData(raw), oldData) || current.body !== old.body);
    // A changed/cleared Updated value is an explicit choice for this edit.
    let oldUpdated;
    try { oldUpdated = toMonth(old?.document.toJS().updatedDate); }
    catch { oldUpdated = old?.document.toJS().updatedDate; }
    const manualUpdated = old && !isDeepStrictEqual(toMonth(raw.updatedDate), oldUpdated);
    if (edited && !manualUpdated) data.updatedDate = month;
  }
  for (const field of migrateOnly ? ["pubDate", "updatedDate", "experience"] : ["pubDate", "updatedDate"]) {
    if (data[field] === undefined) current.document.delete(field);
    else if (!isDeepStrictEqual(raw[field], data[field])) current.document.set(field, data[field]);
  }
  if (migrateOnly) current.document.delete("contentType");
  const next = `---\n${current.document.toString()}---${current.newline}${current.body}`;
  return next;
}

function run() {
  const git = (...args) => execFileSync("git", args, { encoding: "utf8" }).trim();
  const files = git("ls-files", "-z", "src/content/posts").split("\0").filter((file) => /\.mdx?$/.test(file));
  const migrateOnly = process.argv.includes("--migrate");
  const pending = [];
  for (const file of files) {
    const revision = git("log", "-1", "--format=%H", "--", file);
    if (!migrateOnly && git("show", "-s", "--format=%s", revision) === STAMP_COMMIT) continue;
    const month = new Date(git("show", "-s", "--format=%cI", revision)).toISOString().slice(0, 7);
    let exists = true;
    try { execFileSync("git", ["cat-file", "-e", `${revision}^:${file}`], { stdio: "ignore" }); }
    catch { exists = false; }
    const previous = exists ? execFileSync("git", ["show", `${revision}^:${file}`], { encoding: "utf8" }) : undefined;
    const source = fs.readFileSync(file, "utf8");
    let next;
    try { next = maintainPost(source, previous, month, migrateOnly); }
    catch (error) { throw new Error(`${file}: ${error.message}`); }
    if (next !== source) pending.push([file, next]);
  }
  // Validate every candidate before writing any file.
  for (const [file, source] of pending) { fs.writeFileSync(file, source); console.log(`Updated ${file}`); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) run();
