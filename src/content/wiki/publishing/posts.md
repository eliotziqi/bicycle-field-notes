---
title: "Creating and editing Posts"
description: "Actual Posts fields, ordered references and multiple Experience ranges."
section: publishing
order: 21
---

## A. Publish a normal Post

1. Open **Posts** in [Pages CMS](https://app.pagescms.org/), select the repository/branch, and create a draft with `title`, `description` and the rich-text **body**. New Posts default to `draft: true`.
2. **Published** (`pubDate`) and **Updated** (`updatedDate`) use `YYYY-MM` strings. Published initializes to the current UTC month after the first save; later substantive edits automatically maintain Updated. A manually changed or cleared Updated value takes precedence for that save. Published remains editable. Wait for successful validation/build and metadata maintenance and refresh/reopen the entry before editing again.
3. Add optional `tags` and `featured`. Featured is an editorial flag, independent of the homepage Gallery switch. Content types and their browser filter have been removed.
4. Save, leave the entry and reopen it. Check body formatting, image paths and month strings. Preserve published filenames when changing titles. The three date groups are adjacent in the form; Pages CMS has no configured native field-column layout.
5. For a draft preview, synchronize locally and run `npm run dev` on Node 24. For full-text search/public behavior use `npm run build` and `npm run preview`; production excludes drafts. The CMS does not supply the full site preview.
6. Set `draft` to false only when ready. Follow [Actions](https://github.com/eliotziqi/bicycle-field-notes/actions) through source validation, candidate metadata/build, validated metadata commit and deployment. Future months are not scheduling. Verify the article, metadata, images, Posts listing and search. RSS is no longer provided.

Automatic dates are maintained after repository saves rather than inside the hosted editor. Manual changes win for the current save; a later edit with an unchanged Updated value resumes automatic maintenance. Existing explicit dates are converted to month precision without changing publication flags, body content, media or references. Original day precision remains in Git history. Empty values remain hidden in article metadata.

## Ordered geographic references

**Related Places (narrative order)** (`relatedPlaces`) is an ordered list of objects, each with one `place` picker. Search existing names/IDs, add one row per mention, and drag rows to reorder. Repeated references are allowed: A → B → A uses three rows pointing to two existing Places, not a duplicate Place entry.

**Related Trips (narrative order)** (`relatedTrips`) similarly contains one `trip` per row. Source repeats are retained, and the article's unique Place/Trip links use first-occurrence order. Save/reopen to verify both lists. Pickers show names and IDs; stored references use stable IDs.

The order is editorial narrative, independent of Trip chronology. A Trip reference makes its Places discoverable through article filters and Atlas reverse links, but does not append to explicit Related Places or assert visits. See [relationship semantics](../developer/relationships.md).

Illustration only: replace these IDs with existing Places/Trips before saving.

```yaml
relatedPlaces:
  - place: example-a
  - place: example-b
  - place: example-a
relatedTrips:
  - trip: example-journey
experience:
  - start: "2025-06"
    end: "2025-06"
  - start: "2025-08"
    end: "2025-09"
  - start: "2026-05"
    end: "2026-05"
```

## Experience dates and images

**Experience** is an optional, repeatable list of month ranges. Each row requires `start` and `end` in `YYYY-MM`; repeat the same month for a single-month experience. End before start fails the build; the hosted CMS validates month shape but has no configured cross-field comparison. Preserve manual row order. Remove all rows for no Experience.

The example renders “Jun 2025, Aug–Sep 2025, May 2026”. A cross-year range renders “Dec 2025 – Feb 2026”. Published, Updated and Experience share the responsive article metadata row. The footer contains only **Explore in Atlas**, with unique Trips and Places on separate wrapping lines. Source reference repeats are retained.

Posts use string fields rather than nested CMS date fields, avoiding the confirmed empty-object date-writer crash. Git-based legacy day dates and the former Experience object remain readable; historical open-ended ranges are displayed as “From”/“Until” without inventing endpoints. Complete both endpoints when converting such a range to a new list row. Trip dates remain independent full-date fields.

Use images in the body; there is no competing Post cover field. Generated social previews remain automatic. [Media and Gallery](media-gallery.md) explains uploads and related-photo entries. GPX attachments and terrain controls are planned, not available.

## Hosted CMS acceptance

Create a clearly labeled temporary draft only with the owner's consent. Set month fields, Place rows A/B/A, ordered Trip rows and multiple Experience ranges. Save/reopen, reorder to B/A/A, save/reopen again, and inspect frontmatter. Confirm blank Published/Updated values, an empty Experience list, multiple/reordered ranges and repeated references survive. Check automatic month stamping after the workflow and a manual Updated override. Test a range error in a nonpublishing snapshot rather than breaking `main`.

Keep the draft out of public listings/Atlas. To verify a published article link, the owner can deliberately publish the temporary Post or use an isolated production preview: Place and Trip links must preselect Atlas details without Focus. Do not change or delete actual travel content to run this test. Hosted interaction acceptance is separate from local serialization evidence in [CMS compatibility](../developer/cms-compatibility.md).

Repository checks reject every unfinished optional row, including `{}` accepted by native CMS validation. See [validation and recovery](reliability.md).


## Central Post Tags

Open **Post Tags** (`postTags`, JSON records in `src/content/post-tags/`) to create a topic with a single `title`. Use English Title Case: **Bikepacking**, **Route Guides**, **Gear Reviews**. Major words start uppercase; common connecting words may remain lowercase (for example **Planning for Adventure**). Acronyms such as **GPS** are allowed. Keep names concise; tags describe topics, not geographic Places, named Trips or dates. Topic relevance is an editorial judgment, not something a regex can reliably decide.

In **Posts**, the optional **Tags** picker selects zero or more existing Post Tags. It stores title strings in the existing `tags` array, following Gallery Categories. No new tag slugs, pages, descriptions, images or hierarchies are introduced. Unused tag records are allowed in CMS; public controls and counts derive only from visible Posts, so unused and draft-only topics stay out of production filters. Multiple selected tags still match with OR; text, Place/Trip filters, sorting and shareable URLs keep their existing behavior.

### Create, rename and delete safely

1. Search Post Tags first and reuse an existing topic. Duplicate names, including case variants, are invalid. Save the tag before selecting it in a Post; select each tag only once.
2. To rename a tag, update its title **and every Post reference, including drafts**, preserving other tags and their order. References store names rather than an internal ID; native CMS does not cascade a title rename. Keep an established record filename unless deliberately changing it; the filename is not a public slug.
3. For a staged CMS rename, create the new name first, update all referring Posts to select it, then delete the now-unused old record. Each intermediate snapshot remains valid; the temporary unused record never appears publicly by itself. Avoid case-only duplicate records: update a case-only rename and its references together in Git, or use a distinct temporary topic name while migrating in CMS.
4. Before deleting a tag, find every Post using its exact title and explicitly remove/replace those references. Delete only after no references remain. Deleting referenced tags blocks publication; previously saved edits stay in Git. Existing bookmarked filters using a renamed title are not automatically redirected because no tag pages or alias registry exists.

Native reference pickers limit choices to collection entries, and the title field uses a Title Case pattern. They do not replace repository validation: raw/API edits can still create duplicates or dangling references. The repository checks every Post, including drafts, and reports file/field corrections before publication. Native CMS validation does not enforce semantic topic suitability or a safe multi-file rename transaction.

### Migration and hosted acceptance

The initial audit found only `Personal`, on the draft **Beyond the Route**. It already satisfied Title Case, so `Personal.json` registers it unchanged. The other Post has no tags. Neither article was rewritten, retitled or moved; existing `tags: ["Personal"]` data remains valid, and no public filter appears for this draft-only topic.

Locally checked: optional/empty/multiple reference serialization, title rules, duplicates, missing/deleted targets, existing array compatibility and public filtering. Hosted acceptance still requires create/save/reopen of a Post Tag, select/clear/reopen of zero/one/multiple tags, label resolution and selection order. Do this on a nonpublishing branch or test repository. Do not claim local helper tests operated the authenticated editor.
