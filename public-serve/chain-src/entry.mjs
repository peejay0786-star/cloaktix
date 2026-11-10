// Bundled into ../cloaktix-chain.mjs (node, no deps). Decodes CloakTix ledger state from the indexer's hex.
import { ContractState } from '@midnight-ntwrk/compact-runtime';
import { ledger } from '../../contract/managed/cloaktix/contract/index.js';
const hex = (b) => Buffer.from(b).toString('hex');
export function decodeCloakTix(stateHex) {
  const L = ledger(ContractState.deserialize(Buffer.from(stateHex, 'hex')).data);
  const events = new Map([...L.events].map(([id, e]) => [String(id), { organizer: hex(e.organizer), payout: hex(e.payout.bytes) }]));
  const types = new Map([...L.ticketTypes].map(([id, t]) => [String(id), { eventId: String(t.eventId) }]));
  return { events, types };
}
