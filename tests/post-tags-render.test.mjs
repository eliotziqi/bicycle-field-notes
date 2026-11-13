// After production build: verify public facets from actual content, not the catalog.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { parsePost } from "../scripts/content-source.mjs";
const root = process.argv[2] ?? process.cwd();
const html = fs.readFileSync(path.join(root, "dist/posts/index.html"), "utf8");
const filter = /<fieldset data-filter-dimension="tags">([\s\S]*?)<\/fieldset>/.exec(html)?.[1];
assert(filter);
const counts = new Map();
for (const file of fs.readdirSync(path.join(root, "src/content/posts")).filter((file) => /\.mdx?$/.test(file))) {
  const data = parsePost(fs.readFileSync(path.join(root, "src/content/posts", file), "utf8")).document.toJS();
  if (data.draft) continue;
  for (const tag of data.tags ?? []) counts.set(tag, (counts.get(tag) ?? 0) + 1);
}
const escape = (value) => value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
assert.equal([...filter.matchAll(/name="tags"/g)].length, counts.size);
for (const [tag, count] of counts) {
  assert(filter.includes(`value="${escape(tag)}"`));
  assert(filter.includes(`${escape(tag)} <span class="n">(${count})</span>`));
}
for (const file of fs.readdirSync(path.join(root, "src/content/post-tags"))) {
  const { title } = JSON.parse(fs.readFileSync(path.join(root, "src/content/post-tags", file), "utf8"));
  if (!counts.has(title)) assert(!filter.includes(`value="${escape(title)}"`), `unused/draft-only ${title}`);
}
assert(!fs.existsSync(path.join(root, "dist/tags")));
console.log("PASS visible-only Post tag facets/counts, unused/draft-only exclusion, and no tag routes");
