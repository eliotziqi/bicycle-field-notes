import { withBase } from "../utils/urls";
import type { APIContext } from "astro";

export function GET({ site }: APIContext) {
  return new Response(`User-agent: *\nAllow: /\n\nSitemap: ${new URL(withBase("/sitemap-index.xml"), site).href}\n`);
}
