import { hybridProver } from './localProver.ts';
// 1AM's DApp-connector bridge swallows KeyMaterialProvider errors (`.catch(() => {})`) and then reports only
// "failed to find proving key for '<circuit>'". Load each artifact once (with retries), prefetch the keys when the
// wallet asks for the ZKIR (check), and load all three before delegating prove, so a failure names the URL/status.
type KMP = { getZKIR(c: string): Promise<Uint8Array>; getProverKey(c: string): Promise<Uint8Array>; getVerifierKey(c: string): Promise<Uint8Array> };
type PP = { check(p: Uint8Array, k: string): Promise<(bigint | undefined)[]>; prove(p: Uint8Array, k: string, b?: bigint): Promise<Uint8Array> };
type Kind = keyof KMP;
const LABEL: Record<Kind, string> = { getZKIR: 'zkir', getProverKey: 'prover key', getVerifierKey: 'verifier key' };
const isDapp = (c: string) => !c.startsWith('midnight/');

export function cachingKeyMaterial(base: KMP) {
  const memo = new Map<string, Promise<Uint8Array>>(); const errs = new Map<string, string>();
  const load = (kind: Kind, c: string) => {
    const k = `${kind}:${c}`;
    if (!memo.has(k)) memo.set(k, (async () => {
      let last: any;
      for (let i = 0; i < 3; i++) {
        try {
          const b = await base[kind](c);
          if (!(b instanceof Uint8Array) || b.length === 0) throw new Error(`empty ${LABEL[kind]} for '${c}'`);
          errs.delete(k); return b;
        } catch (e: any) { last = e; console.warn(`[cloaktix] ZK ${kind}('${c}') attempt ${i + 1}/3 failed:`, e?.message ?? e); await new Promise((r) => setTimeout(r, 400 * (i + 1) ** 2)); }
      }
      memo.delete(k); errs.set(k, String(last?.message ?? last)); console.error(`[cloaktix] ZK ${kind}('${c}') failed:`, last); throw last;
    })());
    return memo.get(k)!.then((b) => b.slice());
  };
  const loadAll = async (c: string) => {
    const kinds: Kind[] = ['getZKIR', 'getProverKey', 'getVerifierKey'];
    const r = await Promise.allSettled(kinds.map((k) => load(k, c)));
    const bad = r.flatMap((x, i) => (x.status === 'rejected' ? [`${LABEL[kinds[i]]}: ${x.reason?.message ?? x.reason}`] : []));
    if (bad.length) throw new Error(`Could not load ZK key material for circuit '${c}' (${bad.join('; ')})`);
  };
  const kmp: KMP = {
    getZKIR: (c) => { if (isDapp(c)) { load('getProverKey', c).catch(() => {}); load('getVerifierKey', c).catch(() => {}); } return load('getZKIR', c); },
    getProverKey: (c) => load('getProverKey', c),
    getVerifierKey: (c) => load('getVerifierKey', c),
  };
  const wrapProver = (pp: PP): PP => ({
    check: (p, k) => pp.check(p, k),
    async prove(p, k, b) {
      if (isDapp(k)) await loadAll(k);
      try { return await pp.prove(p, k, b); }
      catch (e: any) {
        const why = [...errs].filter(([key]) => key.endsWith(`:${k}`)).map(([key, v]) => `${key.split(':')[0]}: ${v}`).join('; ');
        throw why ? new Error(`${e?.message ?? e} (key material for '${k}': ${why})`) : e;
      }
    },
  });
  return { kmp, wrapProver };
}

// Wraps the wallet API so dappConnectorProofProvider hands the wallet our caching KeyMaterialProvider.
// CT-PROOF-IR: CloakTix's own ZKIR v3 circuits (Compact 0.36) are proved in the tab (hybridProver); 1AM 6.4.10's
// in-browser prover only reads ZKIR v2. Wallet built-in circuits (midnight/*) still go to the wallet.
export const withCachingProver = (api: any) => Object.assign(Object.create(api), {
  getProvingProvider: async (kmp: KMP) => { const c = cachingKeyMaterial(kmp); return hybridProver(c.wrapProver(await api.getProvingProvider(c.kmp)), c.kmp); },
});
