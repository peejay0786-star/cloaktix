// Lazy Midnight SDK (WASM ledger). Loaded only when the user connects a wallet.
export type CloakSdk = typeof import('./cloaktix');
let cached: CloakSdk | null = null;
let pending: Promise<CloakSdk> | null = null;

export function sdkReady(): boolean { return !!cached; }
export function sdkOrThrow(): CloakSdk {
  if (!cached) throw new Error('Midnight SDK is not loaded yet. Connect a wallet first.');
  return cached;
}

export function loadSdk(): Promise<CloakSdk> {
  if (cached) return Promise.resolve(cached);
  pending ??= import('./cloaktix')
    .then((m) => { cached = m; return m; })
    .catch((e) => { pending = null; throw e; });
  return pending;
}
