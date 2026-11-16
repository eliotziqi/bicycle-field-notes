// Production preview + optional isolated populated fixture; never writes content.
import assert from "node:assert/strict";
import fs from "node:fs";
const base = process.argv[2] ?? "http://127.0.0.1:4450/bicycle-field-notes/";
const fixture = process.argv[3];
const port = process.env.CHROME_PORT ?? "9222";
const tabs = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
const ws = new WebSocket(tabs.find((tab) => tab.type === "page").webSocketDebuggerUrl);
await new Promise((resolve) => ws.addEventListener("open", resolve, { once: true }));
let id = 0;
const pending = new Map();
ws.addEventListener("message", (event) => { const m = JSON.parse(event.data); if (m.id) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.reject(m.error) : p.resolve(m.result); } });
const send = (method, params = {}) => new Promise((resolve, reject) => { pending.set(++id, { resolve, reject }); ws.send(JSON.stringify({ id, method, params })); });
const ev = async (expression) => { const r = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw Error(JSON.stringify(r.exceptionDetails)); return r.result.value; };
const wait = async (expression) => { for (let i = 0; i < 100; i++) { if (await ev(expression)) return; await new Promise((r) => setTimeout(r, 100)); } throw Error(`Timeout ${expression}`); };
const nav = async (url) => { await send("Page.navigate", { url }); await wait(`location.href===${JSON.stringify(url)} && document.readyState==='complete' && !!document.querySelector('.posts-results[data-view]')`); };
const visible = () => ev("[...document.querySelectorAll('[data-post-info]:not([hidden])')].map(x=>JSON.parse(x.dataset.postInfo).id)");
const shots = process.env.SCREENSHOT_DIR;
if (shots) fs.mkdirSync(shots, { recursive: true });
try {
  await send("Page.enable"); await send("Page.bringToFront"); await send("Runtime.enable"); await send("Network.enable");
  await nav(base + "posts/"); await ev("localStorage.removeItem('bfn-posts-view')"); await nav(base + "posts/");
  assert.equal(await ev("document.querySelector('.posts-results').dataset.view"), "cards");
  const initial = await visible();
  await ev("document.querySelector('[data-post-view=list]').click()");
  assert.deepEqual(await visible(), initial);
  assert.equal(await ev("document.querySelectorAll('.post-cover img').length"), 0);
  await nav(base + "posts/");
  assert.equal(await ev("document.querySelector('.posts-results').dataset.view"), "list");
  assert.equal(await ev("performance.getEntriesByType('resource').some(x=>/\\.(webp|jpe?g)/.test(x.name))"), false);
  await ev("document.querySelector('[data-post-view=cards]').focus()");
  await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13 });
  await send("Input.dispatchKeyEvent", { type: "char", text: "\r", key: "Enter", windowsVirtualKeyCode: 13 });
  await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Enter", code: "Enter", windowsVirtualKeyCode: 13 });
  await wait("document.querySelector('.posts-results').dataset.view==='cards'");
  for (const target of [base, ...(fixture ? [fixture] : [])]) {
    await nav(target + "posts/");
    for (const width of [1280, 768, 390, 320]) for (const theme of ["light", "dark"]) for (const view of ["list", "cards"]) {
      await send("Emulation.setDeviceMetricsOverride", { width, height: 1000, deviceScaleFactor: 1, mobile: false });
      await ev(`document.documentElement.dataset.theme='${theme}';document.querySelector('[data-post-view=${view}]').click()`);
      assert.equal(await ev("document.documentElement.scrollWidth<=innerWidth"), true);
      if (view === "cards") {
        const ratios = await ev("[...document.querySelectorAll('[data-post-info]:not([hidden]) .post-cover')].map(x=>x.getBoundingClientRect().width/x.getBoundingClientRect().height)");
        ratios.forEach((ratio) => assert(Math.abs(ratio - (width <= 576 ? 1.6 : 2.4)) < .02));
      }
      if (shots && [1280, 390].includes(width)) {
        await ev("Promise.all([...document.querySelectorAll('.post-cover img')].map(x=>x.decode().catch(()=>{})))");
        await ev("scrollTo(0,0)");
        fs.writeFileSync(`${shots}/${target===base?'actual':'fixture'}-${view}-${width}-${theme}.png`, Buffer.from((await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true })).data, "base64"));
      }
    }
    await ev("document.querySelector('#post-advanced').open=true;document.querySelector('input[name=places]').click()");
    const url = await ev("location.href"); const filtered = await visible();
    await ev("document.querySelector('[data-post-view=list]').click()");
    assert.equal(await ev("location.href"), url); assert.deepEqual(await visible(), filtered);
    await ev("document.querySelector('#post-sort').value='experience-asc';document.querySelector('#post-sort').dispatchEvent(new Event('change'))");
    const ordered = await visible();
    await ev("document.querySelector('[data-post-view=cards]').click()"); assert.deepEqual(await visible(), ordered);
    await ev("history.back()"); await wait("document.querySelector('#post-sort').value==='published-desc'");
    await ev("history.forward()"); await wait("document.querySelector('#post-sort').value==='experience-asc'");
    await ev("document.querySelector('#post-query').value='cycling';document.querySelector('#post-query').dispatchEvent(new Event('input',{bubbles:true}))");
    await wait("document.querySelector('.posts-results').getAttribute('aria-busy')==='false'");
    const searched = await visible(); assert(searched.length);
    await ev("document.querySelector('[data-post-view=list]').click()"); assert.deepEqual(await visible(), searched);
    assert.equal(await ev("performance.getEntriesByType('resource').some(x=>/maplibre|openfreemap|artalk/.test(x.name))"), false);
  }
  if (fixture) {
    await nav(fixture + "posts/"); await ev("document.querySelector('[data-post-view=cards]').click()");
    assert(await ev("document.querySelectorAll('.post-cover img').length>0"));
    await ev("document.querySelector('.post-cover img').dispatchEvent(new Event('error'))");
    assert(await ev("[...document.querySelectorAll('.post-cover-fallback')].some(x=>x.textContent==='Cover unavailable')"));
    await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
    assert.equal(await ev("getComputedStyle(document.querySelector('.post-cover img')).transitionDuration"), "0s");
    await ev("document.querySelector('[data-post-info] a').focus()");
    if (shots) fs.writeFileSync(`${shots}/fixture-keyboard-focus.png`, Buffer.from((await send("Page.captureScreenshot", { format: "png" })).data, "base64"));
  }
  await nav(base + "posts/");
  await ev("for(const q of ['missingword123','cycling']){const x=document.querySelector('#post-query');x.value=q;x.dispatchEvent(new Event('input',{bubbles:true}))}");
  await wait("document.querySelector('.posts-results').getAttribute('aria-busy')==='false' && document.querySelector('#result-count').textContent==='1 post'");
  assert.equal(await ev("document.querySelectorAll('[data-post-info]').length"), initial.length);
  const blocked = await send("Page.addScriptToEvaluateOnNewDocument", { source: "Storage.prototype.getItem=function(){throw Error('blocked')};Storage.prototype.setItem=function(){throw Error('blocked')}" });
  await nav(base + "posts/");
  assert.equal(await ev("document.querySelector('.posts-results').dataset.view"), "cards");
  await ev("document.querySelector('[data-post-view=list]').click()");
  assert.equal(await ev("document.querySelector('.posts-results').dataset.view"), "list");
  await send("Page.removeScriptToEvaluateOnNewDocument", { identifier: blocked.identifier });
  await send("Emulation.setScriptExecutionDisabled", { value: true });
  await send("Page.navigate", { url: base + "posts/" });
  await wait("document.readyState==='complete' && !!document.querySelector('#post-results-list')");
  assert.equal(await ev("document.querySelectorAll('.post-cover img').length"), 0);
  assert.equal(await ev("getComputedStyle(document.querySelector('.post-view-switch')).display"), "none");
  await send("Emulation.setScriptExecutionDisabled", { value: false });
  console.log("PASS rapid query races, blocked storage and no-JS List fallback");
  console.log("PASS Cards default, persisted List, keyboard toggle, shared results/search/filter/sort/history, lazy image isolation, ratios, themes, widths, error fallback and reduced motion");
} finally { ws.close(); }
