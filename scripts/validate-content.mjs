import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { parseDocument } from "yaml";
import { createRequire } from "node:module";
// Reuse the parser bundled with the site's configured Astro Markdown processor.
// No additional package or dependency-manifest change is needed.
const markdownRequire = createRequire(import.meta.resolve("@astrojs/markdown-satteri"));
const { markdownToMdast, mdxToMdast, htmlToHast } = await import(pathToFileURL(markdownRequire.resolve("satteri")).href);
import { postsSchema, postTagsSchema, gallerySchema, galleryCategoriesSchema, placesSchema, tripsSchema, wikiSchema } from "../src/schemas/content.ts";
import { SITE } from "../src/config.ts";
import { parsePost } from "./content-source.mjs";

const collections = {
  posts: { extension: /\.mdx?$/i, schema: postsSchema },
  "post-tags": { extension: /\.json$/i, schema: postTagsSchema },
  gallery: { extension: /\.json$/i, schema: gallerySchema },
  "gallery-categories": { extension: /\.json$/i, schema: galleryCategoriesSchema },
  places: { extension: /\.json$/i, schema: placesSchema },
  trips: { extension: /\.json$/i, schema: tripsSchema },
  wiki: { extension: /\.md$/i, schema: wikiSchema },
};
const walk = (dir) => fs.existsSync(dir) ? fs.readdirSync(dir, { withFileTypes: true }).flatMap((item) => item.isDirectory() ? walk(path.join(dir, item.name)) : [path.join(dir, item.name)]) : [];
export const fieldPath = (parts) => parts.map((part, index) => typeof part === "number" ? `[${part}]` : `${index ? "." : ""}${part}`).join("") || "frontmatter";

function schemaIssues(issues, raw, prefix = []) {
  return issues.flatMap((issue) => {
    const parts = [...prefix, ...issue.path];
    if (issue.code === "invalid_union") {
      const value = parts.reduce((data, key) => data?.[key], raw);
      const branches = issue.errors ?? issue.unionErrors?.map((error) => error.issues) ?? [];
      // Experience is an array now; avoid the irrelevant legacy-object branch diagnostic.
      return schemaIssues(Array.isArray(value) ? branches[0] : branches.at(-1), raw, parts);
    }
    return [{ parts, message: issue.message }];
  });
}

function correctiveAction(field) {
  if (field.startsWith("experience")) return "Complete this row with YYYY-MM start and end (end >= start), or explicitly remove the unfinished row in CMS. No ranges means experience: [].";
  if (/relatedPlaces|relatedTrips|^places\[/.test(field)) return "Choose an existing Place/Trip in this row, or explicitly remove the unfinished row; keep source order and intentional repeats.";
  return "Correct this field in Pages CMS or the saved source, then save again. Existing saved edits are retained.";
}

/** Read-only preflight: accumulate diagnostics across every collection and preserve source bytes. */
export function validateContent(root = process.cwd(), { base = new URL(process.env.SITE_URL ?? SITE.url).pathname } = {}) {
  const report = { errors: [], warnings: [], files: [] };
  const records = Object.fromEntries(Object.keys(collections).map((name) => [name, []]));
  const add = (file, field, message, action = correctiveAction(field), line = 1, severity = "errors") => report[severity].push({ file, field, line, message, action });
  for (const [name, { extension, schema }] of Object.entries(collections)) {
    for (const absolute of walk(path.join(root, "src/content", name)).filter((file) => extension.test(file))) {
      const file = path.relative(root, absolute).split(path.sep).join("/");
      report.files.push(file);
      let raw, body, bodyLine = 1, source;
      try {
        source = fs.readFileSync(absolute, "utf8");
        if (/\.mdx?$/i.test(file)) {
          const parsed = parsePost(source);
          raw = parsed.document.toJS(); body = parsed.body; bodyLine = parsed.bodyLine;
        } else {
          raw = JSON.parse(source);
          // JSON.parse alone silently accepts duplicate keys. Reject ambiguity instead.
          const document = parseDocument(source, { schema: "json" });
          if (document.errors.length) throw document.errors[0];
        }
      } catch (error) {
        add(file, "syntax", error.message, "Repair the YAML/JSON/frontmatter syntax in this saved file; do not recreate or delete unrelated edits.");
        continue;
      }
      const parsed = schema.safeParse(raw);
      if (!parsed.success) for (const issue of schemaIssues(parsed.error.issues, raw)) {
        const field = fieldPath(issue.parts);
        add(file, field, issue.message);
      }
      const record = { file, id: file.replace(`src/content/${name}/`, "").replace(/\.(json|mdx?)$/i, ""), raw, data: parsed.success ? parsed.data : undefined };
      records[name].push(record);
      if (body !== undefined) {
        try {
          const tree = file.endsWith(".mdx") ? mdxToMdast(body) : markdownToMdast(body);
          const nodes = [];
          const visit = (node) => { nodes.push(node); node.children?.forEach(visit); };
          visit(tree);
          const definitions = new Map(nodes.filter((node) => node.type === "definition").map((node) => [node.identifier.toLowerCase(), node.url]));
          const check = (url, node, image = false) => {
            if (typeof url !== "string") return;
            if (!image && !/\/media\/|\.(?:gpx|jpe?g|png|webp|avif|svg|gif|pdf)(?:[?#]|$)/i.test(url)) return;
            fileReference(file, "body.media", url, false, bodyLine + (node.position?.start.line ?? 1) - 1);
          };
          for (const node of nodes) {
            if (node.type === "image" || node.type === "link") check(node.url, node, node.type === "image");
            if (node.type === "imageReference" || node.type === "linkReference") check(definitions.get(node.identifier.toLowerCase()), node, node.type === "imageReference");
            if (node.type === "html") {
              const htmlVisit = (element) => {
                if (element.tagName === "img" && typeof element.properties?.src === "string") check(element.properties.src, node, true);
                element.children?.forEach(htmlVisit);
              };
              htmlVisit(htmlToHast(node.value, { fragment: true }));
            }
            if (/^mdxJsx/.test(node.type)) {
              const attribute = node.attributes?.find((attribute) => attribute.name === "src");
              if (attribute && typeof attribute.value === "string") check(attribute.value, node, true);
              else if (attribute) add(file, "body.media", "Dynamic MDX media cannot be resolved by static preflight; the production build remains authoritative.", "Verify the rendered asset in the production preview.", bodyLine + (node.position?.start.line ?? 1) - 1, "warnings");
            }
          }
        } catch (error) {
          add(file, "body.syntax", error.message, "Repair the Markdown/MDX syntax at the reported body position; Astro compilation is also required before publication.", bodyLine);
        }
      }
    }
  }

  function fileReference(file, field, url, mediaOnly = true, line = 1) {
    if (typeof url !== "string" || !url) return;
    if (/^(?:https?:|\/\/|data:)/i.test(url)) {
      if (mediaOnly) add(file, field, "This image field must select a local public/media file.", "Select an existing upload in the CMS image picker.", line);
      return; // External image availability cannot be guaranteed offline.
    }
    try {
      const pathname = decodeURIComponent(url.split(/[?#]/)[0]);
      const prefix = base.replace(/\/$/, "");
      const relative = prefix && pathname.startsWith(prefix + "/") ? pathname.slice(prefix.length) : pathname;
      if (mediaOnly && !relative.startsWith("/media/")) throw new Error("Expected a public/media image path.");
      if (mediaOnly && !/\.(jpe?g|png|webp|avif)$/i.test(relative)) throw new Error("Unsupported image field format; choose JPG/JPEG, PNG, WebP or AVIF.");
      if (!mediaOnly && pathname.startsWith("/") && prefix && !pathname.startsWith(prefix + "/")) throw new Error(`Public body URLs must include the project base ${base}.`);
      const target = relative.startsWith("/") ? path.resolve(root, "public", `.${relative}`) : path.resolve(root, path.dirname(file), relative);
      const boundary = mediaOnly ? path.resolve(root, "public/media") : path.resolve(root);
      if (!target.startsWith(boundary + path.sep) || !fs.existsSync(target) || !fs.statSync(target).isFile()) throw new Error("Referenced local file is missing or outside the allowed directory.");
      if (!fs.realpathSync(target).startsWith(fs.realpathSync(boundary) + path.sep)) throw new Error("Referenced file resolves outside the allowed directory.");
    } catch (error) {
      add(file, field, `${error.message} Reference: ${url}`, "Restore the file or choose an existing upload; preserve correct case, encoding and the GitHub Pages base path.", line);
    }
  }

  function index(name, key) {
    const result = new Map();
    for (const record of records[name]) {
      const id = record.data?.[key] ?? record.raw?.[key];
      if (typeof id !== "string") continue;
      if (result.has(id)) add(record.file, key, `Duplicate ${key} ${JSON.stringify(id)}; also used by ${result.get(id).file}.`, "Keep one unique identity per entry; repair all affected references deliberately.");
      else result.set(id, record);
      if (key === "id" && record.id !== id) add(record.file, "id", `ID does not match filename ${record.id}.`, "Restore the stable ID/filename agreement and update references together if intentionally migrating IDs.");
    }
    return result;
  }
  const places = index("places", "id"), trips = index("trips", "id"), categories = index("gallery-categories", "title");
  const tags = index("post-tags", "title");
  const foldedTags = new Map();
  for (const [title, record] of tags) {
    const key = title.toLowerCase();
    if (foldedTags.has(key) && foldedTags.get(key).file !== record.file) add(record.file, "title", `Duplicate Post Tag name (case-insensitive): ${title}.`, "Choose one canonical topic and deliberately update all Post references before removing duplicates.");
    else foldedTags.set(key, record);
  }
  const posts = new Map(records.posts.map((post) => [post.id, post]));
  const requireReference = (record, field, id, targets) => {
    if (typeof id === "string" && id && !targets.has(id)) add(record.file, field, `Missing reference ${JSON.stringify(id)}.`, "Restore the referenced entry or select an existing target. Fix every occurrence before deleting or renaming targets.");
  };
  for (const post of records.posts) {
    if (Array.isArray(post.raw?.tags)) post.raw.tags.forEach((tag, i) => requireReference(post, `tags[${i}]`, tag, tags));
    for (const [field, key, targets] of [["relatedPlaces", "place", places], ["relatedTrips", "trip", trips]]) {
      if (Array.isArray(post.raw?.[field])) post.raw[field].forEach((row, i) => requireReference(post, `${field}[${i}].${key}`, row?.[key], targets));
    }
  }
  for (const trip of records.trips) if (Array.isArray(trip.raw?.places)) trip.raw.places.forEach((row, i) => requireReference(trip, `places[${i}].place`, row?.place, places));
  for (const place of records.places) if (place.raw?.coverImage) fileReference(place.file, "coverImage", place.raw.coverImage);
  for (const photo of records.gallery) {
    fileReference(photo.file, "image", photo.raw?.image);
    if (Array.isArray(photo.raw?.categories)) photo.raw.categories.forEach((category, i) => requireReference(photo, `categories[${i}]`, category, categories));
    const references = photo.data?.relatedPost ?? (Array.isArray(photo.raw?.relatedPost) ? photo.raw.relatedPost : photo.raw?.relatedPost ? [photo.raw.relatedPost] : []);
    references.forEach((reference, i) => {
      if (typeof reference !== "string") return;
      const id = reference.replace(/^\/?src\/content\/posts\//, "").replace(/\.(md|mdx)$/i, "");
      requireReference(photo, Array.isArray(photo.raw?.relatedPost) ? `relatedPost[${i}]` : "relatedPost", id, posts);
    });
  }
  return report;
}

export function printReport(report) {
  const escape = (value) => String(value).replaceAll("%", "%25").replaceAll("\r", "%0D").replaceAll("\n", "%0A");
  for (const [severity, diagnostics] of [["error", report.errors], ["warning", report.warnings]]) for (const issue of diagnostics) {
    console.error(`${issue.file}:${issue.line} ${issue.field}: ${issue.message}\n  Fix: ${issue.action}`);
    if (process.env.GITHUB_ACTIONS) console.log(`::${severity} file=${escape(issue.file).replaceAll(",", "%2C")},line=${issue.line}::${escape(`${issue.field}: ${issue.message} ${issue.action}`)}`);
  }
  console.log(`${report.errors.length ? "FAIL" : "PASS"} content preflight: ${report.files.length} files, ${report.errors.length} errors, ${report.warnings.length} warnings. No source files changed.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const report = validateContent();
  printReport(report);
  const output = process.argv.indexOf("--report");
  if (output !== -1) fs.writeFileSync(process.argv[output + 1], JSON.stringify(report, null, 2));
  if (report.errors.length) process.exitCode = 1;
}
