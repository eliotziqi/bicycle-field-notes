# Places and Trips — Pages CMS compatibility test

The owner completed and accepted the hosted Trip test for ordered references, repeated visits, reordering, saving and reopening. The shared resolver, Atlas and Post integration consume Places and Trips. Post fields reuse the same pattern, but their hosted interactions still need acceptance using [the Post publishing guide](posts-discovery.md). The owner-created `test-place-a`, `test-place-b` and `test-trip-order` entries remain untouched and are explicitly described as tests in their content.

## Configuration and storage

Places are JSON files in `src/content/places/`: `id`, `name`, numeric `latitude`/`longitude`, short `description`, one or more `status` values (`ridden`, `visited`, `wishlist`), and optional `coverImage` from existing media. Trips are JSON files in `src/content/trips/`: `id`, `name`, optional `startDate`/`endDate` and `description`, and a nonempty ordered `places` array.

Each visit is an object with a single Place reference. The picker displays the Place name and ID, but stores only its stable ID. Repeating a visit adds a row; it does not duplicate the Place. IDs use lowercase letters/digits separated by single hyphens. Filenames are generated from IDs, independently of display names. Keep IDs and filenames unchanged after creating an entry.

Existing collection views use `sort: [field]` and `default.sort`/`default.order`, retaining their previous default sorting. All original Post fields and Media settings are preserved; optional editorial fields are documented in the Post guide. Sources: [collection views](https://pagescms.org/docs/configuration/content/view/), [reference fields](https://pagescms.org/docs/configuration/fields/reference/), [object fields](https://pagescms.org/docs/configuration/fields/object/), [filename templates](https://pagescms.org/docs/configuration/content/filename/).

## Hosted test procedure (owner accepted)

Use a disposable test branch containing this configuration, or a test repository with Pages deployment disabled. Saving through Pages CMS writes Git commits; do not run this test on `main`, where pushes trigger deployment. Do not merge the demo records.

1. Open that test branch in Pages CMS and confirm Places and Trips appear alongside the existing collections.
2. Create Place A: ID `cms-test-a`, name `DEMO — Place A`, latitude `0`, longitude `0`, description `CMS test only`, status **Visited**. Leave cover empty. Save; confirm the file is `src/content/places/cms-test-a.json`.
3. Create Place B with ID `cms-test-b`, name `DEMO — Place B`, latitude `0`, longitude `1`, the same test description/status, and no cover. Save.
4. Create a Trip: ID `cms-test-trip`, name `DEMO — Trip`. Leave dates/description empty. Add three **Places in visiting order** rows and select A, B, A. Each row has its own reference picker. Save and reopen.
5. Inspect `src/content/trips/cms-test-trip.json` in GitHub or the raw editor. Confirm this exact array (including both A visits):

   ```json
   "places": [
     { "place": "cms-test-a" },
     { "place": "cms-test-b" },
     { "place": "cms-test-a" }
   ]
   ```

6. Drag the B row above the first A using its handle. Save, navigate away, and reopen. Confirm **B → A → A** in both the form and JSON. Check keyboard reordering too if supported by the hosted version; record the keys used and outcome.
7. Edit Place A's **name** to `DEMO — Place A edited` and its description. Keep its ID/filename unchanged. Save and reopen the Trip. Both A rows should resolve to the updated label, retain `cms-test-a` in JSON, and remain in their saved positions. Save/reopen the Trip again and confirm.
8. Record the CMS version if available, branch, reference-search behavior, initial/reordered arrays, rename result, and any errors. Optionally test a valid date range and clearing both dates. Run `npm run build` on the saved test snapshot.
9. After recording results, the owner can remove the demo Trip first, then the two demo Places from the disposable test branch. Agents must not automatically delete owner-created test content. Preserve all pre-existing posts, Gallery records, and uploads.

## Decimal coordinates

Latitude and longitude remain numeric JSON values. Their CMS `options` now contain `step: 0.000001`, alongside latitude `min: -90` / `max: 90` and longitude `min: -180` / `max: 180`. This permits six decimal places without changing existing Place data or rounding values in Astro.

The [number-field documentation](https://pagescms.org/docs/configuration/fields/number/) lists min/max but omits step. The [official input implementation](https://github.com/hunvreus/pagescms/blob/6f4e860a35d934406580287e7042e5e111e207a1/fields/core/number/edit-component.tsx) explicitly forwards `field.options.step` to the native number input; this was inspected rather than inferred. The CMS config schema accepts it. Real Chromium input-validity tests use these attributes and verify decimal values and bounds; this is not a claim that we operated the authenticated hosted CMS.

Owner acceptance after this configuration is made available: enter `30.2500`, `30.123456`, `-90`, `90`, `-180` and `180` in the appropriate fields; save/reopen and inspect numeric JSON. Try latitude `90.000001` and longitude `180.000001` (invalid). Astro must also reject out-of-range values. Six-decimal step validation is intentional; values with more decimal places may need author rounding in the CMS. If an older hosted app ignores step, do not save rounded integer coordinates: report its version before changing field types.

## Automated validation and limits

Validated locally on Node 24:

- Actual `.pages.yml` passes the official upstream CMS configuration schema at commit `6f4e860a35d934406580287e7042e5e111e207a1`.
- Actual Trip fields preserve A/B/A and programmatically reordered B/A/A through upstream field validation, sanitization, JSON serialization and initialization. The actual Astro schemas accept both results. Stable-ID template resolution remains unchanged after a Place name edit.
- Astro accepts cleared optional fields and valid date ranges; rejects invalid IDs, coordinates, statuses, impossible dates, reversed dates and empty visit lists.
- Production builds pass for empty collections and a separate temporary copy containing the labeled A/B/A test data. No test records were added to this repository.
- Production preview returns HTTP 200 for Home, Gallery, Posts and Atlas under `/bicycle-field-notes/`. Existing CMS fields/media settings, default sorts, posts, Gallery metadata and public assets match the synchronized baseline.

These automated tests inject upstream function imports using installed Zod/YAML; they do not run the complete CMS application. The owner separately accepted the hosted ordered-reference workflow. The decimal-input configuration still needs hosted save/reopen acceptance. Upstream source compatibility does not guarantee the hosted app uses that version.

The editor uses repeated object rows rather than a single multi-select: that distinction enables ordering and repeated visits. Collapsed row summaries use IDs; pickers display names plus IDs. Optional date fields normalize empty strings/null to absence; Astro enforces date ordering, while the CMS does not provide cross-field date-range validation here.

ID immutability remains an authoring rule. The shared resolver rejects duplicate stable IDs, filename/ID disagreement, missing Place/Trip targets and invalid cover files during production builds. Do not rename IDs or manually duplicate them. Post references are authored only on Posts; reverse Post associations are computed, with no manually maintained related-post arrays on Places or Trips.

Changing a Place's display **name** (its title in the editor) keeps Trip references valid because the stored value is `{fields.id}`, not `{primary}`. Its generated filename also uses the ID. This depends on preserving the ID and filename; the ID field remains editable and is not automatically locked after creation.

**Deleting referenced Places or Trips:** the CMS does not provide a configured deletion guard or cascading repair. Builds reject dangling published references with a file and row error. Before deleting a Place, inspect every Trip's `places` array and Post's `relatedPlaces` array for its exact ID, including repeated rows. Before deleting a Trip, inspect Post `relatedTrips` arrays. Update every occurrence deliberately, then save and verify affected entries before deleting the target. Trips must retain at least one visit; retain the Place if removing it would invalidate a Trip you intend to keep. Recreating a record under a different ID does not repair references. See [Atlas architecture](atlas-development.md) and [Post editorial rules](posts-discovery.md).

Empty collections produce harmless Astro glob warnings. The latest existing Post is a draft and remains excluded from production. With no published articles, existing Pagefind behavior falls back to indexing page bodies; this change does not alter the Posts browser or search configuration.
