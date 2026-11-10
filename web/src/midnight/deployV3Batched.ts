/**
 * Schema v3 batched deploy — Preview block-limit safe.
 *
 * Deploy tx carries a subset of verifier keys; remaining VKs via submitInsertVerifierKeyTx.
 * Critical: deferred circuits must NOT appear as empty ContractOperation slots in the deploy
 * state (Custom error 110 = MalformedError::VerifierKeyNotSet).
 *
 * Between wallet steps: wait until the previous tx is reflected on-chain (circuit op present)
 * before prompting the next — avoids 1AM "there is already a pending transaction".
 * On that wallet error: auto-wait and retry the prompt.
 *
 * Resume syncs done/pending from on-chain operations() so a finished step 2 only runs step 3.
 */
import { readContractState } from './contractStateRead';
import { ContractState } from '@midnight-ntwrk/compact-runtime';
import {
  deployContract,
  submitInsertVerifierKeyTx,
} from '@midnight-ntwrk/midnight-js-contracts';
import {
  CompiledCloakTixV3,
  PRIVATE_STATE_ID_V3,
  FEE_BPS_V3,
  MAX_QUOTE_AGE,
  SLIPPAGE_BPS,
  MAX_ADA_ATTEST_AGE,
  RATE_SIGNER_PK,
  createPrivateStateV3,
  pureCircuitsV3,
  ZK_ASSETS_PATH_V3,
} from './contract-v3';
import { networkTagBytes } from './schema';
import { sampleSigningKey, signatureVerifyingKey } from '@midnight-ntwrk/compact-runtime';
import { getOrCreatePendingDeployKey, loadPendingDeployKey, clearPendingDeployKey } from './privateStateProvider';
import type { SessionV3Host } from './session-v3';
import {
  planV3DeploySteps,
  loadV3DeployProgress,
  saveV3DeployProgress,
  insertBatches,
  V3_INSERT_BATCH_SIZE,
  V3_CIRCUIT_ORDER,
  compiledContractForVkSubset,
  withOmittingEmptyDeferredOps,
  reconcileV3ProgressFromOnChain,
  resolveV3DeployResume,
} from './deployV3Plan';

export {
  V3_CIRCUIT_ORDER,
  V3_DEPLOY_FIRST_COUNT,
  V3_INSERT_BATCH_SIZE,
  V3_DEPLOY_PROGRESS_KEY,
  planV3DeploySteps,
  loadV3DeployProgress,
  saveV3DeployProgress,
  clearV3DeployProgress,
  compactContextSymbol,
  compiledContractForVkSubset,
  withOmittingEmptyDeferredOps,
  operationEntryName,
  reconcileV3ProgressFromOnChain,
  isPendingTxWalletError,
  type V3DeployProgress,
} from './deployV3Plan';

export type DeployStepEvent = {
  step: number;
  totalSteps: number;
  label: string;
  detail?: string;
};

import { sleep, withPendingRetry } from './walletPending';

async function fetchVerifierKey(circuitId: string): Promise<Uint8Array> {
  const base = new URL(ZK_ASSETS_PATH_V3.replace(/\/?$/, '/'), window.location.origin);
  const url = new URL(`keys/${circuitId}.verifier`, base);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Missing verifier key for ${circuitId} (${res.status})`);
  return new Uint8Array(await res.arrayBuffer());
}

/** Circuits that currently have an operation registered on-chain (VK installed). */
export async function listOnChainVkCircuits(
  publicDataProvider: { queryContractState: (a: string) => Promise<{ data?: unknown } | null | any> },
  address: string,
): Promise<string[]> {
  const cs = await readContractState(publicDataProvider, address);
  if (!cs) return [];
  // compact-runtime / ledger ContractState
  const ops: string[] = typeof cs.operations === 'function'
    ? cs.operations().map(String)
    : [];
  // Some providers return a wrapper; try .data path via operation()
  const present: string[] = [];
  for (const id of V3_CIRCUIT_ORDER) {
    try {
      const op = typeof cs.operation === 'function' ? cs.operation(id) : undefined;
      if (op) present.push(id);
    } catch { /* ignore */ }
  }
  if (present.length) return present;
  return ops.filter((id) => (V3_CIRCUIT_ORDER as readonly string[]).includes(id));
}

/** Poll until every circuitId is present on-chain (or timeout). */
async function waitForCircuitsOnChain(
  publicDataProvider: { queryContractState: (a: string) => Promise<any> },
  address: string,
  circuitIds: readonly string[],
  opts: {
    onWait?: (detail: string) => void;
    timeoutMs?: number;
    pollMs?: number;
  } = {},
): Promise<void> {
  const timeoutMs = opts.timeoutMs ?? 180_000;
  const pollMs = opts.pollMs ?? 2_500;
  const need = new Set(circuitIds.map(String));
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const have = new Set(await listOnChainVkCircuits(publicDataProvider, address));
    const missing = [...need].filter((id) => !have.has(id));
    if (missing.length === 0) {
      // Extra beat so the wallet can clear its pending queue after indexer sees the tx.
      opts.onWait?.('On-chain confirmation seen, clearing wallet pending queue…');
      await sleep(4_000);
      return;
    }
    opts.onWait?.(`Waiting for on-chain confirmation of ${missing.join(', ')}…`);
    await sleep(pollMs);
  }
  throw new Error(`Timed out waiting for on-chain verifier keys: ${[...need].join(', ')}`);
}

export class MaintenanceKeyMissingError extends Error {
  constructor(public address: string, public missing: readonly string[]) {
    super(
      `The maintenance key of contract ${address.slice(0, 12)}… is not on this device, so its remaining ` +
      `verifier key(s) (${missing.join(', ')}) can never be installed. Deploy a new schema v3 contract instead.`,
    );
    this.name = 'MaintenanceKeyMissingError';
  }
}

/**
 * The batched deploy's inserts are signed with the contract's maintenance key. Find it in the
 * private-state provider; else adopt the pending pre-deploy key if the contract's on-chain
 * maintenance authority is that key; else refuse clearly (never prompt a doomed 1AM approval).
 */
async function ensureMaintenanceKey(
  host: SessionV3Host,
  address: string,
  storage: Storage,
  verifyingKeyOf: (k: { tag: string; value: string }) => { tag: string; value: string },
  missing: readonly string[],
): Promise<void> {
  const psp = host.P.privateStateProvider;
  if (await psp.getSigningKey(address)) return;
  const pending = loadPendingDeployKey(host.networkId, storage);
  if (pending) {
    const cs: any = await readContractState(host.P.publicDataProvider, address).catch(() => null);
    const committee: { tag: string; value: string }[] = cs?.maintenanceAuthority?.committee ?? [];
    const vk = verifyingKeyOf(pending);
    if (committee.some((c) => c.tag === vk.tag && c.value === vk.value)) {
      await psp.setSigningKey(address, pending);
      clearPendingDeployKey(host.networkId, storage);
      return;
    }
  }
  throw new MaintenanceKeyMissingError(address, missing);
}

export async function deployV3Batched(
  host: SessionV3Host,
  feeAddressBech: string,
  stubIssuer: () => Promise<{ x: bigint; y: bigint }>,
  opts?: {
    onStep?: (e: DeployStepEvent) => void;
    storage?: Storage;
    resume?: boolean;
    /** Create a replacement contract instead of resuming the already-connected one. */
    forceNew?: boolean;
    deployFn?: typeof deployContract;
    insertFn?: typeof submitInsertVerifierKeyTx;
    fetchVk?: typeof fetchVerifierKey;
    /** Injected for tests. */
    listOnChain?: typeof listOnChainVkCircuits;
    /** Injected for tests: signing-key sampler / verifying-key derivation. */
    sampleKey?: () => { tag: string; value: string };
    verifyingKeyOf?: (k: { tag: string; value: string }) => { tag: string; value: string };
    waitForCircuits?: typeof waitForCircuitsOnChain;
  },
): Promise<{ address: string; txIds: string[]; steps: number }> {
  const storage = opts?.storage ?? localStorage;
  const plan = planV3DeploySteps();
  const totalSteps = plan.totalSteps;
  const txIds: string[] = [];
  const doDeploy = opts?.deployFn ?? deployContract;
  const doInsert = opts?.insertFn ?? submitInsertVerifierKeyTx;
  const doFetchVk = opts?.fetchVk ?? fetchVerifierKey;
  const doList = opts?.listOnChain ?? listOnChainVkCircuits;
  const doWait = opts?.waitForCircuits ?? waitForCircuitsOnChain;
  const deferredIds = plan.insertBatches.flat();
  const notify = (step: number, label: string, detail?: string) =>
    opts?.onStep?.({ step, totalSteps, label, detail });
  const doSample = opts?.sampleKey ?? (sampleSigningKey as unknown as () => { tag: string; value: string });
  const doVk = opts?.verifyingKeyOf ?? (signatureVerifyingKey as unknown as (k: { tag: string; value: string }) => { tag: string; value: string });

  let progress = opts?.resume ? loadV3DeployProgress(host.networkId, storage) : null;
  const resumed = resolveV3DeployResume({ forceNew: opts?.forceNew, hostContract: host.contract, progress });
  progress = resumed.progress;
  const knownAddress = resumed.knownAddress;
  if (knownAddress && opts?.resume !== false) {
    try {
      const onChain = await doList(host.P.publicDataProvider, knownAddress);
      if (onChain.length) {
        progress = reconcileV3ProgressFromOnChain(knownAddress, onChain, progress);
        saveV3DeployProgress(host.networkId, progress, storage);
        if (!host.contract) (host as any).contract = knownAddress;
      }
    } catch (e) {
      console.warn('on-chain VK sync failed', e);
    }
  }

  if (progress?.status === 'done' && progress.address) {
    return { address: progress.address, txIds: progress.deployTxId ? [progress.deployTxId] : [], steps: totalSteps };
  }

  if (!progress?.address) {
    progress = {
      address: null,
      deployTxId: null,
      done: [],
      pending: deferredIds,
      step: 1,
      totalSteps,
      updatedAt: Date.now(),
      status: 'deploying',
      message: 'Deploy contract (partial verifier keys, no empty slots)',
    };
    saveV3DeployProgress(host.networkId, progress, storage);
  }

  if (!progress.address) {
    notify(1, `Step 1/${totalSteps}: Deploy contract`, `Confirm in 1AM: create contract with ${plan.deployCircuits.length} verifier keys.`);
    progress.status = 'deploying';
    progress.step = 1;
    progress.message = 'Waiting for 1AM deploy confirmation…';
    saveV3DeployProgress(host.networkId, progress, storage);

    const issuer = await stubIssuer();
    // Midnight.js 5 samples the maintenance key in memory and stores it only AFTER the deploy lands.
    // Persist it first, so a failure after submission never leaves an unmaintainable contract
    // (the remaining verifier keys need this key).
    const signingKey = getOrCreatePendingDeployKey(host.networkId, storage, doSample);
    const partialCompiled = compiledContractForVkSubset(CompiledCloakTixV3, plan.deployCircuits);

    const d: any = await withPendingRetry(
      'Step 1 deploy',
      () =>
        withOmittingEmptyDeferredOps(deferredIds, ContractState, () =>
          doDeploy(host.P, {
            compiledContract: partialCompiled,
            privateStateId: PRIVATE_STATE_ID_V3,
            initialPrivateState: createPrivateStateV3(host.sk, host.age as any),
            signingKey,
            args: [
              FEE_BPS_V3,
              host.userAddress(feeAddressBech),
              pureCircuitsV3.accountId(host.sk),
              issuer,
              RATE_SIGNER_PK,
              networkTagBytes(host.networkId),
              MAX_QUOTE_AGE,
              SLIPPAGE_BPS,
              MAX_ADA_ATTEST_AGE,
            ],
          } as any),
        ),
      (detail) => notify(1, `Step 1/${totalSteps}: Deploy contract`, detail),
    );

    const address = d.deployTxData.public.contractAddress as string;
    const deployTxId = d.deployTxData.public.txId as string;
    txIds.push(deployTxId);
    progress.address = address;
    progress.deployTxId = deployTxId;
    progress.done = [...plan.deployCircuits];
    progress.pending = deferredIds;
    progress.status = progress.pending.length ? 'inserting' : 'done';
    progress.updatedAt = Date.now();
    progress.message = 'Deploy submitted, waiting for inclusion…';
    saveV3DeployProgress(host.networkId, progress, storage);
    // deployContract stored the key under the new address; make sure, then drop the pending copy.
    if (!(await host.P.privateStateProvider.getSigningKey(address))) await host.P.privateStateProvider.setSigningKey(address, signingKey);
    clearPendingDeployKey(host.networkId, storage);

    await doWait(host.P.publicDataProvider, address, plan.deployCircuits, {
      onWait: (detail) => notify(1, `Step 1/${totalSteps}: Waiting for confirmation…`, detail),
    });
    progress.message = 'Deploy included on-chain';
    saveV3DeployProgress(host.networkId, progress, storage);
  }

  const address = progress.address!;
  // Re-sync pending from chain before inserts (handles partial prior run).
  try {
    const onChain = await doList(host.P.publicDataProvider, address);
    progress.done = V3_CIRCUIT_ORDER.filter((id) => onChain.includes(id)) as string[];
    progress.pending = V3_CIRCUIT_ORDER.filter((id) => !onChain.includes(id)) as string[];
    saveV3DeployProgress(host.networkId, progress, storage);
  } catch { /* keep local pending */ }

  if (progress.pending.length === 0) {
    progress.status = 'done';
    progress.step = totalSteps;
    progress.message = 'Schema v3 deploy complete';
    saveV3DeployProgress(host.networkId, progress, storage);
    notify(totalSteps, `Done: all verifier keys on-chain`, `Contract ${address.slice(0, 12)}…`);
    return { address, txIds, steps: totalSteps };
  }

  await ensureMaintenanceKey(host, address, storage, doVk, progress.pending);

  const stillPending = progress.pending.filter((id) => !progress!.done.includes(id));
  const batches = insertBatches(stillPending, V3_INSERT_BATCH_SIZE);
  // Step numbers: 1 = deploy, then inserts start at 2
  let step = 2;
  for (const batch of batches) {
    notify(
      step,
      `Step ${step}/${totalSteps}: Install verifier keys`,
      `Confirm in 1AM: insert ${batch.join(', ')}.`,
    );
    progress.status = 'inserting';
    progress.step = step;
    progress.message = `Waiting for 1AM: ${batch.join(', ')}`;
    saveV3DeployProgress(host.networkId, progress, storage);

    for (const circuitId of batch) {
      // Skip if already on-chain (race / prior partial success).
      const have = await doList(host.P.publicDataProvider, address);
      if (have.includes(circuitId)) {
        progress.done = [...new Set([...progress.done, circuitId])];
        progress.pending = progress.pending.filter((x) => x !== circuitId);
        saveV3DeployProgress(host.networkId, progress, storage);
        continue;
      }

      const vk = await doFetchVk(circuitId);
      const finalized = await withPendingRetry(
        `Step ${step} insert ${circuitId}`,
        () =>
          doInsert(
            host.P,
            CompiledCloakTixV3 as any,
            address,
            circuitId as any,
            vk as any,
          ),
        (detail) => notify(step, `Step ${step}/${totalSteps}: Waiting for confirmation…`, detail),
      );
      // Midnight.js 5: Ledger9FinalizedMaintenanceTxData = { era, public: FinalizedTxData }.
      const fin = finalized as unknown as { txId?: string; public?: { txId?: string } };
      txIds.push((fin.public?.txId ?? fin.txId) as string);
      progress.message = `Submitted ${circuitId}, waiting for inclusion…`;
      saveV3DeployProgress(host.networkId, progress, storage);

      await doWait(host.P.publicDataProvider, address, [circuitId], {
        onWait: (detail) => notify(step, `Step ${step}/${totalSteps}: Waiting for confirmation…`, detail),
      });

      progress.done = [...new Set([...progress.done, circuitId])];
      progress.pending = progress.pending.filter((x) => x !== circuitId);
      progress.updatedAt = Date.now();
      saveV3DeployProgress(host.networkId, progress, storage);
    }
    step++;
  }

  progress.status = 'done';
  progress.step = totalSteps;
  progress.message = 'Schema v3 deploy complete';
  progress.pending = [];
  progress.updatedAt = Date.now();
  saveV3DeployProgress(host.networkId, progress, storage);
  notify(totalSteps, `Done: ${totalSteps} wallet confirmation(s)`, `Contract ${address.slice(0, 12)}…`);

  return { address, txIds, steps: totalSteps };
}
