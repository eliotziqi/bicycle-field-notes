# Changelog

## 2026-11-13

- Fixed workflow startup rejection by initializing diagnostic paths inside a runner step; added coverage for GitHub context availability.

- Added shared-schema, read-only validation for all collections, local media and Markdown/MDX, with actionable file/field errors and regressions for incomplete CMS rows.
- Gate metadata commits and full-snapshot publication behind validation/build. Preserve saved edits and the previous live site on failure; report pending content and offer a native CMS retry action.
- Preserve manual month overrides and support recovery from invalid prior revisions. Removed only the owner-approved empty Experience row from the existing test Post.

## 2026-11-12

- Changed Post dates to month precision with ordered Experience ranges and a responsive top metadata row. Migrated existing explicit dates without changing article bodies, images, publication flags or geographic references.
- Added repository-side Published initialization and Updated maintenance with manual per-save overrides. CMS uses month strings, avoiding the nested native-date serializer bug.
- Simplified article geography to deduplicated Trips/Places in Explore in Atlas; removed content types, their filters, and RSS generation/links/dependency.

- Prepared “Beyond the Route,” the first official introduction, as an English-only, text-only Post draft using existing Pages CMS fields and article layout. Publication remains pending owner authorization.

## 2026-11-10

- Added the canonical Project Wiki with User, Publishing and Developer Guides, static responsive navigation, heading anchors, breadcrumbs, previous/next links and a documentation icon beside theme. Migrated technical guides and compatibility evidence; old docs paths remain pointers.
- Reused Pagefind with isolated Wiki/Post result kinds, documented four publishing workflows and 14 architecture decisions, and added documentation link/browser validation. GPX and terrain remain unimplemented.

## 2026-11-09

- Added optional Post content types, ordered Place/Trip references and experience dates to Astro/Pages CMS, with shared graph resolution and lightweight article links to Atlas. Preserved existing article files, images and generated social previews; GPX controls remain deferred.
- Extended the unified Pagefind Posts browser with type/Place/Trip filters, experience-date sorting, active summaries, per-dimension clears and Back/Forward restoration. Documented explicit versus Trip-derived discovery and added schema/graph/filter regression tests; Wiki remains deferred.
- Added the Atlas MVP with route-local MapLibre globe, OpenFreeMap light/dark maps and attribution, Place/Trip deep links, manual Focus, status/Trip/search filters, selection-aware clustering and responsive panel controls. Added shared relationship/validation utilities and developer documentation; existing CMS test entries are preserved. Posts integration and Wiki remain deferred.
- Recorded owner acceptance of hosted ordered references and set verified CMS coordinate `step: 0.000001` for six-decimal inputs while retaining numeric schemas and bounds.
- Updated Pages CMS collection view syntax and added minimal Places/Trips JSON collections with stable IDs, ordered single-reference visit rows, and Astro schemas. Added a manual CMS compatibility guide with name-change and referenced-Place deletion rules; hosted save/reopen testing remains pending. Atlas and Posts integration are deferred.
- Added a CMS-managed Gallery with shared category options, responsive thumbnails, OR filtering, a keyboard-accessible lightbox, and optional related-post links. Seeded the existing Mount Wangwei upload without copying it.
- Added the shared header subtitle and moved the Home welcome below a curated, manually controlled Gallery slideshow with empty/single-photo states and no autoplay.

- Audited tracked source, configuration, assets, dependencies, and documentation. Removed the original theme contributor guide and unused tag-slug/template-style remnants; renamed the package to `bicycle-field-notes`.
- Added hidden search labels, clarified that posts/photos/GPX do not automatically inherit MIT, preserved the upstream MIT notice, and included the Newsreader font license in published assets.
- Condensed the project plan and expanded local generated-file ignores.
- Unified article browsing, Pagefind search, and multi-tag filtering on Posts, with responsive filters, shareable URLs, counts, and clear/empty states. Removed standalone Search/Tags routes and updated article/header links.
- Replaced repetitive homepage search UI with a compact input shared with Posts.
- Restructured navigation around Home, Posts, Atlas, and Contact; moved the About introduction into Home with the existing photo, recent posts, and sidebar resources. Removed the decorative title mark and retained browser icons.
- Updated the site description and added project planning/agent instructions and a public-facing README.

This changelog begins with this restructuring; earlier changes have not been reconstructed.
