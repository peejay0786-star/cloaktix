// Headful Chrome: open deployed preview, click Connect wallet, log console + every .wasm response's first bytes.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
const URL0 = process.argv[2];
const OUT = new URL('../screenshots/passport-fix/', import.meta.url).pathname;
const chrome = spawn('google-chrome', ['--remote-debugging-port=9347', '--user-data-dir=/tmp/cloaktix-pp-chrome-' + Date.now(), '--no-first-run', '--no-default-browser-check', '--window-size=1280,900', 'about:blank'], { stdio: 'ignore', env: { ...process.env, DISPLAY: process.env.DISPLAY || ':3' } });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let t; for (let i = 0; i < 40 && !t; i++) { await sleep(500); try { t = (await (await fetch('http://127.0.0.1:9347/json/list')).json()).find((x) => x.type === 'page'); } catch {} }
const ws = new WebSocket(t.webSocketDebuggerUrl); await new Promise((r) => ws.addEventListener('open', r, { once: true }));
let id = 0; const pend = new Map(); const wasmReq = new Map(); const LOG = [];
const log = (...a) => { const s = a.join(' '); LOG.push(s); console.log(s); };
ws.addEventListener('message', (m) => { const j = JSON.parse(String(m.data));
  if (j.id && pend.has(j.id)) { const p = pend.get(j.id); pend.delete(j.id); j.error ? p.rej(new Error(j.error.message)) : p.res(j.result); return; }
  if (j.method === 'Runtime.consoleAPICalled') log(`[console.${j.params.type}]`, j.params.args.map((a) => a.value ?? a.description ?? '').join(' ').slice(0, 500));
  else if (j.method === 'Runtime.exceptionThrown') log('[exception]', (j.params.exceptionDetails.exception?.description ?? j.params.exceptionDetails.text).slice(0, 500));
  else if (j.method === 'Log.entryAdded') log(`[log.${j.params.entry.level}]`, j.params.entry.text.slice(0, 300), j.params.entry.url ?? '');
  else if (j.method === 'Network.responseReceived' && /\.wasm(\?|$)/.test(j.params.response.url)) wasmReq.set(j.params.requestId, j.params.response);
  else if (j.method === 'Network.loadingFinished' && wasmReq.has(j.params.requestId)) {
    const r = wasmReq.get(j.params.requestId);
    send('Network.getResponseBody', { requestId: j.params.requestId }).then((b) => { const buf = b.base64Encoded ? Buffer.from(b.body, 'base64') : Buffer.from(b.body);
      log('[wasm]', r.status, r.url, 'ct=' + r.headers['content-type'], 'ce=' + (r.headers['content-encoding'] ?? '-'), 'bytes=' + buf.length, 'magic=' + buf.subarray(0, 4).toString('hex').match(/../g).join(' ')); })
      .catch((e) => log('[wasm]', r.status, r.url, 'body err', e.message)); }
  else if (j.method === 'Network.loadingFailed') log('[netfail]', j.params.errorText, j.params.requestId);
});
const send = (method, params = {}) => { const i = ++id; ws.send(JSON.stringify({ id: i, method, params })); return new Promise((res, rej) => pend.set(i, { res, rej })); };
const ev = async (e) => { const r = await send('Runtime.evaluate', { expression: e, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text); return r.result.value; };
await send('Runtime.enable'); await send('Page.enable'); await send('Log.enable'); await send('Network.enable', { maxResourceBufferSize: 64 << 20, maxTotalBufferSize: 256 << 20 }); await send('Network.setCacheDisabled', { cacheDisabled: true });
const shot = async (name) => { const r = await send('Page.captureScreenshot', { format: 'png' }); const p = OUT + name + '.png'; fs.writeFileSync(p, Buffer.from(r.data, 'base64')); log('CAPTURE', p); };

const waitFor = async (expr, secs = 90) => { for (let i = 0; i < secs; i++) { await sleep(1000); try { if (await ev(expr)) return true; } catch {} } return false; };
const text = async () => (await ev('document.body.innerText')).replace(/\s+/g, ' ');
// 1) Events page (no wallet connected; nothing is signed anywhere in this script)
await send('Page.navigate', { url: URL0 });
await waitFor(`[...document.querySelectorAll('button')].some((x) => /connect wallet/i.test(x.textContent))`); await sleep(2000);
log('events text:', (await text()).slice(0, 700));
log('CTA present:', await ev(`[...document.querySelectorAll('button')].some((x) => /for organizers/i.test(x.textContent))`));
await shot('01-events-empty-state');
// 2) /passport endpoints, same origin, from the page
log('GET /passport/issuer:', await ev(`fetch('/passport/issuer').then(async r => r.status + ' ' + r.headers.get('content-type') + ' coep=' + r.headers.get('cross-origin-embedder-policy') + ' ' + (await r.text()).slice(0, 400))`));
log('POST /passport/issue:', await ev(`fetch('/passport/issue', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ holder: '11'.repeat(32), birthdate: '1990-01-01' }) }).then(async r => r.status + ' ' + (await r.text()).slice(0, 400))`));
log('POST /passport/issue (bad):', await ev(`fetch('/passport/issue', { method: 'POST', body: '{}' }).then(async r => r.status + ' ' + (await r.text()).slice(0, 200))`));
// 3) Click the CTA -> organizer page
log('click CTA:', await ev(`(() => { const b = [...document.querySelectorAll('button')].find((x) => /for organizers/i.test(x.textContent)); if (!b) return 'not found'; b.click(); return 'clicked'; })()`));
await sleep(4000);
log('url after CTA:', await ev('location.href'));
const t2 = await text(); log('organizer text:', t2.slice(0, 900)); log('organizer shows 127.0.0.1:', /127\.0\.0\.1/.test(t2));
log('loaded scripts mention 127.0.0.1:8798:', await ev(`Promise.all([...performance.getEntriesByType('resource')].filter(e => /\.js$/.test(e.name)).map(e => fetch(e.name).then(r => r.text()).then(t => t.includes('127.0.0.1:8798') ? e.name : null))).then(a => a.filter(Boolean))`));
await shot('02-organizer');
// 4) Raw JSON page for the issuer
await send('Page.navigate', { url: new URL('/passport/issuer', URL0).href }); await sleep(3000);
log('issuer page:', (await text()).slice(0, 300)); await shot('03-passport-issuer');
fs.writeFileSync(OUT + 'console.log', LOG.join('\n') + '\n');
ws.close(); chrome.kill(); process.exit(0);
