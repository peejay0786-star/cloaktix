// CT-PROOF-SPEED: when the buyer opens Checkout, fetch the buy circuit's keys (into memory + Cache Storage) and warm the
// in-tab prover (WASM + SRS) while they read the panel. Read-only: no wallet call, no state change, nothing signed.
import { ZK_ASSETS_PATH_V3 } from './contract-v3';
import { sharedZkFetch } from './zkFetch.ts';
import { warmLocalProver } from './localProver.ts';
import { RATE_V3_K } from './zkirV3Protocol.ts';

const started = new Set<string>();
export function prewarmV3Circuit(circuit: string): void {
  if (started.has(circuit) || typeof window === 'undefined') return;
  started.add(circuit);
  const base = new URL(ZK_ASSETS_PATH_V3, window.location.origin).toString();
  const zf = sharedZkFetch(base, fetch.bind(window));
  const k = RATE_V3_K[circuit];
  void Promise.allSettled([
    zf.prefetch([`keys/${circuit}.verifier`, `zkir/${circuit}.bzkir`, `keys/${circuit}.prover`]),
    k ? warmLocalProver([k]) : Promise.resolve(false),
  ]).then((r) => { if (r.some((x) => x.status === 'rejected')) started.delete(circuit); });
}
