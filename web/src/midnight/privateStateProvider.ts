/**
 * Midnight.js 5 PrivateStateProvider for the browser.
 *
 * Midnight.js 5 scopes private state per contract: every read/write goes through
 * `forContract(address)` (deployContract stores the constructor's state there AFTER the deploy
 * lands; submitCallTx reads it there before proving and writes nextPrivateState there after).
 *
 * CloakTix private state is fully determined by (sk, age credential), the same for every contract,
 * and is known before a contract address exists. So the app seeds it once with `seed(id, state)`:
 * a seeded state is the fallback for any contract that has no state of its own under that id, and
 * re-seeding also overwrites every per-contract copy under that id (age credential added/removed).
 * Private states stay in memory only (they hold sk; sk itself is already persisted by Session).
 *
 * Signing keys (the contract maintenance authority, needed for submitInsertVerifierKeyTx in the
 * batched v3 deploy) are persisted in `storage` so a reload between deploy steps does not orphan
 * a half-deployed contract. Addresses are compared in lower case, as the interface requires.
 */
import type { ContractPrivateStates, PrivateStateProvider } from '@midnight-ntwrk/midnight-js-types';

type SigningKey = { tag: string; value: string };
type KV = Pick<Storage, 'getItem' | 'setItem' | 'removeItem' | 'key' | 'length'>;

export type CloakPrivateStateProvider = PrivateStateProvider<string, any> & {
  /** Unscoped seed: fallback for every contract, and overwrite of existing per-contract copies. */
  seed(privateStateId: string, state: any): void;
};

const norm = (a: string) => String(a).replace(/^0x/i, '').toLowerCase();
const notSupported = (what: string) => async (): Promise<never> => {
  throw new Error(`${what} is not supported by the CloakTix browser private-state provider`);
};

export const signingKeyStorageKey = (networkId: string, address: string) =>
  `cloaktix:l9:signing-key:${networkId}:${norm(address)}`;

function memoryStorage(): KV {
  const m = new Map<string, string>();
  return {
    getItem: (k) => (m.has(k) ? m.get(k)! : null),
    setItem: (k, v) => void m.set(k, String(v)),
    removeItem: (k) => void m.delete(k),
    key: (i) => [...m.keys()][i] ?? null,
    get length() { return m.size; },
  };
}

function isSigningKey(v: any): v is SigningKey {
  return v && typeof v === 'object' && typeof v.tag === 'string' && typeof v.value === 'string';
}

export function createCloakPrivateStateProvider(opts: { networkId: string; storage?: KV | null }): CloakPrivateStateProvider {
  const storage: KV = opts.storage ?? memoryStorage();
  const prefix = `cloaktix:l9:signing-key:${opts.networkId}:`;
  const seeds = new Map<string, any>();
  const states = new Map<string, Map<string, any>>(); // address -> (privateStateId -> state)

  const view = (contractAddress: string): ContractPrivateStates<string, any> => {
    const address = norm(contractAddress);
    const own = () => {
      let m = states.get(address);
      if (!m) { m = new Map(); states.set(address, m); }
      return m;
    };
    return {
      contractAddress: address as any,
      set: async (id, state) => { own().set(id, state); },
      get: async (id) => {
        const m = states.get(address);
        const v = m && m.has(id) ? m.get(id) : seeds.get(id);
        return v === undefined ? null : v;
      },
      remove: async (id) => { states.get(address)?.delete(id); },
      clear: async () => { states.delete(address); },
      exportPrivateStates: notSupported('exportPrivateStates') as any,
      importPrivateStates: notSupported('importPrivateStates') as any,
    };
  };

  return {
    seed(id, state) {
      seeds.set(id, state);
      for (const m of states.values()) if (m.has(id)) m.set(id, state);
    },
    forContract: (a) => view(a),
    clearAll: async () => { states.clear(); seeds.clear(); },
    setSigningKey: async (a, k) => {
      if (!isSigningKey(k)) throw new Error('setSigningKey: not a signing key');
      storage.setItem(signingKeyStorageKey(opts.networkId, a), JSON.stringify({ tag: k.tag, value: k.value }));
    },
    getSigningKey: async (a) => {
      const raw = storage.getItem(signingKeyStorageKey(opts.networkId, a));
      if (!raw) return null;
      try { const k = JSON.parse(raw); return isSigningKey(k) ? (k as any) : null; } catch { return null; }
    },
    removeSigningKey: async (a) => { storage.removeItem(signingKeyStorageKey(opts.networkId, a)); },
    clearSigningKeys: async () => {
      const ks: string[] = [];
      for (let i = 0; i < storage.length; i++) { const k = storage.key(i); if (k && k.startsWith(prefix)) ks.push(k); }
      ks.forEach((k) => storage.removeItem(k));
    },
    exportSigningKeys: notSupported('exportSigningKeys') as any,
    importSigningKeys: notSupported('importSigningKeys') as any,
  };
}

/** Pending deploy signing key: persisted BEFORE the deploy tx is built, so a landed deploy is never unmaintainable. */
export const pendingDeployKeyStorageKey = (networkId: string) => `cloaktix:l9:v3-deploy-pending-signing-key:${networkId}`;
export function loadPendingDeployKey(networkId: string, storage: KV): SigningKey | null {
  try { const k = JSON.parse(storage.getItem(pendingDeployKeyStorageKey(networkId)) ?? 'null'); return isSigningKey(k) ? k : null; } catch { return null; }
}
export function getOrCreatePendingDeployKey(networkId: string, storage: KV, sample: () => SigningKey): SigningKey {
  const existing = loadPendingDeployKey(networkId, storage);
  if (existing) return existing;
  const k = sample();
  storage.setItem(pendingDeployKeyStorageKey(networkId), JSON.stringify({ tag: k.tag, value: k.value }));
  return k;
}
export function clearPendingDeployKey(networkId: string, storage: KV) {
  storage.removeItem(pendingDeployKeyStorageKey(networkId));
}
