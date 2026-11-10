/** Schema-4 capability gate. QR format is v2, contract identity/schema stays v4. Never queues offline. */
import { pureCircuitsV4, TicketStatusV4 } from './contract-v4';
import { doorAccepts } from './multiGate';
import { networkTagBytes, contractAddressStruct } from './schema';
import { bytesToHex, decodeAdmitQr, hexToBytes, randomNonce32 } from '../v2/admitCodec';
import { packageAdmitCapability } from '../v2/prepareAdmit';
import type { ContractState } from './viewTypes';
import type { AdmitVerdict } from './session-v2';
type Host = { networkId: string; contract: string | null; state(): Promise<ContractState | null>;
  call(circuit: string, args: unknown[]): Promise<{ txId: string }> };
type Meta = { ticketName?: string; eventName?: string; typeId?: string; eventDate?: string; venue?: string; cover?: string };
export async function registerSerialAdmitV4(host: Host, serial: bigint, meta?: Meta) {
  if (!host.contract) throw new Error('Select an event contract.');
  const state = await host.state();
  if (state?.schemaVersion !== 4) throw new Error('Expected serial ticket schema 4.');
  const ticket = state.ownedTickets.find(t => t.serial === serial);
  if (!ticket) throw new Error('Not an owned ticket serial');
  const nonce = randomNonce32();
  const commit = pureCircuitsV4.admitCommitOf(networkTagBytes(host.networkId), pureCircuitsV4.contractKeyOf(contractAddressStruct(host.contract)), serial, ticket.epoch, nonce);
  const registered = await host.call('registerAdmit', [serial, commit]);
  const packed = packageAdmitCapability({ networkId: host.networkId, contract: host.contract, serial: String(serial), epoch: String(ticket.epoch), nonceHex: bytesToHex(nonce), ...meta, typeId: meta?.typeId ?? String(ticket.typeId) });
  return { serial, epoch: ticket.epoch, admitTxId: registered.txId, ...packed };
}
export async function admitSerialV4(host: Host, text: string, gateId: bigint): Promise<AdmitVerdict> {
  const refuse = (reason: string): AdmitVerdict => ({ ok: false, reason });
  const cap = decodeAdmitQr(text.trim());
  if (!cap) return refuse('Bad QR — not a CloakTix admission code');
  if (cap.networkId !== host.networkId) return refuse('Wrong network');
  if (!host.contract || cap.contract !== host.contract) return refuse('Wrong event contract');
  try {
    const state = await host.state(); // Must be online and re-read for every scan.
    if (state?.schemaVersion !== 4) return refuse('Expected serial ticket schema 4');
    const gate = state.gates.find(g => g.id === gateId);
    if (!gate || !gate.active || (!gate.mine && !gate.assigned)) return refuse('Unauthorized or revoked staff, or inactive door');
    const row = state.tickets.find(t => t.serial === BigInt(cap.serial));
    if (!row) return refuse('Bad QR — unknown ticket');
    if (row.status === TicketStatusV4.consumed) return refuse('Already used');
    if (row.status !== TicketStatusV4.owned) return refuse('Replaced copy — ticket is not owned');
    const type = state.types.find(t => t.id === row.typeId);
    if (!type || !doorAccepts(gate, type)) return refuse('Wrong ticket type for this door');
    if (!row.hasAdmit || String(row.epoch) !== cap.epoch) return refuse('Replaced copy');
    const result = await host.call('admit', [row.serial, hexToBytes(cap.nonceHex), gateId]);
    // Success is displayed only after the call's confirmed result. Compact resolves races.
    return { ok: true, serial: row.serial, typeId: row.typeId, txId: result.txId };
  } catch { return refuse('Admission not confirmed. Refresh and retry online; copy may be replaced, already used, or staff revoked.'); }
}
