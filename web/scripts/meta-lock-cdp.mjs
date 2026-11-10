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
await go(B + '/'); await ev('localStorage.clear()');
await login(`/organizer?contract=${C}`, 'Alice');
await fill('Name', 'Locked meta — Lévis'); await fill('Date', '2026-12-12'); await fill('Venue', 'Centre des congrès');
await click('Create event'); await idle('createEvent+registerKey', 400); await sleep(3000);
await fill('Ticket name', 'VIP'); await click('Add ticket type'); await idle('addTicketType'); await sleep(4000);
let M = await (await fetch(`${B}/meta?c=${C}`)).json(); console.log('server meta', JSON.stringify(M));
const evId = Math.max(...Object.keys(M.ev).filter((k) => M.ev[k].name.startsWith('Locked')).map(Number));
// Organizer update via Edit details
await ev(`(() => { const c = [...document.querySelectorAll('.myev')].find((x) => x.querySelector('h3').textContent.includes('#${evId} ')); [...c.querySelectorAll('button')].find((b) => b.textContent === 'Edit details').click(); return true; })()`); await sleep(500);
await ev(`(() => { const i = [...document.querySelectorAll('.editdet label')].find((l) => l.textContent.startsWith('Venue')).querySelector('input'); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(i, 'Salle Albert-Rousseau (updated)'); i.dispatchEvent(new Event('input', { bubbles: true })); [...document.querySelectorAll('.editdet button')].find((b) => b.textContent === 'Save').click(); return true; })()`);
await idle('edit details', 120); await sleep(2000);
M = await (await fetch(`${B}/meta?c=${C}`)).json(); console.log('after update', JSON.stringify(M.ev[evId]), 'keys', M.keys);
console.log('org my events (key event hidden?)', await ev('[...document.querySelectorAll(".myev h3")].map((h) => h.textContent).join(" | ")'));
// Another identity: valid Ed25519 signature but key not bound on-chain to the organizer -> rejected
const crypto = await import('node:crypto'); const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
const pk = publicKey.export({ format: 'der', type: 'spki' }).subarray(12).toString('hex');
const post = async (kind, id, v, priv = privateKey, pkh = pk, ts = Date.now()) => { const msg = `cloaktix:meta:v1|${C}|${kind}|${id}|${ts}|${JSON.stringify(v)}`;
  const sig = crypto.sign(null, Buffer.from(msg), priv).toString('hex'); const r = await fetch(`${B}/meta`, { method: 'POST', body: JSON.stringify({ c: C, kind, id: String(id), v, pk: pkh, ts, sig }) }); return r.status + ' ' + await r.text(); };
console.log('attacker on Alice event:', await post('ev', evId, { name: 'HACKED' }));
console.log('attacker on new id 999:', await post('ev', 999, { name: 'HACKED' }));
console.log('attacker claims Alice pk, own sig:', await post('ev', evId, { name: 'HACKED' }, privateKey, M.keys.length ? 'x' : pk));
// Bob in the browser: real wallet identity, own derived key, tries to edit Alice's event
await ev('localStorage.clear()'); await login(`/organizer?contract=${C}`, 'Bob'); await sleep(2000);
console.log('Bob sees Alice event in My events:', await ev(`[...document.querySelectorAll('.myev h3')].some((h) => h.textContent.includes('#${evId} '))`));
// Fresh public visitor
await ev('localStorage.clear()'); await login(`/?contract=${C}`, 'Charlie'); await sleep(3000);
console.log('home (fresh):', await ev('[...document.querySelectorAll(".card.event")].map((c) => c.querySelector("h3").textContent + " / " + c.querySelector(".muted").textContent).join(" ; ")'));
await ev('[...document.querySelectorAll(".card.event")].pop()?.scrollIntoView({block:"center"})'); await shot('o5-home-signed-meta', false);
ws.close(); chrome.kill(); process.exit(0);
