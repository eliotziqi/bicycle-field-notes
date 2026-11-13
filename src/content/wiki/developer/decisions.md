---
title: "Architecture decision log"
description: "Numbered decisions, rationale and constraints for future changes."
section: developer
order: 37
---

These records consolidate decisions visible in the released implementation and the current Wiki patch. They are numbered summaries, not claims of historical meeting dates. Records 001–012 describe existing decisions; 013–014 document the Phase 4 implementation. Record 008 is a scope boundary with a future, unimplemented feature.

## ADR 001: Unique geographic Places

**Context:** The same location can recur across journeys.

**Chosen approach:** One Place per geographic entity, with stable ID independent of its name.

**Rationale:** Reuse prevents conflicting coordinates and duplicated descriptions.

**Tradeoffs:** IDs require deliberate migrations; CMS does not lock them.

**Consequences:** Reuse records on return visits; update every reference before deletion or ID change.

## ADR 002: Ordered Trip visits

**Context:** Journeys can return to an earlier location.

**Chosen approach:** Trips own ordered object rows, one Place reference per visit; repetitions are valid.

**Rationale:** A/B/A retains the actual visiting sequence.

**Tradeoffs:** Reference rows are more verbose than a multi-select.

**Consequences:** Never deduplicate or sort source visits; deduplicate only geographic marker/fitting membership.

## ADR 003: Independent Post narrative order

**Context:** An article may tell a journey out of chronological order.

**Chosen approach:** Posts own ordered relatedPlaces and relatedTrips lists independently of Trip visits.

**Rationale:** Editorial order remains authored rather than reconstructed.

**Tradeoffs:** Repeated source Trip references need a unique link-list projection.

**Consequences:** Preserve Place repetitions and first-occurrence Trip link order; do not rewrite Trip chronology.

## ADR 004: Derived inverse relationships

**Context:** Manual inverse lists can diverge from their source links.

**Chosen approach:** Compute Place→Trips/Posts and Trip→Posts in the shared build-time graph.

**Rationale:** One forward source defines consistent reverse discovery.

**Tradeoffs:** Consumers must distinguish explicit links from Trip-derived Places.

**Consequences:** Reuse the graph; derived membership never asserts a visit or changes Place status.

## ADR 005: Trip membership without connecting lines

**Context:** Place sequences are not measured travel tracks.

**Chosen approach:** Atlas highlights unique Trip Places without lines or inferred routes.

**Rationale:** Avoid implying exact roads, transport or geometry.

**Tradeoffs:** Visiting order is read from the complete sidebar list.

**Consequences:** Keep route geometry out of Atlas; future measured tracks require a separate article-level visualization.

## ADR 006: Manual Atlas Focus

**Context:** Selection and filtering can be exploratory and frequent.

**Chosen approach:** Only explicit Focus moves the camera for selection/filter targets.

**Rationale:** Readers retain camera control and can inspect details without disorientation.

**Tradeoffs:** An extra action is needed to fit selected geography; clusters still expand explicitly.

**Consequences:** Deep links, history, selection and filters must not call Focus automatically; respect reduced motion.

## ADR 007: Route-local MapLibre

**Context:** The map renderer is a large interactive dependency.

**Chosen approach:** Dynamically load MapLibre JS/CSS/worker on Atlas only.

**Rationale:** Preserve lightweight article, Gallery and documentation browsing.

**Tradeoffs:** Map initialization/fallback requires route-specific code.

**Consequences:** Do not move renderer imports into shared layout or graph utilities; check unrelated-page requests.

## ADR 008: Future GPX boundary

**Context:** Measured ride tracks differ from a geographic index.

**Chosen approach:** Reserve GPX/terrain for future article-level route visualizations; no rendering is implemented.

**Rationale:** An article provides route context without turning Atlas membership into geometry.

**Tradeoffs:** Attachments, elevation sources and downloads need future schema/provider decisions.

**Consequences:** This is an accepted scope boundary, not a shipped GPX feature; propose and validate it in a later phase.

## ADR 009: Unified Posts and Pagefind

**Context:** Search, topics and geography should narrow the same article list.

**Chosen approach:** Retain one Posts browser and one Pagefind engine/index.

**Rationale:** Avoid duplicate search routes/services and divergent ordering.

**Tradeoffs:** Browser metadata filtering and URL/race handling must remain coordinated.

**Consequences:** OR within dimensions, AND across dimensions/text; Wiki uses kind filtering in that same index.

## ADR 010: Gallery metadata separate from uploads

**Context:** An upload may serve an article or cover without being curated for Gallery.

**Chosen approach:** Only explicit Gallery records create Gallery photos; homepage inclusion is an independent flag.

**Rationale:** Owners control captions, categories, related Posts and Home selection.

**Tradeoffs:** Uploading alone does not publish a Gallery entry.

**Consequences:** Never scan uploads into entries; preserve original files and generate responsive derivatives through Astro.

## ADR 011: JSON entities, Markdown articles

**Context:** Places/Trips are structured data; Posts need rich authored text.

**Chosen approach:** Keep Places/Trips in JSON and existing Posts in Markdown/MDX.

**Rationale:** Matches Pages CMS and existing Astro loaders without content migration.

**Tradeoffs:** Schema and serialization compatibility must be tested across formats.

**Consequences:** Use stable ID references and blank normalization; preserve existing body/filename/image conventions.

## ADR 012: Pages CMS as content editor

**Context:** The owner needs a practical repository-backed publishing interface.

**Chosen approach:** Keep Pages CMS primary for Posts, Places, Trips, Gallery and categories.

**Rationale:** Avoid a custom CMS, database or duplicate content store.

**Tradeoffs:** Hosted version behavior needs acceptance; saves to main trigger deployment and drafts are not source privacy.

**Consequences:** Verify field support upstream and through hosted tests; document rather than assume editor capabilities.

## ADR 013: Canonical static Wiki

**Context:** Guides were split across docs and roadmap with stale duplication.

**Chosen approach:** Use one Astro Markdown Wiki collection and shared layout; old docs paths become pointers.

**Rationale:** Reuse build, themes and content tooling without new dependencies.

**Tradeoffs:** Wiki edits use Git; public routes and source-relative Markdown links need validation.

**Consequences:** Update current behavior and significant decisions with feature changes; keep README/AGENTS/PLAN/CHANGELOG focused.

## ADR 014: Typed shared search

**Context:** Wiki and Posts share Pagefind but serve different discovery tasks.

**Chosen approach:** Index reading containers as kind:Wiki or kind:Post; each client filters its own kind.

**Rationale:** One generated engine can provide isolated results without a second service.

**Tradeoffs:** Search needs JS and a production build; Wiki has a static browse fallback and 20-result display cap.

**Consequences:** Preserve article URL intersection and test populated/empty article collections when changing index behavior.

## ADR 015: Month precision and repository-maintained Post dates

**Context:** Posts need month precision, multiple experiences and reliable CMS saves; optional nested native dates caused a reproduced server serialization failure.

**Chosen approach:** Store Post month strings and ordered `{start, end}` ranges; keep CMS string fields editable. Maintain automatic Published/Updated values after saves in the existing deployment workflow. Use native sequential fields because the CMS has no field-column layout. Remove content types and RSS, retain tag/geographic discovery, and display unique Atlas references below the article.

**Rationale:** Avoid invented days, a custom CMS and the nested date writer while preserving authored references and month overrides.

**Tradeoffs:** Automatic values require workflow completion and an editor refresh. Manual Updated changes apply to that edit; subsequent edits resume maintenance. Range ordering is validated by Astro, not a native CMS cross-field rule. Month-only dates are omitted from Schema.org Date fields instead of inventing a day.

**Consequences:** Preserve legacy metadata during explicit month migration, never alter article bodies or publish drafts, and test complete CMS write serialization plus workflow concurrency. Source repeated references remain distinct from deduplicated footer links. Trip dates are outside this Post-only precision change.


## ADR 016: Preserve authoring saves and gate complete publication

**Context:** Native optional object lists accept empty rows; `559caf6` broke production after saving. Automatic metadata was previously committed before build success.

**Chosen approach:** Keep hosted CMS editing on main. Share Astro schemas with a read-only preflight, then prepare metadata and build before committing it or uploading a Pages artifact. Report affected fields and all pending saved content. Add the documented native CMS workflow action for retry, and check revision freshness before metadata push and deployment.

**Rationale:** Saved Git history preserves every edit; one validated artifact preserves cross-collection consistency without staging/PR machinery or a custom editor. Native validation remains useful but is not authoritative.

**Tradeoffs:** A bad entry delays the entire next deployment, visibly reported; the previous site stays live. The author corrects the saved source and all pending changes publish together. GitHub cannot atomically lock branch advancement with Pages deployment, so a change arriving after the final revision check is handled by its subsequent validation run. Workflow reports require checking Actions, and hosted action permissions need manual acceptance.

**Consequences:** Never silently discard incomplete user data or deploy a sanitized subset. Validate before automatic commits, preserve manual month overrides, use non-force pushes, and cover failure/correction in fixtures. No dependencies or staging branch are introduced. See [publishing reliability](../publishing/reliability.md).


## ADR 017: Contextual image accessibility and read-only media inventory

**Context:** Shared media files already support reuse; Gallery titles doubled as alternatives and Place covers used names. Existing visuals have no owner-written independent descriptions.

**Chosen approach:** Keep the Gallery collection, storage paths, captions and image transforms. Add flat contextual alt/decorative fields to Gallery and Place covers, with repository cross-field validation. Legacy review flags and label fallbacks were removed after the owner deleted the legacy Gallery records; Place covers had no legacy records to preserve. Add a dependency-free, read-only usage/hash inventory. Keep Post captions unchanged.

**Rationale:** Improve accessibility and authoring clarity without a shared media database, upload hooks, automatic renaming or extra services. Contextual alternatives need not match across uses of the same file.

**Tradeoffs:** Native CMS conditional pre-save enforcement is not claimed. Static usage scanning is incomplete for dynamic/code references; identical bytes are not visual similarity. Gallery title/description remain visible, while alt conveys meaningful visual content independently.

**Consequences:** Never invent descriptions or infer decoration from missing text. Only explicit Decorative renders empty alt. All informative records must have alt, without legacy exceptions. Preserve filenames, publication behavior and manual controls. Hosted save/reopen and any future caption convention require separate acceptance.


## ADR 018: Multiple Gallery articles with the existing reference key

**Context:** Gallery needs zero or multiple related articles; the existing `relatedPost` key stored one path.

**Chosen approach:** Keep the key and enable native reference `options.multiple: true`. Normalize absent/blank values to an empty array and existing scalar strings to one-item arrays. Validate every target. Resolve links against visible, explicitly non-draft Posts; deduplicate by Post ID, preserving first-occurrence selection order. Render the same links in cards and the lightbox.

**Rationale:** Native multiple-reference editing avoids nested rows and a competing field or content-key migration.

**Tradeoffs:** The field name remains singular internally for compatibility. CMS save/reopen and selection ordering need hosted acceptance; local serialization checks cannot certify the UI. No upper bound or minimum selection count is imposed.

**Consequences:** Do not expose draft links or discard scalar references. Missing targets block publication. Preserve media files, category filtering, responsive transforms and modal focus behavior.


## ADR 019: Central Post Tags by title reference

**Context:** Posts used free-form tag strings; consistent topic names should be selectable without altering URLs or discovery semantics.

**Chosen approach:** Add `postTags` JSON title records, following Gallery Categories. Keep Post `tags` arrays as title references selected by a native optional multiple-reference field. Label the existing `posts` collection Posts. Validate Title Case, unique catalog names and per-Post references, including drafts. Derive public facets/counts only from visible Posts.

**Rationale:** Existing array content remains readable and the CMS gains consistent choices without IDs/slugs, new routes, dependencies or extra descriptive fields. The only existing tag, Personal, can be registered without rewriting articles.

**Tradeoffs:** Title renames require updating every reference; CMS has no deletion cascade or cross-file transaction. Editorial topic suitability remains human judgment. Saved tag filter URLs using renamed titles are not redirected.

**Consequences:** Allow unused catalog entries but keep them out of public filters. Reject duplicate/dangling references before publication. Document safe staged renames and hosted picker acceptance; preserve OR filtering, search, sorting and article paths.
