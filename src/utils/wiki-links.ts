import path from "node:path/posix";
import type { Link, Image, Definition } from "mdast";
import type { MdastVisitorContext } from "satteri";

/** Wiki Markdown links resolve from source files; site-root links acquire the project base. */
export function wikiLink(url: string, source: string, base: string): string {
  if (/^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(url)) return url;
  const prefix = base.replace(/\/$/, "");
  if (url.startsWith("/")) return url === prefix || url.startsWith(prefix + "/") ? url : prefix + url;
  const match = url.match(/^([^?#]+\.md)([?#].*)?$/i);
  if (!match) return url;
  const relative = source.replaceAll("\\", "/").split("/content/wiki/")[1];
  if (!relative) throw new Error(`Cannot resolve Wiki link from ${source}`);
  const target = path.normalize(path.join(path.dirname(relative), match[1]));
  if (target.startsWith("../")) throw new Error(`Wiki link leaves its collection: ${url}`);
  return `${prefix}/wiki/${target.replace(/(?:^|\/)index\.md$/, "").replace(/\.md$/, "").replace(/\/$/, "")}/`.replace("/wiki//", "/wiki/") + (match[2] ?? "");
}

/** Native Sätteri visitor; runs only for this collection, never existing Posts. */
export function wikiLinks(base: string) {
  const rewrite = (node: Readonly<Link | Image | Definition>, context: MdastVisitorContext) => {
    const source = context.fileURL ? decodeURIComponent(context.fileURL.pathname) : "";
    if (source.replaceAll("\\", "/").includes("/content/wiki/")) {
      context.setProperty(node, "url", wikiLink(node.url, source, base));
    }
  };
  return { name: "wiki-links", link: rewrite, image: rewrite, definition: rewrite };
}
