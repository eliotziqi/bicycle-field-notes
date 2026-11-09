# Atlas: data, interaction and validation

## Implementation files

| Files | Responsibility |
| --- | --- |
| `.pages.yml`, `src/content.config.ts` | Decimal CMS input options and file-based collection loader IDs; existing records stay unchanged |
| `src/utils/atlas-graph.ts`, `src/utils/atlas.ts`, `src/utils/atlas-state.ts` | Pure graph, Astro adapter/media validation, filtering/selection/geographic bounds |
| `src/pages/atlas.astro`, `src/scripts/atlas.ts`, `src/styles/atlas.css` | Atlas markup/fallback, client interactions/map and responsive layout |
| `package.json`, `package-lock.json`, `public/maplibre-license.txt` | Pinned renderer dependency and distributed license notice |
| `tests/atlas.test.mjs` | Node 24 data/state regression cases without extra test dependencies |
| `docs/cms-compatibility-test.md`, `docs/atlas-development.md`, `PLAN.md`, `CHANGELOG.md`, `README.md`, `AGENTS.md` | Owner acceptance, current behavior/limits, roadmap/history and concise project/agent guidance |

## Data ownership

Places and Trips remain CMS-managed JSON collections. A Place is one geographic entity with an immutable, independently authored `id`; changing its name does not change relationships. Trips own ordered `{ place: id }` visit rows. B/A/A and A/B/A remain different itineraries. No reverse arrays are stored in source content.

`src/utils/atlas-graph.ts` is independent of Astro, MapLibre and the DOM. `resolveAtlas()` checks duplicate IDs, filename/ID agreement, coordinates and missing references, then derives Place→Trip and Post relationships. `tripPlaces()` resolves each visit without removing repeats. `uniquePlaces()` is only for consumers needing geographic membership. Invalid references identify the source file and zero-based visit index; restore the referenced record or update every affected visit before deleting it.

Astro's Place/Trip glob loaders use file-based loader IDs so two files with the same authored `data.id` cannot silently replace each other before graph validation. `getAtlas()` reads those collections plus visible `getPosts()` summaries, validates local cover paths and serializes only public summaries. Production drafts and article bodies are never serialized. A future Post adapter can pass `relatedPlaces` and `relatedTrips`; the resolver derives a Place's Posts from direct links and linked Trips, once per article. No Post fields or article/browser UI integration are added in this phase.

The original owner-created CMS tests (`test-place-a`, `test-place-b`, `test-trip-order`) remain in source and appear in Atlas using their authored test names. They are not automatically removed or converted into travel records. Validation-only demo data is kept outside this repository.

## Interaction contract

- `src/utils/atlas-state.ts` contains pure selection parsing, filtering and dateline-aware geographic bounds. The Atlas page renders base-aware static lists and safely escaped JSON. `src/scripts/atlas.ts` progressively enables the panel and dynamically imports MapLibre JS, CSS and worker only on Atlas.
- Fresh loads choose a random existing Place as camera orientation, at a responsive global overview zoom. They do not select it. Empty data uses [0, 20]. No automatic rotation. A deep link selects details without focusing the camera.
- Selection is one Place or one Trip. Selecting a Place emphasizes only that Place; selecting a Trip emphasizes each unique member and shows the complete ordered itinerary, including repeats. An itinerary Place link provides a Return to Trip link. Related Trip links let a Place choose among journeys.
- Filters retain their own state. Status and Trip choices use OR within each group and AND across groups and text. Search matches Place names and the names of Trips visiting them. Highlight mode dims nonmatches; Show Only removes them. Explicit selections survive either mode and filter counts continue to describe matches. Clearing selection keeps filters. Region is deferred: existing records have no reliable region field, and no geocoder or inferred region is introduced.
- Focus is the only selection/filter camera action. It targets the selected Place, selected Trip, then nonempty results of an active filter. With no selection or active filter it is disabled, even though every Place matches by default. Single points use zoom 9; multi-point fitting caps zoom at 9 to avoid over-zooming nearby coordinates. Global-spanning results keep an overview. Reduced motion uses zero-duration changes.
- Cluster clicks are a separate, explicit geographic expansion action. Unselected prominent/dim points use separate clustered GeoJSON sources with member counts. Selected points are excluded from those sources and drawn above them without clustering. Counts refer to each cluster's own members, excluding separately drawn selected points. Unique Place records produce one point each, regardless of repeated visits. At identical coordinates selected Trip markers can overlap; the ordered panel remains the accessible way to inspect each visit.
- The globe uses MapLibre projection `globe`; MapLibre blends toward its local planar view as zoom increases. No Trip lines, GPX tracks, terrain or inferred routes exist. Rotating/zooming the map manually is unrestricted within renderer limits.
- Desktop sidebar collapse changes map width. Mobile uses explicit Compact/Half/Full buttons rather than dragging a sheet over map touch gestures. Full leaves a usable strip of map; attribution remains inside that strip. Panel scrolling is contained. Lists support keyboard navigation as the nonvisual/canvas alternative.
- Only explicit selection uses URL state: `?place=stable-id` or `?trip=stable-id`. Place wins if both valid parameters exist. Unknown IDs show a message without throwing. Selection uses history entries; Back/Forward restores details without moving the camera. Filters and map theme override are transient and not added to URLs.
- Map theme defaults to Follow site, with Light/Dark overrides. Site theme changes are observed. Theme style reloads rebuild sources using current selection/filters and preserve camera. Missing styles expose Retry and preserve panel browsing; unsupported WebGL leaves a list/details fallback. Without JavaScript static Place/Trip lists remain available, but dynamic details/filters do not.

## Provider and licenses

MapLibre GL JS is pinned to 6.17.0 (BSD-3-Clause). The initially evaluated older release had a sanitizer advisory and was replaced before delivery. It is the only new direct runtime dependency. The renderer's large split bundle is an expected build warning; it is not loaded by Home, Posts or Gallery.

OpenFreeMap public vector tiles require no API key or account for normal browsing. Use `https://tiles.openfreemap.org/styles/positron` for light and `/styles/dark` for dark. Positron's restrained presentation fits Inkline; Dark provides an independently switchable night map. Dark's upstream maintenance/sprite coverage is less complete, so future style updates need visual checks. URLs are centralized in the Atlas client loader.

As checked for this implementation, [OpenFreeMap](https://openfreemap.org/) advertises no public map-view/request limits and no usage charge, but offers no SLA. Availability and future terms are outside the site's control. [Offline downloads](https://openfreemap.org/quick_start/) have separate limits (3,000 tiles or 50 MB, at most four parallel requests and an identifying User-Agent); this site performs no bulk download or offline caching.

Visible map credits link OpenFreeMap, OpenMapTiles and OpenStreetMap. A small on-page credits disclosure includes style authors and licenses; it stays available without adding a Wiki. The original renderer notice is distributed as `public/maplibre-license.txt`. OSM data is [ODbL](https://www.openstreetmap.org/copyright). Infrastructure being MIT does not license all styles/data under MIT. [Positron](https://github.com/hyperknot/openfreemap-styles/blob/main/styles/positron/LICENSE.md) and [Dark](https://github.com/hyperknot/openfreemap-styles/blob/main/styles/dark/LICENSE.md) specify BSD-3-Clause code, CC-BY-4.0 design, and inherited CartoDB/Stamen/Paul Norman CC-BY-3.0 credits. Preserve these links and notices if replacing or redistributing assets. No external style assets are copied into source.

## Validation

Use Node 24, `node tests/atlas.test.mjs`, `npm run build`, then `npm run preview`. The pure tests cover ordered repeats, shared Places, reverse Post adapters, duplicate/missing IDs, decimals, filtering, unknown selection and geographic bounds. The production build runs schema/graph/media validation against actual records. See [CMS precision and authoring](cms-compatibility-test.md).

Validated in real headless Chromium against production preview and isolated build fixtures:

- Empty global fallback, one Place random orientation at overview zoom, and nearby/distant multi-Place data. Validated cover paths with the existing photo, without creating a Gallery record.
- Place/Trip deep links, unknown IDs, A/B/A and B/A/A visit lists, two Trips sharing one Place, return links and Back/Forward. Instrumented MapLibre camera methods confirm selection/filter operations do not activate camera motion; explicit Focus does. Nearby Trip fits remain capped at zoom 9.
- Status OR, Trip OR (pure tests), dimensions AND, name search, Highlight/Show Only and explicit selection outside matching filters. Clearing selection retains filters.
- Globe clusters/counts, real pointer cluster expansion without selecting an item, and selected points remaining in a separate source at zoom 0.2/6/11. Dateline and broad bounds have pure tests; physical globe interaction across the dateline remains a useful manual check.
- Real OpenFreeMap Positron/Dark requests succeed. Sources, selection and camera survive style reload. Follow-site and independent override work. Blocking style requests retains details and exposes Retry; unblocking and Retry succeeds.
- Desktop collapse/expand, no horizontal overflow at 1280/768/390/320px, and all three mobile sheet states with map area retained. Physical-phone gestures and screen-reader behavior are not certified by viewport emulation.
- Home/Posts/Gallery request no MapLibre or provider resources. Gallery lightbox/Escape and production empty-Posts search still work. Existing draft exclusion remains intact.
- Chromium native number inputs accept `30.2500`, `30.123456`, `120.123456`, legal extrema, and reject values beyond latitude/longitude bounds. These are actual browser validity checks using the upstream CMS input attributes, not authenticated hosted CMS operations.

Builds pass for actual owner content and empty/single/multiple isolated fixtures. Deliberate missing-reference and duplicate-ID fixture builds fail with actionable errors. Seven pure graph/state test cases pass. Existing user content, uploads, Post/Gallery implementations and deployment workflow remain unchanged. Temporary validation fixtures never enter the source collections.

Remaining manual acceptance:

1. After separately approved publication of the config, save/reopen six-decimal coordinates in hosted Pages CMS using the precision procedure in the CMS guide.
2. On a real phone, rotate and pinch-zoom the globe, scroll the panel, and switch Compact/Half/Full. Confirm map gestures do not operate the panel and attribution remains available.
3. Use keyboard and a screen reader to choose Places/Trips, clear selection, adjust filters and activate Focus. Compare both themes and reduced-motion settings; no full accessibility certification is claimed.
4. Inspect a dateline-spanning Trip and distant filtered results using manual Focus. The map has no lines; the ordered panel is authoritative. Overlapping selected markers can be inspected from the list.

Known limits: no provider SLA/offline mode, no reliable region data, overlapping selected coordinates, and no Post relationship UI yet. A globe cannot show opposite hemispheres simultaneously: world-spanning Focus uses an overview and may require manual rotation to see every marker. Very high latitudes are clamped to ±85° for camera fitting (source coordinates remain untouched). MapLibre's route-only renderer bundle exceeds Vite's default size-warning threshold. npm audit retains two pre-existing moderate Satori/fflate advisories; no new MapLibre advisory is reported after upgrading to 6.17.0. Unsupported WebGL fallback is implemented but was not tested on a physical unsupported device.

## Deferred work

Phase 3 owns Post CMS/schema extensions, article Atlas links and advanced Posts filtering. Phase 4 owns Wiki, help icon and moving this developer guidance into the Wiki without duplication. Post-only GPX rendering/downloads, terrain and elevation statistics remain future work. Atlas will not gain connecting lines or GPX routes as part of those features.
