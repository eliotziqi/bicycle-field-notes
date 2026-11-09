# Posts: editorial metadata and discovery

## Implementation files

| Files | Responsibility |
| --- | --- |
| `.pages.yml`, `src/content.config.ts`, `src/schemas/post-editorial.ts` | Optional CMS fields, compatible schema/date normalization |
| `src/utils/atlas-graph.ts`, `src/utils/atlas.ts`, `src/utils/posts.ts`, `src/utils/urls.ts` | Shared relationships, published visibility, production graph reuse and Atlas paths |
| `src/utils/post-discovery.ts`, `src/scripts/posts-browser.ts` | Pure filter/URL/sort rules and extension of the existing Pagefind browser |
| `src/pages/posts/index.astro`, `src/pages/posts/[...slug].astro`, `src/components/PostList.astro`, `src/components/PostFilterGroup.astro`, `src/components/PostGeography.astro`, `src/styles/global.css` | Posts controls, reusable rows/filter groups, article geography and styling |
| `src/pages/atlas.astro`, `src/scripts/atlas.ts` | Serialize only public reverse summaries; label Trip-derived associations without changing camera behavior |
| `tests/posts.test.mjs`, `tests/atlas.test.mjs` | Editorial/schema/discovery coverage and existing graph regression contract |
| `PLAN.md`, `CHANGELOG.md`, `README.md`, `AGENTS.md`, `docs/atlas-development.md`, `docs/cms-compatibility-test.md`, this guide | Roadmap/history, project guidance, shared semantics and manual acceptance |

## Content model

All new Post fields are optional. Existing articles are not rewritten, classified, dated or linked automatically. The Markdown body editor, filenames, publication dates, tags, featured/draft flags, body images and generated social previews remain intact. No competing cover field or GPX control is added.

| Content type | Stored value | Editorial example |
| --- | --- | --- |
| Ride | `ride` | A cycling ride report, describing the ride itself |
| Travel | `travel` | A journey account spanning transport, destinations and travel experiences |
| Guide | `guide` | Practical instructions, planning advice or an explanatory reference |
| Field Note | `field-note` | A short observation or reflection from the road |

Choose one primary purpose, or leave Content type blank when undecided. Tags remain flexible themes (for example photography or maintenance). Places are geographic references; Trips identify specific journeys. These dimensions are independent, not a second nested category hierarchy. An old unclassified Post remains visible by default but does not match an active Content type filter.

`relatedPlaces` and `relatedTrips` use the owner-tested Pages CMS pattern: an ordered object list with one single reference per row. Values come from `{fields.id}`; labels show names plus IDs. Place repeats remain in narrative order. Trip repeats remain in source and the resolved graph; article Trip link lists deduplicate by first occurrence. A Post's narrative order never replaces the chronological order in a Trip.

Illustration only; replace these sample IDs with existing records:

```yaml
contentType: travel
relatedPlaces:
  - place: place-b
  - place: place-a
  - place: place-b
relatedTrips:
  - trip: journey-two
  - trip: journey-one
  - trip: journey-two
experience:
  startDate: "2026-10-01"
  endDate: "2026-10-03"
```

Experience dates describe when the experience happened, independently of `pubDate`. Either endpoint may be supplied; an end-only date is displayed as an ending date. Blank/null CMS dates and empty objects normalize to absence. Dates normalize to `YYYY-MM-DD`; end-before-start fails the content schema. No dates are inferred from Trips, publication, filenames or geography.

When editing Markdown by hand, quote ISO dates as shown. Astro's YAML parser turns unquoted timestamp values into `Date` objects before schema validation; these are normalized to UTC date strings for compatibility. Malformed unquoted calendar dates may already have been normalized upstream before validation. Use the CMS date picker or quoted ISO dates for strict calendar checking. JSON Trip dates are unaffected by Markdown timestamp parsing.

## Relationship rules

There is one graph in `atlas-graph.ts`, exposed through `getAtlas()`. Production reuses it within a build instead of resolving all content for every article; development reads remain fresh. No inverse relationships are authored in CMS:

- **Explicit editorial references:** `resolvePostReferences()` returns the complete ordered Place and Trip sequences. Article Related Places lists preserve repeats; Related Trips links preserve first-occurrence order. A Place reference is a mention, not proof of a visit.
- **Derived discovery:** a Post's unique discovery Place IDs are explicit Places plus all Places in its explicitly linked Trips. Place filters use this set. Reverse Place→Posts links mark associations available only through a Trip as “via related Trip” in Atlas. This does not append to explicit Place order or alter Ridden/Visited/Wishlist status.
- **Trip discovery:** Post→Trip filtering and reverse Trip→Posts links use explicit Trip references only. Mentioning a Place does not associate the Post with every Trip that visits it.
- **Map membership:** Trip markers still use unique Places; chronological visit rows retain repetitions. Posts integration does not change marker membership, selection, Focus or the camera.

Public summaries come through visible `getPosts()` results. The graph also defensively excludes `draft: true` inputs. Draft titles, bodies, tags and relationships are not serialized into production Atlas, browser facets or RSS. Development article previews may resolve their own references without adding drafts to Atlas reverse associations.

Missing references in published Posts identify the source file and zero-based field row. Duplicate Place/Trip stable IDs and duplicate Post IDs passed to the resolver fail with actionable errors. Post identity remains its existing content-loader ID and published route; no new Post ID field is introduced. Astro still validates the syntax/schema of draft frontmatter, but unpublished target references can remain a work in progress until publication.

Before deleting a Place, inspect every Trip visit and every Post `relatedPlaces` row. Before deleting a Trip, inspect Post `relatedTrips` rows. Update every occurrence deliberately; the CMS does not repair or cascade references. Production builds reject unresolved published references. Do not change stable IDs merely to rename display titles.

## Unified Posts browser

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

Links use `withBase(atlasSelectionPath(...))`, producing the GitHub Pages `/bicycle-field-notes/atlas/?place=...` or `?trip=...` path. They request selection only, never Focus. Existing Atlas URL, Back/Forward, unknown-ID and camera behavior remain authoritative. Articles load no MapLibre assets. Related UI is excluded from Pagefind body indexing to avoid turning helper text into article matches; geographic discovery is handled by the explicit filters.

## Validation and acceptance

Run Node 24 with `node tests/atlas.test.mjs`, `node tests/posts.test.mjs`, `npm run build`, then `npm run preview`. Production search needs the built Pagefind index. Automated tests cover optional fields, repeats, date ranges, graph distinctions, missing references, visibility, metadata filter combinations, URL serialization and sorting. Integration/browser results and remaining owner acceptance are recorded in the project plan.

Isolated fixture checkouts must have their own Astro `cacheDir` if dependencies are symlinked. Astro normally stores content data under `node_modules/.astro`; sharing that directory across simultaneous builds can mix generated output despite unchanged source files. Use a fixture-only cache directory, build sequentially, and verify the real checkout's final output contains no demo records. To reset generated Astro content caches use `npm run astro -- build --force`, then run the normal `npm run build` to regenerate Pagefind. Do not append `--force` to the combined build script: npm would forward it to Pagefind rather than Astro.

Hosted CMS Post interaction checks remain manual. After separately approving a nonpublishing test branch containing these changes:

1. Open an existing article without editing it and confirm its body/old metadata still load. Create a clearly labeled demo Post as a draft. Leave new fields blank, save/reopen, then try each content type and clear it again.
2. Add Place A → B → A with three rows; reorder to B → A → A and save/reopen. Inspect Markdown frontmatter for order and both A references. Add two Trips in narrative order with a repeated Trip and repeat the save/reopen check.
3. Set experience dates independently of publication. Clear them and confirm empty values build. Try an end date before the start date and confirm the build rejects it; the CMS itself has no configured cross-field date comparison.
4. In an isolated production preview, confirm article Place order, deduplicated Trip links, Atlas selection without Focus, reverse Post links, all filter dimensions, experience sorting and shareable URLs. Confirm a Trip-only article gains Place discovery matches without gaining explicit Place links or visit statuses.
5. Keep the demo as a draft on any publishing branch and verify it is absent from public Posts, facets, Atlas and RSS. Only publish demo records in an isolated nonpublishing preview. Remove only test records created for this check after recording results; preserve existing owner-created tests and content.
6. Check keyboard/screen-reader use and a physical phone in both themes. Viewport emulation is not physical-device or hosted-CMS certification.

## Deferred

Wiki/help navigation remains Phase 4; it should reuse these editorial explanations. GPX attachment controls, rendering/downloads, terrain previews and elevation statistics remain future work. Existing images and social previews continue to work; this phase introduces no new article cover implementation.
