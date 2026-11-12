// Run after production build. No added HTML/parser dependency.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
const base = new URL(process.env.SITE_URL ?? "https://eliotziqi.github.io/bicycle-field-notes/").pathname;
const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name)]);
const files = walk("dist").filter((file) => file.endsWith(".html"));
const pages = new Map(files.map((file) => [file, fs.readFileSync(file, "utf8")]));
const wiki = [...pages].filter(([file]) => file.startsWith("dist/wiki/"));
const decode = (text) => text.replaceAll("&amp;", "&").replaceAll("&#39;", "'").replaceAll("&quot;", '"');
const errors = [];
for (const [file, html] of pages) {
  const current = new URL(base + file.replace(/^dist\//, "").replace(/index\.html$/, ""), "https://site.invalid");
  for (const match of html.matchAll(/<(?:a|link)\b[^>]*?\bhref="([^"]+)"/g)) {
    const href = decode(match[1]);
    const url = new URL(href, current);
    if (url.origin !== current.origin) continue;
    if (!url.pathname.startsWith(base)) { errors.push(`${file}: missing base in ${href}`); continue; }
    let target = "dist/" + decodeURIComponent(url.pathname.slice(base.length));
    if (target.endsWith("/")) target += "index.html";
    if (!fs.existsSync(target)) { errors.push(`${file}: missing ${href}`); continue; }
    if (url.hash && target.endsWith(".html")) {
      const id = decodeURIComponent(url.hash.slice(1));
      if (!pages.get(target)?.includes(`id="${id}"`)) errors.push(`${file}: missing fragment ${href}`);
    }
  }
}
assert.deepEqual(errors, [], errors.join("\n"));
const sources = walk("src/content/wiki").filter((file) => file.endsWith(".md"));
assert.equal(wiki.length, sources.length + 1); // Dedicated search route is not indexed.
for (const [file, html] of wiki) {
  assert(html.includes('aria-label="Wiki / Documentation"'), file);
  assert(html.includes('aria-label="Breadcrumb"'), file);
  assert(html.includes('aria-label="Documentation"'), file);
  assert(html.includes('rel="canonical"'), file);
  assert(!/\/(?:home|Users)\/[a-z]|\/tmp\/|(?:ghp_|github_pat_)[A-Za-z0-9_]+/.test(html), file);
  if (!file.includes("/search/")) assert(html.includes('data-pagefind-filter="kind:Wiki"'), file);
  else assert(!html.includes('data-pagefind-body'), "Search UI must not be indexed");
}
const sitemap = walk("dist").filter((file) => /sitemap.*\.xml$/.test(file)).map((file) => fs.readFileSync(file, "utf8")).join("");
for (const [file] of wiki) assert(sitemap.includes(base + file.replace(/^dist\//, "").replace(/index\.html$/, "")), file);
assert(!fs.existsSync("dist/rss.xml"), "RSS route must be absent");
for (const [file, html] of pages) assert(!html.includes("rss.xml") && !html.includes("application/rss+xml"), file);
assert(!fs.readFileSync("dist/posts/index.html", "utf8").includes("data-pagefind-filter=\"kind:Wiki"));
assert(fs.readFileSync("dist/pagefind/pagefind.js", "utf8").length > 0);
console.log(`PASS ${wiki.length} Wiki routes; all production internal links/fragments/base paths, SEO/sitemap, RSS removal, index boundaries and public-path checks`);
