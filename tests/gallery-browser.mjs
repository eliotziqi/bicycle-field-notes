// Run against a populated production preview; never writes content.
import assert from "node:assert/strict";
import fs from "node:fs";
const base = process.argv[2] ?? "http://127.0.0.1:4450/bicycle-field-notes/";
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
const shots = process.env.SCREENSHOT_DIR;
if (shots) fs.mkdirSync(shots, { recursive: true });
const nav = async (url) => {await send("Page.navigate", {url});await wait(`location.href===${JSON.stringify(url)} && document.readyState==='complete' && !!document.querySelector('#gallery-lightbox')`)};
const snapshot = () => ev(`({url:location.href,scroll:scrollY,open:document.querySelector('dialog').open,title:document.querySelector('#lightbox-title').textContent,status:document.querySelector('#lightbox-status').textContent,filters:[...document.querySelectorAll('[name=category]')].filter(x=>x.checked).map(x=>x.value)})`);
try {
 await send("Page.enable");await send("Runtime.enable");await send("Page.bringToFront");
 for(const width of [1280,390]) {
  await send("Emulation.setDeviceMetricsOverride",{width,height:1000,deviceScaleFactor:1,mobile:width===390});
  await nav(base+"gallery/");
  await ev(`(()=>{const name=JSON.parse(document.querySelector('.gallery-card').dataset.categories)[0];[...document.querySelectorAll('[name=category]')].find(x=>x.value===name).click()})();document.querySelector('.gallery-card:not([hidden]) [data-lightbox]').click();document.querySelector('#lightbox-original').scrollIntoView({block:'center'})`);
  const before=await snapshot();
  const link=await ev(`(()=>{const a=document.querySelector('#lightbox-original');return {href:a.href,target:a.target,rel:a.rel,text:a.textContent}})()`);
  assert.equal(link.target,"_blank");assert.equal(link.rel,"noopener noreferrer");assert.equal(link.text,"Open original in new tab");
  const prior=(await send('Target.getTargets')).targetInfos.map(x=>x.targetId);
  await send('Runtime.evaluate',{expression:`document.querySelector('#lightbox-original').click()`,userGesture:true});
  let popup;
  for(let i=0;i<100;i++){popup=(await send('Target.getTargets')).targetInfos.find(x=>!prior.includes(x.targetId)&&x.type==='page'&&x.url===link.href);if(popup)break;await new Promise(r=>setTimeout(r,50));}
  assert(popup,'Original opened a separate image tab');
  const tabs=await(await fetch(`http://127.0.0.1:${port}/json`)).json();const target=tabs.find(x=>x.id===popup.targetId);assert(target);
  const child=new WebSocket(target.webSocketDebuggerUrl);await new Promise(r=>child.addEventListener('open',r,{once:true}));
  const childResult=new Promise(r=>child.addEventListener('message',e=>r(JSON.parse(e.data)),{once:true}));child.send(JSON.stringify({id:1,method:'Runtime.evaluate',params:{expression:'window.opener===null',returnByValue:true}}));assert.equal((await childResult).result.result.value,true);child.close();
  assert.deepEqual(await snapshot(),before,'Gallery URL/filter/photo/scroll/dialog retained');
  await send('Target.closeTarget',{targetId:popup.targetId});await send('Page.bringToFront');
  if(shots)fs.writeFileSync(`${shots}/gallery-original-${width}.png`,Buffer.from((await send('Page.captureScreenshot',{format:'png'})).data,'base64'));
  await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape'});await wait("!document.querySelector('dialog').open");
  await wait("document.activeElement.hasAttribute('data-lightbox')");
  await ev("document.querySelector('#clear-gallery').click();document.querySelector('[data-lightbox]').click()");
  const title=await ev("document.querySelector('#lightbox-title').textContent");
  await send('Input.dispatchKeyEvent',{type:'keyDown',key:'ArrowRight',code:'ArrowRight'});
  assert.notEqual(await ev("document.querySelector('#lightbox-title').textContent"),title);
  await send('Input.dispatchKeyEvent',{type:'keyDown',key:'ArrowLeft',code:'ArrowLeft'});
  assert.equal(await ev("document.querySelector('#lightbox-title').textContent"),title);
  await ev("document.querySelector('.lightbox-close').click()");await wait("document.activeElement.hasAttribute('data-lightbox')");
 }
 console.log('PASS desktop/mobile: separate original-image tab, null opener, retained photo/filter/scroll/dialog, close/Escape/arrows/focus return');
}finally{ws.close()}
