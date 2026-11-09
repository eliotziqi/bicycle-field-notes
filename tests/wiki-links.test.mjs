import assert from "node:assert/strict";
import { test } from "node:test";
import { wikiLink, wikiLinks } from "../src/utils/wiki-links.ts";
const source = "/repo/src/content/wiki/user/atlas.md";
test("Wiki relative sources, section indexes, anchors and site-root URLs respect project bases", () => {
  assert.equal(wikiLink("../publishing/index.md#d-publish", source, "/bicycle-field-notes/"), "/bicycle-field-notes/wiki/publishing/#d-publish");
  assert.equal(wikiLink("posts.md?from=guide#dates", source, "/"), "/wiki/user/posts/?from=guide#dates");
  assert.equal(wikiLink("../index.md", source, "/base/"), "/base/wiki/");
  assert.equal(wikiLink("/atlas/?place=a", source, "/base/"), "/base/atlas/?place=a");
  assert.equal(wikiLink("/base/wiki/", source, "/base/"), "/base/wiki/");
  for (const url of ["#focus", "https://example.org/", "mailto:owner@example.org", "//example.org/"]) assert.equal(wikiLink(url, source, "/base/"), url);
  assert.throws(() => wikiLink("../../../outside.md", source, "/base/"), /leaves its collection/);
});
test("native Markdown visitor never rewrites existing article links", () => {
  const changes = [];
  const context = (path) => ({ fileURL: new URL(`file://${path}`), setProperty: (node, key, value) => changes.push(value) });
  const plugin = wikiLinks("/base/");
  plugin.link({ url: "/atlas/" }, context("/repo/src/content/posts/post.md"));
  assert.equal(changes.length, 0);
  plugin.link({ url: "posts.md" }, context(source));
  plugin.definition({ url: "/gallery/" }, context(source));
  assert.deepEqual(changes, ["/base/wiki/user/posts/", "/base/gallery/"]);
});
