/**
 * CT-MULTI-BUY-227: put every contract call of a multi-call transaction into ONE intent, in a known order.
 *
 * Why: Midnight.js 5 scoped transactions merge one Transaction per call (`Transaction.fromPartsRandomized`), so an
 * N-call tx carries N intents with RANDOM segment ids. Two problems on a real chain:
 *  1. 1AM balances each intent's unshielded (NIGHT) demand on its own and picked the same NIGHT UTXO for several
 *     intents. The ledger's disjoint check rejects that: node error 227 = DisjointCheck/UnshieldedInputsDisjointFailure.
 *  2. The ledger applies intents in segment-id order. Call k+1 was computed against the state after call k (serial,
 *     sold count), so a random order can make the guaranteed transcripts not match.
 * One intent with the actions in call order fixes both: the wallet sees one NIGHT imbalance (same shape as a single
 * buy) and the ledger applies the actions in sequence. Only used before proving (PreProof / PreBinding).
 */
import { Transaction, UnshieldedOffer } from '@midnight-ntwrk/midnight-js-protocol/v9';

const indexOfBytes = (hay: Uint8Array, needle: Uint8Array): number => {
  outer: for (let i = 0; i + needle.length <= hay.length; i++) {
    for (let j = 0; j < needle.length; j++) if (hay[i + j] !== needle[j]) continue outer;
    return i;
  }
  return -1;
};

export class SingleIntentError extends Error { constructor(m: string) { super(m); this.name = 'SingleIntentError'; } }

/**
 * @param tx unproven, unbalanced N-call transaction (one intent per call)
 * @param markers one byte string per call, in the order the calls must run (here: each call's admitCommit, which
 *   appears in that call's proof preimage; matched on its first 31 bytes). Used to order the actions; must match
 *   each call exactly once.
 */
export function mergeCallsIntoOneIntent(tx: any, markers: Uint8Array[]): any {
  const intents: Map<number, any> | undefined = tx.intents;
  if (!intents || intents.size <= 1) return tx;
  const segs = [...intents.keys()].sort((a, b) => a - b);
  const all = segs.map((s) => intents.get(s));
  for (const i of all) {
    if (i.dustActions) throw new SingleIntentError('intent already has DUST actions');
    for (const o of [i.guaranteedUnshieldedOffer, i.fallibleUnshieldedOffer]) if (o && o.inputs.length) throw new SingleIntentError('intent already has unshielded inputs (already balanced)');
  }
  if (tx.fallibleOffer && tx.fallibleOffer.size) throw new SingleIntentError('fallible shielded offers are not supported');
  const actions = all.flatMap((i) => i.actions as any[]);
  if (markers.length !== actions.length) throw new SingleIntentError(`expected ${markers.length} calls, found ${actions.length}`);
  const order = actions.map((a) => {
    const bytes: Uint8Array = a.proof?.serialize?.() ?? new Uint8Array();
    // A Bytes<32> circuit input is carried as two field elements: the first 31 bytes, then the last byte.
    const hits = markers.map((m, k) => (indexOfBytes(bytes, m.length > 31 ? m.subarray(0, 31) : m) >= 0 ? k : -1)).filter((k) => k >= 0);
    if (hits.length !== 1) throw new SingleIntentError(`cannot place a call in order (${hits.length} matches)`);
    return hits[0];
  });
  if (new Set(order).size !== order.length) throw new SingleIntentError('two calls matched the same position');
  const sorted = actions.map((a, i) => ({ a, k: order[i] })).sort((x, y) => x.k - y.k).map((x) => x.a);
  const target = all[0];
  target.actions = sorted;
  const g = all.flatMap((i) => i.guaranteedUnshieldedOffer?.outputs ?? []);
  const f = all.flatMap((i) => i.fallibleUnshieldedOffer?.outputs ?? []);
  target.guaranteedUnshieldedOffer = g.length ? UnshieldedOffer.new([], g, []) : undefined;
  target.fallibleUnshieldedOffer = f.length ? UnshieldedOffer.new([], f, []) : undefined;
  target.ttl = new Date(Math.min(...all.map((i) => (i.ttl as Date).getTime())));
  tx.intents = new Map([[segs[0], target]]);
  return tx;
}

/** Same, on a Midnight.js LedgerTransaction handle ('v9', 'Unproven'). */
export function mergeLedgerTxIntoOneIntent(handle: any, markers: Uint8Array[], LT: { seal: (...a: any[]) => any }): any {
  const tx = handle.deserialize({ v9: Transaction });
  const before = tx.intents?.size ?? 0;
  if (before <= 1) return handle;
  return LT.seal('v9', 'Unproven', mergeCallsIntoOneIntent(tx, markers));
}
