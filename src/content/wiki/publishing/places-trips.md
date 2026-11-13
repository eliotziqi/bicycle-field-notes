---
title: "Places and Trips"
description: "Create unique locations and chronological journeys through tested reference rows."
section: publishing
order: 22
---

## B. Add a Place

1. In [Pages CMS](https://app.pagescms.org/) open **Places** and search for the geographic location first. Reuse it across journeys and return visits.
2. Create a record with **Stable ID** (`id`), `name`, numeric `latitude` and `longitude`, a short `description`, and one or more `status` choices. IDs use lowercase letters/digits separated by single hyphens. `example-location` is an illustration, not an existing travel record. Choose the real stable ID once.
3. Coordinates use decimal degrees: latitude −90…90, longitude −180…180. Negative latitude is south; negative longitude is west. The CMS step is `0.000001`, permitting six decimal places. For example `30.123456` is a precision illustration, not a location claim. If a hosted editor offers only integers, stop and report its version rather than saving rounded coordinates.
4. Select Ridden (`ridden`), Visited (`visited`) and/or Wishlist (`wishlist`). Status is authored, not inferred from Posts or Trips. Optionally choose **Cover photo** (`coverImage`) from media; the file must exist under `public/media/` and be JPG/JPEG, PNG, WebP or AVIF.
If selecting a cover, supply meaningful **Cover alt text** or explicitly mark it decorative with blank alt. See [image accessibility and reuse](media-gallery.md#reuse-an-existing-upload).

5. Save and reopen. The JSON filename must be the same as `id`, for example `example-location.json`. Verify numeric coordinates and the intended status. After deployment, find the Place in Atlas and activate Focus manually if desired.

Places have no draft flag: saving to `main` publishes through the next successful build even without a Post.

## C. Create a Trip

1. Ensure each required Place exists, then open **Trips** and create a unique stable `id` and `name`. `startDate`, `endDate` and `description` are optional. If both dates are known, end cannot precede start.
2. In **Places in visiting order** (`places`), add at least one row and choose one existing `place` in each picker. Rows are chronological visits. A → B → A requires three rows; use the same A reference twice.
3. Drag rows to correct visiting order. Save, navigate away, reopen and verify the complete sequence and repeated IDs in JSON. Changing a Place's name does not break these references when its ID/filename stay unchanged.
4. After deployment choose the Trip in Atlas. Its unique Places highlight without connecting lines, while the sidebar lists every visit in order. Open an itinerary Place, then Return to Trip. Selection should not move the camera until Focus is activated.

Trips also have no draft flag and can exist independently of Posts. The same Place may belong to multiple Trips. Related Posts are derived; do not add a separate manual reverse-relationship list.

## Stable IDs and deleting references

Changing `name` is safe for Place/Trip references; changing `id` or its filename is a migration requiring every reference to be updated. CMS fields remain editable, so immutability is a publishing rule rather than a form lock.

Before deleting a Place, inspect all Trip `places` and Post `relatedPlaces` rows, including repeats. Before deleting a Trip, inspect Post `relatedTrips`. Repair every occurrence before deleting the target. A retained Trip must still contain at least one visit. Builds reject missing published references, duplicates and filename/ID disagreement; CMS provides no deletion cascade.

The [compatibility evidence](../developer/cms-compatibility.md) distinguishes accepted hosted ordering behavior from decimal-input acceptance still requiring the owner.
