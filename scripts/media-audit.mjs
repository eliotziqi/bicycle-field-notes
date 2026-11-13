import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { parsePost } from "./content-source.mjs";
import { SITE } from "../src/config.ts";
const require = createRequire(import.meta.resolve("@astrojs/markdown-satteri"));
const { markdownToMdast, mdxToMdast, htmlToHast } = await import(pathToFileURL(require.resolve("satteri")).href);
const walk = (dir) => fs.existsSync(dir) ? fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? walk(path.join(dir, entry.name)) : entry.isFile() && entry.name !== ".gitkeep" ? [path.join(dir, entry.name)] : []) : [];

/** Inventory only. Never writes, renames, deletes or repairs source/media files. */
export function auditMedia(root = process.cwd(), base = new URL(process.env.SITE_URL ?? SITE.url).pathname) {
  const relative = (file) => path.relative(root, file).split(path.sep).join("/");
  const files = walk(path.join(root, "public/media")).sort().map((file) => ({ file: relative(file), sha256: createHash("sha256").update(fs.readFileSync(file)).digest("hex"), uses: [] }));
  const byPath = new Map(files.map((file) => [file.file, file]));
  const missing = [], diagnostics = [], altReviews = [];
  const use = (url, source, field, line) => {
    if (typeof url !== "string" || !url || /^(?:https?:|\/\/|data:|#)/i.test(url)) return;
    try {
      let target = decodeURIComponent(url.split(/[?#]/)[0]);
      const prefix = base.replace(/\/$/, "");
      if (prefix && target.startsWith(prefix + "/")) target = target.slice(prefix.length);
      const absolute = target.startsWith("/") ? path.resolve(root, "public", `.${target}`) : path.resolve(root, path.dirname(source), target);
      const key = relative(absolute), usage = { source, field, ...(line ? { line } : {}) };
      if (byPath.has(key)) byPath.get(key).uses.push(usage);
      else if (!fs.existsSync(absolute) || !fs.statSync(absolute).isFile()) missing.push({ reference: url, ...usage });
      else diagnostics.push({ source, field, message: `Reference outside the public/media inventory: ${url}` });
    } catch (error) { diagnostics.push({ source, field, message: error.message }); }
  };
  for (const collection of ["gallery", "places"]) for (const absolute of walk(path.join(root, "src/content", collection)).filter((file) => file.endsWith(".json"))) {
    const source = relative(absolute);
    try {
      const data = JSON.parse(fs.readFileSync(absolute, "utf8"));
      const field = collection === "gallery" ? "image" : "coverImage";
      if (data[field]) {
        use(data[field], source, field);
        const alt = collection === "gallery" ? "alt" : "coverAlt", decorative = collection === "gallery" ? "decorative" : "coverDecorative";
        if (!data[decorative] && !(typeof data[alt] === "string" && data[alt].trim())) altReviews.push({ source, field: alt, message: "Human-written alt text needed; missing is not decorative." });
      }
    } catch (error) { diagnostics.push({ source, message: error.message }); }
  }
  for (const absolute of walk(path.join(root, "src/content/posts")).filter((file) => /\.mdx?$/.test(file))) {
    const source = relative(absolute);
    try {
      const { body, bodyLine } = parsePost(fs.readFileSync(absolute, "utf8"));
      const tree = absolute.endsWith(".mdx") ? mdxToMdast(body) : markdownToMdast(body);
      const nodes = [], visit = (node) => { nodes.push(node); node.children?.forEach(visit); }; visit(tree);
      const definitions = new Map(nodes.filter((node) => node.type === "definition").map((node) => [node.identifier.toLowerCase(), node.url]));
      for (const node of nodes) {
        const line = bodyLine + (node.position?.start.line ?? 1) - 1;
        const check = (url, image = false) => {
          if (image || (typeof url === "string" && /\/media\/|\.(?:jpe?g|png|webp|avif|svg|gif|gpx|pdf)(?:[?#]|$)/i.test(url))) use(url, source, "body", line);
        };
        if (["image", "link"].includes(node.type)) check(node.url, node.type === "image");
        if (["imageReference", "linkReference"].includes(node.type)) check(definitions.get(node.identifier.toLowerCase()), node.type === "imageReference");
        if (node.type === "html") {
          const htmlVisit = (element) => { if (element.tagName === "img") check(element.properties?.src, true); if (element.tagName === "a") check(element.properties?.href); element.children?.forEach(htmlVisit); };
          htmlVisit(htmlToHast(node.value, { fragment: true }));
        }
        if (/^mdxJsx/.test(node.type)) for (const attribute of node.attributes ?? []) {
          if (attribute.name === "src") {
            if (typeof attribute.value === "string") check(attribute.value, true);
            else diagnostics.push({ source, line, message: "Dynamic MDX src requires manual usage inspection." });
          }
        }
        if (node.type === "image" && !node.alt?.trim()) altReviews.push({ source, line, field: "body", message: "Empty Markdown alt: confirm decorative intent manually; no inference made." });
      }
    } catch (error) { diagnostics.push({ source, message: error.message }); }
  }
  const hashes = new Map();
  for (const file of files) { const group = hashes.get(file.sha256) ?? []; group.push(file.file); hashes.set(file.sha256, group); }
  return { files, identical: [...hashes].filter(([, paths]) => paths.length > 1).map(([sha256, paths]) => ({ sha256, files: paths })), missing, altReviews, diagnostics, note: "Read-only static inventory, including drafts. Unreferenced files are not deletion candidates. Dynamic/imported MDX, srcset/CSS and other code uses require manual review. Hashes identify identical bytes, not visually similar images." };
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const report = auditMedia();
  console.log(JSON.stringify(report, null, 2));
  if (report.missing.length || report.diagnostics.length) process.exitCode = 1;
}
