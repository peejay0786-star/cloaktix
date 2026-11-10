/** CT-POLISH-3: what buyers see. Pure helpers, no SDK imports. */
import type { PublishedCatalog } from './model';

type EventLike = { id: bigint; isKey?: boolean };
type TypeLike = { id: bigint; eventId: bigint; sold: bigint; supply: bigint; price?: bigint; resale?: unknown; maxResale?: bigint; adultOnly?: boolean };

/**
 * A metadata-key registration is createEvent(payout = organizer metadata pk). It is not a real event.
 * Known by: isKey (this device's key), or the /meta key list. On-chain it never has ticket types.
 */
export function isKeyRegistration(e: EventLike, keyEvents: ReadonlySet<string>): boolean {
  return !!e.isKey || keyEvents.has(String(e.id));
}

/** Buyer views list only real events that have at least one ticket type (nothing to buy otherwise). */
export function buyerVisibleEvents<E extends EventLike>(events: readonly E[], types: readonly TypeLike[], keyEvents: ReadonlySet<string>): E[] {
  const withTypes = new Set(types.map((t) => String(t.eventId)));
  return events.filter((e) => !isKeyRegistration(e, keyEvents) && withTypes.has(String(e.id)));
}

export const normalizeTypeName = (name: string) => name.trim().replace(/\s+/g, ' ').toLowerCase();

export type TypeGroup<T extends TypeLike> = { key: string; primary: T; members: T[]; sold: bigint; supply: bigint };

/**
 * Exact duplicates (same event, name, price, resale rule, cap and age rule) show as one option.
 * Purchases go to the lowest-id member that still has stock; existing tickets keep their own type.
 */
export function collapseDuplicateTypes<T extends TypeLike>(types: readonly T[], nameOf: (id: bigint) => string): TypeGroup<T>[] {
  const groups = new Map<string, T[]>();
  for (const t of types) {
    const key = [String(t.eventId), normalizeTypeName(nameOf(t.id)), String(t.price ?? ''), String(t.resale ?? ''), String(t.maxResale ?? ''), String(!!t.adultOnly)].join('|');
    const list = groups.get(key);
    if (list) list.push(t); else groups.set(key, [t]);
  }
  return [...groups].map(([key, list]) => {
    const members = [...list].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
    const primary = members.find((m) => m.sold < m.supply) ?? members[0];
    return { key, primary, members, sold: members.reduce((n, m) => n + m.sold, 0n), supply: members.reduce((n, m) => n + m.supply, 0n) };
  });
}

/** Add-type guard: the same name already exists on this event (case and spacing ignored). */
export function duplicateTypeName(name: string, eventId: bigint, types: readonly TypeLike[], nameOf: (id: bigint) => string): string | null {
  const n = normalizeTypeName(name);
  if (!n) return null;
  const hit = types.find((t) => t.eventId === eventId && normalizeTypeName(nameOf(t.id)) === n);
  return hit ? nameOf(hit.id) : null;
}

/** Walletless catalog: one entry per identical published option; events with no published options are not listed. */
export function dedupePublishedTickets<T extends { name: string; usdCents?: string; resaleSummary?: string }>(tickets: readonly T[]): T[] {
  const seen = new Set<string>();
  return tickets.filter((t) => { const k = `${normalizeTypeName(t.name)}|${t.usdCents ?? ''}|${t.resaleSummary ?? ''}`; if (seen.has(k)) return false; seen.add(k); return true; });
}

/** CT-POLISH-3: buyers see only events with published ticket options, one entry per identical option. */
export function buyerCatalog(c: PublishedCatalog): PublishedCatalog {
  return { ...c, events: c.events.filter((e) => e.tickets.length > 0).map((e) => ({ ...e, tickets: dedupePublishedTickets(e.tickets) })) };
}
