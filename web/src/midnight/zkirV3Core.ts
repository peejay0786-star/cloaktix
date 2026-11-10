// CT-PROOF-IR: the in-tab ZKIR v3 prover core (official @midnightntwrk/zkir-v3 WASM), shared by the Web Worker and node tests.
import { provingProvider } from '@midnightntwrk/zkir-v3';
import { paramsSha256, type LocalProveRequest, type LocalProveResponse } from './zkirV3Protocol.ts';

const hex = (b: ArrayBuffer) => Array.from(new Uint8Array(b), (x) => x.toString(16).padStart(2, '0')).join('');

/** fetchParams(k, base) returns the raw SRS bytes; they are checked against the pinned sha256 before use. */
export function makeLocalProver(fetchParams: (k: number, base: string) => Promise<ArrayBuffer>) {
  const cache = new Map<string, Promise<Uint8Array>>();
  const getParams = (base: string, k: number) => {
    const key = `${base}|${k}`;
    if (!cache.has(key)) cache.set(key, (async () => {
      const want = paramsSha256(k);
      if (!want) throw new Error(`No pinned proving parameters for k=${k}`);
      const buf = await fetchParams(k, base);
      if (hex(await crypto.subtle.digest('SHA-256', buf)) !== want) throw new Error(`Proving parameters k=${k} failed the integrity check`);
      return new Uint8Array(buf);
    })().catch((e) => { cache.delete(key); throw e; }));
    return cache.get(key)!.then((b) => b.slice());
  };
  return async (req: LocalProveRequest): Promise<LocalProveResponse> => {
    if (req.op === 'warm') {
      try { await Promise.all(req.ks.map((k) => getParams(req.paramsBase, k))); return { id: req.id, ok: true, warmed: req.ks }; }
      catch (e: any) { return { id: req.id, ok: false, error: String(e?.message ?? e) }; }
    }
    const { id, op, preimage, keyLocation, km, binding, paramsBase } = req;
    try {
      const pp = provingProvider({ lookupKey: async () => km, getParams: (k: number) => getParams(paramsBase, k) });
      return op === 'check'
        ? { id, ok: true, check: await pp.check(preimage, keyLocation) }
        : { id, ok: true, proof: await pp.prove(preimage, keyLocation, binding) };
    } catch (e: any) {
      return { id, ok: false, error: String(e?.message ?? e) };
    }
  };
}
