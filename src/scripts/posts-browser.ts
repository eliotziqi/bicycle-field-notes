interface SearchResult {
  data(): Promise<{ url: string }>;
}
interface Pagefind {
  init(): Promise<void>;
  search(query: string): Promise<{ results: SearchResult[] }>;
}

const form = document.querySelector<HTMLFormElement>("#post-filters")!;
const input = form.querySelector<HTMLInputElement>("[name=q]");
const checkboxes = [...form.querySelectorAll<HTMLInputElement>("[name=tags]")];
const clear = document.querySelector<HTMLButtonElement>("#clear-filters")!;
const count = document.querySelector<HTMLElement>("#result-count")!;
const empty = document.querySelector<HTMLElement>("#empty-results")!;
const error = document.querySelector<HTMLElement>("#search-error")!;
const results = document.querySelector<HTMLElement>(".posts-results")!;
const years = [...document.querySelectorAll<HTMLElement>("[data-post-year]")];
const pathKey = (url: string) => decodeURI(new URL(url, location.href).pathname).replace(/\/$/, "");
const rows = [...document.querySelectorAll<HTMLLIElement>("[data-post-tags]")].map((element) => ({
  element,
  tags: JSON.parse(element.dataset.postTags!) as string[],
  path: pathKey(element.querySelector<HTMLAnchorElement>("a")!.href),
}));
let selected = new Set<string>();
let revision = 0;
let pagefind: Promise<Pagefind> | undefined;

function loadSearch(): Promise<Pagefind> {
  // One shared promise prevents duplicate imports/initialization while typing.
  pagefind ??= import(/* @vite-ignore */ `${import.meta.env.BASE_URL}pagefind/pagefind.js`)
    .then(async (module: Pagefind) => { await module.init(); return module; })
    .catch((reason: unknown) => { pagefind = undefined; throw reason; });
  return pagefind;
}

function readURL() {
  const params = new URLSearchParams(location.search);
  if (input) input.value = params.get("q") ?? "";
  // Repeated parameters also support tag names containing commas.
  selected = new Set(params.has("tag")
    ? params.getAll("tag")
    : params.getAll("tags").flatMap((value) => value.split(",")).filter(Boolean));
  checkboxes.forEach((checkbox) => { checkbox.checked = selected.has(checkbox.value); });
}

function writeURL() {
  const url = new URL(location.href);
  url.searchParams.delete("q");
  url.searchParams.delete("tags");
  url.searchParams.delete("tag");
  const query = input?.value.trim() ?? "";
  if (query) url.searchParams.set("q", query);
  if ([...selected].some((tag) => tag.includes(","))) {
    selected.forEach((tag) => url.searchParams.append("tag", tag));
  } else if (selected.size) {
    url.searchParams.set("tags", [...selected].join(","));
  }
  // Replace keeps typing from filling the browser history; popstate restores shared URLs.
  history.replaceState(null, "", url);
}

async function update() {
  const current = ++revision;
  const query = input?.value.trim() ?? "";
  clear.hidden = !query && selected.size === 0;
  error.hidden = true;
  results.setAttribute("aria-busy", query ? "true" : "false");
  let matches: Set<string> | undefined;
  if (query) {
    count.textContent = "Searching…";
    try {
      const search = await (await loadSearch()).search(query);
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
  // Discard old searches that finish after a more recent query or Clear Filters.
  if (current !== revision) return;
  let visible = 0;
  for (const row of rows) {
    const tagMatch = selected.size === 0 || row.tags.some((tag) => selected.has(tag));
    const textMatch = !matches || matches.has(row.path);
    row.element.hidden = !(tagMatch && textMatch);
    if (!row.element.hidden) visible++;
  }
  years.forEach((year) => { year.hidden = !year.querySelector("li:not([hidden])"); });
  count.textContent = `${visible} ${visible === 1 ? "post" : "posts"}`;
  empty.hidden = visible > 0 || !error.hidden;
  results.setAttribute("aria-busy", "false");
}

input?.addEventListener("input", () => { writeURL(); void update(); });
checkboxes.forEach((checkbox) => checkbox.addEventListener("change", () => {
  if (checkbox.checked) selected.add(checkbox.value);
  else selected.delete(checkbox.value);
  writeURL();
  void update();
}));
form.addEventListener("submit", (event) => { event.preventDefault(); writeURL(); void update(); });
clear.addEventListener("click", () => {
  selected.clear();
  checkboxes.forEach((checkbox) => { checkbox.checked = false; });
  if (input) input.value = "";
  writeURL();
  void update();
  (input ?? checkboxes[0])?.focus();
});
window.addEventListener("popstate", () => { readURL(); void update(); });
readURL();
void update();
