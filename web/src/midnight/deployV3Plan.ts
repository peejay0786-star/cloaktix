/** Pure planning helpers for schema v3 batched deploy (no Midnight SDK imports). */

export const V3_CIRCUIT_ORDER = [
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
  'buyTicketAda',
  'buyTicketAdaAdult',
  'adminSet',
] as const;

export type V3CircuitId = (typeof V3_CIRCUIT_ORDER)[number];

/**
 * First N VKs in the deploy tx.
 * Offline ledger measure (subset-only, no empty VK slots): n=11 → bytesWritten≈27891 (~55.8% of 50k).
 * n=12 → ~60.7% (over Preview ~60% headroom → 1010). Empty VK slots cause Custom error 110
 * (MalformedError::VerifierKeyNotSet) — deferred ops must be OMITTED from deploy state, not left empty.
 */
export const V3_DEPLOY_FIRST_COUNT = 11;
/** One 1AM confirmation per insert (midnight-js submitInsertVerifierKeyTx is single-VK). */
export const V3_INSERT_BATCH_SIZE = 1;

/** Bumped to v3 so failed affc97b8 resumes (empty-slot deploy) are not reused. */
export const V3_DEPLOY_PROGRESS_KEY = (networkId: string) =>
  `cloaktix:l9:v3-deploy-progress:v3:${networkId}`;

export type V3DeployProgress = {
  address: string | null;
  deployTxId: string | null;
  done: string[];
  pending: string[];
  step: number;
  totalSteps: number;
  updatedAt: number;
  status: 'idle' | 'deploying' | 'inserting' | 'done' | 'error';
  message?: string;
};

export function insertBatches(pending: string[], size: number): string[][] {
  const out: string[][] = [];
  for (let i = 0; i < pending.length; i += size) out.push(pending.slice(i, i + size));
  return out;
}

export function planV3DeploySteps(): { deployCircuits: string[]; insertBatches: string[][]; totalSteps: number } {
  const deployCircuits = V3_CIRCUIT_ORDER.slice(0, V3_DEPLOY_FIRST_COUNT) as string[];
  const pending = V3_CIRCUIT_ORDER.slice(V3_DEPLOY_FIRST_COUNT) as string[];
  const batches = insertBatches(pending, V3_INSERT_BATCH_SIZE);
  return { deployCircuits, insertBatches: batches, totalSteps: 1 + batches.length };
}

/** When replacing a live contract, ignore that address as a resume target so Deploy creates a new one. */
export function resolveV3DeployResume(opts: {
  forceNew?: boolean;
  hostContract: string | null | undefined;
  progress: V3DeployProgress | null;
}): { progress: V3DeployProgress | null; knownAddress: string | null } {
  let progress = opts.progress;
  const host = opts.hostContract || null;
  if (opts.forceNew && progress?.address && host && progress.address === host) progress = null;
  const knownAddress = opts.forceNew
    ? (progress?.address && progress.address !== host ? progress.address : null)
    : (host || progress?.address || null);
  return { progress, knownAddress };
}

export function loadV3DeployProgress(networkId: string, storage: Storage = localStorage): V3DeployProgress | null {
  try {
    const raw = storage.getItem(V3_DEPLOY_PROGRESS_KEY(networkId));
    if (!raw) return null;
    return JSON.parse(raw) as V3DeployProgress;
  } catch {
    return null;
  }
}

export function saveV3DeployProgress(networkId: string, p: V3DeployProgress, storage: Storage = localStorage): void {
  try {
    storage.setItem(V3_DEPLOY_PROGRESS_KEY(networkId), JSON.stringify(p));
  } catch { /* optional */ }
}

export function clearV3DeployProgress(networkId: string, storage: Storage = localStorage): void {
  try {
    storage.removeItem(V3_DEPLOY_PROGRESS_KEY(networkId));
  } catch { /* optional */ }
}

/** Symbol on CompiledContract that holds `{ ctor, witnesses, compiledAssetsPath }`. */
export function compactContextSymbol(compiled: object): symbol {
  for (const s of Object.getOwnPropertySymbols(compiled)) {
    const v = (compiled as Record<symbol, unknown>)[s];
    if (v && typeof v === 'object' && v !== null && 'ctor' in (v as object)) return s;
  }
  throw new Error('CompiledContract CompactContext symbol not found');
}

/**
 * Fresh CompiledContract-like object whose contract instances expose a filtered
 * `provableCircuits` map. Never assigns to module namespace exports.
 */
export function compiledContractForVkSubset<C extends object>(compiled: C, allowIds: readonly string[]): C {
  const allow = new Set(allowIds.map(String));
  const ctxKey = compactContextSymbol(compiled);
  const ctx = (compiled as Record<symbol, { ctor: new (w: unknown) => object; witnesses?: unknown; compiledAssetsPath?: string }>)[ctxKey];
  if (!ctx?.ctor) throw new Error('CompiledContract context missing ctor');
  const OrigCtor = ctx.ctor;

  function FilteredCtor(this: unknown, witnesses: unknown) {
    const instance = new OrigCtor(witnesses);
    return new Proxy(instance, {
      get(target, prop, receiver) {
        if (prop === 'provableCircuits') {
          const full = Reflect.get(target, 'provableCircuits', target) as Record<string, unknown>;
          return Object.fromEntries(Object.entries(full).filter(([k]) => allow.has(k)));
        }
        const val = Reflect.get(target, prop, receiver);
        return typeof val === 'function' ? (val as (...a: unknown[]) => unknown).bind(target) : val;
      },
    });
  }
  Object.setPrototypeOf(FilteredCtor, OrigCtor);
  FilteredCtor.prototype = OrigCtor.prototype;

  const out: Record<string | symbol, unknown> = { ...(compiled as Record<string, unknown>) };
  for (const s of Object.getOwnPropertySymbols(compiled)) {
    if (s === ctxKey) continue;
    out[s] = (compiled as Record<symbol, unknown>)[s];
  }
  out[ctxKey] = { ...ctx, ctor: FilteredCtor as unknown as typeof OrigCtor };
  return out as C;
}

/** Entry-point name from ContractState.setOperation's operation key. */
export function operationEntryName(operation: string | Uint8Array): string {
  if (typeof operation === 'string') return operation;
  try {
    return new TextDecoder().decode(operation);
  } catch {
    return Array.from(operation).join(',');
  }
}

/**
 * During Compact constructor, every export circuit gets `setOperation(id, new ContractOperation())`
 * with an empty verifier key. If those empty ops remain for circuits whose VKs are deferred to
 * `submitInsertVerifierKeyTx`, Midnight rejects the deploy with Custom error 110
 * (`MalformedError::VerifierKeyNotSet`). Skip registering deferred ops until insert.
 */
export async function withOmittingEmptyDeferredOps<T>(
  deferredIds: readonly string[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setOperationTarget: { prototype: { setOperation: (...args: any[]) => any } },
  fn: () => Promise<T>,
): Promise<T> {
  const skip = new Set(deferredIds.map(String));
  const proto = setOperationTarget.prototype;
  const original = proto.setOperation;
  proto.setOperation = function (this: unknown, operation: string | Uint8Array, value: { verifierKey?: Uint8Array }) {
    const name = operationEntryName(operation);
    if (skip.has(name)) {
      const vk = value?.verifierKey;
      if (!vk || vk.length === 0) return;
    }
    return original.call(this, operation, value);
  };
  try {
    return await fn();
  } finally {
    proto.setOperation = original;
  }
}


/** Merge local progress with on-chain VK presence (resume: skip finished steps). */
export function reconcileV3ProgressFromOnChain(
  address: string,
  onChainCircuits: readonly string[],
  prev: V3DeployProgress | null,
): V3DeployProgress {
  const have = new Set(onChainCircuits.map(String));
  const done = V3_CIRCUIT_ORDER.filter((id) => have.has(id)) as string[];
  const pending = V3_CIRCUIT_ORDER.filter((id) => !have.has(id)) as string[];
  const plan = planV3DeploySteps();
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
    message: pending.length
      ? `Resume: ${pending.length} verifier key(s) still missing on-chain (${pending.join(', ')})`
      : 'All verifier keys present on-chain',
  };
}

export { isPendingTxWalletError } from './walletPending.ts';
