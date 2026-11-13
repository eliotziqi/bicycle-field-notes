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
  const cms = load("lib/schema.ts", ["initializeState", "generateZodSchema", "deepMap", "sanitizeObject"], { z, schemas, defaultValues: { boolean: false } });
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
  // Verified native limitation: optional object lists accept unfinished rows.
  for (const field of ["experience", "relatedPlaces", "relatedTrips"]) {
    const incomplete = cms.initializeState(fields, { title: "Fixture", description: "Test", [field]: [{}] });
    assert(cms.generateZodSchema(fields).safeParse(incomplete).success);
    assert(!postEditorialSchema.safeParse({ [field]: [{}] }).success);
  }
  // Trace the real client -> API path: the form submits raw latest values,
  // the server validates, then deepMap rebuilds the absent row as an object.
  const fixture = { title: "Fixture", description: "Test", experience: [{}] };
  const rawState = cms.initializeState(fields, fixture);
  assert.deepEqual(rawState.experience, [{ start: "", end: "" }]);
  const validated = cms.generateZodSchema(fields).parse(rawState);
  assert.deepEqual(validated.experience, [undefined]);
  const apiMapped = cms.deepMap(validated, fields, (value) => value);
  const apiJson = JSON.parse(JSON.stringify(apiMapped));
  const saved = serial.parse(serial.stringify(cms.sanitizeObject(apiJson), { format: "yaml-frontmatter" }), { format: "yaml-frontmatter" });
  assert.deepEqual(saved.experience, [{}]);
  assert(!cms.generateZodSchema(fields).safeParse(cms.initializeState(fields, { ...fixture, experience: [{ start: "2026-11" }] })).success);
  const experience = fields.find((field) => field.name === "experience");
  const native = (overrides) => cms.generateZodSchema([{ ...experience, ...overrides }]);
  for (const required of [true, false]) {
    const schema = native({ required, list: { min: 0 } });
    assert.equal(schema.safeParse({ experience: [] }).success, !required);
    assert.equal(schema.safeParse({ experience: [{ start: "", end: "" }] }).success, !required);
    assert(schema.safeParse({ experience: [{ start: "2026-11", end: "2026-11" }] }).success);
  }
  // List size validates count, not completeness; object-level pattern is not applied.
  assert(native({ list: { min: 1 } }).safeParse({ experience: [{}] }).success);
  assert(native({ pattern: "^never$" }).safeParse({ experience: [{}] }).success);
  // Independent flat image metadata uses native text/boolean serialization.
  for (const collection of ["gallery", "places"]) {
    const names = collection === "gallery" ? ["alt", "decorative"] : ["coverAlt", "coverDecorative"];
    const imageFields = config.content.find((item) => item.name === collection).fields.filter((field) => names.includes(field.name));
    const values = { [names[0]]: "Human-written alternative", [names[1]]: false };
    for (const input of [values, { [names[1]]: true }, {}]) {
      const state = cms.initializeState(imageFields, input);
      const checked = cms.generateZodSchema(imageFields).parse(state);
      const saved = serial.parse(serial.stringify(cms.sanitizeObject(cms.deepMap(checked, imageFields, (value) => value)), { format: "yaml-frontmatter" }), { format: "yaml-frontmatter" });
      const reopened = cms.initializeState(imageFields, saved);
      for (const name of names) assert.equal(reopened[name], state[name]);
    }
  }
  const relatedField = config.content.find((item) => item.name === "gallery").fields.find((field) => field.name === "relatedPost");
  assert.equal(relatedField.options.multiple, true);
  assert.equal(relatedField.required, undefined);
  for (const [input, expected] of [[undefined, []], ["", []], [[], []], ["a.md", ["a.md"]], [["b.md", "a.md"], ["b.md", "a.md"]]]) {
    const state = cms.initializeState([relatedField], { relatedPost: input });
    const validated = cms.generateZodSchema([relatedField]).parse(state);
    const reopened = serial.parse(serial.stringify(cms.sanitizeObject(validated), { format: "yaml-frontmatter" }), { format: "yaml-frontmatter" });
    assert.deepEqual(cms.generateZodSchema([relatedField]).parse(cms.initializeState([relatedField], reopened)).relatedPost, expected);
  }
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
