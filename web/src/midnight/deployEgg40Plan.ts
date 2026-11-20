/** Pure planning helpers for the EGG-40 batched deploy (no Midnight SDK imports). */
import type { V3DeployProgress } from './deployV3Plan';

/** All 15 provable EGG-40 circuits. The first EGG40_DEPLOY_FIRST_COUNT go in the deploy tx. */
export const EGG40_CIRCUIT_ORDER = [
  'createEvent',
  'addTicketType',
  'setSalesOpen',
  'buyTicket',
  'buyTicketAdult',
  'registerAdmit',
  'listForResale',
  'buyResale',
  'buyResaleAdult',
  'admit',
  'authorizeDoorKey',
  'revokeDoorKey',
  'admitByDoor',
  'admitByDoor4',
  'adminSet',
] as const;

/**
 * Offline ledger-v9 measure (EGG-40 verifier keys, 2026-11-19): n=10 -> bytesWritten 25468 (50.9% of 50k),
 * n=11 -> 28261 (56.5%), n=12 -> 30539 (61.1%). The live v3 deploy used n=11 at 55.9%. EGG-40 has a larger
 * initial ledger, so take n=10: one more wallet prompt, more room under the ~60% node limit.
 */
export const EGG40_DEPLOY_FIRST_COUNT = 10;
export const EGG40_INSERT_BATCH_SIZE = 1;

export const EGG40_DEPLOY_PROGRESS_KEY = (networkId: string) => `cloaktix:l9:egg40-deploy-progress:v1:${networkId}`;
/** Namespace for the pre-deploy maintenance key, separate from the v3 deploy's pending key. */
export const egg40PendingKeyNamespace = (networkId: string) => `${networkId}:egg40`;

export type Egg40DeployProgress = V3DeployProgress;

export function planEgg40DeploySteps(): { deployCircuits: string[]; insertBatches: string[][]; totalSteps: number } {
  const deployCircuits = EGG40_CIRCUIT_ORDER.slice(0, EGG40_DEPLOY_FIRST_COUNT) as string[];
  const pending = EGG40_CIRCUIT_ORDER.slice(EGG40_DEPLOY_FIRST_COUNT) as string[];
  const batches: string[][] = [];
  for (let i = 0; i < pending.length; i += EGG40_INSERT_BATCH_SIZE) batches.push(pending.slice(i, i + EGG40_INSERT_BATCH_SIZE));
  return { deployCircuits, insertBatches: batches, totalSteps: 1 + batches.length };
}

export function loadEgg40DeployProgress(networkId: string, storage: Storage = localStorage): Egg40DeployProgress | null {
  try {
    const raw = storage.getItem(EGG40_DEPLOY_PROGRESS_KEY(networkId));
    return raw ? (JSON.parse(raw) as Egg40DeployProgress) : null;
  } catch {
    return null;
  }
}
export function saveEgg40DeployProgress(networkId: string, p: Egg40DeployProgress, storage: Storage = localStorage): void {
  try { storage.setItem(EGG40_DEPLOY_PROGRESS_KEY(networkId), JSON.stringify(p)); } catch { /* optional */ }
}
export function clearEgg40DeployProgress(networkId: string, storage: Storage = localStorage): void {
  try { storage.removeItem(EGG40_DEPLOY_PROGRESS_KEY(networkId)); } catch { /* optional */ }
}

/** Merge local progress with on-chain VK presence (resume skips finished steps). */
export function reconcileEgg40ProgressFromOnChain(address: string, onChainCircuits: readonly string[], prev: Egg40DeployProgress | null): Egg40DeployProgress {
  const have = new Set(onChainCircuits.map(String));
  const done = EGG40_CIRCUIT_ORDER.filter((id) => have.has(id)) as string[];
  const pending = EGG40_CIRCUIT_ORDER.filter((id) => !have.has(id)) as string[];
  const plan = planEgg40DeploySteps();
  const deployDone = plan.deployCircuits.every((id) => have.has(id));
  return {
    address,
    deployTxId: prev?.deployTxId ?? null,
    done,
    pending,
    step: pending.length === 0 ? plan.totalSteps : deployDone ? 2 + (plan.insertBatches.flat().length - pending.length) : 1,
    totalSteps: plan.totalSteps,
    updatedAt: Date.now(),
    status: pending.length === 0 ? 'done' : deployDone ? 'inserting' : 'deploying',
    message: pending.length ? `Resume: ${pending.length} verifier key(s) still missing on-chain (${pending.join(', ')})` : 'All verifier keys present on-chain',
  };
}

/**
 * Pre-wallet check of the step-1 deploy transaction (ledger-v9 Transaction, duck-typed so it works with any
 * copy of the wasm module). Returns human-readable problems; empty means: exactly one contract deploy whose
 * operations are exactly `expectedIds`, each with a non-empty verifier key (an empty slot is Custom error 110).
 */
export function deployTxVkProblems(tx: any, expectedIds: readonly string[]): string[] {
  const dec = (o: unknown) => (typeof o === 'string' ? o : new TextDecoder().decode(o as Uint8Array));
  const deploys: any[] = [];
  const intents: any = tx?.intents;
  const list: any[] = intents instanceof Map ? [...intents.values()] : intents && typeof intents.values === 'function' ? [...intents.values()] : [];
  for (const intent of list) for (const a of intent?.actions ?? []) if (a?.initialState && typeof a.initialState.operations === 'function') deploys.push(a);
  if (deploys.length !== 1) return [`expected 1 contract deploy, found ${deploys.length}`];
  const st = deploys[0].initialState;
  const ops = (st.operations() as unknown[]).map(dec);
  const problems: string[] = [];
  const want = new Set(expectedIds.map(String));
  for (const id of ops) {
    if (!want.has(id)) problems.push(`unexpected operation ${id}`);
    const vk = st.operation(id)?.verifierKey;
    if (!vk || !vk.length) problems.push(`empty verifier key slot ${id}`);
  }
  for (const id of want) if (!ops.includes(id)) problems.push(`missing verifier key ${id}`);
  return problems;
}
