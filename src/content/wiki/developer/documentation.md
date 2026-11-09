---
title: "Maintaining the Wiki"
description: "One detailed source, stable routes and documentation updates with code."
section: developer
order: 36
---

## Source of truth

| Source | Responsibility |
| --- | --- |
| README | Public introduction, live/Wiki links, quick local commands and attribution |
| AGENTS | Short authoritative safety rules, required reading and architecture invariants |
| PLAN | Released milestones, unresolved acceptance, priorities and future work |
| CHANGELOG | Chronological meaningful changes; not current usage instructions |
| `src/content/wiki/` | Canonical detailed behavior, publishing, architecture, troubleshooting and decisions |
| `docs/` | Small compatibility pointers to migrated guides; no parallel long copies |

Wiki sources are public. Do not include credentials, private data, absolute local machine paths, internal-only operational notes or personal details not already intentionally published. Code paths are repository-relative. Historical test evidence must identify its limits; planned features must be labeled unimplemented.

## Add or update a page

Create a Markdown file under `src/content/wiki/user/`, `publishing/` or `developer/`. Required frontmatter is `title`, `description` and nonnegative integer `order`; section pages also set `section: user`, `publishing` or `developer`. Use unique order values for predictable navigation. Section `index.md` files map to their section landing routes; the root `index.md` maps to `/wiki/`.

```yaml
title: "A concise page title"
description: "What this page helps the reader do."
section: developer
order: 38
```

The layout owns h1. Start body headings at h2; Astro supplies heading IDs and the layout builds a table of contents from h2/h3 when there are at least three entries. Sidebar grouping and previous/next are generated from collection metadata. A small layout script initially collapses navigation at narrow widths and opens it on desktop; without JavaScript it starts open and remains a native disclosure. Keep filenames and published routes stable; a rename needs updated references and, where needed, a compatibility route.

Use relative `.md` links for Wiki sources, such as `../publishing/posts.md`, and site-root links such as `/atlas/` for UI routes. The Wiki-only Sätteri Markdown visitor resolves source-relative links and prefixes site paths with the configured base. It does not rewrite Posts or external URLs. Fragments link to generated heading IDs. Do not use raw HTML anchors for internal Markdown links; they bypass this transformation. The production link validator catches broken files, fragments and missing project prefixes.

## Change policy

1. Change current-behavior and publishing pages in the same patch as behavior, schema, workflow, architecture or UI changes. A trivial code change with no documented behavior impact needs no prose churn.
2. Add a decision record when introducing a significant new tradeoff; update/supersede affected records rather than rewriting history silently.
3. Update PLAN when milestones, priorities or acceptance change and CHANGELOG for meaningful changes/releases.
4. Keep AGENTS short and invariant-focused; link detailed explanations here.
5. Run the link validator, relevant tests and a production build. Inspect search isolation, navigation and browser behavior for documentation UI changes.
6. State limitations and remaining manual checks honestly. Avoid stale counts, advisory status or future functionality presented as current behavior.

## Decisions and future changes

[The decision log](decisions.md) records existing constraints and this Wiki architecture. Numbers are stable references, not invented meeting dates. New records should state context, chosen approach, rationale, tradeoffs and future consequences; mark proposals distinctly from accepted/implemented decisions.

Wiki content is edited in Git Markdown rather than adding another Pages CMS collection in this phase. Pages CMS remains the primary interface for travel content. Reuse this collection/layout for future guides instead of creating a documentation framework or duplicating the same guide in `docs/`.
