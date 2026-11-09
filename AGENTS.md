# Repository instructions

- Bicycle Field Notes is a static Astro site based on Inkline. Shared layout: `src/layouts/Base.astro`; navigation and features: `src/config.ts`; global styles: `src/styles/global.css`.
- Posts live in `src/content/posts/`, validated by `src/content.config.ts`. Use `getPosts()` from `src/utils/posts.ts` so production drafts stay hidden. Pages CMS is configured in `.pages.yml`; media lives in `public/media/`.
- Use Node 24. Install with `npm ci`; develop with `npm run dev`; validate with `npm run build` (Astro plus Pagefind), then `npm run preview`. Search needs a production build. There is no separate lint or test script.
- Follow existing Astro/TypeScript conventions: two-space indentation, double quotes, shared components, CSS tokens, semantic HTML, and accessible labels. Keep Inkline's minimal design and test narrow layouts and both themes when possible.
- Wrap internal UI URLs in `withBase()` from `src/utils/urls.ts`. The deployed project base is `/bicycle-field-notes/`, derived from `SITE.url` or `SITE_URL`. Preserve trailing slashes on page links.
- Preserve user posts, published filenames, uploaded media, favicon, CMS settings, RSS, SEO, search, and deployment workflow. Do not invent personal details or resources. Do not add dependencies or map libraries without need and authorization.
- Atlas globe and post terrain/GPX maps are future work; do not implement them as part of routine cleanup.
- Before editing, read relevant files, run `git status`, and fetch `origin/main`. Compare branches; do not blindly pull, overwrite local work, reset, or discard changes. Never commit, push, or deploy without explicit approval.
- Keep `PLAN.md` and `CHANGELOG.md` current for meaningful changes. Keep README public-facing and concise. Preserve the Inkline MIT notice in `LICENSE`.
