# Bicycle Field Notes — project plan

## Current architecture and status

Astro generates static pages from `src/pages/` and Markdown/MDX articles from `src/content/posts/`. `Base.astro` handles shared layout and SEO; `src/config.ts` defines identity, navigation, and features. Pages CMS uses `.pages.yml`; GitHub Actions builds and publishes `dist/` to GitHub Pages.

Completed: Home, Posts, Atlas, Gallery, and Contact navigation; responsive Home with the existing introduction and a curated Gallery slideshow; and a unified Posts browser. Pagefind provides full-text matches, intersected with OR matching across selected tags. The generated article list retains newest-first order and production draft exclusions. Search and tag state use shareable URLs. Home submits its compact search input to Posts; filters sit right of the desktop list and above it on mobile. RSS, sitemap, social previews, themes, and reading controls remain active.

## Current phase — Phase 3 Posts integration and discovery

- [x] Synchronize safely with `origin/main`, preserving the latest owner CMS coordinate edit and all existing records.
- [x] Add optional content type, ordered/repeated Place and Trip rows, and optional experience dates to Post schemas/CMS without rewriting articles or adding cover/GPX controls.
- [x] Extend the shared graph for explicit narrative order, unique discovery membership and published reverse associations. Trip-derived Place discovery does not assert visits or change statuses.
- [x] Add lightweight article geography/date links to Atlas, preserving manual Focus and base-aware URLs; no article map dependency.
- [x] Extend the existing Pagefind/tag browser with compact types, advanced Place/Trip filters, experience sorting, removable summaries and shareable history state. Keep publication newest-first as default.
- [x] Seventeen pure tests, upstream CMS configuration/frontmatter round trips, and actual/isolated production builds pass. Real Chromium covers combinations, history, dates/grouping, article links, drafts, both themes, narrow layouts and Gallery regressions. Invalid published references and date-range fixtures fail as expected.
- [ ] Owner checks the new Post fields in hosted Pages CMS and physical-phone/keyboard/screen-reader behavior using [the acceptance procedure](docs/posts-discovery.md).
- [x] Owner approved releasing the reviewed Phase 3 changes directly to `origin/main` after final checks; the existing Pages workflow handles deployment.

The existing cover/image/social-preview system remains unchanged. No Wiki, terrain or GPX implementation is included. See [editorial rules, URL semantics, date-parser limitations and validation](docs/posts-discovery.md).

## Released Phase 2 — Atlas MVP and shared data layer

Released in `988ea88`; GitHub Pages deployment and live browser smoke checks passed.

- [x] Owner accepted hosted CMS ordered/repeated reference creation, reordering, saving and reopening. Preserve remaining owner-created test records.
- [x] Fix coordinate input using verified CMS `options.step: 0.000001`, retaining numeric JSON and coordinate bounds; native Chromium precision tests pass. Hosted decimal save/reopen acceptance remains below.
- [x] Add a renderer-independent graph resolver with ordered visits, derived inverse links, duplicate/missing-ID errors and cover-path validation; leave Posts fields/UI unchanged.
- [x] Implement Atlas-only MapLibre 6.17.0 globe, OpenFreeMap Positron/Dark styles, random global overview, explicit Place/Trip selection, manual Focus, clustering, filters, deep links and responsive sidebar/sheet controls.
- [x] Pure data/state tests and production builds pass, including empty/single/multiple data and deliberately failing missing-reference/duplicate-ID fixtures. Real Chromium checks pass for selection/filter precedence, cluster expansion, style/selection/camera persistence, reduced motion and 1280/768/390/320px layouts.
- [x] Deep-link/history, unknown IDs, empty/single/shared-Trip cases, style-outage/Retry and Posts/Gallery browser regressions pass. Unrelated pages request no MapLibre resources. See [Atlas development notes](docs/atlas-development.md).
- [ ] Owner accepts hosted decimal save/reopen and physical-phone gestures/keyboard/screen-reader behavior.
- [x] Owner reviewed the local preview and authorized releasing the Atlas MVP directly to `origin/main`, including its existing Pages deployment workflow. Posts integration and Wiki remain outside this release.

See [Atlas architecture, provider licenses and limitations](docs/atlas-development.md) and [CMS authoring/precision](docs/cms-compatibility-test.md). Region filtering lacks source data and is deferred. Posts integration, Wiki/help icon, GPX and terrain are separate later phases.

## Completed Phase 1 — Places/Trips CMS compatibility

- [x] Fast-forward the clean checkout to the latest `origin/main`, preserving CMS content and uploads.
- [x] Update collection view syntax while retaining default sort order; add minimal Places/Trips CMS JSON collections and Astro schemas with ordered single-reference visit rows.
- [x] Validate actual CMS configuration, ordered/repeated reference serialization, Astro validation, and production builds with empty collections and isolated demo data.
- [x] Owner authorized review and commit/push on successful review; scope/content checks pass. Add explicit referenced-Place deletion guidance.
- [x] Owner completed and accepted hosted CMS ordered-reference compatibility testing. Test records remain preserved; see [the manual test guide](docs/cms-compatibility-test.md).

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
- Review Phase 3, then Phase 4: Wiki and help icon, reusing current developer/publishing explanations. Future post-only terrain maps, GPX tracks, statistics and downloads require separate data/elevation sources and validation; no Atlas routes or connecting lines.

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
