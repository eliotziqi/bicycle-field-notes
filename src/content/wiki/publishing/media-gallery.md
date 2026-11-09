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

Insert the uploaded/selected file through the Blog Posts **body** editor and supply useful alternative text. Keep the CMS's generated public media path. This is independent of Gallery and `showOnHomepage`; no Gallery entry is required for an article image. Body image layout follows existing article styling and social previews remain generated.

## 3. Create a Gallery entry

Open **Gallery** and create a record with required `image`, `title`, `description` and `categories` (one or more). Choose an existing upload; accepted extensions are JPG/JPEG, PNG, WebP and AVIF. `title` is also the displayed image alternative text, so describe the image meaningfully. Select categories from **Gallery Categories**, not arbitrary text.

Gallery entries have no draft flag. Save when the entry is curated and ready to appear after deployment. Entries use title-derived filenames; preserve an established filename to keep `photo-ID` anchors stable. Originals stay untouched; the build creates responsive WebP derivatives without upscaling.

## 4. Show the image on Home

Enable **Show on homepage** (`showOnHomepage`) on the Gallery entry. It defaults to false. This opts that Gallery photo into the manual Home slideshow; it does not feature a Post or publish all uploads. Verify Home after deployment, including caption and manual navigation.

## 5. Associate a Gallery entry with an article

Use **Related post (optional)** (`relatedPost`) to choose an existing Blog Post. The picker stores its path; the site resolves it only against visible Posts. A draft/missing target does not create a public related link, though the Gallery photo itself remains public. This link does not insert the image into the Post or copy Post geographic references onto Gallery.

## Categories and verification

Create categories in **Gallery Categories** with `title`. Gallery references store that title, unlike stable Place/Trip IDs. A category title rename must update every referring Gallery record in the same change; deletion requires removing/replacing all uses. Duplicate titles and unknown categories fail the build.

After a successful deployment check Gallery thumbnails, categories (OR), description, lightbox, original-image link, related published article and optional Home slide. Do not create duplicate entries for multiple uploads accidentally. See [the full trip article workflow](index.md#d-publish-a-trip-article-with-photos) for coordinating these actions.
