import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

export function pendingFiles(baseline, { cwd = process.cwd() } = {}) {
  const git = (...args) => execFileSync("git", args, { cwd, encoding: "utf8" });
  if (baseline && /^[0-9a-f]{40}$/.test(baseline)) {
    try { return git("diff", "--name-only", "-z", baseline, "HEAD", "--", "src/content", "public/media").split("\0").filter(Boolean); }
    catch { /* Unknown history: report every content path rather than omit saved work. */ }
  }
  return git("ls-files", "-z", "src/content", "public/media").split("\0").filter(Boolean);
}

const safe = (text) => String(text).replaceAll("`", "'").replace(/[\r\n]/g, " ");
export function renderPublicationReport({ revision, baseline, pending, stages, validation, repo, runUrl }) {
  const failed = Object.entries(stages).filter(([, outcome]) => outcome === "failure" || outcome === "cancelled").map(([name]) => name);
  const ready = !failed.length && stages.build === "success" && stages.commit === "success" && stages.artifact === "success";
  const lines = ["# Publishing status", "", ready ? "**Validated artifact ready; check the deployment job for publication success.**" : "**Publication blocked. The last successful website remains online.**", "", `Saved source revision: \`${safe(revision)}\`.`, "All CMS edits remain saved in Git. Nothing is deleted, skipped, or published as a partial snapshot.", ""];
  if (failed.length) lines.push(`Failed stages: ${failed.map(safe).join(", ")}.`, "");
  for (const issue of validation?.errors ?? []) {
    lines.push(`- **${safe(issue.file)} — ${safe(issue.field)}:** ${safe(issue.message)} ${safe(issue.action)}`);
  }
  if (validation?.errors?.length) lines.push("");
  if (stages.build === "failure") lines.push("Read the build log/artifact for Astro/MDX errors. Correct the reported source and save again; do not recreate unrelated edits.", "");
  lines.push(baseline ? `## Saved content changes since last successful run (${safe(baseline.slice(0, 7))})` : "## Content requiring publication review (last successful revision unavailable)", "", "These paths are **pending until the full snapshot deploys**. The comparison may also include metadata commits made by the last successful run.", "");
  for (const file of pending) {
    const encoded = file.split("/").map(encodeURIComponent).join("/");
    lines.push(`- [${safe(file)}](https://github.com/${repo}/blob/${revision}/${encoded})`);
  }
  if (!pending.length) lines.push("No content paths differ from that saved revision; inspect the failed validation/build for configuration or code errors.");
  lines.push("", "## Recovery", "", "Open the affected entry on the same main branch in Pages CMS, complete the field or explicitly remove its unfinished row, and save. The next run validates and publishes the entire corrected snapshot, including the other saved edits above. Alternatively run the native **Validate and publish saved changes** CMS action.", "", "If main changed during validation, the run stops rather than overwrite newer edits or deploy a stale artifact. The newer run includes the saved changes; retry after correcting any remaining errors.", "", `[GitHub Actions run](${runUrl})`, "");
  return lines.join("\n");
}

async function run() {
  const dir = process.env.PUBLICATION_REPORT_DIR;
  if (!dir) throw new Error("PUBLICATION_REPORT_DIR is required.");
  fs.mkdirSync(dir, { recursive: true });
  const repo = process.env.GITHUB_REPOSITORY;
  const revision = process.env.GITHUB_SHA;
  let baseline;
  if (process.env.GITHUB_TOKEN && repo) {
    try {
      const response = await fetch(`https://api.github.com/repos/${repo}/actions/workflows/deploy.yml/runs?branch=main&status=success&per_page=10`, {
        headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}`, Accept: "application/vnd.github+json" },
        signal: AbortSignal.timeout(15000),
      });
      if (response.ok) baseline = (await response.json()).workflow_runs.find((run) => String(run.id) !== process.env.GITHUB_RUN_ID)?.head_sha;
    } catch { console.warn("Last successful run unavailable; the report will list every saved content path."); }
  }
  let validation;
  const validationFile = path.join(dir, "validation.json");
  if (fs.existsSync(validationFile)) validation = JSON.parse(fs.readFileSync(validationFile, "utf8"));
  const stages = Object.fromEntries(["validation", "metadata", "build", "commit", "artifact"].map((name) => [name, process.env[`PUBLISH_${name.toUpperCase()}`] ?? "skipped"]));
  const pending = pendingFiles(baseline);
  const runUrl = `https://github.com/${repo}/actions/runs/${process.env.GITHUB_RUN_ID}`;
  const markdown = renderPublicationReport({ revision, baseline, pending, stages, validation, repo, runUrl });
  fs.writeFileSync(path.join(dir, "status.md"), markdown);
  fs.writeFileSync(path.join(dir, "status.json"), JSON.stringify({ revision, baseline, pending, stages, validation }, null, 2));
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, markdown);
  console.log(markdown);
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) await run();
