// CT-PROOF-IR: route CloakTix's own contract proofs (ZKIR v3) to an in-tab prover; everything else stays with the wallet.
// The wallet still balances, pays DUST fees (its built-in midnight/* circuits) and submits. Payment sequencing is unchanged.
import { isZkirV3, type KeyMaterial, type LocalProveRequest, type LocalProveResponse } from './zkirV3Protocol.ts';

type KMP = { getZKIR(c: string): Promise<Uint8Array>; getProverKey(c: string): Promise<Uint8Array>; getVerifierKey(c: string): Promise<Uint8Array> };
type PP = { check(p: Uint8Array, k: string): Promise<(bigint | undefined)[]>; prove(p: Uint8Array, k: string, b?: bigint): Promise<Uint8Array> };
type DistOmit<T, K extends keyof any> = T extends unknown ? Omit<T, K> : never;
export type LocalRunner = (req: DistOmit<LocalProveRequest, 'id' | 'paramsBase'>) => Promise<LocalProveResponse>;

const isDapp = (c: string) => !c.startsWith('midnight/');
/** localStorage 'cloaktix:prover' = 'wallet' forces the old path (wallet proves everything). */
export const localProvingEnabled = (storage?: Pick<Storage, 'getItem'>) => {
  try { return (storage ?? globalThis.localStorage)?.getItem('cloaktix:prover') !== 'wallet'; } catch { return true; }
};

export const PARAMS_BASE_PATH = 'managed/zk-params/';

/**
 * CT-MULTI-BUY: how many prover workers this device may run. 2 only on desktops with >= 4 cores and >= 8 GB (when the
 * browser reports it); phones/tablets and small machines stay at 1. localStorage 'cloaktix:prover-pool' = '1' forces 1.
 */
export function proofPoolSize(nav: any = globalThis.navigator, storage?: Pick<Storage, 'getItem'>): 1 | 2 {
  try { if ((storage ?? globalThis.localStorage)?.getItem('cloaktix:prover-pool') === '1') return 1; } catch { /* default */ }
  if (!nav) return 1;
  const mobile = nav.userAgentData?.mobile ?? /Android|iPhone|iPad|iPod|Mobile/i.test(String(nav.userAgent ?? ''));
  if (mobile || (nav.maxTouchPoints > 1 && /Macintosh/.test(String(nav.userAgent ?? '')))) return 1; // iPadOS reports as Mac
  if (!(nav.hardwareConcurrency >= 4)) return 1;
  if (typeof nav.deviceMemory === 'number' && nav.deviceMemory < 8) return 1;
  return 2;
}

type Slot = { w: Worker; busy: number; waiting: Map<number, (r: LocalProveResponse) => void> };
const slots: Slot[] = []; let seq = 0;
function spawn(): Slot {
  const slot: Slot = { w: new Worker(new URL('./zkirV3.worker.ts', import.meta.url), { type: 'module' }), busy: 0, waiting: new Map() };
  slot.w.onmessage = (e: MessageEvent<LocalProveResponse>) => { const r = slot.waiting.get(e.data.id); slot.waiting.delete(e.data.id); slot.busy = Math.max(0, slot.busy - 1); r?.(e.data); };
  slot.w.onerror = (e) => {
    const err = `In-tab prover crashed: ${e.message || 'worker error'}`;
    for (const [id, r] of slot.waiting) r({ id, ok: false, error: err });
    slot.waiting.clear(); slot.w.terminate(); const i = slots.indexOf(slot); if (i >= 0) slots.splice(i, 1);
  };
  slots.push(slot); return slot;
}
/** Proofs of one multi-ticket tx arrive together (the ledger proves calls concurrently): spread them over the pool. */
function pick(op: LocalProveRequest['op']): Slot {
  if (!slots.length) return spawn();
  if (op !== 'prove') return slots[0];
  const idle = slots.reduce((a, b) => (b.busy < a.busy ? b : a));
  return idle.busy > 0 && slots.length < proofPoolSize() ? spawn() : idle;
}
export const workerRunner: LocalRunner = (req) => {
  const slot = pick(req.op); const id = ++seq; slot.busy++;
  const paramsBase = new URL(PARAMS_BASE_PATH, globalThis.location?.origin).toString();
  return new Promise((resolve) => { slot.waiting.set(id, resolve); slot.w.postMessage({ ...req, id, paramsBase }); });
};

/** CT-MULTI-BUY: observe in-tab dApp proofs (progress only: circuit name + phase, never preimages or keys). */
export type LocalProofEvent = { phase: 'start' | 'done' | 'error'; keyLocation: string };
const proofListeners = new Set<(e: LocalProofEvent) => void>();
export function onLocalProof(listener: (e: LocalProofEvent) => void): () => void {
  proofListeners.add(listener); return () => { proofListeners.delete(listener); };
}
const emitProof = (e: LocalProofEvent) => { for (const l of [...proofListeners]) { try { l(e); } catch { /* progress only */ } } };

export function hybridProver(wallet: PP, kmp: KMP, run: LocalRunner = workerRunner, enabled = localProvingEnabled()): PP {
  const v3Material = async (k: string): Promise<KeyMaterial | undefined> => {
    if (!enabled || !isDapp(k)) return undefined;
    const ir = await kmp.getZKIR(k);
    if (!isZkirV3(ir)) return undefined;
    const [proverKey, verifierKey] = await Promise.all([kmp.getProverKey(k), kmp.getVerifierKey(k)]);
    return { ir, proverKey, verifierKey };
  };
  const unwrap = (r: LocalProveResponse, k: string) => { if (!r.ok) throw new Error(`In-tab ZKIR v3 proving failed for '${k}': ${r.error}`); return r; };
  return {
    async check(p, k) {
      const km = await v3Material(k);
      if (!km) return wallet.check(p, k);
      return unwrap(await run({ op: 'check', preimage: p, keyLocation: k, km }), k).check ?? [];
    },
    async prove(p, k, b) {
      const km = await v3Material(k);
      if (!km) return wallet.prove(p, k, b);
      emitProof({ phase: 'start', keyLocation: k });
      let res: LocalProveResponse;
      try { res = unwrap(await run({ op: 'prove', preimage: p, keyLocation: k, km, binding: b }), k); }
      catch (e) { emitProof({ phase: 'error', keyLocation: k }); throw e; }
      emitProof({ phase: 'done', keyLocation: k });
      const proof = (res as { proof?: Uint8Array }).proof;
      if (!(proof instanceof Uint8Array) || proof.length === 0) throw new Error(`In-tab ZKIR v3 prover returned no proof for '${k}'`);
      return proof;
    },
  };
}

/** CT-PROOF-SPEED: start the worker, compile the WASM and load the SRS for these k values before the Pay click. */
export function warmLocalProver(ks: number[], run: LocalRunner = workerRunner): Promise<boolean> {
  if (!localProvingEnabled()) return Promise.resolve(false);
  return run({ op: 'warm', ks }).then((r) => r.ok, () => false);
}
