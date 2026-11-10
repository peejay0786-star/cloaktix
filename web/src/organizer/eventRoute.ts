/** Organizer routes are separate from public /e/:id buyer routes. No SDK imports. */
import type { ContractState } from '../midnight/viewTypes';
export function organizerEventFromLocation(location: { pathname: string; search: string; hash: string }): bigint | null {
  if (!/^\/organizer\/?$/.test(location.pathname) || location.hash === '#gate') return null;
  const raw = new URLSearchParams(location.search).get('event');
  if (!raw || !/^[1-9]\d{0,19}$/.test(raw)) return null;
  const id = BigInt(raw);
  return id <= 18446744073709551615n ? id : null;
}
export function organizerEventHref({ search, eventId, contract, networkId, schema }: {
  search: string; eventId: bigint | null; contract?: string | null; networkId?: string; schema?: number;
}): string {
  const query = new URLSearchParams(search); query.delete('m'); query.delete('start'); query.delete('event');
  if (eventId !== null) {
    if (eventId <= 0n || eventId > 18446744073709551615n) throw new Error('Invalid organizer event ID');
    query.set('event', String(eventId));
  }
  if (contract) query.set('contract', contract);
  if (networkId) query.set('network', networkId);
  if (schema !== undefined) query.set('schema', String(schema));
  return `/organizer${query.size ? '?' + query : ''}#organizer`;
}
export function ownedOrganizerEvent(state: ContractState | null, id: bigint) {
  if (!state || (state.schemaVersion === 4 && state.staffOnly)) return undefined;
  return state.events.find(event => event.id === id && event.mine && !event.isKey);
}
export function organizerEventStats(state: ContractState | null, id: bigint) {
  const types = state?.types.filter(type => type.eventId === id) ?? [];
  const typeIds = new Set(types.map(type => type.id));
  const admitted = !state ? 0 : state.schemaVersion === 1
    ? [...state.checkIns.values()].filter(type => typeIds.has(type)).length
    : state.tickets.filter(ticket => ticket.status === 2 && typeIds.has(ticket.typeId)).length;
  return { types, sold: types.reduce((sum, type) => sum + type.sold, 0n), capacity: types.reduce((sum, type) => sum + type.supply, 0n), admitted };
}
