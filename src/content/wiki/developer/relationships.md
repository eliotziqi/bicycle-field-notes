---
title: "Content relationships and validation"
description: "Explicit editorial order, derived discovery and map membership are separate."
section: developer
order: 31
---

## One graph

`src/utils/atlas-graph.ts` is renderer-independent. `resolveAtlas()` indexes Places/Trips and visible Post summaries; `getAtlas()` in `src/utils/atlas.ts` supplies Astro collections and validates cover files. Production reuses a graph promise per build; development reads remain fresh. There is no second manually maintained inverse source.

A Place is one geographic entity. Its `id` is independent of `name`; IDs use lowercase letters/digits with hyphens and filenames must be `ID.json`. A Trip holds chronological `{ place: ID }` rows; A/B/A and B/A/A differ. `tripPlaces()` preserves each visit; `uniquePlaces()` is for geographic fitting/markers only. Places can belong to multiple Trips.

## Explicit versus derived associations

| Relationship | Meaning |
| --- | --- |
| Post → `relatedPlaces` | Ordered editorial mentions; repeats preserved |
| Post → `relatedTrips` | Ordered explicit journeys; source repeats preserved, unique UI links use first occurrence |
| Place → Posts | Unique published Posts mentioning it directly or linking a Trip that includes it |
| Trip → Posts | Published Posts explicitly referencing that Trip |
| Place → Trips | Every Trip with a visit to that Place, computed from visits |
| Trip map membership | Unique Places; no inferred travel geometry |

`resolvePostReferences()` returns explicit ordered Places/Trips plus unique `discoveryPlaceIds` and `tripIds`. Discovery Places union explicit Places with Places in explicit Trips. This does not alter authored order, append implicit Place links to articles, change statuses or assert a visit. Mentioning a Place does not infer association with every Trip containing it. Atlas labels derived-only reverse Post associations “via related Trip”.

Post identity remains the existing loader ID/route, not a new editable field. Places and Trips can exist without published Posts. Their collections have no draft state.

## Visibility and serialization

`getPosts()` excludes drafts in production and includes them in development. The graph also defensively excludes `draft: true`. Production Atlas serializes only Places/Trips and public reverse summaries, never article bodies or full resolved Post metadata/source paths. Browser facets and RSS derive from visible Posts. Development draft article previews can resolve their own references without publishing draft reverse associations.

Draft syntax is still schema-validated. Missing draft relationship targets can remain work in progress until publication; published missing references fail graph validation. Drafts and uploads are public source files in a public repository even if absent from generated pages.

## Validation and migrations

Duplicate authored Place/Trip IDs, filename mismatch, invalid coordinates and missing visits fail with actionable file/zero-based row errors. Duplicate Post IDs passed to the resolver and unresolved published Post references also fail. Astro validates required values, statuses, optional blanks and date ranges before graph resolution; cover files must exist in the permitted media directory.

Stable IDs are an authoring rule, not a CMS lock. Rename display names freely while preserving IDs/filenames. An ID migration must deliberately update every Trip visit and Post row, including repeats. Before deleting targets repair all references; the CMS has no configured cascade/deletion guard. Gallery category references differ: they store titles and require coordinated title updates.

## Refactor boundaries

Keep schemas/CMS and serialized shapes compatible with existing content. Preserve explicit sequences before deduplicating any derived sets. Test draft exclusion, A/B/A, shared Places, direct and derived links, missing targets and duplicate IDs. Do not make MapLibre responsible for graph resolution. If future Gallery or Wiki consumers use relationships, reuse this graph instead of introducing another reverse cache in source content.

See [Post fields and browser state](posts.md), [CMS evidence](cms-compatibility.md) and [decisions](decisions.md).
