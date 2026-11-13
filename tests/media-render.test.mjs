// Run after a production build. Optional root is an isolated accessibility fixture.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { imageAlt } from "../src/utils/image-accessibility.ts";
const root = process.argv[2] ?? process.cwd();
const gallery = fs.readFileSync(path.join(root, "dist/gallery/index.html"), "utf8");
const home = fs.readFileSync(path.join(root, "dist/index.html"), "utf8");
const escape = (value) => value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
for (const file of fs.readdirSync(path.join(root, "src/content/gallery"))) {
  if (!file.endsWith(".json")) continue;
  const photo = JSON.parse(fs.readFileSync(path.join(root, "src/content/gallery", file), "utf8"));
  const alt = imageAlt(photo.alt, photo.decorative, photo.title);
  const matches = (html) => alt ? html.includes(`alt="${escape(alt)}"`) : /\salt(?:=""|(?=\s|>))/.test(html);
  const card = gallery.split(`id="photo-${file.slice(0, -5)}"`)[1]?.split("</figure>")[0];
  assert(card && matches(card), file);
  assert(card.includes("srcset=")); assert(card.includes("loading=\"lazy\""));
  if (photo.showOnHomepage) assert(matches(home));
}
assert(fs.readFileSync("src/scripts/gallery.ts", "utf8").includes("image.alt = thumbnail.alt"));
console.log("PASS Gallery/Home alt attributes, legacy fallback, responsive images and lightbox alt propagation");
