import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { postsSchema } from "../src/schemas/content.ts";
import { validateContent } from "../scripts/validate-content.mjs";
import { auditMedia } from "../scripts/media-audit.mjs";
const post = { title: "Legacy", description: "Existing article", draft: false };
test("Post covers remain optional and follow Place cover accessibility policy", () => {
  assert(postsSchema.safeParse(post).success);
  assert(postsSchema.safeParse({ ...post, coverImage: "" }).success);
  for (const coverAlt of [undefined, "", "   "]) assert(!postsSchema.safeParse({ ...post, coverImage: "/media/a.jpg", coverAlt }).success);
  assert(postsSchema.safeParse({ ...post, coverImage: "/media/a.jpg", coverAlt: "Bicycle beside a mountain road" }).success);
  assert(postsSchema.safeParse({ ...post, coverImage: "/media/a.jpg", coverDecorative: true }).success);
  assert(!postsSchema.safeParse({ ...post, coverImage: "/media/a.jpg", coverDecorative: true, coverAlt: "Conflict" }).success);
});
test("Post cover references are validated and inventoried independently of body and Gallery", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "bfn-covers-"));
  try {
    fs.mkdirSync(path.join(root, "src/content/posts"), { recursive: true });
    fs.mkdirSync(path.join(root, "public/media"), { recursive: true });
    const file = path.join(root, "src/content/posts/a.md");
    const source = "---\ntitle: Cover\ndescription: Fixture\ncoverImage: /bicycle-field-notes/media/a.jpg\ncoverDecorative: true\n---\nBody remains independent.\n";
    fs.writeFileSync(file, source);
    assert(validateContent(root).errors.some((e) => e.field === "coverImage"));
    fs.writeFileSync(path.join(root, "public/media/a.jpg"), "fixture bytes");
    assert.equal(validateContent(root).errors.length, 0);
    assert.equal(auditMedia(root).files[0].uses[0].field, "coverImage");
    assert.equal(fs.readFileSync(file, "utf8"), source);
    assert(!fs.existsSync(path.join(root, "src/content/gallery")));
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
