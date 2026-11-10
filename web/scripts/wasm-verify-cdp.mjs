// Headful Chrome: open deployed preview, click Connect wallet, log console + every .wasm response's first bytes.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
const URL0 = process.argv[2];
const OUT = new URL('../screenshots/wasm-fix/', import.meta.url).pathname;
const chrome = spawn('google-chrome', ['--remote-debugging-port=9346', '--user-data-dir=/tmp/cloaktix-wasm-chrome-' + Date.now(), '--no-first-run', '--no-default-browser-check', '--window-size=1280,900', 'about:blank'], { stdio: 'ignore', env: { ...process.env, DISPLAY: process.env.DISPLAY || ':3' } });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let t; for (let i = 0; i < 40 && !t; i++) { await sleep(500); try { t = (await (await fetch('http://127.0.0.1:9346/json/list')).json()).find((x) => x.type === 'page'); } catch {} }
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
// Test-only stub of a DApp Connector v4 wallet so the picker offers a wallet and clicking it triggers the lazy SDK/WASM load.
if (process.env.STUB_WALLET) await send('Page.addScriptToEvaluateOnNewDocument', { source: `window.midnight = { stubtest: { name: 'Stub wallet (test)', rdns: 'test.stub', apiVersion: '4.0.1', icon: '', connect: async () => { throw new Error('stub wallet: connect not implemented (no extension)'); } } };` });
await send('Page.navigate', { url: URL0 });
for (let i = 0; i < 90; i++) { await sleep(1000); try { if (await ev(`[...document.querySelectorAll('button')].some((x) => /connect wallet/i.test(x.textContent))`)) break; } catch {} }
await sleep(1500);
log('crossOriginIsolated=', await ev('self.crossOriginIsolated'), 'SW=', await ev('navigator.serviceWorker ? navigator.serviceWorker.getRegistrations().then(r=>r.length) : "n/a"'));
await shot('01-home');
log('click:', await ev(`(() => { const b = [...document.querySelectorAll('button')].find((x) => /connect wallet/i.test(x.textContent)); if (!b) return 'not found'; b.click(); return 'clicked: ' + b.textContent.trim(); })()`));
await sleep(2500);
if (process.env.STUB_WALLET) { await shot('02a-picker'); log('click wallet:', await ev(`(() => { const b = document.querySelector('button.wallet'); if (!b) return 'no wallet button'; b.click(); return 'clicked: ' + b.textContent.trim(); })()`)); }
await sleep(25000);
log('visible text after click:', (await ev('document.body.innerText')).replace(/\s+/g, ' ').slice(0, 1200));
await shot('02-after-connect');
fs.writeFileSync(OUT + 'console.log', LOG.join('\n') + '\n');
ws.close(); chrome.kill(); process.exit(0);
