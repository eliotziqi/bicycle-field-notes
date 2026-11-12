import { formatMonth } from "../utils/post-dates";
import { comparePosts, matchesPost, postYear, readPostFilters, writePostFilters, type Dimension, type DiscoverablePost, type PostSort } from "../utils/post-discovery";

interface SearchResult { data(): Promise<{ url: string }> }
interface Pagefind { init(): Promise<void>; search(query: string, options: { filters: { kind: string } }): Promise<{ results: SearchResult[] }> }

const form = document.querySelector<HTMLFormElement>("#post-filters")!;
const input = form.querySelector<HTMLInputElement>("[name=q]");
const checkboxes = [...form.querySelectorAll<HTMLInputElement>("input[type=checkbox]")];
const sort = document.querySelector<HTMLSelectElement>("#post-sort")!;
const clear = document.querySelector<HTMLButtonElement>("#clear-filters")!;
const count = document.querySelector<HTMLElement>("#result-count")!;
const empty = document.querySelector<HTMLElement>("#empty-results")!;
const error = document.querySelector<HTMLElement>("#search-error")!;
const results = document.querySelector<HTMLElement>(".posts-results")!;
const list = document.querySelector<HTMLElement>("#post-results-list")!;
const summary = document.querySelector<HTMLElement>("#post-active-filters")!;
const advanced = document.querySelector<HTMLDetailsElement>("#post-advanced")!;
const dimensions: Dimension[] = ["tags", "places", "trips"];
const dimensionLabels = { tags: "Tags", places: "Places", trips: "Trips" };
const sortLabels = { "published-desc": "Publication: newest first", "experience-desc": "Experience: newest first", "experience-asc": "Experience: oldest first" };
const labels = new Map(checkboxes.map((checkbox) => [`${checkbox.name}:${checkbox.value}`, checkbox.dataset.label!]));
const pathKey = (url: string) => decodeURI(new URL(url, location.href).pathname).replace(/\/$/, "");
const rows = [...document.querySelectorAll<HTMLLIElement>("[data-post-tags]")].map((element) => ({
  element,
  ...JSON.parse(element.dataset.postInfo!) as DiscoverablePost,
  path: pathKey(element.querySelector<HTMLAnchorElement>("a")!.href),
  time: element.querySelector<HTMLTimeElement>("time")!,
  publishedLabel: element.querySelector("time")!.textContent!,
}));
let state = readPostFilters(new URLSearchParams(location.search));
let revision = 0;
let pagefind: Promise<Pagefind> | undefined;

function loadSearch(): Promise<Pagefind> {
  // Retain the shared promise and the one existing Pagefind full-text index.
  pagefind ??= import(/* @vite-ignore */ `${import.meta.env.BASE_URL}pagefind/pagefind.js`)
    .then(async (module: Pagefind) => { await module.init(); return module; })
    .catch((reason: unknown) => { pagefind = undefined; throw reason; });
  return pagefind;
}

function syncControls() {
  if (input) input.value = state.query;
  checkboxes.forEach((checkbox) => { checkbox.checked = state[checkbox.name as Dimension].has(checkbox.value); });
  sort.value = state.sort;
  if (state.places.size || state.trips.size || state.sort !== "published-desc") advanced.open = true;
}

function writeURL(push: boolean) {
  const url = new URL(location.href);
  url.search = writePostFilters(url.searchParams, state).toString();
  if (url.href !== location.href) history[push ? "pushState" : "replaceState"](null, "", url);
}

function clearDimension(dimension: Dimension | "query" | "sort") {
  if (dimension === "query") state = { ...state, query: "" };
  else if (dimension === "sort") state = { ...state, sort: "published-desc" };
  else state = { ...state, [dimension]: new Set<string>() };
  syncControls(); writeURL(true); void update();
  // The activated summary/clear button may disappear; leave focus on a usable control.
  const control = dimension === "query" ? input : dimension === "sort" ? sort
    : checkboxes.find((checkbox) => checkbox.name === dimension);
  if ((dimension === "places" || dimension === "trips" || dimension === "sort") && (!advanced.open || !control)) {
    advanced.querySelector("summary")?.focus();
  } else (control ?? input ?? checkboxes[0])?.focus();
}

function renderSummary() {
  summary.replaceChildren();
  function chip(text: string, dimension: Dimension | "query" | "sort") {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = `${text} ×`;
    button.setAttribute("aria-label", `Clear ${text}`);
    button.addEventListener("click", () => clearDimension(dimension));
    summary.append(button);
  }
  if (state.query.trim()) chip(`Search: ${state.query.trim()}`, "query");
  for (const dimension of dimensions) {
    const selected = state[dimension];
    form.querySelector<HTMLButtonElement>(`[data-clear-dimension=${dimension}]`)!.hidden = !selected.size;
    if (selected.size) chip(`${dimensionLabels[dimension]}: ${[...selected].map((value) => labels.get(`${dimension}:${value}`) ?? value).join(", ")}`, dimension);
  }
  if (state.sort !== "published-desc") chip(`Sort: ${sortLabels[state.sort]}`, "sort");
  summary.hidden = !summary.childElementCount;
  clear.hidden = summary.hidden;
}

function regroup(currentSort: PostSort) {
  const groups = new Map<string, { section: HTMLElement; items: HTMLUListElement }>();
  const fragment = document.createDocumentFragment();
  for (const row of [...rows].sort((a, b) => comparePosts(a, b, currentSort))) {
    const year = postYear(row, currentSort);
    if (!groups.has(year)) {
      const section = document.createElement("section");
      section.dataset.postYear = "";
      const label = currentSort === "published-desc" || year === "Undated experience" ? year : `Experience ${year}`;
      section.setAttribute("aria-label", label);
      const heading = document.createElement("h2"); heading.className = "year"; heading.textContent = label;
      const items = document.createElement("ul"); items.className = "list";
      section.append(heading, items); fragment.append(section); groups.set(year, { section, items });
    }
    const experience = currentSort !== "published-desc" ? row.experience : undefined;
    if (experience ?? row.published) row.time.dateTime = experience ?? row.published;
    else row.time.removeAttribute("datetime");
    row.time.textContent = experience ? formatMonth(experience, document.documentElement.lang || "en")
      : currentSort === "published-desc" ? row.publishedLabel : `Published ${row.publishedLabel}`;
    row.time.title = experience ? "Experience date" : "Publication date";
    groups.get(year)!.items.append(row.element);
  }
  groups.forEach(({ section, items }) => { section.hidden = !items.querySelector("li:not([hidden])"); });
  list.replaceChildren(fragment);
}

async function update() {
  const current = ++revision;
  const snapshot = state;
  const query = snapshot.query.trim();
  renderSummary();
  error.hidden = true;
  results.setAttribute("aria-busy", query ? "true" : "false");
  let matches: Set<string> | undefined;
  if (query) {
    count.textContent = "Searching…";
    try {
      const search = await (await loadSearch()).search(query, { filters: { kind: "Post" } });
      const data = await Promise.all(search.results.map((result) => result.data()));
      matches = new Set(data.map((result) => pathKey(result.url)));
    } catch {
      if (current !== revision) return;
      error.textContent = import.meta.env.DEV
        ? "Search needs a production build. Run npm run build, then npm run preview."
        : "Search is unavailable. Please try again or clear the filters.";
      error.hidden = false;
      matches = new Set();
    }
  }
  // Searches finishing after a newer query, filter, sort or reset cannot replace it.
  if (current !== revision) return;
  let visible = 0;
  for (const row of rows) {
    row.element.hidden = !(matchesPost(row, snapshot) && (!matches || matches.has(row.path)));
    if (!row.element.hidden) visible++;
  }
  regroup(snapshot.sort);
  count.textContent = `${visible} ${visible === 1 ? "post" : "posts"}`;
  empty.hidden = visible > 0 || !error.hidden;
  results.setAttribute("aria-busy", "false");
}

input?.addEventListener("input", () => { state = { ...state, query: input.value }; writeURL(false); void update(); });
checkboxes.forEach((checkbox) => checkbox.addEventListener("change", () => {
  const dimension = checkbox.name as Dimension;
  const selected = new Set(state[dimension]);
  if (checkbox.checked) selected.add(checkbox.value); else selected.delete(checkbox.value);
  state = { ...state, [dimension]: selected };
  writeURL(true); void update();
}));
sort.addEventListener("change", () => { state = { ...state, sort: sort.value as PostSort }; writeURL(true); void update(); });
form.querySelectorAll<HTMLButtonElement>("[data-clear-dimension]").forEach((button) => button.addEventListener("click", () => clearDimension(button.dataset.clearDimension as Dimension)));
form.addEventListener("submit", (event) => { event.preventDefault(); writeURL(false); void update(); });
clear.addEventListener("click", () => {
  state = readPostFilters(new URLSearchParams());
  syncControls(); writeURL(true); void update();
  (input ?? checkboxes[0])?.focus();
});
window.addEventListener("popstate", () => { state = readPostFilters(new URLSearchParams(location.search)); syncControls(); void update(); });
syncControls();
void update();
