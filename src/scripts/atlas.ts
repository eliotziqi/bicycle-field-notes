import { imageAlt } from "../utils/image-accessibility";
import type { Map as LibreMap, GeoJSONSource, StyleSpecification } from "maplibre-gl";
import type { AtlasData, AtlasPlace, RelatedPost } from "../utils/atlas-graph";
import { geographicBounds, matchingPlaces, readSelection, selectedIds, type Filters, type Selection } from "../utils/atlas-state";

const root = document.querySelector<HTMLElement>("#atlas")!;
const data = JSON.parse(document.querySelector("#atlas-data")!.textContent!) as AtlasData;
const element = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const details = element("atlas-details");
const focus = element<HTMLButtonElement>("atlas-focus");
const panelToggle = element<HTMLButtonElement>("atlas-panel-toggle");
const theme = element<HTMLSelectElement>("atlas-theme");
const query = element<HTMLInputElement>("atlas-query");
const form = element<HTMLFormElement>("atlas-filters");
const message = element("atlas-map-message");
const retry = element<HTMLButtonElement>("atlas-retry");
const filters: Filters = { query: "", statuses: new Set(), trips: new Set(), mode: "highlight" };
let selection: Selection;
let unknownSelection = false;
let returnTrip: string | undefined;
let tab = "places";
let map: LibreMap | undefined;
let styleRevision = 0;
let sourceRevision = 0;
const mobile = matchMedia("(max-width: 48rem)");
const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const hasFilters = () => Boolean(filters.query.trim() || filters.statuses.size || filters.trips.size);
const targets = () => {
  const selected = selectedIds(data, selection);
  return selection ? data.places.filter((place) => selected.has(place.id)) : hasFilters() ? matchingPlaces(data, filters) : [];
};

function sheet(state: string) {
  root.dataset.sheet = state;
  root.querySelectorAll<HTMLButtonElement>(".atlas-sheet-controls button").forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.sheet === state)));
  updatePanelButton();
}

function updatePanelButton() {
  const open = mobile.matches ? root.dataset.sheet !== "compact" : root.dataset.panelCollapsed !== "true";
  panelToggle.textContent = open ? "Hide panel" : "Explore";
  panelToggle.setAttribute("aria-expanded", String(open));
}

function select(next: Selection, push = true, fromTrip?: string) {
  unknownSelection = false;
  returnTrip = next?.type === "place" ? fromTrip : undefined;
  selection = next;
  if (push) {
    const url = new URL(location.href);
    url.searchParams.delete("place"); url.searchParams.delete("trip");
    if (next) url.searchParams.set(next.type, next.id);
    if (url.href !== location.href) history.pushState(null, "", url);
  }
  if (next) {
    root.dataset.panelCollapsed = "false";
    if (mobile.matches) sheet("half");
  }
  updatePanelButton();
  render();
  // Deliberately no camera call here, including URL/popstate selections.
}

function node<K extends keyof HTMLElementTagNameMap>(tag: K, text?: string) {
  const result = document.createElement(tag);
  if (text) result.textContent = text;
  return result;
}
function selectionLink(type: "place" | "trip", id: string, label: string, fromTrip?: string) {
  const link = node("a", label);
  const url = new URL(location.href);
  url.search = ""; url.hash = ""; url.searchParams.set(type, id);
  link.href = url.href;
  link.addEventListener("click", (event) => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault(); select({ type, id }, true, fromTrip);
  });
  return link;
}
function postList(posts: RelatedPost[]) {
  if (!posts.length) return;
  details.append(node("h3", "Related Posts"));
  const list = node("ul");
  for (const post of posts) {
    const li = node("li");
    const a = node("a", post.title);
    a.href = post.url;
    li.append(a);
    if (post.viaTrip) li.append(node("span", " — via related Trip"));
    list.append(li);
  }
  details.append(list);
}
function renderDetails() {
  details.replaceChildren();
  if (selection?.type === "place") {
    const place = data.places.find((place) => place.id === selection!.id)!;
    if (returnTrip) details.append(selectionLink("trip", returnTrip, "← Return to Trip"));
    details.append(node("h2", place.name), node("p", place.description), node("p", place.status.join(" · ")));
    if (place.coverImage) {
      const image = node("img"); image.src = place.coverImage; image.alt = imageAlt(place.coverAlt, place.coverDecorative); image.loading = "lazy"; details.append(image);
    }
    if (place.tripIds.length) {
      details.append(node("h3", "Trips visiting this Place"));
      const list = node("ul");
      place.tripIds.forEach((id) => { const li = node("li"); li.append(selectionLink("trip", id, data.trips.find((trip) => trip.id === id)!.name)); list.append(li); });
      details.append(list);
    }
    postList(place.posts);
  } else if (selection?.type === "trip") {
    const trip = data.trips.find((trip) => trip.id === selection!.id)!;
    details.append(node("h2", trip.name));
    if (trip.startDate || trip.endDate) details.append(node("p", [trip.startDate, trip.endDate].filter(Boolean).join(" – ")));
    if (trip.description) details.append(node("p", trip.description));
    details.append(node("h3", "Visiting order"));
    const list = node("ol");
    trip.places.forEach(({ place }) => {
      const li = node("li"); li.append(selectionLink("place", place, data.places.find((p) => p.id === place)!.name, trip.id)); list.append(li);
    });
    details.append(list);
    postList(trip.posts);
  } else if (unknownSelection) {
    details.append(node("p", "That Place or Trip was not found. Choose an item below."));
  }
}

function render() {
  const matches = new Set(matchingPlaces(data, filters).map((place) => place.id));
  const selected = selectedIds(data, selection);
  focus.disabled = !map || !targets().length;
  element("atlas-count").textContent = `${matches.size} of ${data.places.length} Places match${selection ? "; selection shown separately" : ""}`;
  element("atlas-clear-filters").hidden = !hasFilters() && filters.mode === "highlight";
  element("atlas-clear-selection").hidden = !selection;
  element("atlas-empty").hidden = matches.size > 0 || data.places.length === 0;
  root.querySelectorAll<HTMLElement>("[data-place-row]").forEach((row) => {
    row.hidden = !matches.has(row.dataset.placeRow!) && !selected.has(row.dataset.placeRow!);
    row.querySelector("a")!.setAttribute("aria-current", String(selection?.type === "place" && selection.id === row.dataset.placeRow));
  });
  root.querySelectorAll<HTMLElement>("[data-trip-row]").forEach((row) => {
    const trip = data.trips.find((trip) => trip.id === row.dataset.tripRow)!;
    row.hidden = !trip.places.some((ref) => matches.has(ref.place)) && !(selection?.type === "trip" && selection.id === trip.id);
    row.querySelector("a")!.setAttribute("aria-current", String(selection?.type === "trip" && selection.id === trip.id));
  });
  element("atlas-places").hidden = tab !== "places";
  element("atlas-trips").hidden = tab !== "trips";
  renderDetails();
  updateSources();
}

function collection(places: AtlasPlace[]): GeoJSON.FeatureCollection<GeoJSON.Point> {
  return { type: "FeatureCollection", features: places.map((place) => ({
    type: "Feature", id: place.id, properties: { id: place.id, name: place.name },
    geometry: { type: "Point", coordinates: [place.longitude, place.latitude] },
  })) };
}
function updateSources() {
  if (!map?.getSource("atlas-selected")) return;
  sourceRevision++;
  const selected = selectedIds(data, selection);
  const matches = new Set(matchingPlaces(data, filters).map((place) => place.id));
  const visible = data.places.filter((place) => filters.mode !== "only" || matches.has(place.id) || selected.has(place.id));
  const groups = {
    selected: visible.filter((place) => selected.has(place.id)),
    match: visible.filter((place) => !selected.has(place.id) && !selection && matches.has(place.id)),
    dim: visible.filter((place) => !selected.has(place.id) && (Boolean(selection) || !matches.has(place.id))),
  };
  for (const [name, places] of Object.entries(groups)) (map.getSource(`atlas-${name}`) as GeoJSONSource).setData(collection(places));
}

function addLayers() {
  if (!map || map.getSource("atlas-selected")) return;
  const dark = effectiveTheme() === "dark";
  const color = dark ? "#a8bdff" : "#294bc7";
  for (const group of ["dim", "match", "selected"]) {
    const id = `atlas-${group}`;
    const dim = group === "dim";
    map.addSource(id, { type: "geojson", data: collection([]), cluster: group !== "selected", clusterRadius: 45, clusterMaxZoom: 10 });
    if (group !== "selected") {
      map.addLayer({ id: `${id}-clusters`, type: "circle", source: id, filter: ["has", "point_count"], paint: {
        "circle-color": dim ? (dark ? "#6e7480" : "#747b88") : color,
        "circle-radius": ["step", ["get", "point_count"], 17, 10, 21, 50, 25],
        "circle-opacity": dim ? 0.5 : 0.95, "circle-stroke-width": 1, "circle-stroke-color": dark ? "#111827" : "#ffffff",
      } });
      map.addLayer({ id: `${id}-counts`, type: "symbol", source: id, filter: ["has", "point_count"], layout: {
        "text-field": "{point_count_abbreviated}", "text-font": ["Noto Sans Regular"], "text-size": 12, "text-allow-overlap": true,
      }, paint: { "text-color": dim && dark ? "#ffffff" : group === "match" && dark ? "#111827" : "#ffffff" } });
    }
    map.addLayer({ id: `${id}-points`, type: "circle", source: id, filter: ["!", ["has", "point_count"]], paint: {
      "circle-color": dim ? (dark ? "#747b88" : "#6a7180") : color,
      "circle-radius": group === "selected" ? 9 : 6, "circle-opacity": dim ? 0.45 : 1,
      "circle-stroke-width": group === "selected" ? 3 : 1.5, "circle-stroke-color": "#ffffff",
    } });
  }
  updateSources();
}

function effectiveTheme() { return theme.value === "site" ? document.documentElement.dataset.theme ?? "light" : theme.value; }
async function loadStyle() {
  if (!map) return;
  const revision = ++styleRevision;
  message.hidden = false; message.textContent = "Loading map style…"; retry.hidden = true;
  try {
    const response = await fetch(`https://tiles.openfreemap.org/styles/${effectiveTheme() === "dark" ? "dark" : "positron"}`, { signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error("Map style request failed");
    const style = await response.json() as StyleSpecification;
    if (revision !== styleRevision) return;
    // Use globe projection; style changes must not reset the camera.
    style.projection = { type: "globe" };
    map.setStyle(style);
    message.hidden = true;
  } catch {
    if (revision !== styleRevision) return;
    message.textContent = "Map tiles unavailable. You can still browse Places and Trips. Retry when connected.";
    retry.hidden = false;
  }
}

async function initMap() {
  try {
    const { Map, NavigationControl, setWorkerUrl } = await import("maplibre-gl");
    const { default: worker } = await import("maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url");
    await import("maplibre-gl/dist/maplibre-gl.css");
    setWorkerUrl(worker);
    const initial = data.places[Math.floor(Math.random() * data.places.length)];
    map = new Map({ container: "atlas-map", center: initial ? [initial.longitude, Math.max(-85, Math.min(85, initial.latitude))] : [0, 20],
      zoom: overviewZoom(), maxZoom: 16, attributionControl: false,
      style: { version: 8, projection: { type: "globe" }, glyphs: "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf", sources: {}, layers: [{ id: "background", type: "background", paint: { "background-color": effectiveTheme() === "dark" ? "#182333" : "#dce6ed" } }] },
    });
    map.addControl(new NavigationControl({ showCompass: true }), "bottom-right");
    map.on("style.load", () => { map!.setProjection({ type: "globe" }); addLayers(); });
    map.on("error", () => {
      message.hidden = false; message.textContent = "Some map resources could not load. Place and Trip browsing is still available."; retry.hidden = false;
    });
    map.on("click", async (event) => {
      const layers = ["atlas-selected-points", "atlas-match-points", "atlas-dim-points", "atlas-match-clusters", "atlas-dim-clusters"].filter((id) => map!.getLayer(id));
      const features = map!.queryRenderedFeatures(event.point, { layers });
      const feature = features.find((feature) => feature.properties?.id) ?? features[0];
      if (!feature) return;
      if (feature.properties?.id) { select({ type: "place", id: feature.properties.id }); return; }
      const revision = sourceRevision;
      try {
        const zoom = await (map!.getSource(feature.source) as GeoJSONSource).getClusterExpansionZoom(feature.properties!.cluster_id);
        if (revision !== sourceRevision || !map) return;
        const coordinates = (feature.geometry as GeoJSON.Point).coordinates;
        map.easeTo({ center: [coordinates[0], coordinates[1]], zoom: Math.min(zoom, 12), duration: reducedMotion() ? 0 : 350 });
      } catch { /* Cluster changed while interaction was in flight. */ }
    });
    map.on("mousemove", (event) => {
      const layers = ["atlas-selected-points", "atlas-match-points", "atlas-dim-points", "atlas-match-clusters", "atlas-dim-clusters"].filter((id) => map!.getLayer(id));
      map!.getCanvas().style.cursor = map!.queryRenderedFeatures(event.point, { layers }).length ? "pointer" : "";
    });
    new ResizeObserver(() => map?.resize()).observe(element("atlas-map"));
    focus.disabled = !targets().length;
    await loadStyle();
  } catch {
    message.hidden = false; message.textContent = "The globe needs WebGL and a supported browser. Browse Places and Trips in the panel.";
    focus.disabled = true;
  }
}

function overviewZoom() {
  const container = element("atlas-map");
  return Math.max(0.1, Math.min(1.7, Math.log2(Math.min(container.clientWidth, container.clientHeight) * 0.75 / 170)));
}

focus.addEventListener("click", () => {
  const places = targets();
  const bounds = geographicBounds(places);
  if (!map || !bounds) return;
  const options = { duration: reducedMotion() ? 0 : 600 };
  if (bounds[1][0] - bounds[0][0] > 180 || bounds[1][1] - bounds[0][1] > 120) {
    map.easeTo({ center: [(bounds[0][0] + bounds[1][0]) / 2, (bounds[0][1] + bounds[1][1]) / 2], zoom: overviewZoom(), ...options });
  } else if (bounds[0][0] === bounds[1][0] && bounds[0][1] === bounds[1][1]) {
    map.easeTo({ center: bounds[0], zoom: 9, ...options });
  } else map.fitBounds(bounds, { padding: 55, maxZoom: 9, ...options });
});

root.querySelectorAll<HTMLAnchorElement>("[data-select-place], [data-select-trip]").forEach((link) => link.addEventListener("click", (event) => {
  if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  select(link.dataset.selectPlace ? { type: "place", id: link.dataset.selectPlace } : { type: "trip", id: link.dataset.selectTrip! });
}));
element("atlas-clear-selection").addEventListener("click", () => select(undefined));
root.querySelectorAll<HTMLButtonElement>("[data-tab]").forEach((button) => button.addEventListener("click", () => {
  tab = button.dataset.tab!;
  root.querySelectorAll<HTMLButtonElement>("[data-tab]").forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
  render();
}));
function readFilters() {
  filters.query = query.value;
  filters.statuses = new Set([...form.querySelectorAll<HTMLInputElement>("[name=status]:checked")].map((input) => input.value));
  filters.trips = new Set([...form.querySelectorAll<HTMLInputElement>("[name=trip]:checked")].map((input) => input.value));
  filters.mode = element<HTMLSelectElement>("atlas-mode").value as Filters["mode"];
  render();
}
form.addEventListener("submit", (event) => event.preventDefault());
form.addEventListener("input", readFilters);
element("atlas-clear-filters").addEventListener("click", () => { form.reset(); readFilters(); });
panelToggle.addEventListener("click", () => {
  if (mobile.matches) sheet(root.dataset.sheet === "compact" ? "half" : "compact");
  else root.dataset.panelCollapsed = String(root.dataset.panelCollapsed !== "true");
  updatePanelButton();
});
root.querySelectorAll<HTMLButtonElement>(".atlas-sheet-controls button").forEach((button) => button.addEventListener("click", () => sheet(button.dataset.sheet!)));
mobile.addEventListener("change", updatePanelButton);
theme.addEventListener("change", () => void loadStyle());
new MutationObserver(() => { if (theme.value === "site") void loadStyle(); }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
retry.addEventListener("click", () => void loadStyle());
function readURL() {
  const params = new URLSearchParams(location.search);
  const next = readSelection(params, data);
  select(next, false);
  unknownSelection = !next && (params.has("place") || params.has("trip"));
  if (unknownSelection) renderDetails();
}
window.addEventListener("popstate", readURL);
root.dataset.ready = "true";
root.querySelectorAll<HTMLElement>(".atlas-toolbar, #atlas-filters, #atlas-list-controls, .atlas-sheet-controls").forEach((item) => { item.hidden = false; });
readURL(); updatePanelButton();
void initMap();
