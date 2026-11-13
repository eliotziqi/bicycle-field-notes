import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { postsSchema, postTagsSchema } from "../src/schemas/content.ts";
import { parsePost } from "../scripts/content-source.mjs";
import { matchesPost, readPostFilters, comparePosts } from "../src/utils/post-discovery.ts";
const post = { title: "Fixture", description: "Fixture" };

test("central tag titles use Title Case; Post arrays stay compatible without new metadata", () => {
  for (const title of ["Personal", "Bikepacking", "Route Guides", "Gear Reviews", "GPS", "E-Bikes", "Planning for Adventure"]) assert(postTagsSchema.safeParse({ title }).success, title);
  for (const title of ["", "route guides", "Route guides", " Bikepacking", "2025-06"]) assert(!postTagsSchema.safeParse({ title }).success, title);
  for (const tags of [[], ["Personal"], ["Bikepacking", "Route Guides"]]) assert.deepEqual(postsSchema.parse({ ...post, tags }).tags, tags);
  assert.deepEqual(postsSchema.parse(post).tags, []);
  for (const tags of [["Personal", "Personal"], [""], [null], "Personal"]) assert(!postsSchema.safeParse({ ...post, tags }).success);
  const existing = parsePost(fs.readFileSync("src/content/posts/beyond-the-route.md", "utf8")).document.toJS();
  assert.deepEqual(postsSchema.parse(existing).tags, existing.tags);
  assert.equal(JSON.parse(fs.readFileSync("src/content/post-tags/Personal.json", "utf8")).title, "Personal");
});

test("tag references preserve OR filtering, URL state, combined dimensions and sorting", () => {
  const a = { id: "a", tags: ["Bikepacking"], placeIds: ["place"], tripIds: [], published: "2026-02" };
  const b = { ...a, id: "b", tags: ["Route Guides"], published: "2026-01" };
  const filters = readPostFilters(new URLSearchParams("tags=Bikepacking,Route+Guides&place=place&q=camping"));
  assert(matchesPost(a, filters)); assert(matchesPost(b, filters));
  assert(!matchesPost({ ...a, tags: ["Personal"] }, filters));
  assert(!matchesPost({ ...a, placeIds: [] }, filters));
  assert.deepEqual([b, a].sort((x, y) => comparePosts(x, y, filters.sort)).map((post) => post.id), ["a", "b"]);
});
