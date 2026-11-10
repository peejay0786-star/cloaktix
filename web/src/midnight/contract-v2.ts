// Schema v2 compiled contract (unique serials + admit). Isolated from v1 MultiToken artifacts.
import { CompiledContract } from '@midnight-ntwrk/compact-js';
import {
  Contract,
  ledger,
  pureCircuits,
  TicketStatus,
  type Ledger,
} from '../../../contract/managed/cloaktix-v2/contract/index.js';
import { witnesses, createPrivateState, type CloakPrivateState } from '../../../contract/witnesses-v2.js';

export {
  ledger as ledgerV2,
  pureCircuits as pureCircuitsV2,
  createPrivateState as createPrivateStateV2,
  TicketStatus,
  type Ledger as LedgerV2,
  type CloakPrivateState as CloakPrivateStateV2,
};

// Versioned path; preview Worker would need a separate map — local builds use this folder only.
export const ZK_ASSETS_PATH_V2 = (import.meta.env.VITE_ZK_ASSETS_PATH_V2 as string) ?? 'managed/cloaktix-v2';
export const PRIVATE_STATE_ID_V2 = 'cloaktix-v2';
export const FEE_BPS_V2 = 300n;

export const CompiledCloakTixV2 = CompiledContract.make('CloakTixV2', Contract).pipe(
  CompiledContract.withWitnesses(witnesses as never),
  CompiledContract.withCompiledFileAssets(ZK_ASSETS_PATH_V2),
);
