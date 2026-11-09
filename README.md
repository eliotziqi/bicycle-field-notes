# Bicycle Field Notes

A personal notebook for cycling routes, travel, and observations from the road.

[Visit Bicycle Field Notes](https://eliotziqi.github.io/bicycle-field-notes/)

Built with Astro, TypeScript, and the minimalist Inkline theme, with Markdown/MDX posts managed through Pages CMS and hosted on GitHub Pages. The unified Posts browser combines multi-select tags and Pagefind full-text search. Other features include light and dark themes, reading controls, RSS, a sitemap, and generated social preview images. The responsive homepage includes a curated photo slideshow, introduction, recent posts, and quick links. Gallery offers category filters, a keyboard-accessible lightbox, and related posts; Atlas and Contact are ready for future content.

## Local development

Use Node 24 and npm:

```sh
npm ci
npm run dev
```

Open the `/bicycle-field-notes/` path shown by Astro. To preview the production site, including search:

```sh
npm run build
npm run preview
```

Manage photos in Pages CMS’s **Gallery** collection; reuse existing media and select **Show on homepage** to include a photo in the slideshow. **Gallery Categories** maintains the shared category options. Uploading a file alone does not publish it.

See [PLAN.md](PLAN.md) for architecture, publishing details, and the development roadmap.

## Attribution and license

Based on Inkline by the Inkline contributors. Theme code is provided under the [MIT license](LICENSE); retain its copyright and permission notice. User-authored posts, photographs, and GPX files are not automatically licensed under MIT; their reuse requires the applicable content license or the owner’s permission.

Newsreader fonts are by the Newsreader Project Authors and distributed under the [SIL Open Font License 1.1](public/newsreader-license.txt).
