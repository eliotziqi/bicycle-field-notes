# Bicycle Field Notes

A personal notebook for cycling, travel and observations from the road, built with Astro, the minimalist Inkline theme, Pages CMS and GitHub Pages.

[Live website](https://eliotziqi.github.io/bicycle-field-notes/) · [Project Wiki](https://eliotziqi.github.io/bicycle-field-notes/wiki/) · [Wiki source](src/content/wiki/index.md)

Browse articles through the unified Posts search and filters, explore Places and ordered Trips in Atlas, and view curated photos in Gallery. The Wiki is the detailed source for using the site, publishing content and maintaining the code.

## Local development

Use Node 24:

```sh
npm ci
npm run dev
```

Open `/bicycle-field-notes/` at the address Astro prints. Production search requires:

```sh
npm run build
npm run preview
```

See [development and validation](src/content/wiki/developer/testing.md), [publishing](src/content/wiki/publishing/index.md) and [roadmap](PLAN.md). No commit, push or deployment without owner approval.

## Attribution and license

Based on Inkline by the Inkline contributors under the [MIT license](LICENSE); retain the original notice. User articles, photographs and GPX files do not automatically inherit that license.

Newsreader is distributed under the [SIL Open Font License](public/newsreader-license.txt). Preserve the [MapLibre notice](public/maplibre-license.txt) and [map/style/data attribution](src/content/wiki/developer/atlas.md#provider-and-licenses).
