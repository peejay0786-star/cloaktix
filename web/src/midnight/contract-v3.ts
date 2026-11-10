/** Schema v3 (USD rate quotes, NIGHT payments). Feature-gated; never the default. */
import { CompiledContract } from '@midnight-ntwrk/compact-js';
import {
  Contract,
  ledger,
  pureCircuits,
  TicketStatus,
  type Ledger,
} from '../../../contract/managed/cloaktix-rate-v3/contract/index.js';
import { witnesses, type CloakPrivateState } from '../../../contract/witnesses-rate-v3.ts';

export {
  ledger as ledgerV3,
  pureCircuits as pureCircuitsV3,
  TicketStatus as TicketStatusV3,
  type Ledger as LedgerV3,
  type CloakPrivateState as CloakPrivateStateV3,
};

export const ZK_ASSETS_PATH_V3 = (import.meta.env.VITE_ZK_ASSETS_PATH_V3 as string) ?? 'managed/cloaktix-rate-v3';
export const PRIVATE_STATE_ID_V3 = 'cloaktix-rate-v3';
export const FEE_BPS_V3 = 300n;
export const MAX_QUOTE_AGE = 180n;
export const SLIPPAGE_BPS = 100n;
export const MAX_ADA_ATTEST_AGE = 300n;

/** Live rateSigner Jubjub pk. Public; SK stays in Worker secret. */
export const RATE_SIGNER_PK = {
  x: BigInt('0x6c6f6bdd5693bfbf50e134c283f6fc33fd87ee828e23a800c62b77227b71dd97'),
  y: BigInt('0x25473d932086847fcac8c163d4c693fdbf209f29115b2726c9a482b63ef35f3e'),
};

export function createPrivateStateV3(sk: Uint8Array, age?: CloakPrivateState['age']): CloakPrivateState {
  return { sk, age: age ?? null };
}

export const CompiledCloakTixV3 = CompiledContract.make('CloakTixRateV3', Contract).pipe(
  CompiledContract.withWitnesses(witnesses as never),
  CompiledContract.withCompiledFileAssets(ZK_ASSETS_PATH_V3),
);

/** True when a v3 contract address is configured (env or localStorage for this network). */
export function isV3ContractConfigured(networkId: string): boolean {
  // Must use import.meta.env.VITE_* literally so Vite inlines at build time.
  const env = import.meta.env.VITE_RATE_V3_CONTRACT as string | undefined;
  if (env && /^[0-9a-fA-F]{64}$/.test(env.replace(/^0x/, ''))) return true;
  try {
    const k = `cloaktix:l9:contract:s3:${networkId}`;
    const v = localStorage.getItem(k);
    if (v && /^[0-9a-fA-F]{64}$/.test(v.replace(/^0x/, ''))) return true;
  } catch { /* ignore */ }
  return false;
}

/** Hex address from VITE_RATE_V3_CONTRACT or localStorage `cloaktix:l9:contract:s3:<network>`. */
export function configuredRateV3Contract(networkId: string): string | null {
  const env = import.meta.env.VITE_RATE_V3_CONTRACT as string | undefined;
  if (env && /^[0-9a-fA-F]{64}$/.test(env.replace(/^0x/, ''))) return env.replace(/^0x/, '').toLowerCase();
  try {
    const v = localStorage.getItem(`cloaktix:l9:contract:s3:${networkId}`);
    if (v && /^[0-9a-fA-F]{64}$/.test(v.replace(/^0x/, ''))) return v.replace(/^0x/, '').toLowerCase();
  } catch { /* ignore */ }
  return null;
}
