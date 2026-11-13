import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { gallerySchema, placesSchema } from "../src/schemas/content.ts";
import { imageAlt } from "../src/utils/image-accessibility.ts";
import { auditMedia } from "../scripts/media-audit.mjs";
const photo = { image: "/media/a.png", title: "Editorial title", description: "Visible context", categories: ["Landscape"] };
const place = { id: "a", name: "A", description: "Place", latitude: 0, longitude: 0, status: ["visited"] };

test("informative images require alt and decoration remains explicit", () => {
  assert(!gallerySchema.safeParse(photo).success);
  assert(!gallerySchema.safeParse({ ...photo, alt: "   " }).success);
  assert(gallerySchema.safeParse({ ...photo, alt: "A meaningful visual description" }).success);
  assert(gallerySchema.safeParse({ ...photo, decorative: true }).success);
  assert(!gallerySchema.safeParse({ ...photo, decorative: true, alt: "Contradiction" }).success);
  assert.equal(imageAlt("Visual content", false), "Visual content");
  assert.equal(imageAlt(undefined, true), "");
  assert.throws(() => imageAlt(undefined, false), /require/);
  assert(placesSchema.safeParse(place).success);
  assert(!placesSchema.safeParse({ ...place, coverImage: "/media/a.png" }).success);
  assert(placesSchema.safeParse({ ...place, coverImage: "/media/a.png", coverAlt: "Visual content" }).success);
  assert(placesSchema.safeParse({ ...place, coverImage: "/media/a.png", coverDecorative: true }).success);
  assert(!placesSchema.safeParse({ ...place, coverImage: "/media/a.png", coverDecorative: true, coverAlt: "Contradiction" }).success);
});

test("media audit inventories reuse, hashes, missing references and accessibility review without writes", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "bfn-media-test-"));
  const sources = new Map();
  const write = (file, data) => { const text = typeof data === "string" ? data : JSON.stringify(data); sources.set(file, text); fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true }); fs.writeFileSync(path.join(root, file), text); };
  try {
    write("public/media/a file.png", "Identical bytes"); write("public/media/duplicate.png", "Identical bytes"); write("public/media/unused.svg", "<svg/>");
    write("src/content/gallery/a.json", { ...photo, image: "/bicycle-field-notes/media/a%20file.png" });
    write("src/content/places/a.json", { ...place, coverImage: "/media/a file.png", coverDecorative: true });
    write("src/content/posts/a.md", '---\ntitle: Draft\ndraft: true\n---\n![Alt][p]\n\n[p]: /bicycle-field-notes/media/a%20file.png\n\n<img src="/bicycle-field-notes/media/missing.svg">\n\n```md\n![Example](/media/not-real.png)\n```\n');
    write("src/content/posts/b.mdx", '---\ntitle: MDX\n---\n<img src="/bicycle-field-notes/media/a%20file.png" />\n<img src={dynamic} />');
    const report = auditMedia(root);
    assert.equal(report.files.find((file) => file.file.endsWith("a file.png")).uses.length, 4);
    assert.equal(report.identical.length, 1);
    assert.equal(report.identical[0].files.length, 2);
    assert.equal(report.missing.length, 1); assert(report.missing[0].reference.endsWith("missing.svg"));
    assert.equal(report.altReviews.length, 1);
    assert(report.diagnostics.some((issue) => issue.message.includes("Dynamic MDX")));
    assert.equal(report.files.find((file) => file.file.endsWith("unused.svg")).uses.length, 0);
    for (const [file, source] of sources) assert.equal(fs.readFileSync(path.join(root, file), "utf8"), source);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});


test("Gallery references accept empty, single and multiple values; links preserve order and hide drafts", async () => {
  const { relatedGalleryPosts } = await import("../src/utils/gallery-posts.ts");
  const parse = (value) => gallerySchema.parse({ ...photo, alt: "Visual content", relatedPost: value }).relatedPost;
  for (const value of [undefined, null, "", []]) assert.deepEqual(parse(value), []);
  assert.deepEqual(parse("src/content/posts/a.md"), ["src/content/posts/a.md"]);
  const refs = ["src/content/posts/b.mdx", "a", "src/content/posts/a.md", "draft", "missing"];
  assert.deepEqual(parse(refs), refs);
  assert(!gallerySchema.safeParse({ ...photo, decorative: true, relatedPost: [""] }).success);
  const posts = [
    { id: "a", data: { title: "A" } },
    { id: "b", filePath: "src/content/posts/b.mdx", data: { title: "B" } },
    { id: "draft", data: { title: "Hidden", draft: true } },
  ];
  assert.deepEqual(relatedGalleryPosts(refs, posts), [{ title: "B", url: "/posts/b/" }, { title: "A", url: "/posts/a/" }]);
  assert.deepEqual(relatedGalleryPosts([], posts), []);
});
