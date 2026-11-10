// CT-PROOF-IR: proves CloakTix circuits compiled by Compact 0.36 (ZKIR v3) inside the tab, off the main thread.
// 1AM 6.4.10's in-browser prover only reads ZKIR v2 ("expected ir-source[v2]..., got ir-source[v3-generic]").
// Witnesses stay in this browser: nothing here talks to a remote proof server.
// The handler is registered synchronously and the WASM is imported lazily: a module worker that awaits its WASM at
// top level would miss the first postMessage (measured in headless Chrome: the request was silently dropped).
import { paramsSha256, type LocalProveRequest, type LocalProveResponse } from './zkirV3Protocol.ts';

let runner: Promise<(req: LocalProveRequest) => Promise<LocalProveResponse>> | undefined;
// CT-PROOF-SPEED: SRS files persist in Cache Storage keyed by their pinned sha256 (re-checked by makeLocalProver).
const fetchParams = async (k: number, base: string): Promise<ArrayBuffer> => {
  const want = paramsSha256(k); const key = want ? `https://zk-cache.invalid/${want}` : undefined;
  try { if (key && self.caches) { const hit = await (await caches.open('cloaktix-zk-v1')).match(key); if (hit) return hit.arrayBuffer(); } } catch { /* no cache */ }
  const res = await fetch(new URL(`bls_midnight_2p${k}`, base));
  if (!res.ok || (res.headers.get('content-type') || '').includes('text/html')) throw new Error(`Proving parameters k=${k} unavailable (HTTP ${res.status})`);
  const b = await res.arrayBuffer();
  try { if (key && self.caches) await (await caches.open('cloaktix-zk-v1')).put(key, new Response(b.slice(0))); } catch { /* quota */ }
  return b;
};
const getRunner = () => (runner ??= import('./zkirV3Core.ts').then((m) => m.makeLocalProver(fetchParams)));
self.onmessage = async (ev: MessageEvent<LocalProveRequest>) => {
  let out: LocalProveResponse;
  try { out = await (await getRunner())(ev.data); }
  catch (e: any) { runner = undefined; out = { id: ev.data.id, ok: false, error: `In-tab prover failed to load: ${String(e?.message ?? e)}` }; }
  (self as unknown as Worker).postMessage(out);
};
