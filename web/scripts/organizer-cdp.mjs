// Drives headless Chrome (CDP) through the CloakTix demo: full flow + screenshots. Local devnet only.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import WebSocket from 'ws';
const URL0 = 'http://127.0.0.1:5180/';
const OUT = new URL('../screenshots/organizer/', import.meta.url).pathname;
const chrome = spawn('google-chrome', ['--headless=new', '--remote-debugging-port=9345', '--user-data-dir=/tmp/cloaktix-org-chrome', '--no-first-run', '--window-size=390,844', '--hide-scrollbars', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let t; for (let i = 0; i < 40 && !t; i++) { await sleep(500); try { t = (await (await fetch('http://127.0.0.1:9345/json/list')).json()).find((x) => x.type === 'page'); } catch {} }
const ws = new WebSocket(t.webSocketDebuggerUrl, { maxPayload: 1 << 30 }); await new Promise((r) => ws.once('open', r));
let id = 0; const pend = new Map();
ws.on('message', (m) => { const j = JSON.parse(String(m));
  if (j.id && pend.has(j.id)) { const p = pend.get(j.id); pend.delete(j.id); j.error ? p.rej(new Error(j.error.message)) : p.res(j.result); }
  else if (j.method === 'Runtime.consoleAPICalled') { const s = j.params.args.map((a) => a.value ?? a.description ?? '').join(' '); if (/zk|\[t\]|error|Error/i.test(s)) console.log('[page]', new Date().toISOString().slice(11, 19), s.slice(0, 300)); }
  else if (j.method === 'Runtime.exceptionThrown') console.log('[page-exc]', JSON.stringify(j.params.exceptionDetails).slice(0, 400)); });
const send = (method, params = {}) => { const i = ++id; ws.send(JSON.stringify({ id: i, method, params })); return new Promise((res, rej) => pend.set(i, { res, rej })); };
const ev = async (e) => { const r = await send('Runtime.evaluate', { expression: e, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text); return r.result.value; };
await send('Runtime.enable'); await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
const shot = async (name, full = true) => {
  await sleep(600);
  const r = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: full });
  fs.writeFileSync(OUT + name + '.png', Buffer.from(r.data, 'base64')); console.log('CAPTURE', OUT + name + '.png');
};
const go = async (u) => { await send('Page.navigate', { url: u }); await sleep(2500); for (let i = 0; i < 60; i++) { if (await ev('!!document.querySelector(".top")')) break; await sleep(500); } };
const click = (text, sel = 'button') => ev(`(() => { const b = [...document.querySelectorAll(${JSON.stringify(sel)})].find((x) => x.textContent.includes(${JSON.stringify(text)}) && !x.disabled); if (!b) throw new Error('button not found: ' + ${JSON.stringify(text)}); b.click(); return true; })()`);
const fill = (label, value) => ev(`(() => { const l = [...document.querySelectorAll('label')].find((x) => x.textContent.startsWith(${JSON.stringify(label)})); const i = l.querySelector('input,select');
  const proto = i.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(proto, 'value').set.call(i, ${JSON.stringify(value)});
  i.dispatchEvent(new Event(i.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true })); return true; })()`);
const fillSel = (sel, value) => ev(`(() => { const i = document.querySelector(${JSON.stringify(sel)}); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(i, ${JSON.stringify(value)}); i.dispatchEvent(new Event('input', { bubbles: true })); return true; })()`);
const idle = async (label, max = 300, expectErr = null) => { const t0 = Date.now(); await sleep(800);
  for (let i = 0; i < max; i++) { if (!(await ev('!!document.querySelector(".busy")'))) break; await sleep(1000); }
  const e = await ev('document.querySelector(".error")?.textContent ?? null'); const secs = ((Date.now() - t0) / 1000).toFixed(1); console.log(`${label}: ${e ? 'ERROR ' + e.slice(0, 300) : 'ok'} (busy cleared after ${secs} s)`); TIMES.push(`${label} ${secs}s`); if (expectErr) { if (!e || !expectErr.test(e)) throw new Error(label + ': expected refusal, got ' + e); return; } if (e) throw new Error(label + ': ' + e); };
const TIMES = [];
const connect = async (role) => { await go(URL0); await inject(true); await click('Connect wallet'); await sleep(500); await click(role, 'button.wallet'); await idle('connect ' + role, 120);
  for (let i = 0; i < 30; i++) { if (await ev('!!document.querySelector(".chip b") && !document.querySelector(".chip b").textContent.startsWith("…")')) break; await sleep(1000); } };
const tab = async (name) => { await click(name, 'nav button'); await sleep(1500); };


fs.mkdirSync(OUT, { recursive: true });
const C = '719bc71067962da41674c62b50fe72f18a2e88d660c2dc8ece60cbb22a54e9cb';
const B = 'http://127.0.0.1:5180';
const inject = (det) => ev(`(() => { for (const w of Object.values(window.midnight)) { const c = w.connect.bind(w); w.connect = async (n) => { const api = await c(n);
  api.signData = async (data) => { window.__signs = (window.__signs ?? 0) + 1; const salt = ${det} ? '' : String(Math.random());
    const d = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode('mock|' + w.name + '|' + data + salt)));
    return { data, signature: [...d].map((b) => b.toString(16).padStart(2, '0')).join(''), verifyingKey: 'mock' }; }; return api; }; } return true; })()`);
const login = async (path, role) => { await go(B + path); await inject(true); await click('Connect wallet'); await sleep(500); await click(role, 'button.wallet'); await idle('connect ' + role, 120); await sleep(6000); };
// Public home: no organizer controls
await go(B + '/'); await ev('localStorage.clear()'); await go(`${B}/?contract=${C}`);
await login(`/?contract=${C}`, 'Alice');
console.log('public nav', await ev('[...document.querySelectorAll("nav button")].map((b) => b.textContent).join(",")'),
  '| organizer controls on public:', await ev('[...document.querySelectorAll("button")].some((b) => /Create event|Add ticket type|Close sales|Deploy/.test(b.textContent))'));
await shot('o0-public-home', false);
// /organizer as Alice
await go(`${B}/organizer`); await sleep(1000); await shot('o1-organizer-login', false);
await inject(true); await click('Connect wallet'); await sleep(500); await click('Alice', 'button.wallet'); await idle('connect Alice', 120); await sleep(6000);
console.log('org nav', await ev('[...document.querySelectorAll("nav button")].map((b) => b.textContent).join(",")'));
await fill('Name', 'Organizer test 2 — Lévis'); await click('Create event'); await idle('createEvent'); await sleep(4000);
await click('Add ticket type'); await idle('addTicketType'); await sleep(8000);
const link = await ev('document.querySelector(".sharebox input")?.value'); console.log('SHARE', link?.slice(0, 80));
// Charlie buys via the link
await ev('localStorage.clear()'); await go(link); await sleep(1500); await inject(true); await click('Connect wallet to buy'); await sleep(500); await click('Charlie', 'button.wallet'); await idle('connect Charlie', 120); await sleep(5000);
await ev(`(() => { [...document.querySelectorAll('.ttype')].find((x) => x.textContent.includes('General admission')).querySelector('button').click(); return true; })()`); await idle('buyTicket'); await sleep(2000);
console.log('event page organizer controls:', await ev('[...document.querySelectorAll("button")].some((b) => /Create event|Add ticket type|Close sales/.test(b.textContent))'));
// Alice back: stats
await go(`${B}/organizer?contract=${C}`); await ev('void 0'); await inject(true); await click('Connect wallet'); await sleep(500); await click('Alice', 'button.wallet'); await idle('connect Alice', 120); await sleep(9000);
console.log('Alice my events', await ev('[...document.querySelectorAll(".myev h3")].length'), '| last stats:', await ev('[...document.querySelectorAll(".myev")].pop()?.innerText.replace(/\\n+/g, " ").slice(0, 300)'));
await ev('[...document.querySelectorAll(".myev")].pop()?.scrollIntoView()'); await shot('o2-organizer-stats', false);
// Bob on /organizer: none of Alice's events
await ev('localStorage.clear()'); await go(`${B}/organizer?contract=${C}`); await inject(true); await click('Connect wallet'); await sleep(500); await click('Bob', 'button.wallet'); await idle('connect Bob', 120); await sleep(8000);
console.log('Bob my events', await ev('document.querySelectorAll(".myev").length'), await ev('document.querySelector("main")?.innerText.includes("No events yet")'));
// Bob tries addTicketType on Alice's event 1 directly: contract must refuse
console.log('Bob events visible in ticket-type select:', await ev('document.querySelectorAll("select option").length'));
ws.close(); chrome.kill(); process.exit(0);
