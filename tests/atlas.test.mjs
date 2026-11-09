import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveAtlas, tripPlaces, uniquePlaces } from "../src/utils/atlas-graph.ts";
import { matchingPlaces, selectedIds, readSelection, geographicBounds } from "../src/utils/atlas-state.ts";
const place = (id, overrides = {}) => ({ id, name: `Place ${id}`, description: "TEST ONLY", latitude: 30.123456, longitude: 120.123456, status: ["visited"], ...overrides });
const trip = (id, ids, overrides = {}) => ({ id, name: `Trip ${id}`, places: ids.map(place => ({ place })), ...overrides });
const entries = (items) => items.map(data => ({ source: `${data.id}.json`, data }));
const graph = () => resolveAtlas(entries([place("a"), place("b", { status: ["ridden", "wishlist"] }), place("c")]), entries([trip("one", ["a", "b", "a"]), trip("two", ["a", "c"])]));
const filters = (overrides = {}) => ({ query: "", statuses: new Set(), trips: new Set(), mode: "highlight", ...overrides });

test("ordered visits stay intact; inverse relationships and map membership are unique", () => {
  const data = graph();
  assert.deepEqual(tripPlaces(data.trips[0], data.places).map(p => p.id), ["a", "b", "a"]);
  assert.deepEqual(uniquePlaces(tripPlaces(data.trips[0], data.places)).map(p => p.id), ["a", "b"]);
  assert.deepEqual(data.places.find(p => p.id === "a").tripIds, ["one", "two"]);
});

test("empty/single data, decimal coordinates and name changes", () => {
  assert.deepEqual(resolveAtlas([], []), { places: [], trips: [] });
  const data = resolveAtlas(entries([place("a", { name: "Renamed" })]), entries([trip("one", ["a", "a"])]));
  assert.deepEqual(tripPlaces(data.trips[0], data.places).map(p => p.name), ["Renamed", "Renamed"]);
  assert.equal(data.places[0].latitude, 30.123456);
});

test("duplicate IDs, filename mismatches and missing visits identify offending source/row", () => {
  assert.throws(() => resolveAtlas([...entries([place("a")]), { source: "copy.json", data: place("a") }], []), /copy.json: duplicate Place ID/);
  assert.throws(() => resolveAtlas([], entries([trip("one", ["missing"])])), /one.json, places\[0\]: missing Place "missing"/);
  assert.throws(() => resolveAtlas(entries([place("a")]), [...entries([trip("one", ["a"])]), { source: "copy.json", data: trip("one", ["a"]) }]), /duplicate Trip ID/);
  assert.throws(() => resolveAtlas([{ source: "wrong.json", data: place("a") }], []), /filename must match/);
  assert.throws(() => resolveAtlas(entries([place("a", { latitude: 91 })]), []), /coordinates must be finite/);
});

test("visible Post adapter computes reverse links once without duplicating article summaries", () => {
  const post = { id: "p", title: "Visible", url: "/base/posts/p/", relatedTrips: [{ trip: "one" }], relatedPlaces: [{ place: "a" }] };
  const data = resolveAtlas(entries([place("a"), place("b")]), entries([trip("one", ["a", "b", "a"])]), [post]);
  assert.equal(data.places[0].posts.length, 1);
  assert.equal(data.places[1].posts.length, 1);
  assert.equal(data.trips[0].posts.length, 1);
  assert.deepEqual(data.places[0].posts[0], { id: "p", title: "Visible", url: "/base/posts/p/" });
  assert.throws(() => resolveAtlas([], [], [post]), /Post p/);
});

test("filters OR within dimensions, AND across dimensions, and search Trip names", () => {
  const data = graph();
  assert.equal(matchingPlaces(data, filters()).length, 3);
  assert.deepEqual(matchingPlaces(data, filters({ statuses: new Set(["ridden", "wishlist"]), trips: new Set(["one", "two"]) })).map(p => p.id), ["b"]);
  assert.deepEqual(matchingPlaces(data, filters({ query: "Trip two" })).map(p => p.id), ["a", "c"]);
  assert.equal(matchingPlaces(data, filters({ query: "missing" })).length, 0);
});

test("selections and URL parsing do not depend on filters", () => {
  const data = graph();
  assert.deepEqual([...selectedIds(data, { type: "trip", id: "one" })], ["a", "b"]);
  assert.deepEqual([...selectedIds(data, { type: "place", id: "a" })], ["a"]);
  assert.deepEqual(readSelection(new URLSearchParams("trip=two"), data), { type: "trip", id: "two" });
  assert.equal(readSelection(new URLSearchParams("place=unknown"), data), undefined);
});

test("fitting handles one point, nearby and distant locations, poles and dateline", () => {
  assert.equal(geographicBounds([]), undefined);
  const single = geographicBounds([place("a")]);
  assert.equal(single[0][0], single[1][0]);
  const dateline = geographicBounds([place("a", { longitude: 179 }), place("b", { longitude: -179 })]);
  assert.equal(dateline[1][0] - dateline[0][0], 2);
  assert.equal(geographicBounds([place("a", { latitude: 90 })])[0][1], 85);
  assert(geographicBounds([place("a", { longitude: 0 }), place("b", { longitude: 170 })])[1][0] >= 170);
});
