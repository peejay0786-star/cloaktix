export type WalletAdapter = {
  name: string;
  rdns: string;
  icon?: string;
  dev?: boolean;
  connect(network: string): Promise<unknown>;
};

/** Do not inherit from or mutate extension objects: they may be frozen. */
export function walletAdapters(source: unknown): WalletAdapter[] {
  if (!source || typeof source !== 'object') return [];
  const wallets: WalletAdapter[] = [];
  // A broken extension getter must not hide the other installed wallets.
  for (const key of Object.keys(source)) {
    try {
      const value: unknown = Reflect.get(source, key);
      if (!value || typeof value !== 'object' || !('connect' in value) || typeof value.connect !== 'function') continue;
      if (key !== '1am' && !('apiVersion' in value && String(value.apiVersion).startsWith('4'))) continue;
      const connect = value.connect;
      wallets.push({
        name: 'name' in value && typeof value.name === 'string' ? value.name : key === '1am' ? '1AM' : key,
        rdns: 'rdns' in value && typeof value.rdns === 'string' ? value.rdns : key === '1am' ? 'xyz.1am' : key,
        ...('icon' in value && typeof value.icon === 'string' ? { icon: value.icon } : {}),
        ...('dev' in value && value.dev === true ? { dev: true } : {}),
        connect: network => Promise.resolve(Reflect.apply(connect, value, [network])),
      });
    } catch { /* Skip only this malformed connector; discovery continues. */ }
  }
  const rank = (wallet: WalletAdapter) => /1am/i.test(wallet.name + wallet.rdns) ? 0 : /lace/i.test(wallet.name + wallet.rdns) ? 1 : 2;
  return wallets.sort((a, b) => rank(a) - rank(b));
}
