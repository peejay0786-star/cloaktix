// SPDX-License-Identifier: Apache-2.0
import { CompiledContract } from '@midnight-ntwrk/midnight-js-protocol/compact-js';
import path from 'node:path';
export { Contract, ledger, pureCircuits, type Ledger } from './managed/cloaktix/contract/index.js';
import { Contract } from './managed/cloaktix/contract/index.js';
import { witnesses } from './witnesses.js';
const currentDir = path.resolve(new URL(import.meta.url).pathname, '..');
export const zkConfigPath = path.resolve(currentDir, 'managed', 'cloaktix');
export const CompiledCloakTix = CompiledContract.make('CloakTix', Contract).pipe(
  CompiledContract.withWitnesses(witnesses),
  CompiledContract.withCompiledFileAssets(zkConfigPath),
);
