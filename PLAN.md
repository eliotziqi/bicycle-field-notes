# Bicycle Field Notes — project plan

## Current architecture and status

Astro generates static pages from `src/pages/` and Markdown/MDX articles from `src/content/posts/`. `Base.astro` handles shared layout and SEO; `src/config.ts` defines identity, navigation, and features. Pages CMS uses `.pages.yml`; GitHub Actions builds and publishes `dist/` to GitHub Pages.

Completed: Home, Posts, Atlas, Gallery, and Contact navigation; responsive Home with the existing introduction and a curated Gallery slideshow; and a unified Posts browser. Pagefind provides full-text matches, intersected with OR matching across selected tags. The generated article list retains newest-first order and production draft exclusions. Search and tag state use shareable URLs. Home submits its compact search input to Posts; filters sit right of the desktop list and above it on mobile. Sitemap, social previews, themes, and reading controls remain active. Post dates use month precision; content types and RSS are removed.

## Publishing reliability

- [x] Correct runner-only context placement after GitHub rejected workflow initialization; add a startup regression check.

- [x] Audit all CMS collections and reproduce native optional-object validation gaps using `559caf6` and upstream helpers.
- [x] Share Astro contracts with read-only file/field diagnostics, reference/media/syntax checks and regression fixtures.
- [x] Keep main authoring saves; gate full-snapshot publication and automatic metadata commits behind validation/build, with pending-edit reports and native CMS retry action.
- [x] Remove only the owner-approved empty Experience row; preserve other content and manual month overrides.
- [ ] Owner confirms authenticated hosted CMS action dispatch/status and save/reopen acceptance; no staging/PR workflow introduced.

## Current Post metadata update

- [x] Use month-only publication/update values and ordered repeatable Experience ranges, with legacy day-date compatibility and explicit migration preserving bodies, media, flags and references.
- [x] Keep native CMS string fields and ordered Place/Trip rows; remove content types. Add post-save month maintenance with per-save manual overrides and build the maintained revision.
- [x] Show one responsive date row and a compact deduplicated Explore in Atlas footer; remove RSS route, links and dependency.
- [x] Production builds, month/schema/history tests, upstream CMS serialization, article/Atlas checks and Chrome regressions pass, including multiple ranges, empty states, both themes and 1280/768/390/320px. Hosted CMS interaction and workflow write-permission acceptance remain distinct from local checks.

## Current phase — Phase 4 Project Wiki

- [x] Review code and existing guides; migrate detailed explanations/evidence into canonical Astro Markdown Wiki sources, leaving old docs paths as pointers.
- [x] Add grouped static navigation, breadcrumbs, heading TOCs/anchors, previous/next, responsive reading layout and a book icon beside theme; preserve main navigation.
- [x] Cover visitor behavior, actual CMS publishing workflows, shared architecture and 14 numbered decisions. No new content collection in Pages CMS or runtime dependency.
- [x] Reuse one Pagefind index with explicit Wiki/Post kinds; preserve unified article filtering and static Wiki browsing fallback.
- [x] Nineteen pure tests, CMS upstream configuration/frontmatter checks, production builds and all 19 Wiki route/link/fragment checks pass. Real Chrome covers Wiki search/history/races, native keyboard focus/disclosure, no-JS navigation, desktop/mobile widths and both themes; isolated populated Post regressions and current Home/Gallery/Atlas checks pass.
- [ ] Owner accepts Wiki content/navigation on a physical phone and assistive technology; hosted CMS checks below remain distinct.
- [x] Owner approved releasing the reviewed Phase 4 implementation directly to `origin/main` after final checks; the existing Pages workflow handles deployment.

## Released Phase 3 — Posts integration and discovery

Released in `9fad5a7`; GitHub Pages build/deploy and live Chrome smoke checks passed. Optional types, ordered/repeated geographic references and experience dates extend existing Posts without rewriting them. The shared graph derives published reverse discovery. Article Atlas links select without Focus; the unified Pagefind browser adds types, advanced Place/Trip filters, experience sorting and shareable history.

Seventeen pure tests, local upstream CMS configuration/frontmatter round trips, isolated populated/empty builds and Chrome checks passed. The live site had no published Posts, so populated results and article links were tested with isolated fixtures. Remaining owner acceptance: hosted new Post field save/reopen, physical-phone and screen-reader behavior. See [publishing acceptance](src/content/wiki/publishing/posts.md#hosted-cms-acceptance).

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

See [Atlas architecture, provider licenses and limitations](docs/atlas-development.md) and [CMS authoring/precision](docs/cms-compatibility-test.md). Region filtering lacks source data and is deferred. Posts integration is released; Wiki is the current local phase. GPX and terrain remain future work.

## Completed Phase 1 — Places/Trips CMS compatibility

- [x] Fast-forward the clean checkout to the latest `origin/main`, preserving CMS content and uploads.
- [x] Update collection view syntax while retaining default sort order; add minimal Places/Trips CMS JSON collections and Astro schemas with ordered single-reference visit rows.
- [x] Validate actual CMS configuration, ordered/repeated reference serialization, Astro validation, and production builds with empty collections and isolated demo data.
- [x] Owner authorized review and commit/push on successful review; scope/content checks pass. Add explicit referenced-Place deletion guidance.
- [x] Owner completed and accepted hosted CMS ordered-reference compatibility testing. Test records remain preserved; see [the manual test guide](docs/cms-compatibility-test.md).

At the Phase 1 milestone, no Atlas, Posts integration, Wiki or relationship graph was included. The owner authorized committing and pushing the reviewed compatibility changes; the existing `main` push deployment workflow remains unchanged. Collection IDs must remain stable; cross-entry integrity validation was added in later phases. Detailed test steps and current limitations live in the guide.

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

## Next steps (future)

- “Beyond the Route” is prepared as an English-only, text-only draft in the existing Posts collection. Keep `draft: true` until the owner explicitly authorizes publication; photographs can be inserted later through the Pages CMS body editor.
- Draft validation passed: Node 24 production build, 19 pure regression tests, Wiki route/link checks, and local Chrome article rendering at 1280/768/390/320px in both themes. Production preview confirms article 404 and exclusion from Home, Posts, RSS, sitemap, social preview and Pagefind Post results. Hosted Pages CMS discovery/edit/save/reopen remains a manual acceptance check.

- Owner supplies further introduction, route/travel content, resource links, and contact details. Add a form only with a working submission service.
- Complete remaining physical-phone, assistive-technology and hosted CMS acceptance. Future post-only terrain maps, GPX tracks, statistics and downloads require separate data/elevation sources and validation; no Atlas routes or connecting lines.

## Acceptance criteria

- `/gallery/` appears between Atlas and Contact; categories use OR, lightbox supports keyboard/focus return, and only opted-in entries appear on Home. Empty and single-photo states remain usable.
- `/posts/` is the sole article browsing/search/filter interface. No standalone Search/Tags routes or internal links; published article URLs remain stable.
- Tags use OR; text and tags use AND. Counts, Clear Filters, empty/error states, shareable URLs, and Back/Forward restoration work with publication newest-first as default and unchanged production draft exclusions.
- Home and Posts share a compact accessible search input; Home submits on Enter. Layouts remain usable at desktop and phone widths.
- `npm ci` and `npm run build` succeed; Pagefind, SEO, generated links, and GitHub Pages project paths work.
- User content/media, original license notices, CMS settings, and deployment configuration remain intact; uncertain items are retained and reported.

## Maintenance ownership

Detailed development/deployment instructions and regression requirements live in the [Wiki](src/content/wiki/developer/index.md); publishing procedures live in [Publishing](src/content/wiki/publishing/index.md). This roadmap tracks milestones and unresolved work rather than duplicating those guides. Preserve historical favicon source attribution in repository history and existing assets/notices.
