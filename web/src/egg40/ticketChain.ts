/**
 * EGG-44: live ticket view for door scans, plan B check-in and settlement.
 * Before this, the live app built the door API without any chain view, so every scanned ticket looked unknown
 * and the scanner answered "Not for this event". Reads the EGG-40 contract state (indexer, read only) and the
 * catalog ticket-type names. A failed read throws: callers fail closed ("Can't confirm entry right now").
 */
import type { ChainView, TicketRow } from './live.ts';

export type ChainTicket = { serial: string; typeId: string; eventId: string; status: number; hasAdmit: boolean; epoch: string };
export type TicketChainOptions = {
  contract: string;
  /** GraphQL endpoint (same-origin /indexer proxy in the app). */
  indexerUrl: string;
  /** Catalog metadata (ticket type names); optional, names fall back to "Ticket type #N". */
  metaUrl?: string;
  /** Contract state hex -> tickets. Injected so the wasm decoder stays in its own chunk. */
  decode: (stateHex: string) => ChainTicket[];
  fetcher?: typeof fetch;
  ttlMs?: number;
  minFreshMs?: number;
  now?: () => number;
};
export type TicketChain = ChainView & { refresh(opts?: { fresh?: boolean }): Promise<void>; loaded(): boolean };

export function indexerTicketChain(o: TicketChainOptions): TicketChain {
  const fetcher = o.fetcher ?? fetch;
  const ttl = o.ttlMs ?? 4000, minFresh = o.minFreshMs ?? 1500;
  const now = o.now ?? Date.now;
  let rows = new Map<string, TicketRow>();
  let at = -Infinity;
  let names: Record<string, string> = {};
  let inflight: Promise<void> | null = null;
  const recorded = new Set<string>();

  const readNames = async () => {
    if (!o.metaUrl) return;
    try {
      const r = await fetcher(o.metaUrl);
      if (!r.ok) return;
      const j: any = await r.json();
      const tt = j?.tt && typeof j.tt === 'object' ? j.tt : {};
      names = Object.fromEntries(Object.entries(tt).flatMap(([k, v]: [string, any]) => (typeof v?.name === 'string' && v.name.trim() ? [[k, v.name.trim()]] : [])));
    } catch { /* names are cosmetic: keep the previous ones */ }
  };
  const read = async () => {
    const [r] = await Promise.all([
      fetcher(o.indexerUrl, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ query: 'query($a:HexEncoded!){contractAction(address:$a){state}}', variables: { a: o.contract } }),
      }),
      readNames(),
    ]);
    if (!r.ok) throw new Error(`Indexer HTTP ${r.status}`);
    const body: any = await r.json();
    const hex = body?.data?.contractAction?.state;
    if (body?.errors || typeof hex !== 'string') throw new Error('Indexer returned no contract state');
    const next = new Map<string, TicketRow>();
    for (const t of o.decode(hex)) next.set(t.serial, { ...t, typeName: names[t.typeId] ?? `Ticket type #${t.typeId}` });
    rows = next; at = now();
  };
  return {
    async refresh({ fresh = false } = {}) {
      if (now() - at < (fresh ? minFresh : ttl)) return;
      inflight ??= read().finally(() => { inflight = null; });
      await inflight;
    },
    loaded: () => at > -Infinity,
    ticket: (serial) => rows.get(serial),
    recordedCount: (eventId) => [...rows.values()].filter(t => t.eventId === eventId && (t.status === 2 || recorded.has(t.serial))).length,
    markRecorded: (serials) => { for (const s of serials) { recorded.add(s); const t = rows.get(s); if (t) rows.set(s, { ...t, status: 2 }); } },
  };
}
