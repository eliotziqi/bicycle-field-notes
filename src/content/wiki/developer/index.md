---
title: "Architecture and directory map"
description: "Maintain the static Astro site without breaking content contracts."
section: developer
order: 30
---

## Runtime and build boundaries

Bicycle Field Notes is a static Astro site based on Inkline, deployed to GitHub Pages. Pages CMS edits repository files; no application database or custom CMS exists. Node 24 runs the build. `Base.astro` supplies shared HTML, SEO, fonts, theme initialization, header and footer. Routes under `src/pages/` generate static output; small route-specific scripts enhance existing markup.

```text
.pages.yml                  CMS collections and media output
astro.config.ts             site/base, Markdown, MDX, sitemap
src/config.ts               site identity, navigation, feature flags
src/content.config.ts       content collection loaders
src/schemas/content.ts      shared Astro/preflight contracts
src/content/posts/          Markdown/MDX articles
src/content/places/         JSON geographic entities
src/content/trips/          JSON ordered visits
src/content/gallery/        JSON curated photo metadata
src/content/gallery-categories/  JSON category titles
src/content/wiki/           canonical Markdown documentation
src/layouts/                Base and Wiki layouts
src/components/             shared UI, rows, filters and related content
src/utils/                  graph, adapters, filters, media and URL helpers
src/scripts/                route-specific interactions
scripts/post-metadata.mjs   month migration and post-save date maintenance
scripts/validate-content.mjs read-only publishing preflight
scripts/publication-report.mjs pending-edit and recovery reports
src/styles/                 global tokens and feature styles
public/media/               uploaded originals
public/                     static assets and license notices
tests/                      Node tests and browser acceptance harness
.github/workflows/deploy.yml GitHub Pages build/deploy
```

Generated `dist/`, `.astro/` and `node_modules/` are ignored. The lockfile is required source metadata. Preserve existing media, author content, favicon, license notices and deployment setup during refactoring.

## Collections and adapters

`posts` uses the Markdown/MDX loader and existing Post metadata plus optional editorial fields. `places` and `trips` use JSON with stable authored IDs; file-based loader IDs keep duplicate authored IDs visible to validation. `gallery` references media and `galleryCategories`; categories store titles. `wiki` uses Markdown with title, description, optional section and integer order.

Use `getPosts()` for published visibility, `getAtlas()` for the shared relationship graph and validated Place media, and `getGallery()` for curated photos and responsive derivatives. Avoid direct collection reads that bypass those contracts. Read [relationships](relationships.md), [Atlas](atlas.md) and [Posts discovery](posts.md) before changing them.

## Components and themes

Global CSS tokens define color, fonts, spacing and focus outlines. `Header.astro` renders the configured main navigation and tool icons; Wiki belongs beside theme, not in the main nav list. `SearchField.astro` accepts an optional label and preserves Posts defaults. Reuse semantic controls, accessible names and `withBase()` rather than copying feature-specific markup.

The theme initializer reads browser preferences before paint; the header stores light/dark changes. Atlas observes the site unless independently overridden. Article reading controls remain separate from documentation layout. Wiki navigation uses native details; long pages use generated h2/h3 tables of contents and heading anchors. Test narrow layouts, both themes and keyboard focus after shared changes.

## Build, SEO and deployment

`npm ci` uses the lockfile. `npm run build` runs Astro, then the existing Pagefind CLI against `dist`. Article social previews, robots and sitemap are generated through existing routes/integrations. Wiki pages have canonical URLs, descriptions and sitemap entries, but are not Posts and do not enter article social-preview generation.

`SITE.url`, overridden by `SITE_URL`, determines the site/base. Internal UI paths go through `withBase()`. Preserve `/bicycle-field-notes/` and trailing slashes. Markdown Wiki links use the scoped build-time link resolver; author relative `.md` links and site-root UI paths. CMS media output must be coordinated separately for a future base migration; existing body paths are not automatically rewritten.

The [deployment workflow](https://github.com/eliotziqi/bicycle-field-notes/blob/main/.github/workflows/deploy.yml) runs on pushes to `main` or manual dispatch, uses Node 24, installs with `npm ci`, maintains month metadata before building that exact commit, builds/uploads the artifact, then deploys in `github-pages`. No server runtime is required. Never commit/push/deploy without explicit owner approval. See [testing and safe refactoring](testing.md).

## Dependencies and licenses

Use existing Astro/MDX/sitemap, Pagefind and image tooling. MapLibre is the only map renderer and is route-local. No documentation framework or new dependency is required for Wiki. Preserve the original Inkline MIT notice, Newsreader OFL notice and MapLibre BSD notice; user photos, articles and future GPX files do not inherit the code license. Map/provider/data licensing is detailed in [Atlas notes](atlas.md#provider-and-licenses). Check current advisories and provider terms before dependency/provider changes rather than treating historical test evidence as a current security audit.

## Planned extension points

GPX attachments, downloads, statistics and article-level MapLibre terrain previews remain unimplemented. They would extend Post schema/CMS, public-media validation and a separate article-only renderer; they must not add routes to Atlas or load maps on every article by default. Expanded geographic metadata and additional filters need reliable authored data, migration rules and OR/AND semantics, not inferred regions. New collections should define ownership, IDs, validation, public/draft behavior and reference rules before adding UI. Record significant tradeoffs in [decisions](decisions.md).

The production workflow validates source, prepares month updates and builds before committing metadata or publishing. Failed snapshots retain every saved edit and the previous live site; see [publishing reliability](../publishing/reliability.md).
