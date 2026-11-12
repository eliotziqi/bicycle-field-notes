// Run against a production build; current content is the fixture, never publish test Posts.
import assert from "node:assert/strict";
import fs from "node:fs";
import { parsePost } from "../scripts/post-metadata.mjs";
import { postEditorialSchema, postMonthSchema } from "../src/schemas/post-editorial.ts";
import { formatMonth, formatMonthRange } from "../src/utils/post-dates.ts";
const base = new URL(process.env.SITE_URL ?? "https://eliotziqi.github.io/bicycle-field-notes/").pathname;
for (const file of fs.readdirSync("src/content/posts").filter((file) => /\.mdx?$/.test(file))) {
  const data = parsePost(fs.readFileSync(`src/content/posts/${file}`, "utf8")).document.toJS();
  const id = file.replace(/\.mdx?$/, "");
  const target = `dist/posts/${id}/index.html`;
  if (data.draft) { assert(!fs.existsSync(target), `draft route ${id}`); continue; }
  const html = fs.readFileSync(target, "utf8");
  const metadata = /<div class="meta article-metadata"[^>]*>([\s\S]*?)<\/div>/.exec(html)?.[1];
  assert(metadata, id);
  for (const [key, label] of [["pubDate", "Published"], ["updatedDate", "Updated"]]) {
    const month = postMonthSchema.parse(data[key]);
    if (month) { assert(metadata.includes(`${label}:`)); assert(metadata.includes(`datetime="${month}"`)); assert(metadata.includes(formatMonth(month))); }
    else assert(!metadata.includes(`${label}:`));
  }
  assert(!/datetime="\d{4}-\d{2}-\d{2}/.test(metadata));
  const editorial = postEditorialSchema.parse(data);
  if (editorial.experience.length) assert(metadata.includes(editorial.experience.map((range) => formatMonthRange(range)).join(", ")));
  const footer = /<section class="post-geography"[^>]*>([\s\S]*?)<\/section>/.exec(html)?.[1];
  if (!editorial.relatedPlaces.length && !editorial.relatedTrips.length) assert(!footer);
  else {
    assert(footer.includes("Explore in Atlas"));
    assert(!footer.includes("Experience") && !footer.includes("Focus"));
    for (const [kind, rows, key] of [["place", editorial.relatedPlaces, "place"], ["trip", editorial.relatedTrips, "trip"]]) {
      const links = [...footer.matchAll(new RegExp(`href="${base}atlas/\\?${kind}=([^\"]+)"`, "g"))].map((match) => decodeURIComponent(match[1]));
      assert.deepEqual(links, [...new Set(rows.map((row) => row[key]))]);
    }
  }
  const jsonLd = JSON.parse(/<script type="application\/ld\+json">([^<]+)<\/script>/.exec(html)[1]);
  assert(!("datePublished" in jsonLd) && !("dateModified" in jsonLd));
  assert(!html.includes("rss.xml") && !html.includes("Places and journeys"));
}
const posts = fs.readFileSync("dist/posts/index.html", "utf8");
assert(!posts.includes('name="types"') && !posts.includes("Content type"));
assert(!fs.existsSync("dist/rss.xml"));
console.log("PASS article month precision, responsive-row structure, ordered/deduplicated Atlas footer, draft exclusion and RSS/type removal");
