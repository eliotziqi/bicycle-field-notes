import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { maintainPost, parsePost, STAMP_COMMIT } from "../scripts/post-metadata.mjs";

const text = (fields, body = "\n## Original\n\n![Photo](/bicycle-field-notes/media/original.jpg)\n") => `---\ntitle: Example\ndescription: "Metadata test"\ndraft: true\n${fields}---\n${body}`;
const data = (source) => parsePost(source).document.toJS();

test("Published initializes once and Updated stamps subsequent edits without changing the body", () => {
  const source = text("");
  const created = maintainPost(source, undefined, "2026-11");
  assert.equal(data(created).pubDate, "2026-11");
  assert.equal(data(created).updatedDate, undefined);
  const edited = created.replace("## Original", "## Edited");
  const updated = maintainPost(edited, created, "2026-12");
  assert.equal(data(updated).pubDate, "2026-11");
  assert.equal(data(updated).updatedDate, "2026-12");
  assert.equal(parsePost(updated).body, parsePost(edited).body);
  assert.equal(maintainPost(updated, edited, "2026-12"), updated);
});

test("manual publication and update changes (including clearing Updated) take precedence", () => {
  const before = text('pubDate: "2025-06"\nupdatedDate: "2025-07"\n');
  const manual = before.replace('"2025-06"', '"2024-01"').replace('"2025-07"', '"2025-03"');
  assert.equal(data(maintainPost(manual, before, "2026-11")).updatedDate, "2025-03");
  assert.equal(data(maintainPost(manual, before, "2026-11")).pubDate, "2024-01");
  const cleared = before.replace('updatedDate: "2025-07"\n', "");
  assert.equal(data(maintainPost(cleared, before, "2026-11")).updatedDate, undefined);
  assert.equal(data(maintainPost(before, before, "2026-11")).updatedDate, "2025-07");
});

test("legacy migration preserves bodies, flags, references and range order without inventing updates", () => {
  const legacy = text('pubDate: 2025-06-29\ncontentType: ride\nrelatedPlaces:\n  - place: a\n  - place: a\nexperience:\n  startDate: 2025-08-20\n  endDate: 2025-09-02\n');
  const next = maintainPost(legacy, legacy, "2026-11", true);
  assert.equal(data(next).pubDate, "2025-06");
  assert.deepEqual(data(next).experience, [{ start: "2025-08", end: "2025-09" }]);
  assert.deepEqual(data(next).relatedPlaces, [{ place: "a" }, { place: "a" }]);
  assert.equal(data(next).updatedDate, undefined);
  assert.equal(data(next).draft, true);
  assert.equal(data(next).contentType, undefined);
  assert.equal(parsePost(next).body, parsePost(legacy).body);
  assert.equal(maintainPost(next, legacy, "2026-11"), next);
  const open = text('experience:\n  endDate: 2025-09-02\n');
  assert.deepEqual(data(maintainPost(open, open, "2026-11", true)).experience, { endDate: "2025-09" });
  assert.throws(() => maintainPost(text('experience:\n  - start: "2026-12"\n    end: "2026-01"\n'), undefined, "2026-11"));
});

test("Git automation initializes, updates, respects manual overrides and skips its own commits", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "bfn-months-"));
  const script = path.resolve("scripts/post-metadata.mjs");
  const git = (...args) => execFileSync("git", args, { cwd: dir, stdio: "pipe", env: { ...process.env, GIT_AUTHOR_DATE: "2026-11-12T12:00:00Z", GIT_COMMITTER_DATE: "2026-11-12T12:00:00Z" } });
  const run = () => execFileSync(process.execPath, [script], { cwd: dir });
  try {
    git("init", "-q"); git("config", "user.name", "Fixture"); git("config", "user.email", "fixture@example.invalid");
    fs.mkdirSync(path.join(dir, "src/content/posts"), { recursive: true });
    const file = path.join(dir, "src/content/posts/example.md");
    fs.writeFileSync(file, text("")); git("add", "."); git("commit", "-qm", "Create Post"); run();
    assert.equal(data(fs.readFileSync(file, "utf8")).pubDate, "2026-11");
    git("add", "."); git("commit", "-qm", STAMP_COMMIT); run();
    assert.equal(git("status", "--porcelain").toString(), "");
    fs.appendFileSync(file, "\nAn edit.\n"); git("add", "."); git("commit", "-qm", "Edit Post"); run();
    assert.equal(data(fs.readFileSync(file, "utf8")).updatedDate, "2026-11");
    git("add", "."); git("commit", "-qm", STAMP_COMMIT);
    fs.writeFileSync(file, fs.readFileSync(file, "utf8").replace('updatedDate: 2026-11', 'updatedDate: "2025-01"').replace('updatedDate: "2026-11"', 'updatedDate: "2025-01"'));
    git("add", "."); git("commit", "-qm", "Manual month"); run();
    assert.equal(data(fs.readFileSync(file, "utf8")).updatedDate, "2025-01");
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test("invalid current rows are rejected without sanitizing; correction recovers from an invalid parent", () => {
  const broken = text('pubDate: "2026-11"\nexperience:\n  - {}\n');
  assert.throws(() => maintainPost(broken, undefined, "2026-11"));
  const corrected = broken.replace('experience:\n  - {}', 'experience: []');
  const result = maintainPost(corrected, broken, "2026-11");
  assert.deepEqual(data(result).experience, []);
  assert.equal(parsePost(result).body, parsePost(broken).body);
  assert.equal(data(result).updatedDate, "2026-11");
});

test("CLI validates every candidate before writing any automatic metadata", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "bfn-months-invalid-"));
  const git = (...args) => execFileSync("git", args, { cwd: dir, stdio: "pipe" });
  try {
    git("init", "-q"); git("config", "user.name", "Fixture"); git("config", "user.email", "fixture@example.invalid");
    fs.mkdirSync(path.join(dir, "src/content/posts"), { recursive: true });
    const good = path.join(dir, "src/content/posts/a.md"), bad = path.join(dir, "src/content/posts/z.md");
    fs.writeFileSync(good, text("")); fs.writeFileSync(bad, text("experience: [{}]\n"));
    git("add", "."); git("commit", "-qm", "Saved candidate snapshot");
    const before = fs.readFileSync(good, "utf8");
    assert.throws(() => execFileSync(process.execPath, [path.resolve("scripts/post-metadata.mjs")], { cwd: dir, stdio: "pipe" }), /z\.md/);
    assert.equal(fs.readFileSync(good, "utf8"), before);
    assert.equal(git("status", "--porcelain").toString(), "");
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
