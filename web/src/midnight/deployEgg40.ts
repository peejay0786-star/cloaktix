/**
 * EGG-40 batched deploy on Midnight Preview, signed by the organizer's own wallet (1AM).
 * Same mechanics as deployV3Batched (which is not modified): the deploy tx carries the first
 * EGG40_DEPLOY_FIRST_COUNT verifier keys, deferred circuits are omitted from the deploy state
 * (an empty slot is Custom error 110), the rest are inserted one per wallet prompt, and each step
 * waits for on-chain inclusion before the next prompt. Resume reads on-chain operations.
 * Never called with a server key. The returned address is what VITE_EGG40_CONTRACT must be set to.
 */
import { readContractState } from './contractStateRead.ts';
import { networkTagBytes } from './schema.ts';
import { getOrCreatePendingDeployKey, loadPendingDeployKey, clearPendingDeployKey } from './privateStateProvider.ts';
import { sleep, withPendingRetry } from './walletPending.ts';
import { compiledContractForVkSubset, withOmittingEmptyDeferredOps } from './deployV3Plan.ts';
import {
  EGG40_CIRCUIT_ORDER,
  planEgg40DeploySteps,
  loadEgg40DeployProgress,
  saveEgg40DeployProgress,
  reconcileEgg40ProgressFromOnChain,
  egg40PendingKeyNamespace,
  deployTxVkProblems,
  type Egg40DeployProgress,
} from './deployEgg40Plan.ts';
import { FEE_BPS_EGG40, MAX_QUOTE_AGE_EGG40, SLIPPAGE_BPS_EGG40, PRIVATE_STATE_ID_EGG40 } from './contract-egg40-meta.ts';
import type { SessionV3Host } from './session-v3';

export type Egg40DeployStep = { step: number; totalSteps: number; label: string; detail?: string };
type SigningKey = { tag: string; value: string };

export type Egg40DeployDeps = {
  P: any;
  compiled: object;
  ContractStateCls: { prototype: { setOperation: (...a: any[]) => any } };
  deployFn: (P: any, opts: any) => Promise<any>;
  insertFn: (P: any, compiled: any, address: string, circuitId: string, vk: Uint8Array) => Promise<any>;
  fetchVk: (circuitId: string) => Promise<Uint8Array>;
  listOnChain: (pdp: any, address: string) => Promise<string[]>;
  waitForCircuits: (pdp: any, address: string, ids: readonly string[], o?: { onWait?: (d: string) => void }) => Promise<void>;
  sampleKey: () => SigningKey;
  verifyingKeyOf: (k: SigningKey) => SigningKey;
  accountId: (sk: Uint8Array) => Uint8Array;
  rateSignerPk: { x: bigint; y: bigint };
  createPrivateState: (sk: Uint8Array, age?: any) => unknown;
  /** Resolves when the Midnight indexer answers; rejects otherwise. Checked before the first wallet prompt. */
  indexerCheck?: () => Promise<void>;
};

/**
 * midnight-js 5 hands the wallet a LedgerTransaction *handle* ({ era, stage, serialize(), deserialize(decoders) }),
 * not a ledger Transaction. Unwrap it with the bundle's own ledger-v9 Transaction before inspecting.
 */
async function rawLedgerTx(tx: any): Promise<any> {
  if (tx && typeof tx.intents !== 'undefined') return tx;
  if (tx && typeof tx.deserialize === 'function' && tx.era === 'v9') {
    const { Transaction } = await import('@midnight-ntwrk/midnight-js-protocol/v9');
    return tx.deserialize({ v9: Transaction });
  }
  return null;
}

/** Problems that mean "could not read the tx", not "the tx is wrong": never block on these. */
const SHAPE_UNKNOWN = /^expected 1 contract deploy, found 0$/;

/**
 * Same providers, but the wallet only sees the deploy tx after deployTxVkProblems() found nothing wrong.
 * Blocks on real problems (empty key slot, missing/extra key, several deploys). If the tx cannot be read,
 * it fails open with a console warning instead of blocking.
 */
export function withDeployTxGuard(P: any, expectedIds: readonly string[]): any {
  const w = P.walletProvider;
  if (!w) return P;
  const walletProvider = new Proxy(w, {
    get(target, prop) {
      if (prop === 'balanceTx') {
        return async (tx: any, ...rest: any[]) => {
          let problems: string[] = [];
          try {
            const raw = await rawLedgerTx(tx);
            problems = raw ? deployTxVkProblems(raw, expectedIds) : ['expected 1 contract deploy, found 0'];
          } catch (e) {
            console.warn('[CloakTix] EGG-40 deploy guard could not read the tx; continuing', e);
            problems = [];
          }
          if (problems.length === 1 && SHAPE_UNKNOWN.test(problems[0])) {
            console.warn('[CloakTix] EGG-40 deploy guard: unrecognized tx shape; continuing without the check');
            problems = [];
          }
          if (problems.length) throw new Error(`EGG-40 deploy stopped before the wallet (nothing was sent): ${problems.slice(0, 4).join('; ')}`);
          return target.balanceTx(tx, ...rest);
        };
      }
      const v = Reflect.get(target, prop, target);
      return typeof v === 'function' ? v.bind(target) : v;
    },
  });
  return { ...P, walletProvider };
}

function withTimeout<T>(p: Promise<T>, ms: number, what: string): Promise<T> {
  return new Promise<T>((res, rej) => {
    const t = setTimeout(() => rej(new Error(`${what} timed out after ${Math.round(ms / 1000)} s`)), ms);
    p.then((v) => { clearTimeout(t); res(v); }, (e) => { clearTimeout(t); rej(e); });
  });
}

export async function listOnChainEgg40Circuits(pdp: { queryContractState: (a: string) => Promise<any> }, address: string): Promise<string[]> {
  const cs: any = await readContractState(pdp, address);
  if (!cs) return [];
  const present: string[] = [];
  for (const id of EGG40_CIRCUIT_ORDER) {
    try { if (typeof cs.operation === 'function' && cs.operation(id)) present.push(id); } catch { /* ignore */ }
  }
  if (present.length) return present;
  const ops: string[] = typeof cs.operations === 'function' ? cs.operations().map(String) : [];
  return ops.filter((id) => (EGG40_CIRCUIT_ORDER as readonly string[]).includes(id));
}

async function waitForEgg40Circuits(pdp: any, address: string, ids: readonly string[], opts: { onWait?: (d: string) => void } = {}) {
  const deadline = Date.now() + 180_000;
  while (Date.now() < deadline) {
    const have = new Set(await listOnChainEgg40Circuits(pdp, address));
    const missing = ids.filter((id) => !have.has(id));
    if (missing.length === 0) { opts.onWait?.('On-chain confirmation seen, clearing wallet pending queue…'); await sleep(4_000); return; }
    opts.onWait?.(`Waiting for on-chain confirmation of ${missing.join(', ')}…`);
    await sleep(2_500);
  }
  throw new Error(`Timed out waiting for on-chain verifier keys: ${ids.join(', ')}`);
}

/** Browser defaults: EGG-40 providers (EGG-40 keys), midnight-js deploy/insert, compact-runtime keys. */
async function defaultDeps(host: SessionV3Host): Promise<Egg40DeployDeps> {
  const [{ egg40Providers }, contracts, runtime, egg, v3, { ZK_ASSETS_PATH_EGG40 }] = await Promise.all([
    import('./providers-egg40'),
    import('@midnight-ntwrk/midnight-js-contracts'),
    import('@midnight-ntwrk/compact-runtime'),
    import('./contract-egg40'),
    import('./contract-v3'),
    import('./contract-egg40'),
  ]);
  const P = await egg40Providers(host as any);
  return {
    P,
    compiled: egg.CompiledCloakTixEgg40 as object,
    ContractStateCls: runtime.ContractState as any,
    deployFn: contracts.deployContract as any,
    insertFn: contracts.submitInsertVerifierKeyTx as any,
    fetchVk: async (circuitId) => {
      const base = new URL(ZK_ASSETS_PATH_EGG40.replace(/\/?$/, '/'), window.location.origin);
      const res = await fetch(new URL(`keys/${circuitId}.verifier`, base));
      if (!res.ok) throw new Error(`Missing EGG-40 verifier key for ${circuitId} (${res.status})`);
      return new Uint8Array(await res.arrayBuffer());
    },
    listOnChain: listOnChainEgg40Circuits,
    waitForCircuits: waitForEgg40Circuits,
    sampleKey: runtime.sampleSigningKey as any,
    verifyingKeyOf: runtime.signatureVerifyingKey as any,
    accountId: (sk) => egg.pureCircuitsEgg40.accountId(sk) as Uint8Array,
    // Same rate signer public key as the live v3 contract (no key rotation).
    rateSignerPk: v3.RATE_SIGNER_PK,
    createPrivateState: (sk, age) => egg.createPrivateStateEgg40(sk, age),
    // The live schema-3 contract must be readable: the deploy waits on the indexer after every prompt.
    indexerCheck: async () => {
      const addr = (host as any).contract as string | undefined;
      if (!addr) return;
      const st = await withTimeout(Promise.resolve(P.publicDataProvider.queryContractState(addr)), 15_000, 'Indexer check');
      if (!st) throw new Error('indexer returned no state for the current contract');
    },
  };
}

export async function deployEgg40Batched(
  host: SessionV3Host,
  feeAddressBech: string,
  stubIssuer: () => Promise<{ x: bigint; y: bigint }>,
  opts?: { onStep?: (e: Egg40DeployStep) => void; storage?: Storage; deps?: Partial<Egg40DeployDeps> },
): Promise<{ address: string; txIds: string[]; steps: number }> {
  const storage = opts?.storage ?? localStorage;
  const d: Egg40DeployDeps = { ...(opts?.deps && 'P' in opts.deps ? {} as Egg40DeployDeps : await defaultDeps(host)), ...(opts?.deps ?? {}) } as Egg40DeployDeps;
  const plan = planEgg40DeploySteps();
  const totalSteps = plan.totalSteps;
  const deferredIds = plan.insertBatches.flat();
  const txIds: string[] = [];
  const ns = egg40PendingKeyNamespace(host.networkId);
  const notify = (step: number, label: string, detail?: string) => opts?.onStep?.({ step, totalSteps, label, detail });
  const save = (p: Egg40DeployProgress) => saveEgg40DeployProgress(host.networkId, p, storage);

  let progress = loadEgg40DeployProgress(host.networkId, storage);
  if (progress?.address) {
    try {
      const onChain = await d.listOnChain(d.P.publicDataProvider, progress.address);
      if (onChain.length) { progress = reconcileEgg40ProgressFromOnChain(progress.address, onChain, progress); save(progress); }
    } catch (e) { console.warn('EGG-40 on-chain VK sync failed', e); }
  }
  if (progress?.status === 'done' && progress.address) {
    return { address: progress.address, txIds: progress.deployTxId ? [progress.deployTxId] : [], steps: totalSteps };
  }

  if (!progress?.address && d.indexerCheck) {
    try { await d.indexerCheck(); } catch (e: any) {
      throw new Error(`The Midnight Preview indexer is not responding right now (${String(e?.message ?? e).slice(0, 120)}). Nothing was sent and no DUST was spent. Wait a few minutes, reload, then click Deploy EGG-40 again.`);
    }
  }

  if (!progress?.address) {
    progress = { address: null, deployTxId: null, done: [], pending: deferredIds, step: 1, totalSteps, updatedAt: Date.now(), status: 'deploying', message: 'Waiting for 1AM deploy confirmation…' };
    save(progress);
    notify(1, `Step 1/${totalSteps}: Deploy EGG-40 contract`, `Confirm in 1AM: create contract with ${plan.deployCircuits.length} verifier keys.`);
    const issuer = await stubIssuer();
    // Persist the maintenance key before submitting: the remaining inserts need it.
    const signingKey = getOrCreatePendingDeployKey(ns, storage as any, d.sampleKey as any);
    const partial = compiledContractForVkSubset(d.compiled, plan.deployCircuits);
    const r: any = await withPendingRetry(
      'Step 1 deploy',
      () => withOmittingEmptyDeferredOps(deferredIds, d.ContractStateCls, () => d.deployFn(withDeployTxGuard(d.P, plan.deployCircuits), {
        compiledContract: partial,
        privateStateId: PRIVATE_STATE_ID_EGG40,
        initialPrivateState: d.createPrivateState(host.sk, host.age as any),
        signingKey,
        // Constructor: feeBps, feeAddress, admin, ageIssuer, rateSigner, networkTag, maxQuoteAge, slippageBps. No ADA.
        args: [FEE_BPS_EGG40, host.userAddress(feeAddressBech), d.accountId(host.sk), issuer, d.rateSignerPk, networkTagBytes(host.networkId), MAX_QUOTE_AGE_EGG40, SLIPPAGE_BPS_EGG40],
      })),
      (detail) => notify(1, `Step 1/${totalSteps}: Deploy EGG-40 contract`, detail),
    );
    const address = r.deployTxData.public.contractAddress as string;
    const deployTxId = r.deployTxData.public.txId as string;
    txIds.push(deployTxId);
    progress = { ...progress, address, deployTxId, done: [...plan.deployCircuits], pending: deferredIds, status: 'inserting', updatedAt: Date.now(), message: 'Deploy submitted, waiting for inclusion…' };
    save(progress);
    if (!(await d.P.privateStateProvider.getSigningKey(address))) await d.P.privateStateProvider.setSigningKey(address, signingKey);
    clearPendingDeployKey(ns, storage as any);
    await d.waitForCircuits(d.P.publicDataProvider, address, plan.deployCircuits, { onWait: (x) => notify(1, `Step 1/${totalSteps}: Waiting for confirmation…`, x) });
  }

  const address = progress.address!;
  try {
    const onChain = await d.listOnChain(d.P.publicDataProvider, address);
    progress.done = EGG40_CIRCUIT_ORDER.filter((id) => onChain.includes(id)) as string[];
    progress.pending = EGG40_CIRCUIT_ORDER.filter((id) => !onChain.includes(id)) as string[];
    save(progress);
  } catch { /* keep local pending */ }

  if (progress.pending.length && !(await d.P.privateStateProvider.getSigningKey(address))) {
    const pendingKey = loadPendingDeployKey(ns, storage as any);
    const cs: any = await readContractState(d.P.publicDataProvider, address).catch(() => null);
    const committee: SigningKey[] = cs?.maintenanceAuthority?.committee ?? [];
    const vk = pendingKey ? d.verifyingKeyOf(pendingKey) : null;
    if (pendingKey && vk && committee.some((c) => c.tag === vk.tag && c.value === vk.value)) {
      await d.P.privateStateProvider.setSigningKey(address, pendingKey);
      clearPendingDeployKey(ns, storage as any);
    } else {
      throw new Error(`The maintenance key of EGG-40 contract ${address.slice(0, 12)}… is not on this device. Finish the deploy in the same browser where it started.`);
    }
  }

  let step = 2;
  for (const circuitId of deferredIds) {
    if (!progress.pending.includes(circuitId)) { step++; continue; }
    notify(step, `Step ${step}/${totalSteps}: Install verifier key`, `Confirm in 1AM: insert ${circuitId}.`);
    progress.status = 'inserting'; progress.step = step; progress.message = `Waiting for 1AM: ${circuitId}`; save(progress);
    const vk = await d.fetchVk(circuitId);
    const fin: any = await withPendingRetry(
      `Step ${step} insert ${circuitId}`,
      () => d.insertFn(d.P, d.compiled, address, circuitId, vk),
      (x) => notify(step, `Step ${step}/${totalSteps}: Waiting for confirmation…`, x),
    );
    txIds.push((fin?.public?.txId ?? fin?.txId) as string);
    await d.waitForCircuits(d.P.publicDataProvider, address, [circuitId], { onWait: (x) => notify(step, `Step ${step}/${totalSteps}: Waiting for confirmation…`, x) });
    progress.done = [...new Set([...progress.done, circuitId])];
    progress.pending = progress.pending.filter((x) => x !== circuitId);
    progress.updatedAt = Date.now(); save(progress);
    step++;
  }

  progress.status = 'done'; progress.step = totalSteps; progress.pending = []; progress.message = 'EGG-40 deploy complete'; progress.updatedAt = Date.now();
  save(progress);
  notify(totalSteps, `Done: ${totalSteps} wallet confirmation(s)`, `Contract ${address.slice(0, 12)}…`);
  return { address, txIds, steps: totalSteps };
}
