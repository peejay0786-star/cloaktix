/** Read an indexed schema without signing. Unknown/unreadable state is never guessed to be a supported schema. */
import { readContractState } from './contractStateRead';
import { ledgerV2 } from './contract-v2';
import { ledgerV3 } from './contract-v3';
import { ledgerV4 } from './contract-v4';

export async function detectOnChainSchema(
  publicDataProvider: { queryContractState: (a: string) => Promise<any> },
  contract: string,
): Promise<1 | 2 | 3 | 4 | null> {
  try {
    const state = await readContractState(publicDataProvider, contract);
    if (!state) return null;
    try {
      if (Number(ledgerV4(state.data).schemaVersion) === 4) return 4;
    } catch { /* v4 has a separate generated decoder; never infer a version from a failed decode. */ }
    try {
      if (Number(ledgerV3(state.data).schemaVersion) === 3) return 3;
    } catch { /* Try the older reader only after v3 did not match. */ }
    try {
      const version = Number(ledgerV2(state.data).schemaVersion);
      if (version === 3) return 3;
      if (version === 2) return 2;
      if (version === 1) return 1;
    } catch { /* Not readable as a versioned ledger. */ }
    return null;
  } catch {
    return null;
  }
}
