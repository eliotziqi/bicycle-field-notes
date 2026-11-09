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
