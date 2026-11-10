// Drives headless Chrome (CDP) through the CloakTix demo: full flow + screenshots. Local devnet only.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import WebSocket from 'ws';
const URL0 = 'http://127.0.0.1:5180/';
const OUT = new URL('../../video/shots/', import.meta.url).pathname;
const FR = new URL('../../video/frames/', import.meta.url).pathname;
fs.mkdirSync(FR, { recursive: true }); fs.mkdirSync(OUT, { recursive: true });
const MARKS = []; const mark = (label, kind = 'mark') => { MARKS.push({ t: Date.now() / 1000, kind, label }); fs.writeFileSync(FR + '../marks_b.json', JSON.stringify(MARKS, null, 1)); };
const chrome = spawn('google-chrome', ['--headless=new', '--remote-debugging-port=9344', '--user-data-dir=/tmp/cloaktix-demo-chrome', '--no-first-run', '--window-size=1280,720', '--lang=en-US', '--accept-lang=en-US', '--hide-scrollbars', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let t; for (let i = 0; i < 40 && !t; i++) { await sleep(500); try { t = (await (await fetch('http://127.0.0.1:9344/json/list')).json()).find((x) => x.type === 'page'); } catch {} }
const ws = new WebSocket(t.webSocketDebuggerUrl, { maxPayload: 1 << 30 }); await new Promise((r) => ws.once('open', r));
let id = 0; const pend = new Map();
ws.on('message', (m) => { const j = JSON.parse(String(m));
  if (j.id && pend.has(j.id)) { const p = pend.get(j.id); pend.delete(j.id); j.error ? p.rej(new Error(j.error.message)) : p.res(j.result); }
  else if (j.method === 'Runtime.consoleAPICalled') { const s = j.params.args.map((a) => a.value ?? a.description ?? '').join(' '); if (/zk|\[t\]|error|Error/i.test(s)) console.log('[page]', new Date().toISOString().slice(11, 19), s.slice(0, 300)); }
  else if (j.method === 'Page.screencastFrame') { const { data, metadata, sessionId } = j.params; fs.writeFileSync(FR + metadata.timestamp.toFixed(3) + '.jpg', Buffer.from(data, 'base64')); ws.send(JSON.stringify({ id: ++id, method: 'Page.screencastFrameAck', params: { sessionId } })); }
  else if (j.method === 'Runtime.exceptionThrown') console.log('[page-exc]', JSON.stringify(j.params.exceptionDetails).slice(0, 400)); });
const send = (method, params = {}) => { const i = ++id; ws.send(JSON.stringify({ id: i, method, params })); return new Promise((res, rej) => pend.set(i, { res, rej })); };
const ev = async (e) => { const r = await send('Runtime.evaluate', { expression: e, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text); return r.result.value; };
await send('Runtime.enable'); await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 720, deviceScaleFactor: 1.5, mobile: false });
await send('Emulation.setLocaleOverride', { locale: 'en-US' }).catch((e) => console.log('locale', e.message));
await send('Page.startScreencast', { format: 'jpeg', quality: 85, maxWidth: 1920, maxHeight: 1080, everyNthFrame: 1 });
const shot = async (name, full = true) => {
  await sleep(2200); mark(name, 'shot');
  const r = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(OUT + name + '.png', Buffer.from(r.data, 'base64')); console.log('CAPTURE', OUT + name + '.png');
};
const go = async (u) => { await send('Page.navigate', { url: u }); await sleep(2500); for (let i = 0; i < 60; i++) { if (await ev('!!document.querySelector(".top")')) break; await sleep(500); } };
const click = (text, sel = 'button') => ev(`(() => { const b = [...document.querySelectorAll(${JSON.stringify(sel)})].find((x) => x.textContent.includes(${JSON.stringify(text)}) && !x.disabled); if (!b) throw new Error('button not found: ' + ${JSON.stringify(text)}); b.scrollIntoView({ block: 'center', behavior: 'smooth' }); return new Promise((r) => setTimeout(() => { b.click(); r(true); }, 700)); })()`);
const fill = (label, value) => ev(`(() => { const l = [...document.querySelectorAll('label')].find((x) => x.textContent.startsWith(${JSON.stringify(label)})); const i = l.querySelector('input,select'); l.scrollIntoView({ block: 'center' });
  const proto = i.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(proto, 'value').set.call(i, ${JSON.stringify(value)});
  i.dispatchEvent(new Event(i.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true })); return true; })()`);
const fillSel = (sel, value) => ev(`(() => { const i = document.querySelector(${JSON.stringify(sel)}); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(i, ${JSON.stringify(value)}); i.dispatchEvent(new Event('input', { bubbles: true })); return true; })()`);
const idle = async (label, max = 300, expectErr = null) => { const t0 = Date.now(); mark(label, 'busyStart'); await sleep(800);
  for (let i = 0; i < max; i++) { if (!(await ev('!!document.querySelector(".busy")'))) break; await sleep(1000); }
  const e = await ev('document.querySelector(".error")?.textContent ?? null'); const secs = ((Date.now() - t0) / 1000).toFixed(1); mark(label, 'busyEnd'); console.log(`${label}: ${e ? 'ERROR ' + e.slice(0, 300) : 'ok'} (busy cleared after ${secs} s)`); TIMES.push(`${label} ${secs}s`); if (expectErr) { if (!e || !expectErr.test(e)) throw new Error(label + ': expected refusal, got ' + e); return; } if (e) throw new Error(label + ': ' + e); };
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
await go(URL0); mark('B-start');
await connect('Charlie');
await tab('Events'); await sleep(4000);
for (let k = 0; k < 2; k++) { await ev(`(() => { const r = [...document.querySelectorAll('.ttype')].find((x) => x.textContent.includes('General admission')); r.querySelector('button').click(); return true; })()`); await idle('prep buy GA ' + k); }
await tab('My tickets'); await sleep(2000);
const before = await ev(`[...document.querySelectorAll('.passcard .code')].map((x) => x.textContent)`); mark('B-ready'); await sleep(1500);
await ev(`(() => { const c = [...document.querySelectorAll('.ticket')].find((x) => x.textContent.includes('General admission') && [...x.querySelectorAll('button')].some((b) => b.textContent.includes('Check in'))); const b = [...c.querySelectorAll('button')].find((x) => x.textContent.includes('Check in') && !x.disabled); b.scrollIntoView({ block: 'center', behavior: 'smooth' }); return new Promise((r) => setTimeout(() => { b.click(); r(true); }, 700)); })()`); await idle('checkIn (Charlie)');
await sleep(1500);
const code = await ev(`(() => { const before = ${JSON.stringify(before)}; const c = [...document.querySelectorAll('.passcard')].find((x) => !before.includes(x.querySelector('.code').textContent)); c.scrollIntoView({ block: 'center' }); return c.querySelector('.code').textContent; })()`); await sleep(1500); await shot('06-entry-pass-qr');
console.log('PASS', code);
await tab('Gate'); await sleep(2000);
await verify('hello', 'e:1', '07a-gate-not-a-pass');
await verify(code, 't:2', '07b-gate-wrong-type-refused');
await verify(code, 't:1', '07c-gate-admitted');
await verify(code, 'e:1', '07d-gate-replay-refused');
await click('Scan with camera', '.gate button'); await sleep(500);
console.log('CAMERA', await ev('document.querySelector(".gate .warn")?.textContent ?? "scanner opened"'));
await tab('My tickets'); await sleep(1500);
await ev(`(() => { const c = [...document.querySelectorAll('.ticket')].find((x) => x.textContent.includes('General admission') && x.querySelector('.row input')); const i = c.querySelector('.row input'); c.scrollInto'13'iew({ block: 'center' }); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(i, '13'); i.dispatchEvent(new Event('input', { bubbles: true })); return true; })()`); await sleep(500); await shot('08-resale-above-cap');

await ev(`(() => { const c = [...document.querySelectorAll('.ticket')].find((x) => x.textContent.includes('General admission') && x.querySelector('.row input')); const i = c.querySelector('.row input'); c.scrollInto'12'iew({ block: 'center' }); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(i, '12'); i.dispatchEvent(new Event('input', { bubbles: true })); return true; })()`); await sleep(300);

await ev(`(() => { const c = [...document.querySelectorAll('.ticket')].find((x) => x.textContent.includes('General admission') && x.querySelector('.row input')); const b = [...c.querySelectorAll('button')].find((x) => x.textContent.includes('Resell') && !x.disabled); b.scrollIntoView({ block: 'center', behavior: 'smooth' }); return new Promise((r) => setTimeout(() => { b.click(); r(true); }, 700)); })()`); await idle('listForResale');

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
mark('end'); await sleep(1500); ws.close(); chrome.kill(); process.exit(0);
