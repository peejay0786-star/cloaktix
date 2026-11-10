import { walletAdapters } from './walletAdapter';
// Shell-safe helpers: no Midnight WASM / ledger imports. Safe to load before Connect.
import type { Wallet } from './types';
export type { Wallet };
export { STAR_PER_NIGHT } from './star';
export const AGE_NOTE = 'Age verification will use Midnight Passport once it launches. Demo uses a test issuer.';

export function discoverWallets(): Wallet[] {
  return walletAdapters('midnight' in window ? window.midnight : undefined);
}
