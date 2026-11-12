import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { parse } from "yaml";
import { pendingFiles, renderPublicationReport } from "../scripts/publication-report.mjs";

test("publishing gates source, candidate build and metadata commit before artifact/deployment", () => {
  const workflow = parse(fs.readFileSync(".github/workflows/deploy.yml", "utf8"));
  const steps = workflow.jobs["validate-build"].steps;
  const ids = steps.map((step) => step.id).filter(Boolean);
  assert.deepEqual(ids, ["validation", "metadata", "build", "commit", "artifact"]);
  assert.match(steps.find((step) => step.id === "commit").run, /git ls-remote/);
  assert(!steps.find((step) => step.id === "commit").run.includes("--force"));
  assert.equal(workflow.jobs.deploy.needs, "validate-build");
  assert.match(workflow.jobs.deploy.steps[0].run, /VALIDATED_REVISION/);
  assert.equal(workflow.concurrency["cancel-in-progress"], false);
  assert(steps.some((step) => step.run?.includes("publication-report.mjs") && step.if === "always()"));
});

test("failed validation reports every saved edit; correction preserves unrelated committed work", () => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), "bfn-publication-"));
  const git = (...args) => execFileSync("git", args, { cwd, encoding: "utf8", stdio: "pipe" }).trim();
  try {
    git("init", "-q"); git("config", "user.name", "Fixture"); git("config", "user.email", "fixture@example.invalid");
    fs.mkdirSync(path.join(cwd, "src/content/posts"), { recursive: true });
    const a = path.join(cwd, "src/content/posts/a.md"), b = path.join(cwd, "src/content/posts/b.md");
    fs.writeFileSync(a, "Published snapshot"); git("add", "."); git("commit", "-qm", "Published");
    const baseline = git("rev-parse", "HEAD");
    fs.writeFileSync(a, "Incomplete Experience row"); git("add", "."); git("commit", "-qm", "Saved invalid edit");
    fs.writeFileSync(b, "Independent valid saved edit"); git("add", "."); git("commit", "-qm", "Saved valid edit");
    const pending = pendingFiles(baseline, { cwd });
    assert.deepEqual(pending, ["src/content/posts/a.md", "src/content/posts/b.md"]);
    const report = renderPublicationReport({ revision: git("rev-parse", "HEAD"), baseline, pending, stages: { validation: "failure", build: "skipped" }, validation: { errors: [{ file: pending[0], field: "experience[0].start", message: "Missing month", action: "Complete or remove the unfinished row." }] }, repo: "owner/repo", runUrl: "https://example.invalid/run" });
    assert.match(report, /Publication blocked/);
    for (const file of pending) assert(report.includes(file));
    assert.match(report, /experience\[0\].start/);
    fs.writeFileSync(a, "Corrected Experience list"); git("add", "."); git("commit", "-qm", "Correct invalid entry");
    assert.equal(fs.readFileSync(b, "utf8"), "Independent valid saved edit");
    assert.deepEqual(pendingFiles(baseline, { cwd }), pending);
    assert.deepEqual(pendingFiles(undefined, { cwd }), pending);
  } finally { fs.rmSync(cwd, { recursive: true, force: true }); }
});
