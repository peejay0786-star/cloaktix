// CT-PROOF-SPEED: Midnight.js 5's FetchZkConfigProvider does not memoize artifacts, and ZKConfigRegistry.buildConfig
// re-fetches the prover key for every getZKIR/getProverKey/getVerifierKey: measured 4 prover-key downloads per call
// (buyTicket: 4 x 24.7 MB) and /managed/* is served no-store, so every reload pays it again.
// This fetch wrapper (1) dedupes artifact downloads in memory and (2) persists them in Cache Storage keyed by the
// sha256 the compiler wrote in compiler/contract-manifest.json. A cached entry is only used when its hash is the one
// the current manifest expects, and FetchZkConfigProvider still re-verifies every artifact (verify: 'require').
type FetchFn = (input: string, init?: RequestInit) => Promise<Response>;
type Manifest = Record<string, string>; // "keys/buyTicket.prover" -> sha256
const CACHE = 'cloaktix-zk-v1';
const ART = /\/(keys|zkir)\/[^/]+\.(prover|verifier|bzkir|zkir)$/;
const hex = (b: ArrayBuffer) => Array.from(new Uint8Array(b), (x) => x.toString(16).padStart(2, '0')).join('');
const cacheKey = (h: string) => `https://zk-cache.invalid/${h}`;

function flatten(node: any, prefix: string, out: Manifest) {
  for (const [k, v] of Object.entries(node ?? {})) {
    if (v && typeof v === 'object' && (v as any).type === 'file' && typeof (v as any).hash === 'string') out[prefix + k] = (v as any).hash;
    else if (v && typeof v === 'object' && (v as any).type === 'directory') flatten(v, `${prefix}${k}/`, out);
  }
}

export type ZkFetchStats = { network: number; memory: number; cache: number; bytesNetwork: number };
export function cachedZkFetch(base: string, fetchFunc: FetchFn, storage: CacheStorage | undefined = globalThis.caches) {
  const root = base.replace(/\/?$/, '/');
  const stats: ZkFetchStats = { network: 0, memory: 0, cache: 0, bytesNetwork: 0 };
  let manifest: Promise<Manifest> | undefined;
  const loadManifest = () => (manifest ??= (async () => {
    const res = await fetchFunc(new URL('compiler/contract-manifest.json', root).toString(), { cache: 'no-store' });
    if (!res.ok || (res.headers.get('content-type') || '').includes('text/html')) return {};
    const m: Manifest = {}; const j = await res.json();
    for (const dir of ['keys', 'zkir']) flatten(j?.[dir], `${dir}/`, m);
    void prune(new Set(Object.values(m)));
    return m;
  })().catch(() => { manifest = undefined; return {} as Manifest; }));
  const prune = async (keep: Set<string>) => {
    try { const c = await storage?.open(CACHE); for (const r of (await c?.keys()) ?? []) if (!keep.has(new URL(r.url).pathname.slice(1))) await c!.delete(r); } catch { /* best effort */ }
  };
  const inflight = new Map<string, Promise<ArrayBuffer>>(); const recent: string[] = [];
  const remember = (k: string, p: Promise<ArrayBuffer>) => { inflight.set(k, p); recent.push(k); while (recent.length > 6) inflight.delete(recent.shift()!); };

  const load = async (url: string, rel: string): Promise<ArrayBuffer> => {
    const want = (await loadManifest())[rel];
    if (want && storage) {
      try {
        const hit = await (await storage.open(CACHE)).match(cacheKey(want));
        if (hit) { const b = await hit.arrayBuffer(); if (hex(await crypto.subtle.digest('SHA-256', b)) === want) { stats.cache++; return b; } }
      } catch { /* cache unavailable: fall through to network */ }
    }
    const res = await fetchFunc(url, { cache: 'no-store' });
    if (!res.ok || (res.headers.get('content-type') || '').includes('text/html')) throw Object.assign(new Error(`HTTP ${res.status}`), { response: res });
    const b = await res.arrayBuffer(); stats.network++; stats.bytesNetwork += b.byteLength;
    if (want && storage) {
      try { if (hex(await crypto.subtle.digest('SHA-256', b)) === want) await (await storage.open(CACHE)).put(cacheKey(want), new Response(b.slice(0), { headers: { 'content-type': 'application/octet-stream' } })); } catch { /* quota etc.: still usable */ }
    }
    return b;
  };

  const fn: FetchFn = async (input, init) => {
    const url = String(input);
    if (!url.startsWith(root) || !ART.test(new URL(url).pathname)) return fetchFunc(url, init);
    const rel = url.slice(root.length).split('?')[0];
    let p = inflight.get(rel); if (p) stats.memory++;
    else { p = load(url, rel); remember(rel, p); p.catch(() => inflight.delete(rel)); }
    try { const b = await p; return new Response(b.slice(0), { status: 200, headers: { 'content-type': 'application/octet-stream' } }); }
    catch (e: any) { if (e?.response) return e.response as Response; throw e; }
  };
  return Object.assign(fn, { stats, prefetch: (rels: string[]) => Promise.all(rels.map((r) => fn(new URL(r, root).toString()).then((x) => x.ok))) });
}

const shared = new Map<string, ReturnType<typeof cachedZkFetch>>();
/** One wrapper per artifact base, shared by the providers and the Buy prewarm so both hit the same memory. */
export function sharedZkFetch(base: string, fetchFunc: FetchFn) {
  const k = base.replace(/\/?$/, '/');
  if (!shared.has(k)) shared.set(k, cachedZkFetch(k, fetchFunc));
  return shared.get(k)!;
}
