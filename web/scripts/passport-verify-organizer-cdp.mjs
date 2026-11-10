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
await send('Page.navigate', { url: new URL('/organizer', URL0).href });
await waitFor(`/organizer|deploy/i.test(document.body.innerText) && document.querySelectorAll('button').length > 0`); await sleep(3000);
const ot = await text(); log('organizer text:', ot.slice(0, 1200)); log('organizer shows 127.0.0.1:', /127\.0\.0\.1/.test(ot));
log('buttons:', await ev(`[...document.querySelectorAll('button')].map(b => b.textContent.trim() + (b.disabled ? ' [disabled]' : '')).join(' | ')`));
await shot('04-organizer-direct');
log('served bundles:', await ev(`Promise.all(['/assets/cloaktix-jw7ICYS5.js','/assets/index-BdWCSkwE.js'].map(u => fetch(u).then(r => r.text()).then(x => u + ' passport=' + x.includes('zf = "/passport"') + ' localhost8798=' + x.includes('127.0.0.1:8798') + ' demoPkFallback=' + x.includes('preview demo issuer public key') + ' connectErr=' + x.includes('Wallet connection failed') + ' cta=' + x.includes('For organizers · deploy the platform')))).then(a => a.join(' || '))`));
fs.writeFileSync(OUT + 'console-organizer.log', LOG.join('\n') + '\n');
ws.close(); chrome.kill(); process.exit(0);
