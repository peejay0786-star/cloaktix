/**
 * Midnight.js 5 `PublicDataProvider.queryContractState` no longer returns a decoded ContractState.
 * It returns a read record `{ protocolVersion, contractState: SerializedContractState, ledgerParameters }`
 * and leaves decoding to the caller's runtime. Every CloakTix ledger read goes through here so
 * `.data` / `.operation()` / `.maintenanceAuthority` work again. A pre-decoded ContractState (tests,
 * older providers) passes through unchanged.
 */
import { ContractState } from '@midnight-ntwrk/compact-runtime';

export function toContractState(read: any): ContractState | null {
  if (read == null) return null;
  if (typeof read.operation === 'function' && 'data' in read) return read as ContractState;
  const s = read.contractState ?? read;
  if (s && typeof s.operation === 'function' && 'data' in s) return s as ContractState;
  if (s && typeof s.serialize === 'function') {
    if (s.era !== undefined && s.era !== 'v9')
      throw new Error(`Contract state is from ledger era ${String(s.era)}; this app reads ledger 9 (v9) state only`);
    return ContractState.deserialize(s.serialize());
  }
  // Test doubles / legacy shapes that only carry `.data`.
  if (s && typeof s === 'object' && 'data' in s) return s as ContractState;
  throw new Error('Unrecognised contract state read from the public data provider');
}

export async function readContractState(
  publicDataProvider: { queryContractState: (address: string) => Promise<any> },
  address: string,
): Promise<ContractState | null> {
  return toContractState(await publicDataProvider.queryContractState(address));
}
