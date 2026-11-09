# Changelog

## 2026-11-09

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
