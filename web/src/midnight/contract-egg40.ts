/**
 * EGG-40 contract bindings (schemaVersion stays 3; ADA removed; door keys + admitByDoor4).
 * Ledger shape differs from the live rate-v3 contract, so this is a separate compiled package.
 * Address is VITE_EGG40_CONTRACT (placeholder until P-Jay deploys).
 */
export {
  PRIVATE_STATE_ID_EGG40, FEE_BPS_EGG40, MAX_QUOTE_AGE_EGG40, SLIPPAGE_BPS_EGG40, SETTLEMENT_GATE_ID,
  normalizedEgg40Address, configuredEgg40Contract, isEgg40Contract,
} from './contract-egg40-meta';
import { CompiledContract } from '@midnight-ntwrk/compact-js';
import {
  Contract, ledger, pureCircuits, TicketStatus, type Ledger,
} from '../../../contract/managed/cloaktix-egg40/contract/index.js';
import { witnesses, type CloakPrivateState } from '../../../contract/witnesses-egg40.ts';

export {
  ledger as ledgerEgg40,
  pureCircuits as pureCircuitsEgg40,
  TicketStatus as TicketStatusEgg40,
  type Ledger as LedgerEgg40,
  type CloakPrivateState as CloakPrivateStateEgg40,
};

export const ZK_ASSETS_PATH_EGG40 = (import.meta.env.VITE_ZK_ASSETS_PATH_EGG40 as string) ?? 'managed/cloaktix-egg40';

export function createPrivateStateEgg40(sk: Uint8Array, age?: CloakPrivateState['age'], doorSk?: Uint8Array | null): CloakPrivateState {
  return { sk, age: age ?? null, doorSk: doorSk ?? null };
}

export const CompiledCloakTixEgg40 = CompiledContract.make('CloakTixEgg40', Contract).pipe(
  CompiledContract.withWitnesses(witnesses as never),
  CompiledContract.withCompiledFileAssets(ZK_ASSETS_PATH_EGG40),
);
