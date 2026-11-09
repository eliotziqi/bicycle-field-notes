import { getCollection } from "astro:content";
import { withBase } from "./urls";

export const WIKI_SECTIONS = { user: "User Guide", publishing: "Publishing Guide", developer: "Developer Guide" };
export const wikiPath = (id: string) => withBase(`/wiki/${id === "index" ? "" : id.replace(/\/index$/, "") + "/"}`);
export async function getWiki() {
  const pages = await getCollection("wiki");
  return pages.sort((a, b) => a.data.order - b.data.order || a.id.localeCompare(b.id));
}
