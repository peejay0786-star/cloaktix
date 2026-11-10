// Drives headless Chrome (CDP) through the CloakTix demo: full flow + screenshots. Local devnet only.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import WebSocket from 'ws';
const URL0 = 'http://127.0.0.1:5180/';
const OUT = new URL('../screenshots/', import.meta.url).pathname;
const chrome = spawn('google-chrome', ['--headless=new', '--remote-debugging-port=9344', '--user-data-dir=/tmp/cloaktix-demo-chrome', '--no-first-run', '--window-size=1440,1000', '--hide-scrollbars', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let t; for (let i = 0; i < 40 && !t; i++) { await sleep(500); try { t = (await (await fetch('http://127.0.0.1:9344/json/list')).json()).find((x) => x.type === 'page'); } catch {} }
const ws = new WebSocket(t.webSocketDebuggerUrl, { maxPayload: 1 << 30 }); await new Promise((r) => ws.once('open', r));
let id = 0; const pend = new Map();
ws.on('message', (m) => { const j = JSON.parse(String(m));
  if (j.id && pend.has(j.id)) { const p = pend.get(j.id); pend.delete(j.id); j.error ? p.rej(new Error(j.error.message)) : p.res(j.result); }
  else if (j.method === 'Runtime.consoleAPICalled') { const s = j.params.args.map((a) => a.value ?? a.description ?? '').join(' '); if (/zk|\[t\]|error|Error/i.test(s)) console.log('[page]', new Date().toISOString().slice(11, 19), s.slice(0, 300)); }
  else if (j.method === 'Runtime.exceptionThrown') console.log('[page-exc]', JSON.stringify(j.params.exceptionDetails).slice(0, 400)); });
const send = (method, params = {}) => { const i = ++id; ws.send(JSON.stringify({ id: i, method, params })); return new Promise((res, rej) => pend.set(i, { res, rej })); };
const ev = async (e) => { const r = await send('Runtime.evaluate', { expression: e, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text); return r.result.value; };
await send('Runtime.enable'); await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
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

const step = process.argv[2] ?? 'all';
const verdict = () => ev('document.querySelector(".verdict")?.innerText');
const verify = async (code, accept, name) => {
  await fill('Accepted ticket type', accept); await sleep(300);
  await fillSel('.gate input', code); await click('Verify', '.gate button'); 
  for (let i = 0; i < 30; i++) { await sleep(500); if (await ev('!!document.querySelector(".verdict")')) break; }
  await shot(name, false); const v = await verdict(); console.log('VERDICT', name, '=>', JSON.stringify(v)); return v;
};
await go(URL0 + '?fresh'); if (step === 'all') { await ev('localStorage.clear()'); await go(URL0); }
await shot('01-home', false);
await click('Connect wallet'); await sleep(800); await shot('02-wallet-picker', false);

// Organizer (Alice): deploy with the 3% fee to DAVE, one event, three ticket types
await connect('Alice');
await tab('Organizer');
const dave = (await (await fetch('http://127.0.0.1:8797/devwallet/DAVE/getUnshieldedAddress', { method: 'POST' })).json()).ok.unshieldedAddress;
if (await ev('[...document.querySelectorAll("button")].some((b) => b.textContent === "Deploy")')) {
  await fill('Fee address', dave); await shot('03-deploy', false);
  await click('Deploy'); await idle('deploy', 400);
}
await sleep(3000);
await click('Create event'); await idle('createEvent');
await sleep(4000);
console.log('FEEBOX GA', await ev('document.querySelector(".feebox").innerText'));
await click('Add ticket type'); await idle('addTicketType GA');
await sleep(4000);
// Resale policy per ticket type: GA capped at 12 (default), VIP no resale, Open floor unlimited
await fill('Ticket name', 'VIP'); await fill('Price (tNIGHT)', '50'); await fill('Quantity', '20'); await fill('Resale', '2'); await sleep(300);
await shot('04a-ticket-type-no-resale', false);
await click('Add ticket type'); await idle('addTicketType VIP (no resale)');
await sleep(4000);
await fill('Ticket name', 'Open floor'); await fill('Price (tNIGHT)', '20'); await fill('Quantity', '10'); await fill('Resale', '1'); await sleep(300);
await click('Add ticket type'); await idle('addTicketType Open floor (unlimited)');
await sleep(4000);
// 18+ (age-restricted) type
await fill('Ticket name', 'After-party (18+)'); await fill('Price (tNIGHT)', '15'); await fill('Quantity', '50'); await fill('Resale', '0'); await sleep(300);
await ev(`(() => { const i = [...document.querySelectorAll('label.check input')][0]; if (!i.checked) i.click(); return true; })()`); await sleep(400);
console.log('AGE NOTE (organizer)', await ev(`document.querySelector('.note')?.textContent`));
await shot('04b-ticket-type-18plus', false);
await click('Add ticket type'); await idle('addTicketType After-party (18+)');
await sleep(6000); await shot('04-organizer');

// Fan (Charlie): buys 2 GA, checks in one (single-use pass), resells the other
await connect('Charlie');
await tab('Events'); await sleep(4000); await shot('05-events');
const buyGA = () => ev(`(() => { const r = [...document.querySelectorAll('.ttype')].find((x) => x.textContent.includes('General admission')); r.querySelector('button').click(); return true; })()`);
await buyGA(); await idle('buyTicket GA #1');
await buyGA(); await idle('buyTicket GA #2 (non-18+, no credential needed)');
// 18+ checkout: no credential refused, minor refused, adult admitted
const buyRow = (name) => ev(`(() => { const r = [...document.querySelectorAll('.ttype')].find((x) => x.textContent.includes(${JSON.stringify(name)})); r.querySelector('button').click(); return true; })()`);
console.log('AGE NOTE (checkout)', await ev(`document.querySelector('.agecheck .note')?.textContent`));
await buyRow('After-party'); await idle('buyTicket 18+ without credential', 300, /Age credential required/); await shot('11a-18plus-no-credential', false);
await fill('Birthdate', '2012-06-01'); await click('Get age credential'); await idle('credential (minor)');
await buyRow('After-party'); await idle('buyTicket 18+ as a minor', 300, /Under 18/); await shot('11b-18plus-minor-refused', false);
await fill('Birthdate', '1990-04-12'); await click('Get age credential'); await idle('credential (adult)');
await buyRow('After-party'); await idle('buyTicket 18+ as an adult'); await sleep(4000); await shot('11c-18plus-adult-ok', false);
await tab('My tickets'); await sleep(2000);
await click('Check in'); await idle('checkIn (Charlie)');
await sleep(1500); await shot('06-entry-pass-qr');
const code = await ev('document.querySelector(".passcard .code").textContent');
console.log('PASS', code);
await tab('Gate'); await sleep(2000);
await verify('hello', 'e:1', '07a-gate-not-a-pass');
await verify(code, 't:2', '07b-gate-wrong-type-refused');
await verify(code, 't:1', '07c-gate-admitted');
await verify(code, 'e:1', '07d-gate-replay-refused');
await click('Scan with camera', '.gate button'); await sleep(500);
console.log('CAMERA', await ev('document.querySelector(".gate .warn")?.textContent ?? "scanner opened"'));
await tab('My tickets'); await sleep(1500);
await fillSel('.ticket .row input', '13'); await sleep(500); await shot('08-resale-above-cap');
console.log('Resell button disabled above the cap =', await ev(`[...document.querySelectorAll('.ticket button')].find((b) => b.textContent === 'Resell').disabled`));
await fillSel('.ticket .row input', '12'); await sleep(300);
console.log('RESALE NOTE', await ev(`document.querySelector('.ticket .row + p').textContent`));
await click('Resell'); await idle('listForResale');

// Resale buyer (Bob)
await connect('Bob');
await tab('Events'); await sleep(4000); await shot('09-resale-listing');
await ev(`(() => { const b = [...document.querySelectorAll('.listing button')].find((x) => x.textContent.startsWith('Buy')); b.click(); })()`); await idle('buyResale');
await tab('My tickets'); await sleep(2000); await click('Check in'); await idle('checkIn (Bob)');
await sleep(1500);
const code2 = await ev('document.querySelector(".passcard .code").textContent');
await tab('Gate'); await sleep(2000);
await verify(code2, 'e:1', '10-gate-resale-admitted');
console.log('BUSY TIMES', TIMES.join(' · '));
console.log('ACTIVITY', await ev('document.querySelector(".activity")?.innerText'));
ws.close(); chrome.kill(); process.exit(0);
