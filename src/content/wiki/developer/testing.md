---
title: "Testing and safe changes"
description: "Regression checks, content preservation and honest acceptance boundaries."
section: developer
order: 35
---

## Before editing

Read AGENTS, README, PLAN, CHANGELOG and the relevant current Wiki pages and decision records. Inspect code, `.pages.yml` and schemas rather than assuming documentation is correct. Run `git status`, fetch `origin/main`, compare branches, and fast-forward only when safe. Preserve CMS-created changes and uncommitted work; never reset/discard or pull through conflicts. Commit, push and deploy require explicit owner approval.

## Automated checks

Use Node 24:

```sh
npm ci
node tests/atlas.test.mjs
node tests/posts.test.mjs
node tests/post-metadata.test.mjs
node tests/content-validation.test.mjs
node tests/publication.test.mjs
npm run validate:content
node tests/wiki-links.test.mjs
npm run build
node tests/wiki.test.mjs
npm run preview
```

Pure Atlas tests cover ordered visits, shared Places, reverse links, ID/reference failures, coordinates, filters, selections and geographic bounds. Post tests cover compatible blanks, editorial order, date validation, visibility, derived discovery, metadata OR/AND, URLs and sorting. Wiki tests check link rewriting and production routes/links/anchors, Pagefind typing, SEO/sitemap and accidental public local-path leaks.

Build-time schemas/graph/media checks are part of validation. A production build is required for Pagefind. Existing MapLibre chunk-size warnings are known; do not silence them by loading maps on unrelated pages. Inspect the actual changed files and untracked files before declaring a patch safe.

## Browser checks

Run the checked-in `node tests/wiki-browser.mjs BASE_URL` against a production preview with Chrome exposing a local DevTools port 9222. The default base is the local project preview URL printed by Astro; provide a different URL when needed. This harness checks actual DOM, searches, navigation, themes, widths, keyboard interaction and no-JavaScript reading. It is a validation tool, not a runtime dependency, and requires a separately started Chrome instance.

For significant shared changes also exercise populated and empty Posts, search plus multiple filter dimensions, history restoration, article Atlas deep links without Focus, draft absence, Gallery filters/lightbox/focus return, Home manual slideshow and Atlas clustering/selection/themes. Current real content may not include public Posts: use labeled fixtures in a separate nonpublishing checkout, not fabricated travel records in source.

Isolated checkouts sharing symlinked dependencies need a distinct Astro `cacheDir`; the default content store is under `node_modules/.astro`. Build sequentially and verify the real final output has no demo records. Reset generated content with `npm run astro -- build --force`, then the normal combined build to rebuild Pagefind. Do not pass `--force` to the combined build, which forwards it to Pagefind.

## Content and deployment invariants

Confirm existing Post filenames/frontmatter/body, Gallery entries/categories, Places/Trips and media remain unchanged unless explicitly authorized. Preserve `.pages.yml` fields/media, deployment workflow, SEO, notices and existing base paths. Without published articles, test empty search; do not manufacture public content just to get a live test result.

Use production HTML link checks for internal routes and heading fragments. Check Wiki icon, breadcrumbs, sidebar active state, previous/next, mobile disclosure, visible focus, both themes, narrow layouts and no-JavaScript navigation. Documentation must not include credentials, private data or machine-specific paths.

## Evidence and manual acceptance

Compilation is not a browser test. Viewport emulation is not a physical-phone test. Local upstream CMS round trips are not authenticated hosted CMS acceptance. Record which checks actually ran; preserve useful evidence without claiming it applies to every future dependency version.

Owner checks remaining for current features include hosted decimal input/save/reopen, new Post ordered references/dates, physical-phone gestures and screen-reader behavior. [CMS evidence](cms-compatibility.md) separates accepted tests from outstanding items. [Publishing Posts](../publishing/posts.md#hosted-cms-acceptance) gives the owner procedure.

## Phase 4 validation record

The local Phase 4 implementation passed 19 pure Atlas/Post/Wiki-link tests, the upstream CMS configuration/frontmatter round-trip check, a production build and checks for all 19 Wiki routes and generated internal links/fragments. Sitemap/SEO and RSS boundaries passed. The build retains the existing MapLibre chunk-size warning.

Real Chrome checked Wiki icon/grouping/active navigation, breadcrumbs, previous/next, heading anchors, native keyboard disclosure with visible focus, no-JavaScript mobile browsing, both themes and 1280/768/390/320px layouts. Wiki search returned only documentation and restored URL/history, handled empty queries/no matches and discarded stale results. A physical-phone-style 390px viewport also had no horizontal overflow and started with collapsed navigation. Screenshots were visually inspected.

A separate labeled fixture checkout with its own Astro cache verified five published demo articles plus a hidden draft alongside Wiki indexing. Existing populated Pagefind/text/tag/type/Place/Trip combinations, sorting, Back/Forward, ordered/repeated article Atlas links, reverse associations and draft exclusion passed. The real checkout retained its original content, and current empty Posts, Home, Gallery lightbox/Escape and Atlas Trip checks passed without browser exceptions. Temporary fixture content was removed after validation; it is not published travel data.

Not verified by these checks: authenticated hosted CMS editing, physical-phone gestures or full screen-reader behavior. No deployment or release is included in this local validation record.

## Post month regression checks

`node tests/post-metadata.test.mjs
node tests/content-validation.test.mjs
node tests/publication.test.mjs
npm run validate:content` covers date migration, manual overrides, initialization and an isolated temporary Git repository. `PAGES_CMS_SOURCE=/path/to/pagescms node tests/cms-posts.test.mjs` runs the current configuration through the inspected upstream configuration schema, field validation, initialization, sanitization and frontmatter round trips. It needs an existing official CMS source checkout, not the hosted application. Tests cover create/edit/reopen, no Experience, multiple/reordered ranges and preserved repeated references. Run `node tests/posts-render.test.mjs` after the production build. `node tests/posts-browser.mjs BASE_URL [FIXTURE_BASE_URL]` covers article metadata, Atlas links, Posts search/sorting/history, both themes and four widths; the optional isolated fixture server adds multi-range and empty metadata cases.

Hosted acceptance must separately confirm month entry, string validation, empty and multiple Experience rows, save/reopen and automatic workflow refresh. Months are not exact dates; generated HTML/JSON-LD must not fabricate day precision. Confirm no content-type controls or feed routes/links remain. Use [publishing acceptance](../publishing/posts.md#hosted-cms-acceptance).

## Publishing recovery regressions

`content-validation.test.mjs` covers all collections, `559caf6`, partial/empty rows, invalid months/ranges, missing targets/media, malformed YAML/JSON/MDX and correction without losing independent edits. `publication.test.mjs` verifies workflow gates and reports every pending content change across saved Git commits. Metadata tests reject invalid current rows while allowing recovery from an invalid parent. The optional upstream CMS test proves its empty-row acceptance gap. Never add intentionally invalid test entries to main; use temporary fixtures. Build also runs the read-only preflight, and final compiled-link/article checks remain required.

Workflow YAML parsing alone does not validate GitHub expression contexts. The startup regression checks that report paths are initialized through `$GITHUB_ENV` inside a runner step, not with `runner.temp` in job-level `env`, which GitHub rejects before creating jobs. See [GitHub context availability](https://docs.github.com/en/actions/reference/workflows-and-actions/contexts#context-availability). Confirm the remote workflow actually starts and completes after workflow changes.

## Image accessibility and read-only audit

Run `node tests/media.test.mjs`, `node tests/content-validation.test.mjs`, then `npm run build` and `node tests/media-render.test.mjs`. Check the current `npm run audit:media` output; do not turn unused reports into deletions. Test an isolated build with an informative Gallery image, an explicitly decorative image and a Place cover; verify Home, lightbox alt copying and Atlas details in both themes. Missing informative alt must fail validation; no migration flags or title/name fallback remain. Test multiple related links (including repeated aliases and draft references) in Gallery cards and the lightbox, plus empty/single scalar compatibility. Hosted CMS conditional validation is not assumed; see [media workflow and caption findings](../publishing/media-gallery.md).
