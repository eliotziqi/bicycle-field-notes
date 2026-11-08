# Bicycle Field Notes

A personal cycling and travel blog built with Astro and the Inkline theme.

Target address: https://eliotziqi.github.io/bicycle-field-notes/

## Local development

Use Node 24 (CI uses Node 24), then:

```sh
npm ci
npm run dev
```

Open the `/bicycle-field-notes/` path printed by Astro. To test the production site, including search:

```sh
npm run build
npm run preview
```

The build generates static pages, social images, RSS, a sitemap, and the Pagefind search index in `dist/`.

## Writing with Pages CMS

Connect the repository in Pages CMS and select the branch you want to edit. The root `.pages.yml` configures the Blog Posts collection in `src/content/posts/`.

- Title, description, and publication date are required.
- Tags, featured status, an updated date, and Markdown body are supported.
- New CMS posts default to drafts. Turn off Draft when ready to publish. Drafts appear in development but are excluded from production, feeds, and search.
- Filenames determine post URLs. Keep published filenames stable to avoid breaking links.
- Uploaded media is committed to `public/media/`; CMS writes `/bicycle-field-notes/media/...` URLs into content. Astro copies these files to the published site.

Post files can also be edited directly. The homepage introduces the site and lists recent posts. Inkline demo articles have been removed; the design, reading controls, and publishing workflow are preserved. Keep user-created posts and uploaded media when cleaning up content.

## GitHub Pages

The workflow in `.github/workflows/deploy.yml` builds on pushes to `main` or a manual workflow run, then deploys `dist/` using GitHub Pages artifacts. It runs the complete `npm run build` command so search is included.

When ready to publish, set the repository's **Settings → Pages → Source** to **GitHub Actions**, then push the reviewed changes. CMS commits to `main` will also trigger this workflow. No Cloudflare account or deployment token is needed.

The public URL is configured in `src/config.ts`. Astro derives its base path from that URL; `SITE_URL` can override it for another host. Internal UI links use `src/utils/urls.ts`. If the deployment path changes, also update the media output path in `.pages.yml` and existing media URLs in posts.

GitHub Pages project sites cannot serve a domain-root `robots.txt`; the generated file lives under `/bicycle-field-notes/robots.txt`. The sitemap is available under the same project path and can be submitted directly to search engines.

## Browser icons

`public/favicon.ico` is the unchanged original favicon from https://cs571-f25.github.io/p107/assets/favicon-CaOTZMPU.ico (16, 32, and 48 pixels). `public/apple-touch-icon.png` is a 180-pixel export of its largest frame, scaled proportionally without cropping. The original artwork is only 48 pixels, so larger icons retain that resolution limit. Both links use the existing GitHub Pages base-path helper.
