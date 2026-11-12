import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { validateContent } from "../scripts/validate-content.mjs";

export function contentFixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "bfn-validation-"));
  const write = (file, source) => { const target = path.join(root, file); fs.mkdirSync(path.dirname(target), { recursive: true }); fs.writeFileSync(target, typeof source === "string" ? source : JSON.stringify(source)); };
  const post = (fields = "", body = "Valid **Markdown**.\n") => `---\ntitle: Fixture\ndescription: Fixture description\npubDate: "2026-11"\n${fields}---\n${body}`;
  write("src/content/posts/a.md", post('relatedPlaces:\n  - place: a\nrelatedTrips:\n  - trip: one\n'));
  write("src/content/gallery-categories/landscape.json", { title: "Landscape" });
  write("src/content/gallery/photo.json", { image: "/bicycle-field-notes/media/photo.png", title: "Photo", description: "Fixture", categories: ["Landscape"], relatedPost: "src/content/posts/a.md", showOnHomepage: true });
  write("src/content/places/a.json", { id: "a", name: "A", latitude: 30, longitude: 120, description: "Fixture", status: ["visited"], coverImage: "/bicycle-field-notes/media/photo.png" });
  write("src/content/trips/one.json", { id: "one", name: "One", places: [{ place: "a" }, { place: "a" }] });
  write("src/content/wiki/index.md", "---\ntitle: Wiki\ndescription: Fixture\norder: 0\n---\nStatic text.\n");
  fs.mkdirSync(path.join(root, "public/media"), { recursive: true });
  fs.writeFileSync(path.join(root, "public/media/photo.png"), Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=", "base64"));
  const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
  const cleanup = () => fs.rmSync(root, { recursive: true, force: true });
  return { root, write, read, post, cleanup };
}
const use = (fn) => { const fixture = contentFixture(); try { fn(fixture); } finally { fixture.cleanup(); } };

test("valid content across every collection, optional empty lists and repeated visits is accepted", () => use(({ root, write, post }) => {
  write("src/content/posts/empty.md", post('experience: []\nrelatedPlaces: []\nrelatedTrips: []\n'));
  const report = validateContent(root);
  assert.deepEqual(report.errors, []);
  assert.equal(report.files.length, 7);
}));

test("559caf6 regression: empty or partial Experience rows are rejected without sanitizing source", () => use(({ root, write, read, post }) => {
  for (const row of ['{}', '{start: "2026-11"}', '{end: "2026-11"}', '{start: "", end: ""}', 'null']) {
    const source = post(`experience:\n  - ${row}\n`);
    write("src/content/posts/a.md", source);
    const report = validateContent(root);
    assert(report.errors.some((issue) => issue.file === "src/content/posts/a.md" && issue.field.startsWith("experience[0]")));
    assert(report.errors.some((issue) => issue.action.includes("explicitly remove")));
    assert.equal(read("src/content/posts/a.md"), source);
  }
}));

test("month shapes, calendar dates and cross-field ordering are enforced", () => use(({ root, write, post }) => {
  for (const fields of ['pubDate: "2026-13"\n', 'experience: [{start: "2026-12", end: "2026-11"}]\n', 'experience: [{start: "2026-11-01", end: "2026-12"}]\n']) {
    write("src/content/posts/a.md", post().replace('pubDate: "2026-11"\n', "") .replace('---\nValid', `${fields}---\nValid`));
    assert(validateContent(root).errors.length > 0);
  }
  write("src/content/trips/one.json", { id: "one", name: "One", places: [{ place: "a" }], startDate: "2026-02-30", endDate: "2026-01-01" });
  assert(validateContent(root).errors.some((issue) => issue.file.endsWith("one.json") && issue.field === "startDate"));
}));

test("missing and invalid Place/Trip references are identified in every source row", () => use(({ root, write, post }) => {
  write("src/content/posts/a.md", post('relatedPlaces: [{place: gone}, {}]\nrelatedTrips: [{trip: missing}, {}]\n'));
  write("src/content/trips/one.json", { id: "one", name: "One", places: [{ place: "gone" }, {}] });
  const report = validateContent(root);
  for (const field of ["relatedPlaces[0].place", "relatedPlaces[1].place", "relatedTrips[0].trip", "relatedTrips[1].trip", "places[0].place", "places[1].place"]) assert(report.errors.some((issue) => issue.field === field), field);
}));

test("Gallery fields, categories, media and related article targets are validated", () => use(({ root, write }) => {
  write("src/content/gallery/photo.json", { image: "/bicycle-field-notes/media/missing.jpg", title: " ", description: "", categories: ["Gone"], relatedPost: "src/content/posts/missing.md" });
  const report = validateContent(root);
  for (const field of ["image", "title", "description", "categories[0]", "relatedPost"]) assert(report.errors.some((issue) => issue.field === field), field);
  write("src/content/gallery-categories/duplicate.json", { title: "Landscape" });
  assert(validateContent(root).errors.some((issue) => issue.message.includes("Duplicate title")));
}));

test("IDs, filenames, coordinate bounds, status and nonempty Trip visits are enforced", () => use(({ root, write }) => {
  write("src/content/places/a.json", { id: "changed", name: " ", latitude: 91, longitude: -181, description: " ", status: ["invalid"] });
  write("src/content/trips/one.json", { id: "one", name: "One", places: [] });
  const errors = validateContent(root).errors;
  for (const field of ["id", "name", "latitude", "longitude", "description", "status[0]", "places"]) assert(errors.some((issue) => issue.field === field), field);
}));

test("malformed frontmatter/JSON, duplicate keys and invalid MDX are actionable syntax errors", () => use(({ root, write, post }) => {
  write("src/content/posts/a.md", "---\ntitle: [\n---\nBody\n");
  write("src/content/posts/b.mdx", post("", '<Component value={'));
  write("src/content/gallery/broken.json", '{"title":');
  write("src/content/gallery-categories/duplicate-key.json", '{"title":"A", "title":"B"}');
  const errors = validateContent(root).errors;
  for (const file of ["a.md", "b.mdx", "broken.json", "duplicate-key.json"]) assert(errors.some((issue) => issue.file.endsWith(file) && issue.field.includes("syntax")), file);
}));

test("Markdown, reference-style, HTML and MDX static media paths are checked without scanning code examples", () => use(({ root, write, post }) => {
  write("src/content/posts/a.md", post("", '![Photo](/bicycle-field-notes/media/photo.png)\n\n![Missing][m]\n\n[m]: /bicycle-field-notes/media/missing.jpg\n\n<img src="/bicycle-field-notes/media/also-missing.jpg">\n\n```md\n![example](/nonexistent.jpg)\n```\n'));
  write("src/content/posts/b.mdx", post("", '<img src="/bicycle-field-notes/media/mdx-missing.jpg" />'));
  const errors = validateContent(root).errors.filter((issue) => issue.field === "body.media");
  assert.equal(errors.length, 3);
  assert(errors.every((issue) => issue.line > 1));
  assert(!errors.some((issue) => issue.message.includes("nonexistent.jpg")));
}));

test("failed validation preserves unrelated valid edits; correcting the bad row validates the full snapshot", () => use(({ root, write, read, post }) => {
  const validEdit = { image: "/bicycle-field-notes/media/photo.png", title: "Edited caption", description: "Valid saved edit", categories: ["Landscape"] };
  write("src/content/gallery/photo.json", validEdit);
  const invalid = post("experience: [{}]\n"); write("src/content/posts/a.md", invalid);
  const savedGallery = read("src/content/gallery/photo.json");
  assert(validateContent(root).errors.length > 0);
  assert.equal(read("src/content/gallery/photo.json"), savedGallery);
  assert.equal(read("src/content/posts/a.md"), invalid);
  write("src/content/posts/a.md", invalid.replace("experience: [{}]", "experience: []"));
  assert.deepEqual(validateContent(root).errors, []);
  assert.equal(read("src/content/gallery/photo.json"), savedGallery);
}));
