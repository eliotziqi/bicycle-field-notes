import { test } from "node:test";
import assert from "node:assert/strict";
import { postEditorialSchema } from "../src/schemas/post-editorial.ts";
import { resolveAtlas, resolvePostReferences } from "../src/utils/atlas-graph.ts";
import { comparePosts, matchesPost, postYear, readPostFilters, writePostFilters, isPostVisible } from "../src/utils/post-discovery.ts";
import { atlasSelectionPath } from "../src/utils/urls.ts";

const entries = (data) => data.map((item) => ({ source: `${item.id}.json`, data: item }));
const places = ["a", "b", "c"].map((id) => ({ id, name: id.toUpperCase(), description: "UNIT TEST ONLY", latitude: 30, longitude: 120, status: ["wishlist"] }));
const trips = [{ id: "one", name: "One", places: [{ place: "a" }, { place: "b" }, { place: "a" }] }, { id: "two", name: "Two", places: [{ place: "c" }] }];
const post = (extra = {}) => ({ id: "post", title: "Unit test", url: "/base/posts/post/", ...extra });

test("old Posts stay unclassified and optional CMS blanks normalize without invented dates", () => {
  const old = postEditorialSchema.parse({});
  assert.equal(old.contentType, undefined);
  assert.equal(old.experience, undefined);
  assert.deepEqual(old.relatedPlaces, []);
  assert.deepEqual(old.relatedTrips, []);
  for (const value of [null, "", undefined]) {
    const empty = postEditorialSchema.parse({ contentType: value, relatedPlaces: value, relatedTrips: value, experience: value });
    assert.equal(empty.contentType, undefined);
    assert.equal(empty.experience, undefined);
  }
  assert.equal(postEditorialSchema.parse({ experience: { startDate: "", endDate: null } }).experience, undefined);
});

test("editorial schema retains ordered/repeated Place and Trip rows and stable type values", () => {
  const data = { contentType: "field-note", relatedPlaces: [{ place: "b" }, { place: "a" }, { place: "b" }], relatedTrips: [{ trip: "two" }, { trip: "one" }, { trip: "two" }] };
  const parsed = postEditorialSchema.parse(data);
  assert.deepEqual(parsed.relatedPlaces, data.relatedPlaces);
  assert.deepEqual(parsed.relatedTrips, data.relatedTrips);
  for (const contentType of ["ride", "travel", "guide", "field-note"]) assert.equal(postEditorialSchema.parse({ contentType }).contentType, contentType);
  assert.equal(postEditorialSchema.safeParse({ contentType: "Ride" }).success, false);
  assert.equal(postEditorialSchema.safeParse({ relatedPlaces: [{}] }).success, false);
});

test("experience dates reject impossible dates/reversed ranges; allow either known endpoint", () => {
  assert.equal(postEditorialSchema.safeParse({ experience: { startDate: "2026-02-30" } }).success, false);
  assert.equal(postEditorialSchema.safeParse({ experience: { startDate: "2025-02-01", endDate: "2025-01-01" } }).success, false);
  assert.equal(postEditorialSchema.parse({ experience: { startDate: "2024-02-29" } }).experience.startDate, "2024-02-29");
  assert.equal(postEditorialSchema.parse({ experience: { startDate: new Date("2024-02-29T00:00:00Z") } }).experience.startDate, "2024-02-29");
  assert.equal(postEditorialSchema.parse({ experience: { endDate: "2026-11-09" } }).experience.startDate, undefined);
});

test("explicit narrative references, unique links and derived discovery remain distinct", () => {
  const article = post({ relatedPlaces: [{ place: "b" }, { place: "a" }, { place: "b" }], relatedTrips: [{ trip: "two" }, { trip: "one" }, { trip: "two" }] });
  const graph = resolveAtlas(entries(places), entries(trips), [article]);
  const resolved = graph.posts[0];
  assert.deepEqual(resolved.places.map((p) => p.id), ["b", "a", "b"]);
  assert.deepEqual(resolved.trips.map((t) => t.id), ["two", "one", "two"]);
  assert.deepEqual(resolved.tripIds, ["two", "one"]);
  assert.deepEqual(resolved.discoveryPlaceIds, ["b", "a", "c"]);
  assert.equal(graph.places.find((p) => p.id === "c").posts[0].viaTrip, true);
  assert.equal(graph.places.find((p) => p.id === "a").posts[0].viaTrip, undefined);
  assert.equal(graph.trips[0].posts.length, 1);
  assert.deepEqual(graph.places.find((p) => p.id === "c").status, ["wishlist"]);
  assert.deepEqual(article.relatedPlaces, [{ place: "b" }, { place: "a" }, { place: "b" }]);
});

test("published missing references and duplicate Post IDs produce actionable errors", () => {
  assert.throws(() => resolveAtlas(entries(places), entries(trips), [post({ source: "article.md", relatedPlaces: [{ place: "gone" }] })]), /article.md, relatedPlaces\[0\]: missing Place "gone"/);
  assert.throws(() => resolveAtlas(entries(places), entries(trips), [post({ relatedTrips: [{ trip: "gone" }] })]), /relatedTrips\[0\]: missing Trip "gone"/);
  assert.throws(() => resolveAtlas([], [], [post(), post({ source: "copy.md" })]), /copy.md: duplicate Post ID/);
  assert.throws(() => resolvePostReferences(post({ relatedTrips: [{ trip: "gone" }] }), places, trips), /missing Trip/);
});

test("draft visibility is retained and drafts cannot leak through graph reverse links", () => {
  assert.equal(isPostVisible({}), true);
  assert.equal(isPostVisible({ draft: true }), false);
  assert.equal(isPostVisible({ draft: true }, true), true);
  const graph = resolveAtlas(entries(places), entries(trips), [post({ draft: true, title: "DRAFT SECRET", relatedPlaces: [{ place: "missing" }] })]);
  assert.equal(graph.posts.length, 0);
  assert.equal(JSON.stringify(graph).includes("DRAFT SECRET"), false);
});

test("metadata filters use OR per dimension, AND across dimensions; missing types stay unclassified", () => {
  const item = { id: "a", tags: ["cycling", "travel"], contentType: "ride", placeIds: ["a", "b"], tripIds: ["one"], published: "2026-11-09" };
  const state = readPostFilters(new URLSearchParams("tags=cycling,other&type=ride&type=guide&place=b&trip=one"));
  assert.equal(matchesPost(item, state), true);
  assert.equal(matchesPost({ ...item, tripIds: ["two"] }, state), false);
  assert.equal(matchesPost({ ...item, contentType: undefined }, state), false);
  state.types.clear(); assert.equal(matchesPost({ ...item, contentType: undefined }, state), true);
  state.places.add("unknown"); assert.equal(matchesPost(item, state), true);
});

test("URL state preserves legacy tags, comma/Unicode tags, all dimensions and unrelated params", () => {
  const params = new URLSearchParams("utm=keep&q=coast&tag=routes%2C+maps&tag=骑行&type=ride&type=travel&place=a&place=b&trip=one&sort=experience-asc");
  const state = readPostFilters(params);
  assert.deepEqual([...state.tags], ["routes, maps", "骑行"]);
  const written = writePostFilters(params, state);
  assert.equal(written.get("utm"), "keep");
  assert.deepEqual(readPostFilters(written), state);
  state.places.clear();
  const cleared = readPostFilters(writePostFilters(params, state));
  assert.equal(cleared.places.size, 0); assert.equal(cleared.trips.size, 1); assert.equal(cleared.query, "coast");
  assert.deepEqual([...readPostFilters(new URLSearchParams("tags=a,b")).tags], ["a", "b"]);
});

test("experience sorting leaves undated Posts last in either direction and publication default intact", () => {
  const data = [{ id: "new", published: "2026-11-09" }, { id: "old", published: "2025-01-01", experience: "2024-01-01" }, { id: "middle", published: "2025-06-01", experience: "2025-01-01" }];
  assert.deepEqual([...data].sort((a, b) => comparePosts(a, b, "published-desc")).map((p) => p.id), ["new", "middle", "old"]);
  assert.deepEqual([...data].sort((a, b) => comparePosts(a, b, "experience-desc")).map((p) => p.id), ["middle", "old", "new"]);
  assert.deepEqual([...data].sort((a, b) => comparePosts(a, b, "experience-asc")).map((p) => p.id), ["old", "middle", "new"]);
  assert.equal(postYear(data[0], "experience-desc"), "Undated experience");
});

test("article Atlas paths encode only explicit selection, never Focus", () => {
  assert.equal(atlasSelectionPath("place", "test-place-a"), "/atlas/?place=test-place-a");
  assert.equal(atlasSelectionPath("trip", "test-trip-order"), "/atlas/?trip=test-trip-order");
  assert.equal(atlasSelectionPath("place", "a&trip=b").includes("&trip="), false);
});
