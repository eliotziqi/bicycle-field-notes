// Production preview + headless Chrome endpoint. Optional second argument tests isolated range fixtures.
import assert from "node:assert/strict";
import fs from "node:fs";
const base = process.argv[2] ?? "http://127.0.0.1:4321/bicycle-field-notes/";
const fixtureBase = process.argv[3];
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
const wait = async (expression) => { for (let i = 0; i < 150; i++) { if (await evaluate(expression)) return; await new Promise((resolve) => setTimeout(resolve, 100)); } throw Error(`Timeout: ${expression}`); };
async function navigate(url) { await send("Page.navigate", { url }); await wait(`location.href === ${JSON.stringify(url)} && document.readyState === 'complete'`); }
try {
  await send("Page.enable"); await send("Runtime.enable"); await send("Network.enable"); await send("Network.setCacheDisabled", { cacheDisabled: true });
  await navigate(base + "posts/a-first-ride-testing-bicycle-field-notes/");
  assert.match(await evaluate('document.querySelector(".article-metadata").textContent'), /Published: Nov 2026.*Updated: Nov 2026.*Experience: Nov–Dec 2026/s);
  assert.equal(await evaluate('document.querySelectorAll(".post-geography a").length'), 3);
  assert.equal(await evaluate('document.querySelector(".post-geography").textContent.includes("Focus")'), false);
  assert.equal(await evaluate('document.querySelector(".post-geography").textContent.includes("Experience")'), false);
  assert.equal(await evaluate('[...document.querySelectorAll(".post-geography a")].every(a=>a.pathname==="/bicycle-field-notes/atlas/" && !a.search.includes("focus"))'), true);
  for (const theme of ["light", "dark"]) {
    await evaluate(`document.documentElement.dataset.theme=${JSON.stringify(theme)}`);
    for (const width of [1280, 768, 390, 320]) {
      await send("Emulation.setDeviceMetricsOverride", { width, height: 1000, deviceScaleFactor: 1, mobile: false });
      assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'), true, `${theme}/${width}`);
      if (width === 390 || width === 1280) fs.writeFileSync(`/tmp/bfn-months-${theme}-${width}.png`, Buffer.from((await send("Page.captureScreenshot", { format: "png" })).data, "base64"));
    }
  }
  assert.equal(await evaluate('performance.getEntriesByType("resource").some(r=>/maplibre|openfreemap/.test(r.name))'), false);
  await send("Emulation.setScriptExecutionDisabled", { value: true });
  await navigate(base + "posts/a-first-ride-testing-bicycle-field-notes/");
  assert.equal(await evaluate('document.querySelectorAll(".post-geography a").length'), 3);
  await send("Emulation.setScriptExecutionDisabled", { value: false });
  console.log("PASS month metadata and deduplicated Atlas footer; both themes, 1280/768/390/320px, no-JS reading, no map assets");
  await navigate(base + "posts/?q=cycling&type=ride&place=test-place-a&trip=test-trip-order");
  await wait('document.querySelector("#result-count").textContent==="1 post" && document.querySelector(".posts-results").getAttribute("aria-busy")==="false"');
  assert.equal(await evaluate('document.querySelectorAll("input[name=types]").length'), 0);
  assert.equal(await evaluate('document.querySelector("#search-error").hidden'), true);
  await evaluate('document.querySelector("#post-sort").value="experience-desc";document.querySelector("#post-sort").dispatchEvent(new Event("change",{bubbles:true}))');
  await wait('document.querySelector("[data-post-tags] time").textContent==="Nov 2026"');
  await evaluate('history.back()'); await wait('document.querySelector("#post-sort").value==="published-desc"');
  await evaluate('history.forward()'); await wait('document.querySelector("#post-sort").value==="experience-desc"');
  await evaluate('document.querySelector("#post-query").value="zznomatchxyz";document.querySelector("#post-query").dispatchEvent(new Event("input",{bubbles:true}))');
  await wait('document.querySelector("#result-count").textContent==="0 posts"');
  await evaluate('document.querySelector("#clear-filters").click()');
  await wait('document.querySelector("#result-count").textContent==="1 post"');
  assert.equal((await fetch(base + "rss.xml")).status, 404);
  assert.equal((await fetch(base + "posts/beyond-the-route/")).status, 404);
  console.log("PASS Pagefind/Place/Trip search, removed type filter, month sorting, history, clear/empty results, RSS 404 and draft exclusion");
  if (fixtureBase) {
    await navigate(fixtureBase + "posts/metadata-fixture/");
    assert.match(await evaluate('document.querySelector(".article-metadata").textContent'), /Jun 2025, Aug–Sep 2025, May 2026, Dec 2025 – Feb 2026/);
    assert.equal(await evaluate('document.querySelectorAll(".post-geography a").length'), 3);
    await send("Emulation.setDeviceMetricsOverride", { width: 320, height: 1000, deviceScaleFactor: 1, mobile: false });
    assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'), true);
    await navigate(fixtureBase + "posts/empty-metadata-fixture/");
    assert.equal(await evaluate('document.querySelectorAll(".post-geography, .metadata-experience").length'), 0);
    assert.equal(await evaluate('document.querySelector(".article-metadata").textContent.includes("Updated:")'), false);
    console.log("PASS isolated multiple ordered month ranges, same/cross-year display, narrow wrapping and empty metadata/footer");
  }
  assert.deepEqual(errors, []);
} finally { await send("Emulation.setScriptExecutionDisabled", { value: false }); ws.close(); }
