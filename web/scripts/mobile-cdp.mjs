// Drives headless Chrome (CDP) through the CloakTix demo: full flow + screenshots. Local devnet only.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import WebSocket from 'ws';
const URL0 = 'http://127.0.0.1:5180/';
const OUT = new URL('../screenshots/mobile/', import.meta.url).pathname;
const chrome = spawn('google-chrome', ['--headless=new', '--remote-debugging-port=9345', '--user-data-dir=/tmp/cloaktix-mobile-chrome', '--no-first-run', '--window-size=390,844', '--hide-scrollbars', 'about:blank'], { stdio: 'ignore' });
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
const connect = async (role) => { await go(URL0); await click('Connect wallet'); await sleep(500); await click(role, 'button.wallet'); await idle('connect ' + role, 120);
  for (let i = 0; i < 30; i++) { if (await ev('!!document.querySelector(".chip b") && !document.querySelector(".chip b").textContent.startsWith("…")')) break; await sleep(1000); } };
const tab = async (name) => { await click(name, 'nav button'); await sleep(1500); };

fs.mkdirSync(OUT, { recursive: true });
// Phone-width flow: organizer creates an event + copies its share link; a buyer on a "fresh device" opens it, buys, shows the entry QR; gate verifies.
await go(URL0); await ev('localStorage.clear()');
await connect('Alice'); await tab('Organizer');
const dave = (await (await fetch('http://127.0.0.1:8797/devwallet/DAVE/getUnshieldedAddress', { method: 'POST' })).json()).ok.unshieldedAddress;
if (await ev('[...document.querySelectorAll("button")].some((b) => b.textContent === "Deploy")')) { await fill('Fee address', dave); await click('Deploy'); await idle('deploy', 400); await sleep(3000); }
await fill('Name', 'Neon Nights — Québec'); await fill('Venue', 'Le Cercle');
await click('Create event'); await idle('createEvent'); await sleep(4000);
await click('Add ticket type'); await idle('addTicketType GA'); await sleep(8000);
const link = await ev('document.querySelector(".sharebox input")?.value');
console.log('SHARE', link);
await shot('m0-organizer-share');
// Buyer on another device: nothing local, only the link
await ev('localStorage.clear()'); await go(link); await sleep(1500); await shot('m1-event-link', false);
await click('Connect wallet to buy'); await sleep(500); await click('Charlie', 'button.wallet'); await idle('connect Charlie', 120); await sleep(5000);
await ev(`(() => { const r = [...document.querySelectorAll('.ttype')].find((x) => x.textContent.includes('General admission')); r.querySelector('button').click(); return true; })()`);
await idle('buyTicket GA'); await sleep(1500); await shot('m2-event-bought', false);
await click('View my ticket'); await sleep(2000); await shot('m3-my-ticket', false);
await click('Show entry QR'); await sleep(600); await shot('m4-confirm', false);
await click('Yes, show my QR'); await sleep(1500); await shot('m5-preparing', false); await idle('checkIn'); await sleep(1500);
await shot('m6-fullscreen-qr', false);
const pass = await ev(`(() => { const p = JSON.parse(Object.entries(localStorage).find(([k]) => k.includes('passes:'))[1]); return p; })()`);
console.log('PASSES', JSON.stringify(pass).slice(0, 300));
await click('Done'); await sleep(800); await shot('m7-tickets-after', false);
console.log('BUSY TIMES', TIMES.join(' · '));
console.log('ACTIVITY', await ev('document.querySelector(".activity")?.innerText'));
ws.close(); chrome.kill(); process.exit(0);
