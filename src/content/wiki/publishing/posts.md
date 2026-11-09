---
title: "Creating and editing Posts"
description: "Actual Blog Posts fields, ordered references and experience dates."
section: publishing
order: 21
---

## A. Publish a normal Post

1. Open **Blog Posts** in [Pages CMS](https://app.pagescms.org/), select the repository/branch, and create an entry. Set required `title`, `description` and **Publication date** (`pubDate`). Write the article in the existing rich-text **body** editor. New Posts default to `draft: true`; keep that enabled while editing.
2. Add optional `tags` and select a **Content type** (`contentType`) if known. `featured` remains an optional editorial flag; it is not the homepage Gallery switch. **Updated date** (`updatedDate`) is optional and may be cleared.
3. Save, leave the entry and reopen it. Check body formatting and image paths. Posts use Markdown frontmatter and retain Markdown/MDX rendering. Generated names start from the title; preserve the published filename when changing a title later.
4. For a draft preview, synchronize the saved branch locally, run `npm ci` on Node 24 and `npm run dev`, then open the Post route. Development shows drafts. For full-text search/public behavior run a production build and preview; production hides drafts, so use an isolated nonpublishing snapshot when testing a would-be published article. The CMS itself does not supply this site's full rendering preview.
5. Set `draft` to false and save when ready. Follow the matching commit through [Actions](https://github.com/eliotziqi/bicycle-field-notes/actions). Verify the live Post, metadata, images, Posts listing/search and RSS after deployment. Future publication dates are not scheduling: a Post with `draft: false` is included regardless of date.

## Classification

| Content type | Stored value | Use |
| --- | --- | --- |
| Ride | `ride` | A ride report centered on cycling |
| Travel | `travel` | A journey account across destinations or transport |
| Guide | `guide` | Practical instructions or planning advice |
| Field Note | `field-note` | A short observation or reflection |

Choose one primary purpose or leave it blank. Existing articles are not automatically classified. Tags are flexible themes, Places are locations, Trips are journeys; they are independent dimensions rather than another nested category hierarchy.

## Ordered geographic references

**Related Places (narrative order)** (`relatedPlaces`) is an ordered list of objects, each with one `place` picker. Search existing names/IDs, add one row per mention, and drag rows to reorder. Repeated references are allowed: A → B → A uses three rows pointing to two existing Places, not a duplicate Place entry.

**Related Trips (narrative order)** (`relatedTrips`) similarly contains one `trip` per row. Source repeats are retained, but the article's unique Trip link list uses first-occurrence order. Save/reopen to verify both lists. Pickers show names and IDs; stored references use stable IDs.

The order is editorial narrative, independent of Trip chronology. A Trip reference makes its Places discoverable through article filters and Atlas reverse links, but does not append to explicit Related Places or assert visits. See [relationship semantics](../developer/relationships.md).

Illustration only: replace these IDs with existing Places/Trips before saving.

```yaml
contentType: travel
relatedPlaces:
  - place: example-a
  - place: example-b
  - place: example-a
relatedTrips:
  - trip: example-journey
experience:
  startDate: "2026-10-01"
  endDate: "2026-10-03"
```

## Experience dates and images

**Experience dates** (`experience.startDate`, `experience.endDate`) describe when the experience occurred independently of `pubDate`. Either endpoint is optional; an end-only date is displayed as “ended”. Cleared CMS dates normalize to absence. End before start fails the build; the CMS has no configured cross-field range check.

When editing Markdown by hand, quote ISO dates. Astro converts unquoted YAML timestamps to Date objects; a malformed unquoted calendar date can normalize before validation. Quoted impossible dates and reversed ranges are rejected.

Use images in the body; there is no competing Post cover field. Generated social previews remain automatic. [Media and Gallery](media-gallery.md) explains uploads and related-photo entries. GPX attachments and terrain controls are planned, not available.

## Hosted CMS acceptance

Create a clearly labeled temporary draft only with the owner's consent. Set a type, Place rows A/B/A, ordered Trip rows and experience dates. Save/reopen, reorder to B/A/A, save/reopen again, and inspect frontmatter. Confirm blanks and repeated rows survive. Test a range error in a nonpublishing snapshot rather than breaking `main`.

Keep the draft out of public listings/Atlas/RSS. To verify a published article link, the owner can deliberately publish the temporary Post or use an isolated production preview: Place and Trip links must preselect Atlas details without Focus. Do not change or delete actual travel content to run this test. Hosted interaction acceptance is separate from local serialization evidence in [CMS compatibility](../developer/cms-compatibility.md).
