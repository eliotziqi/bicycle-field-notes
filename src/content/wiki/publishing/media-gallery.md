---
title: "Media and Gallery"
description: "Five distinct actions for photos and their metadata."
section: publishing
order: 23
---

## 1. Upload an image

Use Media or an image picker in [Pages CMS](https://app.pagescms.org/). Uploads live in `public/media/`; the configured public path is `/bicycle-field-notes/media/`. Uploading alone creates neither Gallery metadata nor a homepage slide. Files in a public repository are public, including unused or draft-related uploads; upload only material intended to be public and remove private metadata before upload when necessary.

Preserve existing filenames and media paths. Do not move or delete an image without checking Post bodies, Place covers and Gallery records. CMS media output is tied to the deployment base; a future base change must coordinate it with existing article links.

## 2. Use an image inside a Post

Insert the uploaded/selected file through the Posts **body** editor and supply useful alternative text. Keep the CMS's generated public media path. This is independent of Gallery and `showOnHomepage`; no Gallery entry is required for an article image. Body image layout follows existing article styling and social previews remain generated.

## 3. Create a Gallery entry

Open **Gallery** and create a record with required `image`, `title`, `description` and `categories` (one or more). Choose an existing upload; accepted extensions are JPG/JPEG, PNG, WebP and AVIF. `title` remains the visible editorial caption. Enter separate **Alt text** describing meaningful visual content. Do not repeat the caption automatically. Only enable **Decorative image** deliberately, with Alt text blank, when the image conveys no meaningful information. Select categories from **Gallery Categories**, not arbitrary text.

Gallery entries have no draft flag. Save when the entry is curated and ready to appear after deployment. Entries use title-derived filenames; preserve an established filename to keep `photo-ID` anchors stable. Originals stay untouched; the build creates responsive WebP derivatives without upscaling.

## 4. Show the image on Home

Enable **Show on homepage** (`showOnHomepage`) on the Gallery entry. It defaults to false. This opts that Gallery photo into the manual Home slideshow; it does not feature a Post or publish all uploads. Verify Home after deployment, including caption and manual navigation.

## 5. Associate a Gallery entry with an article

Use **Related Posts** to select zero or more Posts with the native multiple-reference picker. The stored key remains `relatedPost`, now an array of Post paths; no nested object rows are needed. An absent field or empty list means no related links. Existing single strings remain readable and are converted to a one-item list by native CMS serialization when saved.

Gallery cards and the lightbox render all related published articles in stored selection order, deduplicated by resolved Post identity while preserving first occurrence. Drafts never create public links, including in development. Missing targets fail repository validation; restore the Post or correct the selection before publishing. Associations do not insert the image into Posts or copy their geographic references onto Gallery.

Native reference configuration and local upstream helpers support multiple selections. Hosted acceptance still requires selecting zero, one and several Posts, saving and reopening, verifying retained ordering, and checking the Gallery/lightbox. Do not assume the picker offers drag-and-drop reordering; deselect/reselect or edit source to change stored order if necessary.

## Categories and verification

Create categories in **Gallery Categories** with `title`. Gallery references store that title, unlike stable Place/Trip IDs. A category title rename must update every referring Gallery record in the same change; deletion requires removing/replacing all uses. Duplicate titles and unknown categories fail the build.

After a successful deployment check Gallery thumbnails, categories (OR), description, lightbox, original-image link, related published article and optional Home slide. Do not create duplicate entries for multiple uploads accidentally. See [the full trip article workflow](index.md#d-publish-a-trip-article-with-photos) for coordinating these actions.


## Reuse an existing upload

Before uploading, browse Media and select the existing file in the Gallery image picker, Place cover picker or Post body image picker. All use the same `public/media/` source. Reuse the path instead of uploading another copy. A Gallery association does not insert an image into a Post, and a Post image does not create a Gallery entry. Trips can use their existing Place relationships; this change adds no Trip image field or shared image database.

Place covers have separate **Cover alt text** (`coverAlt`) and **Decorative cover image** (`coverDecorative`) fields. These are contextual to the Place and do not inherit Gallery text. No cover means no alt requirement. Native CMS does not enforce the conditional alt/decorative relationship reliably; repository validation does before publication. A missing alternative is never automatically interpreted as decorative. Legacy review exceptions and title/name fallbacks have been removed for both Gallery and Place covers; all informative images require meaningful alt text.

For informative images, provide nonblank `alt` (Gallery) or `coverAlt` (Places). Explicit decorative images use `decorative: true` or `coverDecorative: true` and blank/absent alt; they render `alt=""`. Contradictory decorative plus nonblank alt is rejected. Gallery image links retain an accessible title-based link name for decorative images, and the lightbox copies the rendered alternative. Homepage uses the same Gallery alternative without changing slideshow controls or captions.

### Read-only inventory

Run `npm run audit:media` for JSON output, or `node scripts/media-audit.mjs` for clean JSON suitable for saving outside source. It lists file usages in Gallery, Posts (including drafts) and Place covers; SHA-256 groups identify identical bytes under different filenames. Missing references, missing-alt review and parsing/dynamic-expression diagnostics are separate. There are currently no direct Trip image references.

The audit never changes files, deletes unused assets, repairs paths, or merges duplicates. Unreferenced means unobserved by this static scan, not safe to delete. Dynamic/imported MDX, CSS, responsive srcset and application-code references need manual inspection. External resources are not downloaded. Identical hashes do not detect resized/recompressed versions or visually similar photographs. Missing references or parsing/dynamic diagnostics return a nonzero status; duplicate groups and review reminders alone do not. `validate:content` remains the independent publication gate.

## Post captions: investigation only

The official [rich-text documentation](https://pagescms.org/docs/configuration/fields/rich-text/) provides Markdown/HTML editing and a source switch, but no caption option. In the inspected official source revision `6f4e860a35d934406580287e7042e5e111e207a1`, `components/ui/editor/index.tsx` supports image `src`, `alt` and `title` attributes and an Alt text dialog; no figure/figcaption or caption editing path was found. A Markdown image's optional quoted title is an HTML title/tooltip, **not a visible caption**. Raw HTML figures cannot be claimed to round-trip safely through the visual editor without hosted testing.

Recommend, pending owner approval, a plain italic paragraph immediately after the ordinary Markdown image for occasional visible captions. It uses basic editable Markdown but does not create semantic figure/figcaption association. If semantic captions become essential, investigate a tested rendering convention separately. No Post content, caption renderer or editor configuration is changed here.

Local configuration/schema/rendering tests do not certify the authenticated hosted editor. Manual acceptance: select the same upload in each picker; save/reopen informative and decorative Gallery/Place fields; verify the Gallery, Home and Atlas alternatives; test caption examples only in a nonpublishing branch, switching Editor/Source and saving/reopening. Do not add owner test content automatically to main.
