# Bicycle Field Notes — project plan

## Current architecture and status

Astro generates static pages from `src/pages/` and Markdown/MDX articles from `src/content/posts/`. `Base.astro` handles shared layout and SEO; `src/config.ts` defines identity, navigation, and features. Pages CMS uses `.pages.yml`; GitHub Actions builds and publishes `dist/` to GitHub Pages.

Completed: Home, Posts, Atlas, and Contact navigation; responsive Home with the existing introduction/photo; and a unified Posts browser. Pagefind provides full-text matches, intersected with OR matching across selected tags. The generated article list retains newest-first order and production draft exclusions. Search and tag state use shareable URLs. Home submits its compact search input to Posts; filters sit right of the desktop list and above it on mobile. RSS, sitemap, social previews, themes, and reading controls remain active.

## Cleanup checklist

- [x] Inspect all tracked files and references; preserve existing content and publishing configuration.
- [x] Remove the unused theme contributor guide, tag-slug helper/output, and unused intro/featured/tag-count styles.
- [x] Rename package/lockfile identity, add hidden search labels, clarify content licensing, and distribute the Newsreader license notice.
- [x] Condense working documentation and update generated-file ignores.
- [x] Clean install and production build pass. Chrome checks cover full-text search, multi-tag OR/text AND, ordering, draft exclusion, clear/empty states, shared URLs, Back restoration, and stale searches. Layouts pass at 1280/768/390/320px. Generated links/fragments, RSS, SEO/JSON-LD, sitemap, robots, and project base paths pass. Multi-tag/draft fixtures were built in a temporary copy only.
- [ ] Owner reviews cleanup. No commit, push, or deployment is authorized for this task.

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

- Owner supplies further introduction, route/travel content, resource links, and contact details. Add a form only with a working submission service.
- Plan the Atlas MapLibre 3D globe with markers linking to posts, then optional post terrain maps, GPX tracks, and downloads. Choose data/style/elevation sources, attribution, content schema, performance limits, and accessible fallbacks before implementation. No map dependencies yet.

## Acceptance criteria

- `/posts/` is the sole browsing/search/filter interface. No standalone Search/Tags routes or internal links; published article URLs remain stable.
- Tags use OR; text and tags use AND. Counts, Clear Filters, empty/error states, shareable URLs, and Back/Forward restoration work without changing newest-first order or production draft exclusions.
- Home and Posts share a compact accessible search input; Home submits on Enter. Layouts remain usable at desktop and phone widths.
- `npm ci` and `npm run build` succeed; Pagefind, RSS, SEO, generated links, and GitHub Pages project paths work.
- User content/media, original license notices, CMS settings, and deployment configuration remain intact; uncertain items are retained and reported.

## Maintenance notes

Use Node 24. Run `npm ci`, `npm run dev`, or `npm run build` followed by `npm run preview` (full-text search needs a production build). The project base `/bicycle-field-notes/` comes from `SITE.url` or `SITE_URL`; internal UI URLs use `withBase()`.

CMS posts default to drafts; keep published filenames stable. Uploads go to `public/media/`. If the deployment path changes, coordinate the site URL, CMS media output, and existing post media URLs. GitHub Pages serves the generated robots file beneath the project path; the sitemap is at that same base. Pushes to `main` trigger deployment, so publishing requires approval.

The existing favicon source is `https://cs571-f25.github.io/p107/assets/favicon-CaOTZMPU.ico`; the Apple touch icon is a proportional export from that artwork. Preserve both originals.
