---
title: "Posts search and URL architecture"
description: "One Pagefind article browser, ordered metadata and date sorting."
section: developer
order: 33
---

## Unified browser contract

The existing `/posts/` browser retains its shared SearchField, lazy Pagefind loader, single full-text index, static article rows, count/error/empty states and revision guard against stale searches. Metadata is rendered into those same rows; there is no second search service or index.

Search remains full-text article search. Tags and compact Content type selectors are primary controls. Places, Trips and sorting live in a collapsed advanced section, opened when those URL controls are restored. Facet options/counts describe the visible Post collection, not all Atlas records; counts are not dynamically recalculated after each filter. Place counts include explicit and Trip-derived discovery associations. Blank collections remain usable.

Within a dimension use OR; across tags/types/Places/Trips and Pagefind results use AND. Active summaries and each group’s Clear action remove only that dimension; Clear Filters resets all dimensions and publication sort. Unknown IDs/types/tags retain a removable summary and produce an empty match rather than silently widening results.

Default ordering remains publication newest-first. Experience newest/oldest sorting uses start date, falling back to a known end-only date. Undated Posts come last in both directions; ties use publication newest-first, then stable ID. The same row nodes regroup into experience-year sections and an explicit “Undated experience” section. Undated rows label their displayed date as publication. No experience date is fabricated.

Shareable URL parameters:

| Parameter | Meaning |
| --- | --- |
| `q` | Existing full-text query |
| `tags=a,b` | Existing OR tag links |
| Repeated `tag` | Existing alternative for tags containing commas; Unicode supported |
| Repeated `type` | Stable primary content-type values |
| Repeated `place` | Stable discovery Place IDs |
| Repeated `trip` | Stable explicit Trip IDs |
| `sort=experience-desc` / `experience-asc` | Optional experience ordering; omitted means publication newest-first |

Discrete checkbox, sort and clear actions create history entries. Typing continues to replace the current URL to avoid an entry per keystroke. Back/Forward restores controls, results, sorting and grouping; a revision guard discards stale Pagefind completions. Unrelated URL parameters are retained.

## Article and Atlas UI

Referenced articles show a lightweight Places and journeys section after the body, with optional experience dates, ordered Place links and unique ordered Trip links. Trip-derived Places are deliberately not presented as authored Related Places. Experience-only articles can show dates without requiring geographic links. No reference/date metadata means no related-content section.

Links use `withBase(atlasSelectionPath(...))`, producing the GitHub Pages `/bicycle-field-notes/atlas/?place=...` or `?trip=...` path. They request selection only, never Focus. Existing Atlas URL, Back/Forward, unknown-ID and camera behavior remain authoritative. Articles load no MapLibre assets. Related UI is excluded from Pagefind article indexing to avoid turning helper text into article matches; geographic discovery is handled by the explicit filters.

## Validation and acceptance

Run Node 24 with `node tests/atlas.test.mjs`, `node tests/posts.test.mjs`, `npm run build`, then `npm run preview`. Production search needs the built Pagefind index. Automated tests cover optional fields, repeats, date ranges, graph distinctions, missing references, visibility, metadata filter combinations, URL serialization and sorting. Integration/browser results and remaining owner acceptance are recorded in the project plan.

Isolated fixture checkouts must have their own Astro `cacheDir` if dependencies are symlinked. Astro normally stores content data under `node_modules/.astro`; sharing that directory across simultaneous builds can mix generated output despite unchanged source files. Use a fixture-only cache directory, build sequentially, and verify the real checkout's final output contains no demo records. To reset generated Astro content caches use `npm run astro -- build --force`, then run the normal `npm run build` to regenerate Pagefind. Do not append `--force` to the combined build script: npm would forward it to Pagefind rather than Astro.


## Shared documentation search

Wiki reuses the same Pagefind CLI output. Article containers carry `kind:Post`, Wiki reading containers `kind:Wiki`; clients request only their own kind. Posts still intersect matching URLs with the same static article rows and metadata dimensions. Wiki never becomes an article result, tag or RSS entry. Wiki search loads only on its search route, labels results as documentation and offers a static browse fallback. It caps rendered search results at 20 and asks readers to refine larger result sets.

[Pagefind filter attributes](https://pagefind.app/docs/filtering/) and [JavaScript filters](https://pagefind.app/docs/js-api-filtering/) describe this built-in mechanism; the installed engine is validated through production-browser tests rather than assuming current online examples match its version.

## Field ownership

Canonical editing instructions, content-type definitions, ordered rows and experience-date examples live in [Post publishing](../publishing/posts.md). [Relationships](relationships.md) owns direct/derived semantics; [testing](testing.md) owns regression requirements. Existing cover/body-image/social-preview behavior is retained; no new cover or GPX control is introduced.
