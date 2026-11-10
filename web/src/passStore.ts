/** Device-local prepared entry passes. Viewable offline; not a chain status claim. */

export type SavedPass = {
  v: 1;
  networkId: string;
  contract: string;
  typeId: string;
  passId: string;
  txId: string;
  at: string;
  ticketName?: string;
  eventName?: string;
  accountId?: string;
};

const STORE_KEY = 'cloaktix:saved-passes:v1';
const LAST_CONTRACT_PREFIX = 'cloaktix:last-contract:';

function isNonEmptyString(x: unknown): x is string {
  return typeof x === 'string' && x.length > 0;
}

export function isSavedPass(x: unknown): x is SavedPass {
  if (!x || typeof x !== 'object') return false;
  const o = x as Record<string, unknown>;
  if (o.v !== 1) return false;
  if (!isNonEmptyString(o.networkId) || !isNonEmptyString(o.contract)) return false;
  if (!isNonEmptyString(o.typeId) || !isNonEmptyString(o.txId) || !isNonEmptyString(o.at)) return false;
  if (!isNonEmptyString(o.passId) || !/^[0-9a-f]{64}$/i.test(o.passId)) return false;
  return true;
}

function readRaw(storage: Storage): unknown {
  try {
    const raw = storage.getItem(STORE_KEY);
    if (raw == null || raw === '') return [];
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

/** Returns only well-formed passes; ignores malformed entries. */
export function loadSavedPasses(storage: Storage = localStorage): SavedPass[] {
  const parsed = readRaw(storage);
  if (!Array.isArray(parsed)) return [];
  const out: SavedPass[] = [];
  for (const item of parsed) {
    if (isSavedPass(item)) {
      out.push({
        v: 1,
        networkId: item.networkId,
        contract: item.contract,
        typeId: item.typeId,
        passId: item.passId.toLowerCase(),
        txId: item.txId,
        at: item.at,
        ...(isNonEmptyString(item.ticketName) ? { ticketName: item.ticketName } : {}),
        ...(isNonEmptyString(item.eventName) ? { eventName: item.eventName } : {}),
        ...(isNonEmptyString(item.accountId) ? { accountId: item.accountId } : {}),
      });
    }
  }
  return out;
}

export function saveSavedPasses(passes: SavedPass[], storage: Storage = localStorage): void {
  storage.setItem(STORE_KEY, JSON.stringify(passes));
}

export function upsertSavedPass(pass: SavedPass, storage: Storage = localStorage): SavedPass[] {
  const cur = loadSavedPasses(storage).filter((p) => !(p.networkId === pass.networkId && p.contract === pass.contract && p.passId === pass.passId));
  const next = [pass, ...cur];
  saveSavedPasses(next, storage);
  return next;
}

export function passesForNetwork(networkId: string, contract: string | null | undefined, storage: Storage = localStorage): SavedPass[] {
  const all = loadSavedPasses(storage).filter((p) => p.networkId === networkId);
  if (!contract) return all;
  return all.filter((p) => p.contract === contract);
}

/** schema defaults to 1 so v1 callers stay compatible; schema 2 never reads the unscoped legacy key. */
export function rememberContract(networkId: string, contract: string, schema: 1 | 2 | 3 | 4 = 1, storage: Storage = localStorage): void {
  if (!networkId || !contract) return;
  storage.setItem(`${LAST_CONTRACT_PREFIX}s${schema}:${networkId}`, contract);
  if (schema === 1) storage.setItem(LAST_CONTRACT_PREFIX + networkId, contract); // legacy mirror for older builds
}

export function lastContract(networkId: string, schema: 1 | 2 | 3 | 4 = 1, storage: Storage = localStorage): string | null {
  try {
    const scoped = storage.getItem(`${LAST_CONTRACT_PREFIX}s${schema}:${networkId}`);
    if (scoped && scoped.length > 0) return scoped;
    if (schema === 1) {
      const legacy = storage.getItem(LAST_CONTRACT_PREFIX + networkId);
      return legacy && legacy.length > 0 ? legacy : null;
    }
    return null;
  } catch {
    return null;
  }
}

/** Legacy per-session key used while a wallet session is open. */
export function sessionPassKey(networkId: string, contract: string, accountId: string): string {
  return `passes:${networkId}:${contract}:${accountId}`;
}

export function readSessionPasses(networkId: string, contract: string, accountId: string, storage: Storage = localStorage): Array<{ typeId: string; passId: string; txId: string; at: string }> {
  try {
    const raw = storage.getItem(sessionPassKey(networkId, contract, accountId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((p): p is { typeId: string; passId: string; txId: string; at: string } => {
      if (!p || typeof p !== 'object') return false;
      const o = p as Record<string, unknown>;
      return isNonEmptyString(o.typeId) && isNonEmptyString(o.passId) && isNonEmptyString(o.txId) && isNonEmptyString(o.at) && /^[0-9a-f]{64}$/i.test(o.passId);
    });
  } catch {
    return [];
  }
}

export function writeSessionPasses(
  networkId: string,
  contract: string,
  accountId: string,
  passes: Array<{ typeId: string; passId: string; txId: string; at: string }>,
  storage: Storage = localStorage,
): void {
  storage.setItem(sessionPassKey(networkId, contract, accountId), JSON.stringify(passes));
}
