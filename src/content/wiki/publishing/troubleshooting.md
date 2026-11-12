---
title: "Publishing troubleshooting"
description: "Diagnose content, relationship, media and deployment failures."
section: publishing
order: 24
---

## A save is not a successful deployment

CMS saves commit to the selected branch. On `main`, follow the matching commit in [GitHub Actions](https://github.com/eliotziqi/bicycle-field-notes/actions). Both build and deploy jobs must succeed. A failed build leaves the last successful site online. Allow deployment and cache propagation time; reload with the browser cache bypassed if you still see old controls.

Failed checks now report file/field corrections and all saved content waiting for publication. Follow [validation and recovery](reliability.md); other edits remain saved and publish with the corrected snapshot.

## Content is missing

A Post with `draft: true` is excluded from production Posts, Home and Atlas reverse links. Development previews include drafts. This is not repository privacy. Places, Trips and Gallery have no draft flag. Places/Trips need not have a Post to appear in Atlas; article filter options include only those associated with published articles.

Future `pubDate` is not a scheduler. Use `draft` to control publication. A Gallery `relatedPost` targeting a draft/missing article produces no link; it does not hide the photo.

## Reference and ID errors

Errors identify a source record and zero-based row such as `relatedPlaces[0]` or `places[2]`. Restore the missing record or update every affected row to an existing stable ID. Do not fix a display-name typo by changing an ID. A Place/Trip JSON filename must match its authored ID. Duplicate stable IDs are rejected before graph resolution.

Empty Trip visit lists fail validation. Repeated visits are valid; do not deduplicate them to “fix” a build. Explicit Post Place order differs from derived discovery; [relationship rules](../developer/relationships.md) explain why a Post may match a Place filter without listing it explicitly.

## Dates and coordinates

Post Experience end months and Trip end dates cannot precede their starts. Post months use quoted `YYYY-MM` strings and Experience may be an empty list. Automatic Published/Updated months appear after the metadata workflow and a CMS refresh; manual Updated changes win for that save. Trip dates retain `YYYY-MM-DD`; malformed unquoted YAML timestamps may normalize before validation. Coordinates must be numeric, finite and in latitude/longitude bounds. The CMS six-decimal input step is configured; report an older hosted input that still rejects decimals rather than saving integers. [Precision evidence](../developer/cms-compatibility.md#decimal-coordinates) describes the verified configuration.

## Photo failures

Confirm the file exists under `public/media/`, the selected path matches it, and the extension is supported. A Gallery entry requires known categories; duplicate category titles or a rename without updating entries fails validation. Uploading a file alone does not publish a Gallery entry. A Gallery photo appears on Home only when `showOnHomepage` is true. Keep original filenames and check case as well as spaces/non-ASCII paths.

## Search or map unavailable

Search needs `npm run build` and `npm run preview`; it does not have a generated index in normal development. Clear filters/query to check the static article list, or use Wiki navigation if documentation search is unavailable. A map-style outage exposes Retry and preserves Atlas lists. WebGL limitations can prevent globe rendering; list/details browsing remains an alternative.

## Validate safely

On Node 24 run `npm ci`, `node tests/atlas.test.mjs`, `node tests/posts.test.mjs`, `npm run build`, `node tests/wiki.test.mjs`, then `npm run preview`. The build checks schemas, published references and media. Test temporary records in a separate nonpublishing checkout with its own Astro cache; never overwrite CMS-created content. For detailed regression and hosted acceptance checks see [testing](../developer/testing.md).
