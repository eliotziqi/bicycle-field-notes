/** Content relationships only: no Astro, DOM or map dependency. */
export interface Place {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  description: string;
  status: ("ridden" | "visited" | "wishlist")[];
  coverImage?: string;
}

export interface Trip {
  id: string;
  name: string;
  places: { place: string }[];
  startDate?: string;
  endDate?: string;
  description?: string;
}

export interface RelatedPost {
  id: string;
  title: string;
  url: string;
  relatedPlaces?: { place: string }[];
  relatedTrips?: { trip: string }[];
  source?: string;
  draft?: boolean;
  /** Discovery association through a Trip, not an explicit editorial Place reference. */
  viaTrip?: boolean;
}

export interface Source<T> { source: string; data: T }
export type AtlasPlace = Place & { tripIds: string[]; posts: RelatedPost[] };
export type AtlasTrip = Trip & { posts: RelatedPost[] };
export interface AtlasData { places: AtlasPlace[]; trips: AtlasTrip[] }
export interface ResolvedPost extends RelatedPost {
  places: Place[];
  trips: Trip[];
  discoveryPlaceIds: string[];
  tripIds: string[];
}
export interface ContentGraph extends AtlasData { posts: ResolvedPost[] }

export function uniquePlaces(places: Place[]): Place[] {
  return [...new Map(places.map((place) => [place.id, place])).values()];
}

export function resolveAtlas(
  placeEntries: Source<Place>[],
  tripEntries: Source<Trip>[],
  visiblePosts: RelatedPost[] = [],
): ContentGraph {
  const errors: string[] = [];
  function index<T extends { id: string }>(entries: Source<T>[], kind: string) {
    const result = new Map<string, T>();
    const files = new Map<string, string>();
    for (const { source, data } of entries) {
      if (result.has(data.id)) errors.push(`${source}: duplicate ${kind} ID "${data.id}" (also ${files.get(data.id)}). Give each ${kind} a unique stable ID.`);
      if (source.split("/").at(-1) !== `${data.id}.json`) errors.push(`${source}: filename must match stable ID "${data.id}.json". Coordinate any ID migration with all references.`);
      files.set(data.id, source);
      result.set(data.id, data);
    }
    return result;
  }
  const places = index(placeEntries, "Place");
  const trips = index(tripEntries, "Trip");
  const posts = visiblePosts.filter((post) => !post.draft);
  const postSources = new Map<string, string>();
  for (const post of posts) {
    const source = post.source ?? `Post ${post.id}`;
    if (postSources.has(post.id)) errors.push(`${source}: duplicate Post ID "${post.id}" (also ${postSources.get(post.id)}). Keep Post filenames/IDs unique.`);
    postSources.set(post.id, source);
  }
  const requirePlace = (id: string, source: string) => {
    if (!places.has(id)) errors.push(`${source}: missing Place "${id}". Restore it or update this reference before deleting a Place.`);
  };
  for (const { source, data } of placeEntries) {
    if (!Number.isFinite(data.latitude) || Math.abs(data.latitude) > 90
      || !Number.isFinite(data.longitude) || Math.abs(data.longitude) > 180) errors.push(`${source}: coordinates must be finite latitude [-90, 90] and longitude [-180, 180].`);
  }
  for (const { source, data } of tripEntries) {
    data.places.forEach(({ place }, i) => requirePlace(place, `${source}, places[${i}]`));
  }
  for (const post of posts) {
    const source = post.source ?? `Post ${post.id}`;
    post.relatedPlaces?.forEach(({ place }, i) => requirePlace(place, `${source}, relatedPlaces[${i}]`));
    post.relatedTrips?.forEach(({ trip }, i) => {
      if (!trips.has(trip)) errors.push(`${source}, relatedTrips[${i}]: missing Trip "${trip}". Restore it or update the reference.`);
    });
  }
  if (errors.length) throw new Error(`Atlas content validation failed:\n- ${errors.join("\n- ")}`);
  const postSummary = ({ id, title, url }: RelatedPost): RelatedPost => ({ id, title, url });
  const resolvedPosts = posts.map((post) => resolvePostReferences(post, [...places.values()], [...trips.values()]));
  const resolvedTrips = [...trips.values()].map((trip) => ({
    ...trip,
    // Never deduplicate the source itinerary.
    places: trip.places.map((visit) => ({ ...visit })),
    posts: resolvedPosts.filter((post) => post.tripIds.includes(trip.id)).map(postSummary),
  }));
  const resolvedPlaces = [...places.values()].map((place) => {
    const tripIds = resolvedTrips.filter((trip) => trip.places.some((ref) => ref.place === place.id)).map((trip) => trip.id);
    return {
      ...place, tripIds,
      posts: resolvedPosts.filter((post) => post.discoveryPlaceIds.includes(place.id)).map((post) => ({
        ...postSummary(post),
        ...(post.places.some((direct) => direct.id === place.id) ? {} : { viaTrip: true }),
      })),
    };
  });
  const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name);
  return { places: resolvedPlaces.sort(byName), trips: resolvedTrips.sort(byName), posts: resolvedPosts };
}

/** Explicit narrative sequences stay separate from derived discovery membership. */
export function resolvePostReferences(post: RelatedPost, places: Place[], trips: Trip[]): ResolvedPost {
  const source = post.source ?? `Post ${post.id}`;
  const byPlace = new Map(places.map((place) => [place.id, place]));
  const byTrip = new Map(trips.map((trip) => [trip.id, trip]));
  const orderedPlaces = (post.relatedPlaces ?? []).map(({ place }, i) => {
    const found = byPlace.get(place);
    if (!found) throw new Error(`${source}, relatedPlaces[${i}]: missing Place "${place}".`);
    return found;
  });
  const orderedTrips = (post.relatedTrips ?? []).map(({ trip }, i) => {
    const found = byTrip.get(trip);
    if (!found) throw new Error(`${source}, relatedTrips[${i}]: missing Trip "${trip}".`);
    return found;
  });
  return {
    ...post, places: orderedPlaces, trips: orderedTrips,
    discoveryPlaceIds: [...new Set([...orderedPlaces.map((place) => place.id), ...orderedTrips.flatMap((trip) => trip.places.map((ref) => ref.place))])],
    tripIds: [...new Set(orderedTrips.map((trip) => trip.id))],
  };
}

/** Ordered, resolved visits; duplicates are meaningful and retained. */
export function tripPlaces(trip: Trip, places: Place[]): Place[] {
  const byId = new Map(places.map((place) => [place.id, place]));
  return trip.places.map(({ place }, index) => {
    const found = byId.get(place);
    if (!found) throw new Error(`Trip ${trip.id}, places[${index}]: missing Place "${place}".`);
    return found;
  });
}
