// Optional integration check against an inspected official Pages CMS checkout.
// PAGES_CMS_SOURCE=/path/to/pagescms node tests/cms-posts.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { stripTypeScriptTypes, createRequire } from "node:module";
import { parse as yamlParse } from "yaml";
import { postEditorialSchema } from "../src/schemas/post-editorial.ts";
const sourceRoot = process.env.PAGES_CMS_SOURCE;
const require = createRequire(import.meta.url);
const { z } = require("zod/v3");
function load(file, names, injected = {}) {
  const source = fs.readFileSync(`${sourceRoot}/${file}`, "utf8").replace(/^import .*?;?\s*$/gm, "").replace(/export\s*\{[\s\S]*?\};?/g, "");
  return new Function(...Object.keys(injected), `${stripTypeScriptTypes(source, { mode: "transform" })};return {${names.join(",")}}`)(...Object.values(injected));
}

test("CMS Post create/edit/save/reopen: month strings, optional lists, manual order and legacy Posts", { skip: !sourceRoot }, () => {
  const config = yamlParse(fs.readFileSync(".pages.yml", "utf8"));
  const fieldTypes = new Set([...fs.readFileSync(`${sourceRoot}/fields/registry.ts`, "utf8").matchAll(/registerField\("([^"]+)"/g)].map((match) => match[1]));
  load("lib/config-schema.ts", ["ConfigSchema"], { z, fieldTypes }).ConfigSchema.parse(config);
  const fields = config.content.find((collection) => collection.name === "posts").fields;
  assert(!fields.some((field) => field.name === "contentType"));
  const schemas = {};
  for (const type of ["string", "text", "boolean", "reference", "rich-text"]) schemas[type] = load(`fields/core/${type}/index.tsx`, ["schema"], { z }).schema;
  const cms = load("lib/schema.ts", ["initializeState", "generateZodSchema", "deepMap", "sanitizeObject"], { z, schemas, defaultValues: {} });
  const serial = load("lib/serialization.ts", ["parse", "stringify"], { YAML: { parse: yamlParse, stringify: require("yaml").stringify } });
  const roundTrip = (input) => {
    const state = cms.initializeState(fields, input);
    const validated = cms.generateZodSchema(fields).parse(state);
    // All Posts fields have no write hook: the buggy nested date writer is unreachable.
    assert.equal(JSON.stringify(fields).includes('"type":"date"'), false);
    const written = cms.deepMap(validated, fields, (value) => value);
    const reopened = serial.parse(serial.stringify(cms.sanitizeObject(written), { format: "yaml-frontmatter" }), { format: "yaml-frontmatter" });
    return cms.initializeState(fields, reopened);
  };
  const created = roundTrip({ title: "CMS fixture", description: "Test only", body: "## Original\n\n*Text*\n", draft: true });
  assert.equal(created.pubDate, "");
  assert.equal(created.updatedDate, "");
  assert.deepEqual(created.experience, []);
  const ranges = [{ start: "2025-06", end: "2025-06" }, { start: "2025-08", end: "2025-09" }, { start: "2026-05", end: "2026-05" }];
  const edited = roundTrip({ ...created, pubDate: "2026-11", updatedDate: "2026-12", experience: ranges, relatedPlaces: [{ place: "a" }, { place: "b" }, { place: "a" }], relatedTrips: [{ trip: "one" }, { trip: "one" }] });
  assert.deepEqual(edited.experience, ranges);
  assert.equal(edited.body, created.body);
  assert.deepEqual(edited.relatedPlaces.map((item) => item.place), ["a", "b", "a"]);
  assert.deepEqual(edited.relatedTrips.map((item) => item.trip), ["one", "one"]);
  assert.deepEqual(roundTrip({ ...edited, experience: ranges.toReversed() }).experience, ranges.toReversed());
  assert.deepEqual(roundTrip({ ...edited, experience: [] }).experience, []);
  assert.deepEqual(postEditorialSchema.parse(edited).experience, ranges);
  for (const month of ["2025-13", "2025-00", "2025-6", "2025-06-01"]) assert(!cms.generateZodSchema(fields).safeParse({ ...edited, pubDate: month }).success);
  assert(!postEditorialSchema.safeParse({ experience: [{ start: "2026-02", end: "2026-01" }] }).success);
  for (const file of fs.readdirSync("src/content/posts").filter((file) => /\.mdx?$/.test(file))) {
    const original = serial.parse(fs.readFileSync(`src/content/posts/${file}`, "utf8"), { format: "yaml-frontmatter" });
    const reopened = roundTrip(original);
    assert.equal(reopened.body, original.body);
    assert.deepEqual(postEditorialSchema.parse(reopened).experience, postEditorialSchema.parse(original).experience);
  }
});
