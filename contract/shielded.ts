// SPDX-License-Identifier: Apache-2.0
// Variante shielded (wNIGHT). TESTNET/LOCAL ONLY.
import { CompiledContract } from '@midnight-ntwrk/midnight-js-protocol/compact-js';
import path from 'node:path';
export { Contract, ledger, pureCircuits, type Ledger } from './managed/cloaktix-shielded/contract/index.js';
import { Contract } from './managed/cloaktix-shielded/contract/index.js';
import { witnesses } from './witnesses.js';
const currentDir = path.resolve(new URL(import.meta.url).pathname, '..');
export const zkConfigPathShielded = path.resolve(currentDir, 'managed', 'cloaktix-shielded');
export const CompiledCloakTixShielded = CompiledContract.make('CloakTixShielded', Contract).pipe(
  CompiledContract.withWitnesses(witnesses as any),
  CompiledContract.withCompiledFileAssets(zkConfigPathShielded),
);
