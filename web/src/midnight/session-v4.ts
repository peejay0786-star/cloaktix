/** Read-only v4 session wiring. Generated code-only binding is real; no v4 keys are installed. */
import { readContractState } from './contractStateRead';
import { ledgerV4, TicketStatusV4, V4_LOCAL_ONLY } from './contract-v4';
import { hexId, projectMultiGate } from './multiGate';
import type { ContractState } from './viewTypes';
type Host = { contract: string | null; accountId: string; metaKey(): Promise<{ pk: string } | null>;
  P: { publicDataProvider: { queryContractState(address: string): Promise<any> } } };
export async function stateV4(host: Host): Promise<Extract<ContractState, { schemaVersion: 4 }> | null> {
  if (!host.contract) return null;
  const cs = await readContractState(host.P.publicDataProvider, host.contract);
  if (!cs) return null;
  const L = ledgerV4(cs.data);
  if (Number(L.schemaVersion) !== 4) throw new Error('Expected schema 4; existing Preview events stay on schema 3.');
  const mpk = (await host.metaKey())?.pk;
  const tickets = [...L.tickets].map(([serial, t]) => ({ serial, typeId: t.typeId, status: Number(t.status), epoch: t.epoch,
    hasAdmit: t.hasAdmit, mine: hexId(t.owner) === host.accountId, listingId: t.listingId }));
  const ownedTickets = tickets.filter(t => t.mine && t.status === TicketStatusV4.owned);
  const held: Record<string, number> = {};
  for (const t of ownedTickets) held[String(t.typeId)] = (held[String(t.typeId)] ?? 0) + 1;
  const admissions = [...L.admissions];
  return { schemaVersion: 4, feeBps: L.feeBps, ageIssuer: L.ageIssuer, networkTag: L.networkTag,
    events: [...L.events].map(([id, e]) => ({ id, mine: hexId(e.organizer) === host.accountId, open: e.open, isKey: hexId(e.payout.bytes) === mpk })),
    types: [...L.ticketTypes].map(([id, t]) => ({ id, eventId: t.eventId, price: t.priceUsdCents, maxResale: t.maxResaleUsdCents,
      supply: t.supply, sold: t.sold, resale: t.resale, adultOnly: t.adultOnly })),
    tickets, ownedTickets, held,
    checkIns: new Map(admissions.map(([serial]) => [String(serial), L.tickets.lookup(serial).typeId])),
    listings: [...L.listings].map(([id, l]) => ({ id, serial: l.serial, typeId: l.typeId, price: l.priceUsdCents, mine: hexId(l.seller) === host.accountId })),
    ...projectMultiGate(L, host.accountId) };
}
// Fail closed instead of reusing v3 proofs/circuits against a different schema.
export async function callV4(_host: Host, _circuit: string, _args: unknown[]): Promise<{ txId: string; result: unknown; ms: number }> {
  throw new Error(V4_LOCAL_ONLY);
}
