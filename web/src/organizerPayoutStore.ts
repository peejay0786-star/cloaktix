/** Organizer-private payout addresses — local only, never published to /meta or buyer UI. */
export type OrganizerPayouts = { nightPayout: string; at: string };

const PREFIX = 'cloaktix:org-payout:v1:';
const key = (network: string, contract: string, eventId: string) =>
  `${PREFIX}${network}:${contract}:${eventId}`;

export function eventIdFromCircuitResult(result: unknown): string | null {
  if (typeof result === 'bigint') return String(result);
  if (typeof result === 'number' && Number.isFinite(result)) return String(Math.trunc(result));
  if (typeof result === 'string' && /^\d+$/.test(result.trim())) return result.trim();
  if (result && typeof result === 'object') {
    const rec = result as Record<string, unknown>;
    for (const field of ['value', 'result', 'eventId']) {
      if (field in rec) {
        const inner = eventIdFromCircuitResult(rec[field]);
        if (inner) return inner;
      }
    }
    if (typeof rec.toString === 'function' && rec.toString !== Object.prototype.toString) {
      const printed = rec.toString();
      if (/^\d+$/.test(printed)) return printed;
    }
  }
  return null;
}

function parsePayouts(rawText: string | null): OrganizerPayouts | null {
  if (!rawText) return null;
  try {
    const raw: unknown = JSON.parse(rawText);
    if (!raw || typeof raw !== 'object') return null;
    const nightPayout = 'nightPayout' in raw && typeof raw.nightPayout === 'string' ? raw.nightPayout : '';
    const at = 'at' in raw && typeof raw.at === 'string' ? raw.at : '';
    if (!nightPayout) return null;
    return { nightPayout, at };
  } catch { return null; }
}

export function saveOrganizerPayouts(network: string, contract: string, eventId: string, payouts: Omit<OrganizerPayouts, 'at'>): void {
  const value: OrganizerPayouts = { ...payouts, at: new Date().toISOString() };
  try { localStorage.setItem(key(network, contract, eventId), JSON.stringify(value)); }
  catch { /* Organizer can keep a backup offline; creation may still succeed on-chain. */ }
}

export function loadOrganizerPayouts(network: string, contract: string, eventId: string): OrganizerPayouts | null {
  const exact = parsePayouts(localStorage.getItem(key(network, contract, eventId)));
  if (exact) return exact;
  try {
    const suffix = `:${contract}:${eventId}`;
    const ls = globalThis.localStorage;
    if (!ls || typeof ls.key !== 'function' || typeof ls.length !== 'number') return null;
    for (let i = 0; i < ls.length; i++) {
      const storedKey = ls.key(i);
      if (storedKey && storedKey.startsWith(PREFIX) && storedKey.endsWith(suffix)) {
        const found = parsePayouts(ls.getItem(storedKey));
        if (found) return found;
      }
    }
  } catch { /* private store unavailable */ }
  return null;
}
