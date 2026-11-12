import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { isDeepStrictEqual } from "node:util";
import { pathToFileURL } from "node:url";
import { parseDocument } from "yaml";
import { toMonth } from "../src/utils/post-dates.ts";

export const STAMP_COMMIT = "chore(posts): maintain month metadata";

export function parsePost(source) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---(\r?\n|$)/.exec(source);
  if (!match) throw new Error("Expected YAML frontmatter.");
  const document = parseDocument(match[1]);
  if (document.errors.length) throw document.errors[0];
  const body = source.slice(match[0].length);
  return { document, body, newline: match[2] };
}

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
  const data = normalizeData(raw);
  const old = previous === undefined ? undefined : parsePost(previous);
  const oldData = old ? normalizeData(old.document.toJS()) : undefined;
  if (!migrateOnly) {
    if (!data.pubDate) data.pubDate = month;
    const edited = old && (!isDeepStrictEqual(normalizeData(raw), oldData) || current.body !== old.body);
    // A changed/cleared Updated value is an explicit choice for this edit.
    const manualUpdated = old && !isDeepStrictEqual(toMonth(raw.updatedDate), toMonth(old.document.toJS().updatedDate));
    if (edited && !manualUpdated) data.updatedDate = month;
  }
  for (const field of ["pubDate", "updatedDate", "experience"]) {
    if (data[field] === undefined) current.document.delete(field);
    else if (!isDeepStrictEqual(raw[field], data[field])) current.document.set(field, data[field]);
  }
  current.document.delete("contentType");
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
    const next = maintainPost(source, previous, month, migrateOnly);
    if (next !== source) pending.push([file, next]);
  }
  // Validate every candidate before writing any file.
  for (const [file, source] of pending) { fs.writeFileSync(file, source); console.log(`Updated ${file}`); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) run();
