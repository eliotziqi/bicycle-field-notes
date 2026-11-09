import type { AtlasData, AtlasPlace, Place } from "./atlas-graph";

export type Selection = { type: "place" | "trip"; id: string } | undefined;
export interface Filters { query: string; statuses: Set<string>; trips: Set<string>; mode: "highlight" | "only" }

export function matchingPlaces(data: AtlasData, filters: Filters): AtlasPlace[] {
  const query = filters.query.trim().toLocaleLowerCase();
  const namedTrips = new Set(data.trips.filter((trip) => trip.name.toLocaleLowerCase().includes(query)).map((trip) => trip.id));
  return data.places.filter((place) => (!query || place.name.toLocaleLowerCase().includes(query) || place.tripIds.some((id) => namedTrips.has(id)))
    && (!filters.statuses.size || place.status.some((status) => filters.statuses.has(status)))
    && (!filters.trips.size || place.tripIds.some((id) => filters.trips.has(id))));
}

export function selectedIds(data: AtlasData, selection: Selection): Set<string> {
  if (!selection) return new Set();
  return new Set(selection.type === "place" ? [selection.id]
    : data.trips.find((trip) => trip.id === selection.id)?.places.map((ref) => ref.place) ?? []);
}

export function readSelection(params: URLSearchParams, data: AtlasData): Selection {
  const place = params.get("place");
  const trip = params.get("trip");
  if (place && data.places.some((item) => item.id === place)) return { type: "place", id: place };
  if (trip && data.trips.some((item) => item.id === trip)) return { type: "trip", id: trip };
}

/** Smallest longitude arc, including dateline crossings. */
export function geographicBounds(places: Place[]): [[number, number], [number, number]] | undefined {
  if (!places.length) return;
  const longitudes = places.map((place) => ((place.longitude % 360) + 360) % 360).sort((a, b) => a - b);
  let gap = -1;
  let start = 0;
  for (let i = 0; i < longitudes.length; i++) {
    const next = longitudes[(i + 1) % longitudes.length] + (i === longitudes.length - 1 ? 360 : 0);
    if (next - longitudes[i] > gap) { gap = next - longitudes[i]; start = (i + 1) % longitudes.length; }
  }
  let west = longitudes[start];
  let east = west + 360 - gap;
  if (west > 180) { west -= 360; east -= 360; }
  const latitudes = places.map((place) => Math.max(-85, Math.min(85, place.latitude)));
  return [[west, Math.min(...latitudes)], [east, Math.max(...latitudes)]];
}
