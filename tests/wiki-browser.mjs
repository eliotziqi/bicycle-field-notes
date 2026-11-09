// Requires production preview and a separately started Chrome DevTools endpoint.
import assert from "node:assert/strict";
const base = process.argv[2] ?? "http://127.0.0.1:4321/bicycle-field-notes/";
const tabs = await (await fetch("http://127.0.0.1:9222/json")).json();
const ws = new WebSocket(tabs[0].webSocketDebuggerUrl);
await new Promise((resolve) => ws.addEventListener("open", resolve, { once: true }));
let id = 0;
const pending = new Map(), errors = [];
ws.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (message.method === "Runtime.exceptionThrown") errors.push(message.params.exceptionDetails.text);
  if (message.id) { const call = pending.get(message.id); pending.delete(message.id); message.error ? call.reject(message.error) : call.resolve(message.result); }
});
const send = (method, params = {}) => new Promise((resolve, reject) => { pending.set(++id, { resolve, reject }); ws.send(JSON.stringify({ id, method, params })); });
const evaluate = async (expression) => { const result = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true }); if (result.exceptionDetails) throw Error(JSON.stringify(result.exceptionDetails)); return result.result.value; };
const wait = async (expression) => { for (let attempt = 0; attempt < 200; attempt++) { if (await evaluate(expression)) return; await new Promise((resolve) => setTimeout(resolve, 100)); } throw Error(`Timeout: ${expression}`); };
async function navigate(route) { await send("Page.navigate", { url: base + route }); await wait(`location.href === ${JSON.stringify(base + route)} && document.readyState === 'complete'`); }
async function key(key, code, number) { await send("Input.dispatchKeyEvent", { type: "keyDown", key, code, windowsVirtualKeyCode: number, ...(key === "Enter" ? { text: "\r" } : {}) }); await send("Input.dispatchKeyEvent", { type: "keyUp", key, code, windowsVirtualKeyCode: number }); }
try {
  await send("Page.enable"); await send("Runtime.enable"); await send("Network.enable"); await send("Network.setCacheDisabled", { cacheDisabled: true });
  await send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 1000, deviceScaleFactor: 1, mobile: false });
  await navigate("wiki/");
  assert.equal(await evaluate('document.querySelector("[aria-label=Main]").querySelectorAll("a:not(.icon-btn)").length'), 5);
  assert.equal(await evaluate('[...document.querySelectorAll(".site-nav a")].find(a=>a.getAttribute("aria-label")==="Wiki / Documentation").pathname'), new URL(base).pathname + "wiki/");
  assert.equal(await evaluate('document.querySelector(".wiki-navigation nav").getBoundingClientRect().height>100'), true);
  await navigate("wiki/user/atlas/");
  assert.equal(await evaluate('document.querySelector(".wiki-navigation [aria-current=page]").textContent'), "Using Atlas");
  assert.equal(await evaluate('document.querySelectorAll(".wiki-breadcrumbs a").length'), 3);
  assert.equal(await evaluate('document.querySelector("a[rel=next]").textContent.includes("Finding Posts")'), true);
  await evaluate('document.querySelector(".wiki-toc a").click()');
  assert.equal(await evaluate('!!document.getElementById(decodeURIComponent(location.hash.slice(1)))'), true);
  await evaluate('document.querySelector("a[rel=next]").click()');
  await wait('document.querySelector("h1")?.textContent==="Finding Posts"');
  for (const theme of ["light", "dark"]) {
    await evaluate(`document.documentElement.dataset.theme=${JSON.stringify(theme)}`);
    for (const width of [1280, 768, 390, 320]) {
      await send("Emulation.setDeviceMetricsOverride", { width, height: 1000, deviceScaleFactor: 1, mobile: false });
      assert.equal(await evaluate('document.documentElement.scrollWidth>innerWidth'), false);
    }
  }
  // Native disclosure works with actual keyboard events and visible focus.
  await key("Tab", "Tab", 9);
  await evaluate('document.querySelector(".wiki-navigation summary").focus()');
  assert.equal(await evaluate('getComputedStyle(document.activeElement).outlineStyle'), "solid");
  await key("Enter", "Enter", 13);
  await wait('document.querySelector(".wiki-navigation").open===true');
  await key("Enter", "Enter", 13);
  await wait('document.querySelector(".wiki-navigation").open===false');
  console.log("PASS Wiki icon, grouped/active navigation, breadcrumbs, next links, heading anchors, keyboard disclosure/focus, both themes and 1280/768/390/320px");
  await navigate("wiki/search/?q=coordinates");
  await wait('document.querySelectorAll("#wiki-search-results li").length>0');
  assert.equal(await evaluate('[...document.querySelectorAll("#wiki-search-results a")].every(a=>a.pathname.includes("/wiki/"))'), true);
  await evaluate('document.querySelector("#wiki-query").value="clustering";document.querySelector("#wiki-search").requestSubmit()');
  await wait('document.querySelector("#wiki-search-results").getAttribute("aria-busy")!=="true"');
  assert.equal(await evaluate('new URL(location.href).searchParams.get("q")'), "clustering");
  await evaluate('history.back()'); await wait('document.querySelector("#wiki-query").value==="coordinates"');
  await evaluate('history.forward()'); await wait('document.querySelector("#wiki-query").value==="clustering"');
  await evaluate('document.querySelector("#wiki-query").value="zznomatchxyz";document.querySelector("#wiki-search").requestSubmit()');
  await wait('document.querySelector("#wiki-search-status").textContent.startsWith("No documentation")');
  // A newer blank query must defeat an older in-flight search.
  await evaluate('document.querySelector("#wiki-query").value="Atlas";document.querySelector("#wiki-search").requestSubmit();document.querySelector("#wiki-query").value="";document.querySelector("#wiki-search").requestSubmit()');
  await new Promise((resolve) => setTimeout(resolve, 300));
  assert.equal(await evaluate('document.querySelectorAll("#wiki-search-results li").length'), 0);
  assert.equal(await evaluate('performance.getEntriesByType("resource").some(r=>/maplibre|openfreemap/.test(r.name))'), false);
  console.log("PASS real Pagefind Wiki results, URL/history, empty/race states and no map resources on documentation");
  await send("Emulation.setScriptExecutionDisabled", { value: true });
  await navigate("wiki/publishing/");
  assert.equal(await evaluate('document.querySelectorAll(".wiki-prose a").length>5'), true);
  assert.equal(await evaluate('document.querySelector(".wiki-navigation").open'), true);
  await evaluate('document.querySelector(".wiki-navigation summary").focus()');
  await key("Enter", "Enter", 13);
  await wait('document.querySelector(".wiki-navigation").open===false');
  await send("Emulation.setScriptExecutionDisabled", { value: false });
  console.log("PASS documentation and mobile native navigation without JavaScript");
  // Inspect the shared index directly: Wiki data must never be returned to Posts search.
  await navigate("wiki/search/");
  const counts = await evaluate(`(async()=>{const p=await import(${JSON.stringify(base + "pagefind/pagefind.js")});const w=await p.search('coordinates',{filters:{kind:'Wiki'}});const a=await p.search('coordinates',{filters:{kind:'Post'}});return {wiki:w.results.length,posts:a.results.length}})()`);
  assert(counts.wiki>0);
  await navigate("posts/?q=coordinates&type=ride&place=test-place-a&trip=test-trip-order");
  await wait('document.querySelector(".posts-results")?.getAttribute("aria-busy")==="false"');
  assert.equal(await evaluate('document.querySelector("#search-error").hidden'), true);
  assert.equal(await evaluate('document.querySelector("#result-count").textContent'), "0 posts");
  await navigate("gallery/");
  await evaluate('document.querySelector("[data-lightbox]").click()');
  assert.equal(await evaluate('document.querySelector("#gallery-lightbox").open'), true);
  await key("Escape", "Escape", 27);
  assert.equal(await evaluate('document.querySelector("#gallery-lightbox").open'), false);
  await navigate("");
  assert.equal(await evaluate('!!document.querySelector(".home-slideshow, .hero-fallback")'), true);
  assert.equal(await evaluate('!![...document.querySelectorAll(".site-nav a")].find(a=>a.getAttribute("aria-label")==="Wiki / Documentation")'), true);
  await navigate("atlas/?trip=test-trip-order");
  await wait('document.querySelector("#atlas")?.dataset.ready==="true" && document.querySelector("#atlas-details h2")?.textContent==="CMS Ordering Test"');
  assert.equal(await evaluate('document.querySelectorAll("#atlas-details ol li").length'), 3);
  assert.deepEqual(errors, []);
  console.log("PASS typed index isolation, empty Posts/filter search, Gallery lightbox/Escape, Home and Atlas Trip regression; no browser exceptions");
} finally { await send("Emulation.setScriptExecutionDisabled", { value: false }); ws.close(); }
