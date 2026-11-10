// Dev wallet — LOCAL DEVNET ONLY. Exposes the same DApp Connector v4 interface as 1AM/Lace
// under window.midnight. Balancing/signing/submission: Node bridge (public genesis seeds).
// ZK proofs: generated HERE, in the browser (WASM zkir-v2), as a wallet would.
import { proofLog } from './proofLog';
export { proofLog };
type DappKMP = { getZKIR(l: string): Promise<Uint8Array>; getProverKey(l: string): Promise<Uint8Array>; getVerifierKey(l: string): Promise<Uint8Array> };
const T0 = () => performance.now();
const tlog = (what: string, t: number) => console.log(`[t] ${new Date().toISOString().slice(11, 23)} ${what} ${Math.round(performance.now() - t)} ms`);
const b64d = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
let zkir: Promise<any> | null = null;
function loadZkir() {
  zkir ??= (async () => {
    const url = ['/zk', 'zkir', 'midnight_zkir_wasm_bg.js'].join('/'); // outside the Vite graph: served by the bridge
    const bg: any = await import(/* @vite-ignore */ url);
    const bytes = await (await fetch('/zk/zkir/midnight_zkir_wasm_bg.wasm')).arrayBuffer();
    const { instance } = await WebAssembly.instantiate(bytes, { './midnight_zkir_wasm_bg.js': bg });
    bg.__wbg_set_wasm(instance.exports); (instance.exports as any).__wbindgen_start();
    return bg;
  })();
  return zkir;
}
async function rpc(role: string, method: string, args: unknown[] = []) {
  const r = await fetch(`/devwallet/${role}/${method}`, { method: 'POST', body: JSON.stringify(args) });
  const j = await r.json();
  if (j.error) throw new Error(j.error);
  return j.ok;
}
function connected(role: string) {
  const api: any = {
    getConfiguration: () => rpc(role, 'getConfiguration'),
    getConnectionStatus: () => rpc(role, 'getConnectionStatus'),
    getUnshieldedAddress: () => rpc(role, 'getUnshieldedAddress'),
    getShieldedAddresses: () => rpc(role, 'getShieldedAddresses'),
    getUnshieldedBalances: async () => Object.fromEntries(Object.entries(await rpc(role, 'getUnshieldedBalances')).map(([k, v]) => [k, BigInt(v as string)])),
    getDustBalance: async () => { const d = await rpc(role, 'getDustBalance'); return { balance: BigInt(d.balance), cap: 0n }; },
    balanceUnsealedTransaction: async (tx: string) => { const t = T0(); const r = await rpc(role, 'balanceUnsealedTransaction', [tx]); tlog('balance+sign', t); return r; },
    submitTransaction: async (tx: string) => { const t = T0(); const r = await rpc(role, 'submitTransaction', [tx]); tlog('submit', t); return r; },
    getProvingProvider: async (kmp: DappKMP) => {
      const bg = await loadZkir();
      const keys = {
        lookupKey: async (loc: string) => {
          if (loc.startsWith('midnight/')) { // public ledger keys (zswap/dust)
            const r = await fetch('/zk/km?loc=' + encodeURIComponent(loc)); if (r.status === 404) return undefined;
            const j = await r.json(); return { proverKey: b64d(j.proverKey), verifierKey: b64d(j.verifierKey), ir: b64d(j.ir) };
          }
          const t = T0(); const r = { proverKey: await kmp.getProverKey(loc), verifierKey: await kmp.getVerifierKey(loc), ir: await kmp.getZKIR(loc) };
          tlog(`keys ${loc} (${r.proverKey.length} B)`, t); return r;
        },
        getParams: async (k: number) => { const t = T0(); const r = new Uint8Array(await (await fetch('/zk/params/' + k)).arrayBuffer()); tlog(`params 2^${k}`, t); return r; },
      };
      return {
        check: async (pre: Uint8Array, loc: string) => { const t = T0(); const r = await bg.check(pre, keys); tlog(`check ${loc}`, t); return r; },
        prove: async (pre: Uint8Array, loc: string, ob?: bigint) => {
          const t = performance.now(); const p = await bg.prove(pre, keys, ob);
          proofLog.push({ loc, ms: Math.round(performance.now() - t) });
          console.log(`[zk] browser proof ${loc} ${Math.round(performance.now() - t)} ms`);
          return p;
        },
      };
    },
  };
  return api;
}
export const DEV_ROLES = [
  { role: 'ALICE', label: 'Alice — organizer' },
  { role: 'CHARLIE', label: 'Charlie — fan' },
  { role: 'BOB', label: 'Bob — resale buyer' },
];
export async function installDevWallets() {
  if (!['localhost', '127.0.0.1'].includes(location.hostname)) return;
  try { if (!(await fetch('/devwallet/ALICE/getConnectionStatus', { method: 'POST' })).ok) return; } catch { return; }
  const w: any = ((window as any).midnight ??= {});
  for (const { role, label } of DEV_ROLES) {
    w['cloaktix-dev-' + role.toLowerCase()] = {
      rdns: 'local.cloaktix.devwallet.' + role.toLowerCase(), name: `Dev wallet · ${label}`, apiVersion: '4.0.1',
      icon: '/brand/cloaktix_icon.svg', dev: true,
      connect: async (networkId: string) => {
        if (networkId !== 'undeployed') throw new Error('Dev wallet: local devnet only');
        return connected(role);
      },
    };
  }
}
