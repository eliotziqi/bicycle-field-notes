import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import { SITE } from "./src/config";
import { wikiLinks } from "./src/utils/wiki-links";
import { satteri } from "@astrojs/markdown-satteri";

// SITE_URL (set in your host's environment) overrides `url` in src/config.ts.
const site = process.env.SITE_URL ?? SITE.url;
if (site.includes("example.com")) {
  console.warn(
    "\n[bicycle-field-notes] Set your real address as `url` in src/config.ts (or the SITE_URL variable).\n" +
      "          RSS, the sitemap and social images use it.\n",
  );
}

export default defineConfig({
  site,
  base: new URL(site).pathname,
  trailingSlash: "always",
  integrations: [mdx(), sitemap()],
  markdown: {
    processor: satteri({ mdastPlugins: [wikiLinks(new URL(site).pathname)] }),
    shikiConfig: {
      themes: { light: "github-light", dark: "github-dark" },
      wrap: true,
    },
  },
});
