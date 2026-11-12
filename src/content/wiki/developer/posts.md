---
title: "Posts search and URL architecture"
description: "One Pagefind article browser, ordered metadata and date sorting."
section: developer
order: 33
---

## Unified browser contract

The existing `/posts/` browser retains its shared SearchField, lazy Pagefind loader, single full-text index, static article rows, count/error/empty states and revision guard against stale searches. Metadata is rendered into those same rows; there is no second search service or index.

Search remains full-text article search. Tags are the primary controls. Content-type classification and filtering have been removed. Places, Trips and sorting live in a collapsed advanced section, opened when those URL controls are restored. Facet options/counts describe the visible Post collection, not all Atlas records; counts are not dynamically recalculated after each filter. Place counts include explicit and Trip-derived discovery associations. Blank collections remain usable.

Within a dimension use OR; across tags/Places/Trips and Pagefind results use AND. Active summaries and each group’s Clear action remove only that dimension; Clear Filters resets all dimensions and publication sort. Unknown IDs/tags retain a removable summary and produce an empty match rather than silently widening results.

Default ordering remains publication newest-first. Experience newest/oldest sorting uses the latest known range start month (or a legacy end-only month), independently of manual range display order. Undated Posts come last in both directions; ties use publication newest-first, then stable ID. The same row nodes regroup into experience-year sections and an explicit “Undated experience” section. Undated rows label their displayed date as publication. No experience date is fabricated.

Shareable URL parameters:

| Parameter | Meaning |
| --- | --- |
| `q` | Existing full-text query |
| `tags=a,b` | Existing OR tag links |
| Repeated `tag` | Existing alternative for tags containing commas; Unicode supported |
| Repeated `place` | Stable discovery Place IDs |
| Repeated `trip` | Stable explicit Trip IDs |
| `sort=experience-desc` / `experience-asc` | Optional experience ordering; omitted means publication newest-first |

Discrete checkbox, sort and clear actions create history entries. Typing continues to replace the current URL to avoid an entry per keystroke. Back/Forward restores controls, results, sorting and grouping; a revision guard discards stale Pagefind completions. Unrelated URL parameters are retained.

## Article and Atlas UI

Published, Updated and ordered Experience month ranges appear together above the body. HTML time values use `YYYY-MM`; JSON-LD omits publication/modification dates because Schema.org Date expects day precision. No first-of-month day or midnight timestamp is fabricated. Social previews and article listings also show months.

The footer is **Explore in Atlas**, with Trips then Places, one wrapping line per nonempty category. Both link lists deduplicate by stable ID in first-occurrence order; source narrative arrays remain unchanged. Trip-derived Places are not added to authored Place links. Experience never appears in the footer; empty geography hides the section.

Links use `withBase(atlasSelectionPath(...))`, producing the GitHub Pages `/bicycle-field-notes/atlas/?place=...` or `?trip=...` path. They request selection only, never Focus. Existing Atlas URL, Back/Forward, unknown-ID and camera behavior remain authoritative. Articles load no MapLibre assets. Related UI is excluded from Pagefind article indexing to avoid turning helper text into article matches; geographic discovery is handled by the explicit filters.

## Validation and acceptance

Run Node 24 with `node tests/atlas.test.mjs`, `node tests/posts.test.mjs`, `npm run build`, then `npm run preview`. Production search needs the built Pagefind index. Automated tests cover optional fields, repeats, date ranges, graph distinctions, missing references, visibility, metadata filter combinations, URL serialization and sorting. Integration/browser results and remaining owner acceptance are recorded in the project plan.

Isolated fixture checkouts must have their own Astro `cacheDir` if dependencies are symlinked. Astro normally stores content data under `node_modules/.astro`; sharing that directory across simultaneous builds can mix generated output despite unchanged source files. Use a fixture-only cache directory, build sequentially, and verify the real checkout's final output contains no demo records. To reset generated Astro content caches use `npm run astro -- build --force`, then run the normal `npm run build` to regenerate Pagefind. Do not append `--force` to the combined build script: npm would forward it to Pagefind rather than Astro.


## Shared documentation search

Wiki reuses the same Pagefind CLI output. Article containers carry `kind:Post`, Wiki reading containers `kind:Wiki`; clients request only their own kind. Posts still intersect matching URLs with the same static article rows and metadata dimensions. Wiki never becomes an article result, tag. Wiki search loads only on its search route, labels results as documentation and offers a static browse fallback. It caps rendered search results at 20 and asks readers to refine larger result sets.

[Pagefind filter attributes](https://pagefind.app/docs/filtering/) and [JavaScript filters](https://pagefind.app/docs/js-api-filtering/) describe this built-in mechanism; the installed engine is validated through production-browser tests rather than assuming current online examples match its version.

## Field ownership

Canonical editing instructions, month maintenance, ordered rows and experience-date examples live in [Post publishing](../publishing/posts.md). [Relationships](relationships.md) owns direct/derived semantics; [testing](testing.md) owns regression requirements. Existing cover/body-image/social-preview behavior is retained; no new cover or GPX control is introduced.

## Month maintenance and compatibility

`src/utils/post-dates.ts` owns month validation/formatting. The Astro schema accepts historical day-based values and legacy Experience objects while normalizing them for display. The current CMS writes month strings and repeatable `{start, end}` objects. Empty lists are optional; nonempty rows require both endpoints. Existing explicit dates are migrated to their known months, with source bodies and flags preserved.

`scripts/post-metadata.mjs` uses the existing YAML parser to preserve body bytes while editing frontmatter. `--migrate` converts explicit dates without inventing Updated values. Normal workflow execution scans tracked Posts, compares each file with its previous revision and uses its latest edit commit's UTC month. It initializes missing Published and stamps Updated on substantive subsequent edits unless Updated was manually changed/cleared in that edit. It skips its own `chore(posts): maintain month metadata` commits; normalization-only migrations do not manufacture edits.

The deployment workflow serializes runs, checks out the latest branch, commits metadata when necessary, and builds that exact resulting revision. Bot pushes do not need to trigger a second workflow. A concurrent branch update can reject the non-force push; the newer queued run reconciles the latest tree. Branch rules may require permission for the workflow's content write. Hosted defaults appear after workflow completion and CMS refresh, not while initially typing. See [publishing](../publishing/posts.md).
