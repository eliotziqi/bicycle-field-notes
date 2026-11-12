---
title: "Publishing workflow"
description: "An everyday checklist for content managed through Pages CMS."
section: publishing
order: 20
---

## Before editing

Open [Pages CMS](https://app.pagescms.org/) and choose `eliotziqi/bicycle-field-notes` and the intended branch. Collection names and files are defined in [`.pages.yml`](https://github.com/eliotziqi/bicycle-field-notes/blob/main/.pages.yml). Authentication is required; these guides contain no credentials.

CMS saves write Git commits. Saving on `main` triggers the GitHub Pages workflow, even when editing a draft. Places, Trips and Gallery records have no draft flag and become public after a successful deployment. Draft **Posts** are hidden from the public site, but their source and uploads are still in a public repository: drafts are not private storage.

The CMS is an editor, not an automatic full-site preview. Use a local preview or an explicitly arranged nonpublishing branch to inspect drafts. GitHub Pages deploys `main`; a different branch does not automatically get a hosted preview.

## Collection source links

Inspect saved files in GitHub when checking the CMS result: [Posts](https://github.com/eliotziqi/bicycle-field-notes/tree/main/src/content/posts), [Places](https://github.com/eliotziqi/bicycle-field-notes/tree/main/src/content/places), [Trips](https://github.com/eliotziqi/bicycle-field-notes/tree/main/src/content/trips), [Gallery](https://github.com/eliotziqi/bicycle-field-notes/tree/main/src/content/gallery), [Gallery Categories](https://github.com/eliotziqi/bicycle-field-notes/tree/main/src/content/gallery-categories) and [uploaded media](https://github.com/eliotziqi/bicycle-field-notes/tree/main/public/media). Use the branch selector to inspect the branch you actually edited.

## Choose a workflow

- **A. Normal Post:** [draft, preview, publish and verify](posts.md#a-publish-a-normal-post).
- **B. Place:** [stable ID, coordinates and Atlas verification](places-trips.md#b-add-a-place).
- **C. Trip:** [chronological visits and repeated references](places-trips.md#c-create-a-trip).
- **D. Trip article with photos:** follow the checklist below.

## D. Publish a trip article with photos

1. Search **Places** before creating locations. Reuse an existing geographic entity; do not create a second Place for a return visit. Add missing Places using [workflow B](places-trips.md#b-add-a-place).
2. Create a **Trip** with a stable `id`, `name` and chronological `places` rows. Include return visits as new rows. Optional Trip dates describe the journey; [workflow C](places-trips.md#c-create-a-trip) covers saving and Atlas verification.
3. In **Blog Posts**, create a clearly titled draft with `title`, `description` and body. Published/Updated months are maintained after saving; optional `tags` and ordered `experience` month ranges describe topics and experiences. Do not invent dates.
4. Add `relatedPlaces` in article narrative order, including repeated mentions where intended. Add `relatedTrips` in article order. These fields are optional; a Trip article need not explicitly list every Place in that Trip.
5. Upload photos via Media or an image picker. Insert selected images into the Post body with useful alternative text. This does not create Gallery records.
6. If desired, separately create **Gallery** records with `image`, `title`, `description` and `categories`. Use `relatedPost` to associate them with the article. Enable `showOnHomepage` only for selected homepage photos. [Photo workflow](media-gallery.md) explains the five independent actions.
7. Save and reopen the Post; inspect reference order, repeats and month ranges. Preview using development mode for drafts, and an isolated production snapshot for public relationship/filter checks. Keep demo content off `main` unless deliberately publishing it.
8. Set `draft` to false only when ready and save. Watch [GitHub Actions](https://github.com/eliotziqi/bicycle-field-notes/actions) for the correct commit. Build success precedes deployment success; allow time for Pages/CDN/browser caches.
9. Verify the published article, body images, Place/Trip Atlas links, manual Focus behavior, Posts filters and any Gallery related link/homepage choice. Test both themes and a phone. If content is missing, use [troubleshooting](troubleshooting.md).

Places and Trips can be useful in Atlas without any published Post. Adding a Trip to a Post creates discovery associations with its Places, not evidence that the author visited all of them.

## Editing and deletion safety

Keep published Post filenames, Place/Trip IDs and their filenames stable. Display names can change independently of Place/Trip references. The CMS does not lock IDs or repair deleted references. Before deleting a Place inspect every Trip visit and Post Place row; before deleting a Trip inspect Post Trip rows. Preserve repeated references deliberately.

Category references store titles, so a Gallery category title rename requires updating referencing Gallery entries. Media removal can break covers, Gallery records and body images; inspect all uses first. Do not automatically delete owner-created test entries. See [errors and validation](troubleshooting.md).
