/**
 * Headless check against the *production* Vite build (no wallet signing).
 * Serves web-dist-app-preview and opens /v3-batch-smoke.html.
 */
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../web-dist-app-preview');
const smoke = path.join(root, 'v3-batch-smoke.html');
if (!existsSync(smoke)) {
  console.error('Missing', smoke, '— run web build:preview first');
  process.exit(2);
}

const mime: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.wasm': 'application/wasm',
  '.json': 'application/json',
};

const server = createServer((req, res) => {
  const url = new URL(req.url || '/', 'http://127.0.0.1');
  let rel = decodeURIComponent(url.pathname);
  if (rel.endsWith('/')) rel += 'index.html';
  const file = path.join(root, rel);
  if (!file.startsWith(root) || !existsSync(file) || statSync(file).isDirectory()) {
    res.writeHead(404); res.end('not found'); return;
  }
  const ext = path.extname(file);
  res.writeHead(200, {
    'content-type': mime[ext] || 'application/octet-stream',
    'cross-origin-opener-policy': 'same-origin',
    'cross-origin-embedder-policy': 'require-corp',
  });
  res.end(readFileSync(file));
});

await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
const { port } = server.address() as { port: number };
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const errors: string[] = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(msg.text());
});
await page.goto(`http://127.0.0.1:${port}/v3-batch-smoke.html`, { waitUntil: 'networkidle', timeout: 120_000 });
await page.waitForFunction(() => (window as any).__V3_BATCH_SMOKE__, null, { timeout: 120_000 });
const result = await page.evaluate(() => (window as any).__V3_BATCH_SMOKE__);
const body = await page.locator('#out').innerText();
await browser.close();
server.close();
console.log(body);
if (result !== 'PASS' || errors.some((e) => /read only property|getProvableCircuitIds/i.test(e))) {
  console.error('SMOKE FAILED', result, errors);
  process.exit(1);
}
console.log('playwright v3-batch-smoke PASS');
