/** Schema-3 ticket recovery/check-in only. Does not change the primary buy path. */
import { pureCircuitsV3, TicketStatusV3 } from './contract-v3';
import { networkTagBytes, contractAddressStruct } from './schema';
import { bytesToHex, decodeAdmitQr, hexToBytes, randomNonce32 } from '../v2/admitCodec';
import { packageAdmitCapability } from '../v2/prepareAdmit';
import type { ContractState } from './viewTypes';
import type { AdmitVerdict } from './session-v2';

type Host = {
  networkId: string; contract: string | null;
  state(): Promise<ContractState | null>;
  call(circuit: string, args: any[]): Promise<{ txId: string }>;
};
type Meta = { ticketName?: string; eventName?: string; typeId?: string; eventDate?: string; venue?: string; cover?: string };

export async function registerSerialAdmitV3(host: Host, serial: bigint, meta?: Meta) {
  if (!host.contract) throw new Error('Select an event contract.');
  const state = await host.state();
  if (state?.schemaVersion !== 3) throw new Error('Expected serial ticket schema 3.');
  const row = state.ownedTickets.find((ticket) => ticket.serial === serial);
  if (!row) throw new Error('Not an owned ticket serial');
  const nonce = randomNonce32();
  const commit = pureCircuitsV3.admitCommitOf(networkTagBytes(host.networkId), pureCircuitsV3.contractKeyOf(contractAddressStruct(host.contract)), serial, row.epoch, nonce);
  const registered = await host.call('registerAdmit', [serial, commit]);
  const packed = packageAdmitCapability({ networkId: host.networkId, contract: host.contract, serial: String(serial), epoch: String(row.epoch), nonceHex: bytesToHex(nonce), ...meta, typeId: meta?.typeId ?? String(row.typeId) });
  return { serial, epoch: row.epoch, admitTxId: registered.txId, ...packed };
}

export async function admitSerialV3(host: Host, text: string, acceptedTypeIds: bigint[]): Promise<AdmitVerdict> {
  const cap = decodeAdmitQr(text.trim());
  if (!cap) return { ok: false, reason: 'Not a CloakTix admission QR' };
  if (cap.networkId !== host.networkId) return { ok: false, reason: 'Ticket is for another network' };
  if (!host.contract || cap.contract !== host.contract) return { ok: false, reason: 'Ticket is for another event contract' };
  const state = await host.state();
  if (state?.schemaVersion !== 3) return { ok: false, reason: 'Expected serial ticket schema 3' };
  const row = state.tickets.find((ticket) => ticket.serial === BigInt(cap.serial));
  if (!row) return { ok: false, reason: 'Serial not on this contract' };
  if (row.status !== TicketStatusV3.owned) return { ok: false, reason: 'Ticket is no longer in owned state' };
  if (!acceptedTypeIds.includes(row.typeId)) return { ok: false, reason: 'Wrong ticket type for this gate' };
  if (!row.hasAdmit || String(row.epoch) !== cap.epoch) return { ok: false, reason: 'This ticket copy has been replaced' };
  try {
    const result = await host.call('admit', [row.serial, hexToBytes(cap.nonceHex)]);
    return { ok: true, serial: row.serial, typeId: row.typeId, txId: result.txId };
  } catch (error) {
    return { ok: false, reason: error instanceof Error ? error.message : String(error) };
  }
}
