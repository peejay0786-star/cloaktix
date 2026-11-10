import type { TicketType as LegacyTicketType } from '../../../contract/managed/cloaktix/contract/index.js';
import type { TicketType as UniqueTicketType } from '../../../contract/managed/cloaktix-v2/contract/index.js';
import type { TicketType as RateTicketType } from '../../../contract/generated-rate-v4/contract/index.js';
import type { MultiGateState } from './multiGate';
import type { V2Listing, V2Ticket } from './session-v2';

/** UI projection is derived from generated ledger types, not a second contract schema. */
export type TicketType = (LegacyTicketType | UniqueTicketType | (Omit<RateTicketType, 'priceUsdCents' | 'maxResaleUsdCents'> & { price: bigint; maxResale: bigint })) & { id: bigint };
export type EventRow = { id: bigint; mine: boolean; open: boolean; isKey: boolean };
export type TicketRow = V2Ticket;
export type ListingRow = Omit<V2Listing, 'serial'> & { serial?: bigint };
type CommonState = {
  feeBps: bigint;
  ageIssuer: { x: bigint; y: bigint };
  events: EventRow[];
  types: TicketType[];
  held: Record<string, number> | null;
  checkIns: Map<string, bigint>;
  listings: ListingRow[];
};
export type ContractState = CommonState & (
  | { schemaVersion: 1; tickets?: never; ownedTickets?: never; networkTag?: never }
  | { schemaVersion: 2; tickets: TicketRow[]; ownedTickets: TicketRow[]; networkTag: Uint8Array }
  | { schemaVersion: 3; tickets: TicketRow[]; ownedTickets: TicketRow[]; networkTag: Uint8Array }
  | ({ schemaVersion: 4; tickets: TicketRow[]; ownedTickets: TicketRow[]; networkTag: Uint8Array } & MultiGateState)
);
