# Bicycle Field Notes — project plan

## Goals and architecture

Keep a simple, readable cycling and travel notebook with user-owned content, accessible navigation, and a reliable Pages CMS publishing workflow. Preserve Inkline's typography, themes, and reading tools.

Astro generates static pages from `src/pages/` and Markdown/MDX posts in `src/content/posts/`. `Base.astro` owns shared metadata and layout; Header and Footer use `src/config.ts`. `getPosts()` filters production drafts. Pagefind indexes post bodies after the Astro build. The unified `/posts/` browser intersects Pagefind full-text matches with client-side tag filtering; it retains the generated newest-first article list. RSS, sitemap, and social images are generated at build time. GitHub Actions builds and deploys `dist/` to GitHub Pages. No new runtime dependencies are needed for the current structure.

## Phases and checklist

### Phase 1 — site structure (completed)

- [x] Use Home, Posts, Atlas, Contact navigation; remove the decorative brand mark and retain favicon.
- [x] Move the About introduction into Home and remove the redundant About page.
- [x] Reuse the Mount Wangwei photo for a wide hero; show recent posts beside a sidebar of search, quick links, and the existing Ride with GPS resource.
- [x] Stack the sidebar below main content at widths up to 48rem.
- [x] Initially exposed tag browsing from Posts; the unified browser below supersedes the standalone tag pages.
- [x] Add minimal Atlas and Contact pages without sample data, maps, or forms.
- [x] Create working project documentation and simplify README.

### Phase 2 — validation and review (completed)

- [x] Production build and generated internal href/src/action audit pass under `/bicycle-field-notes/`. Headless Chrome checks at 1280, 768, 390, and 320 pixels confirm no horizontal overflow, hero loading, and sidebar positioning. Home search returns the published post at its project-prefixed URL; theme switching persists and post reading controls are present.
- [x] Owner reviewed the changes and authorized committing and pushing. Pushes to `main` trigger the configured Pages deployment.

### Unified Posts browser (completed)

- [x] Consolidate search and tag browsing into `/posts/`; remove standalone search and tag routes and update article/header links.
- [x] Reuse Pagefind for full-text search, with OR across selected tags and AND between tags and text; retain newest-first order and production draft exclusions.
- [x] Add live result counts, Clear Filters, empty/error states, query/tag URL parameters, initial URL restoration, and Back/Forward handling.
- [x] Share a compact accessible search field between Home and Posts. Home submits to Posts on Enter.
- [x] Put filters right of the desktop list and above the mobile list.
- [x] Production build and generated internal URL/sitemap checks pass. Chrome checks cover full-text search, multi-tag OR/query AND, newest-first order, draft exclusion, shared URL restoration, Clear Filters, empty states, Unicode/comma tags, Back navigation, and stale-search protection. Filters are right of the list at 1280px and above it at 768/390/320px without horizontal overflow. Multi-tag/draft fixtures were built only in a temporary copy; user content was unchanged.
- [x] Owner reviewed the changes and authorized committing and pushing; pushes to `main` trigger the configured Pages deployment.

### Phase 3 — content and contact (future, next priority)

- [ ] Owner supplies further introduction, route/travel material, and any additional resource links.
- [ ] Owner supplies contact details and decides whether a form is needed. Any form must have a working submission service before publication.
- [ ] Decide whether a compatibility redirect from the removed `/about/` URL is useful for existing visitors.

### Phase 4 — mapping (future, after content)

- [ ] Plan a MapLibre GL JS interactive 3D globe on Atlas with location markers linking to related posts.
- [ ] Plan optional MapLibre 3D terrain in individual posts with GPX tracks and downloadable GPX files.
- [ ] Before implementation, choose map/style/elevation sources, hosting and attribution requirements, content schema, mobile performance limits, and accessible fallbacks. Keep maps optional and avoid loading map assets on unrelated pages.

## Acceptance criteria

- Navigation targets exist beneath `/bicycle-field-notes/`; no placeholder links. Search and tag filtering are integrated in Posts; obsolete Search/Tags routes do not appear in the sitemap or internal links.
- Home uses the existing introduction and image, displays recent published posts, and puts the sidebar on the right on desktop and below content on narrow screens.
- Search submitted from Home reaches `/posts/?q=…` and uses Pagefind full-text matches; theme controls and post reading controls remain functional.
- Atlas and Contact explain that content is forthcoming, without mock maps, invented details, or inactive forms.
- User content, media, favicon, Pages CMS, RSS, SEO, and deployment configuration are preserved.
- `npm run build` succeeds, links resolve in generated output, and documentation accurately separates completed work from future plans.

## Publishing and maintenance

Use Node 24 (`package.json` specifies the minimum supported version). Run `npm ci`, `npm run dev`, or `npm run build` followed by `npm run preview`. The project path is `/bicycle-field-notes/`; search is available after building.

Pages CMS uses `.pages.yml` for the posts collection. Title, description, and publication date are required; new CMS posts default to drafts. Keep published filenames stable. Uploads go to `public/media/`, with project-prefixed URLs in post content. If the deployment base changes, coordinate `SITE.url`/`SITE_URL`, CMS media output, and existing post media URLs.

The deployment workflow runs on pushes to `main` or manual dispatch and deploys the full build including Pagefind. Repository Pages source must be GitHub Actions. A GitHub Pages project site serves its generated `robots.txt` beneath the project path; submit the project sitemap directly if needed.

The unchanged favicon originated at `https://cs571-f25.github.io/p107/assets/favicon-CaOTZMPU.ico`. The Apple touch icon is an existing proportional export from that artwork. Preserve both assets and their base-aware links.
