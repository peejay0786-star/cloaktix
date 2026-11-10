// CT-PROOF-SPEED: artifact fetch wrapper (memory dedupe + Cache Storage keyed by manifest sha256).
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
import { cachedZkFetch } from '../src/midnight/zkFetch.ts';
const here = path.dirname(fileURLToPath(import.meta.url));
const MANAGED = path.resolve(here, '../../contract/managed/cloaktix-rate-v3');
const BASE = 'http://zk.test/managed/cloaktix-rate-v3';
function fakeCaches() {
  const stores = new Map<string, Map<string, ArrayBuffer>>();
  return { stores, open: async (n: string) => { if (!stores.has(n)) stores.set(n, new Map()); const m = stores.get(n)!;
    return { match: async (k: string) => (m.has(k) ? new Response(m.get(k)!.slice(0)) : undefined), put: async (k: string, r: Response) => void m.set(k, await r.arrayBuffer()),
      keys: async () => [...m.keys()].map((u) => ({ url: u })), delete: async (r: any) => m.delete(r.url) }; } } as any;
}
function server(tamper = false) {
  const log: string[] = [];
  const f = async (url: string) => { const rel = new URL(url).pathname.replace('/managed/cloaktix-rate-v3/', ''); log.push(rel);
    const p = path.join(MANAGED, rel); if (!fs.existsSync(p)) return new Response('nf', { status: 404 });
    const b = fs.readFileSync(p); if (tamper && rel.endsWith('.prover')) b[100] ^= 1;
    return new Response(b, { headers: { 'content-type': rel.endsWith('.json') ? 'application/json' : 'application/octet-stream' } }); };
  return { f, log };
}
describe('cachedZkFetch', () => {
  it('dedupes concurrent and repeated downloads of the same artifact', async () => {
    const s = server(); const zf = cachedZkFetch(BASE, s.f as any, undefined);
    const u = `${BASE}/keys/buyTicket.prover`;
    const rs = await Promise.all([zf(u), zf(u), zf(u)]); await zf(u);
    for (const r of rs) assert.equal((await r.arrayBuffer()).byteLength, fs.statSync(path.join(MANAGED, 'keys/buyTicket.prover')).size);
    assert.equal(s.log.filter((x) => x === 'keys/buyTicket.prover').length, 1);
  });
  it('a reload (new wrapper) is served from Cache Storage with zero artifact downloads', async () => {
    const c = fakeCaches(); const s1 = server(); await cachedZkFetch(BASE, s1.f as any, c)(`${BASE}/keys/buyTicket.prover`);
    const s2 = server(); const zf2 = cachedZkFetch(BASE, s2.f as any, c);
    const b = await (await zf2(`${BASE}/keys/buyTicket.prover`)).arrayBuffer();
    assert.equal(b.byteLength, fs.statSync(path.join(MANAGED, 'keys/buyTicket.prover')).size);
    assert.deepEqual(s2.log, ['compiler/contract-manifest.json'], 'only the (fresh, small) manifest is fetched');
    assert.equal(zf2.stats.cache, 1);
  });
  it('never caches bytes whose hash differs from the manifest (tampered/stale), and serves the manifest/other files untouched', async () => {
    const c = fakeCaches(); const s = server(true); const zf = cachedZkFetch(BASE, s.f as any, c);
    await zf(`${BASE}/keys/buyTicket.prover`);
    assert.equal(c.stores.get('cloaktix-zk-v1')?.size ?? 0, 0);
    const m = await zf(`${BASE}/compiler/contract-manifest.json`); assert.equal(m.headers.get('content-type'), 'application/json');
    assert.equal((await zf(`${BASE}/keys/nope.prover`)).status, 404);
  });
  it('prunes cache entries that the current manifest no longer lists', async () => {
    const c = fakeCaches(); const store = await c.open('cloaktix-zk-v1'); await store.put('https://zk-cache.invalid/' + 'ab'.repeat(32), new Response(new Uint8Array(3)));
    const s = server(); await cachedZkFetch(BASE, s.f as any, c)(`${BASE}/keys/createEvent.verifier`);
    await new Promise((r) => setTimeout(r, 20));
    assert.equal([...c.stores.get('cloaktix-zk-v1')!.keys()].some((k) => k.includes('ab'.repeat(32))), false);
  });
});
