# Bicycle Field Notes — project plan

## Current architecture and status

Astro generates static pages from `src/pages/` and Markdown/MDX articles from `src/content/posts/`. `Base.astro` handles shared layout and SEO; `src/config.ts` defines identity, navigation, and features. Pages CMS uses `.pages.yml`; GitHub Actions builds and publishes `dist/` to GitHub Pages.

Completed: Home, Posts, Atlas, Gallery, and Contact navigation; responsive Home with the existing introduction and a curated Gallery slideshow; and a unified Posts browser. Pagefind provides full-text matches, intersected with OR matching across selected tags. The generated article list retains newest-first order and production draft exclusions. Search and tag state use shareable URLs. Home submits its compact search input to Posts; filters sit right of the desktop list and above it on mobile. RSS, sitemap, social previews, themes, and reading controls remain active.

## Current phase — Places/Trips CMS compatibility only

- [x] Fast-forward the clean checkout to the latest `origin/main`, preserving CMS content and uploads.
- [x] Update collection view syntax while retaining default sort order; add minimal Places/Trips CMS JSON collections and Astro schemas with ordered single-reference visit rows.
- [x] Validate actual CMS configuration, ordered/repeated reference serialization, Astro validation, and production builds with empty collections and isolated demo data.
- [x] Owner authorized review and commit/push on successful review; scope/content checks pass. Add explicit referenced-Place deletion guidance.
- [ ] Hosted CMS create/reorder/save/reopen/name-edit checks remain pending. Follow [the manual test guide](docs/cms-compatibility-test.md) on a disposable nonpublishing branch.

No Atlas, Posts integration, Wiki, or relationship graph is included in this phase. The owner authorized committing and pushing the reviewed compatibility changes; the existing `main` push deployment workflow remains unchanged. Collection IDs must remain stable; cross-entry integrity validation is deferred. Detailed test steps and current limitations live in the guide.

## Completed phase — Home and Gallery

- [x] Add the shared responsive subtitle; move the welcome heading/introduction below the hero.
- [x] Add Gallery metadata and centrally maintained Gallery Categories collections to Pages CMS, preserving Posts and Media. Seed only the existing Mount Wangwei photo; media uploads are never automatically published.
- [x] Add responsive Gallery thumbnails, OR category filters, descriptions, related-post links, and a native keyboard-accessible lightbox.
- [x] Drive Home from `showOnHomepage` entries, with manual previous/next and arrow-key controls, single/empty states, and no autoplay or animation.
- [x] Production build and CMS YAML/reference checks pass; Posts/Media configuration is unchanged. Chrome checks pass for 1280/768/390/320px, category OR and clear/empty states, lightbox arrows/Escape/focus return, related/draft links, and manual slideshow wrap/keyboard/reduced-motion behavior. Isolated multiple/empty-entry builds verify fallback states. Internal links, image paths/srcsets, RSS, sitemap, and project base paths pass.
- [x] Owner reviewed this phase and authorized committing and pushing; pushes to `main` trigger the configured Pages deployment.

The earlier repository cleanup is complete: package identity, template cleanup, content/license clarification, and clean-install/build/browser checks passed.

## Repository audit

| Classification | Files and decision |
| --- | --- |
| Essential | All active `src/` components, routes, scripts, styles, utilities, configuration, and user posts; package manifest/lockfile; Astro/TypeScript config; `.pages.yml`; `.github/workflows/deploy.yml`; `LICENSE`. Retain. Every direct dependency has an active integration, import, or build command. |
| Essential assets/config | All existing `public/` assets including the media directory marker; `.gitattributes` (`text=auto` correctly recognizes binary assets); `.gitignore`. Retain. Distribute Newsreader's original license with its bundled fonts. |
| Active documentation | `README.md`, `AGENTS.md`, `PLAN.md`, `CHANGELOG.md`. Maintain concise, distinct roles. |
| Obsolete template remnants | Original `CONTRIBUTING.md` removed; unused tag-slug code and template selectors removed. Package/build-message identity now uses Bicycle Field Notes. |
| Generated files | No generated build/cache/dependency files are tracked. `.astro/`, `dist/`, `node_modules/`, npm logs, and TypeScript build caches are ignored. The lockfile is required reproducibility metadata and stays tracked. |
| Uncertain or intentionally retained | The user-created test post and its placeholders remain content, not disposable demos. Keep `featured` metadata/CMS fields and reusable `.callout` content styling. Original icon reuse permissions are not documented beyond their source; retain assets and source attribution without assuming MIT coverage. |

## Gallery publishing

Create JSON entries through Pages CMS **Gallery**. Required fields are image, title (also the image’s accessible text), description, and one or more categories. `relatedPost` is an optional Posts reference; production omits links to drafts or missing posts. `showOnHomepage` defaults to false. The starter Mount Wangwei entry reuses the existing upload and post link.

**Gallery Categories** is the central list shared by CMS references and the site: Landscape, Routes & Maps, Travel, Bicycles, Other. Add categories there without code changes; coordinate category title renames/deletions with existing entry values. Entry titles determine filenames; preserve filenames to keep photo anchors stable. Gallery entries are deliberately published records; curate the entry before saving to the publishing branch.

`getGallery()` reads only explicit entries, validates local media/category references, and creates 320/640px thumbnails and 800/1600px display images through Astro’s existing image pipeline (never upscaled). Generated WebP files stay in ignored build output; originals are not duplicated in source. The first Home image loads eagerly; Gallery thumbnails and later slides are lazy. No autoplay or animation means reduced-motion users get the same manual control.

## Next steps (future)

- Owner supplies further introduction, route/travel content, resource links, and contact details. Add a form only with a working submission service.
- Plan the Atlas MapLibre 3D globe with markers linking to posts, then optional post terrain maps, GPX tracks, and downloads. Choose data/style/elevation sources, attribution, content schema, performance limits, and accessible fallbacks before implementation. No map dependencies yet.

## Acceptance criteria

- `/gallery/` appears between Atlas and Contact; categories use OR, lightbox supports keyboard/focus return, and only opted-in entries appear on Home. Empty and single-photo states remain usable.
- `/posts/` is the sole article browsing/search/filter interface. No standalone Search/Tags routes or internal links; published article URLs remain stable.
- Tags use OR; text and tags use AND. Counts, Clear Filters, empty/error states, shareable URLs, and Back/Forward restoration work without changing newest-first order or production draft exclusions.
- Home and Posts share a compact accessible search input; Home submits on Enter. Layouts remain usable at desktop and phone widths.
- `npm ci` and `npm run build` succeed; Pagefind, RSS, SEO, generated links, and GitHub Pages project paths work.
- User content/media, original license notices, CMS settings, and deployment configuration remain intact; uncertain items are retained and reported.

## Maintenance notes

Use Node 24. Run `npm ci`, `npm run dev`, or `npm run build` followed by `npm run preview` (full-text search needs a production build). The project base `/bicycle-field-notes/` comes from `SITE.url` or `SITE_URL`; internal UI URLs use `withBase()`.

CMS posts default to drafts; keep published filenames stable. Uploads go to `public/media/`. If the deployment path changes, coordinate the site URL, CMS media output, and existing post media URLs. GitHub Pages serves the generated robots file beneath the project path; the sitemap is at that same base. Pushes to `main` trigger deployment, so publishing requires approval.

The existing favicon source is `https://cs571-f25.github.io/p107/assets/favicon-CaOTZMPU.ico`; the Apple touch icon is a proportional export from that artwork. Preserve both originals.
