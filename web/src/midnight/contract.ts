// Simple contract (pseudonymous, unshielded NIGHT payments). The shielded variant is the advanced option.
import { CompiledContract } from '@midnight-ntwrk/compact-js';
import { Contract, ledger, pureCircuits, type Ledger } from '../../../contract/managed/cloaktix/contract/index.js';
import { witnesses, createPrivateState, type CloakPrivateState } from '../../../contract/witnesses.js';
import { createCircuitContext } from '@midnight-ntwrk/compact-runtime';
export { ledger, pureCircuits, createPrivateState, type Ledger, type CloakPrivateState };
// Read-only local run of the balanceOf circuit against indexed state (no proof, no tx): ticket balances are in the
// OZ MultiToken ledger, which the generated Ledger type does not expose.
const readOnly = new Contract(witnesses as any);
export async function balanceOfLocal(contractAddress: string, state: any, sk: Uint8Array, typeId: bigint): Promise<bigint> {
  const ctx = createCircuitContext({ circuitId: 'balanceOf' as any, contractAddress, coinPublicKeyOrZswapState: '00'.repeat(32), contractState: state, privateState: createPrivateState(sk) as any });
  const acct = { is_left: true, left: pureCircuits.accountId(sk), right: { bytes: new Uint8Array(32) } };
  return (await (readOnly.circuits as any).balanceOf(ctx, acct, typeId)).result as bigint; // compact-runtime 0.21: circuits are async
}
// Versioned so browsers never reuse a stale cached artifact; the preview Worker maps /zkv/<v>/managed/* to /managed/*.
export const ZK_ASSETS_PATH = (import.meta.env.VITE_ZK_ASSETS_PATH as string) ?? 'managed/cloaktix';
export const PRIVATE_STATE_ID = 'cloaktix';
export const FEE_BPS = 300n;
export const STAR_PER_NIGHT = 1_000_000n;
export const CompiledCloakTix = CompiledContract.make('CloakTix', Contract).pipe(
  CompiledContract.withWitnesses(witnesses as any),
  CompiledContract.withCompiledFileAssets(ZK_ASSETS_PATH),
);
