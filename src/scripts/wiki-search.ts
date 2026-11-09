interface SearchData { url: string; meta: { title?: string }; excerpt: string }
interface Pagefind { init(): Promise<void>; search(query: string, options: { filters: { kind: string } }): Promise<{ results: { data(): Promise<SearchData> }[] }> }
const form = document.querySelector<HTMLFormElement>("#wiki-search")!;
const input = document.querySelector<HTMLInputElement>("#wiki-query")!;
const status = document.querySelector<HTMLElement>("#wiki-search-status")!;
const list = document.querySelector<HTMLOListElement>("#wiki-search-results")!;
let pagefind: Promise<Pagefind> | undefined;
let revision = 0;
async function search() {
  const current = ++revision;
  const query = input.value.trim();
  list.replaceChildren();
  if (!query) { status.textContent = "Enter a term, or browse the documentation below."; list.removeAttribute("aria-busy"); return; }
  status.textContent = "Searching documentation…";
  list.setAttribute("aria-busy", "true");
  try {
    pagefind ??= import(/* @vite-ignore */ `${import.meta.env.BASE_URL}pagefind/pagefind.js`).then(async (module: Pagefind) => { await module.init(); return module; }).catch((error: unknown) => { pagefind = undefined; throw error; });
    const found = await (await pagefind).search(query, { filters: { kind: "Wiki" } });
    const entries = await Promise.all(found.results.slice(0, 20).map((result) => result.data()));
    if (current !== revision) return;
    for (const entry of entries) {
      const li = document.createElement("li");
      const link = document.createElement("a");
      link.href = entry.url; link.textContent = entry.meta.title ?? "Documentation";
      const label = document.createElement("p"); label.className = "wiki-result-kind"; label.textContent = "Wiki documentation";
      const excerpt = document.createElement("p"); excerpt.textContent = entry.excerpt.replace(/<[^>]*>/g, "");
      li.append(link, label, excerpt); list.append(li);
    }
    status.textContent = found.results.length ? `${found.results.length} documentation results${found.results.length > 20 ? "; showing the first 20. Refine your search for more." : "."}` : "No documentation matches. Try another term or browse below.";
  } catch {
    if (current !== revision) return;
    status.textContent = import.meta.env.DEV ? "Search needs a production build and preview. Browse the links below." : "Documentation search is unavailable. Try again or browse the links below.";
  } finally { if (current === revision) list.removeAttribute("aria-busy"); }
}
function restore() { input.value = new URLSearchParams(location.search).get("q") ?? ""; void search(); }
form.addEventListener("submit", (event) => { event.preventDefault(); const url = new URL(location.href); url.searchParams.delete("q"); if (input.value.trim()) url.searchParams.set("q", input.value.trim()); if (url.href !== location.href) history.pushState(null, "", url); void search(); });
window.addEventListener("popstate", restore);
restore();
