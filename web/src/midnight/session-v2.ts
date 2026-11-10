import { readContractState } from './contractStateRead';
import type { ContractState } from './viewTypes';
/**
 * Schema-v2 Session helpers: buy→serial, registerAdmit, phone export, organizer admit.
 * Does not import checkIn / v1 pass verify.
 */
import {
  CompiledCloakTixV2,
  PRIVATE_STATE_ID_V2,
  FEE_BPS_V2,
  ledgerV2,
  pureCircuitsV2,
  createPrivateStateV2,
  TicketStatus,
} from './contract-v2';
import { networkTagBytes, contractAddressStruct } from './schema';
import {
  bytesToHex,
  encodeAdmitFragmentPath,
  encodeAdmitQr,
  decodeAdmitQr,
  randomNonce32,
} from '../v2/admitCodec';
import { packageAdmitCapability } from '../v2/prepareAdmit';
import { deployContract, submitCallTx } from '@midnight-ntwrk/midnight-js-contracts';

const hex = (u: Uint8Array) => Array.from(u, (b) => b.toString(16).padStart(2, '0')).join('');
const unhex = (s: string) => Uint8Array.from(s.match(/../g)!.map((h) => parseInt(h, 16)));

export type V2Ticket = {
  serial: bigint;
  typeId: bigint;
  status: number;
  epoch: bigint;
  hasAdmit: boolean;
  mine: boolean;
  listingId: bigint;
};

export type V2Listing = {
  id: bigint;
  mine: boolean;
  serial: bigint;
  typeId: bigint;
  price: bigint;
};

export type AdmitVerdict =
  | { ok: true; serial: bigint; typeId: bigint; txId: string }
  | { ok: false; reason: string };

const usedAdmitKey = (contract: string) => `cloaktix:gate:admit-used:v2:${contract}`;
export const gateAdmitUsed = (contract: string): Record<string, string> =>
  JSON.parse(localStorage.getItem(usedAdmitKey(contract)) ?? '{}');
const markAdmitUsed = (contract: string, serial: string) =>
  localStorage.setItem(
    usedAdmitKey(contract),
    JSON.stringify({ ...gateAdmitUsed(contract), [serial]: new Date().toISOString() }),
  );

/** Minimal surface the Session must provide. */
export type SessionV2Host = {
  schema: 2;
  contract: string | null;
  networkId: string;
  sk: Uint8Array;
  accountId: string;
  P: any;
  api: any;
  userAddress: (bech?: string) => { bytes: Uint8Array };
  metaKey: () => Promise<{ priv: CryptoKey; pk: string } | null>;
  age: unknown;
};

export async function deployV2(host: SessionV2Host, feeAddressBech: string, stubIssuer: () => Promise<{ x: bigint; y: bigint }>) {
  const d: any = await deployContract(host.P, {
    compiledContract: CompiledCloakTixV2,
    privateStateId: PRIVATE_STATE_ID_V2,
    initialPrivateState: createPrivateStateV2(host.sk, host.age as any),
    args: [
      FEE_BPS_V2,
      host.userAddress(feeAddressBech),
      pureCircuitsV2.accountId(host.sk),
      await stubIssuer(),
      networkTagBytes(host.networkId),
    ],
  } as any);
  return { address: d.deployTxData.public.contractAddress as string, txId: d.deployTxData.public.txId as string };
}

export async function callV2(host: SessionV2Host, circuitId: string, args: any[]) {
  if (!host.contract) throw new Error('No CloakTix v2 contract selected');
  const t0 = performance.now();
  const r: any = await submitCallTx(host.P, {
    compiledContract: CompiledCloakTixV2,
    contractAddress: host.contract,
    privateStateId: PRIVATE_STATE_ID_V2,
    circuitId,
    args,
  } as any);
  return { txId: r.public.txId as string, result: r.private.result, ms: Math.round(performance.now() - t0) };
}

export function admitCommitFor(host: SessionV2Host, serial: bigint, epoch: bigint, nonce: Uint8Array): Uint8Array {
  if (!host.contract) throw new Error('No contract');
  return pureCircuitsV2.admitCommitOf(
    networkTagBytes(host.networkId),
    pureCircuitsV2.contractKeyOf(contractAddressStruct(host.contract)),
    serial,
    epoch,
    nonce,
  );
}

export async function stateV2(host: SessionV2Host): Promise<Extract<ContractState, {schemaVersion: 2}> | null> {
  if (!host.contract) return null;
  const cs = await readContractState(host.P.publicDataProvider, host.contract);
  if (!cs) return null;
  const L = ledgerV2(cs.data);
  const mpk = (await host.metaKey())?.pk;
  const tickets: V2Ticket[] = [...L.tickets].map(([serial, t]) => ({
    serial: serial as bigint,
    typeId: t.typeId as bigint,
    status: Number(t.status),
    epoch: t.epoch as bigint,
    hasAdmit: !!t.hasAdmit,
    mine: hex(t.owner) === host.accountId,
    listingId: t.listingId as bigint,
  }));
  const owned = tickets.filter((t) => t.mine && t.status === TicketStatus.owned);
  const held: Record<string, number> = {};
  for (const t of owned) held[String(t.typeId)] = (held[String(t.typeId)] ?? 0) + 1;
  return {
    schemaVersion: 2 as const,
    feeBps: L.feeBps,
    networkTag: L.networkTag as Uint8Array,
    ageIssuer: L.ageIssuer as { x: bigint; y: bigint },
    events: [...L.events]
      .map(([id, e]) => ({
        id: id as bigint,
        mine: hex(e.organizer) === host.accountId,
        open: e.open as boolean,
        isKey: hex(e.payout.bytes) === mpk,
      }))
      .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)),
    types: [...L.ticketTypes]
      .map(([id, t]) => ({ id: id as bigint, ...t }))
      .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)),
    tickets,
    ownedTickets: owned,
    held,
    checkIns: new Map<string, bigint>(), // v2 has no checkIns; keep shape for UI guards
    listings: [...L.listings]
      .map(([id, l]) => ({
        id: id as bigint,
        mine: hex(l.seller) === host.accountId,
        serial: l.serial as bigint,
        typeId: l.typeId as bigint,
        price: l.price as bigint,
      }))
      .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)),
  };
}

/**
 * Buy one ticket then registerAdmit (2 txs). Returns phone-exportable capability.
 * Does not burn. Nonce never written to chain — only its commit hash.
 */
export async function buyAndPrepareAdmit(
  host: SessionV2Host,
  args: {
    typeId: bigint;
    adult: boolean;
    asOf?: bigint;
    ticketName?: string;
    eventName?: string;
  },
) {
  const empty = new Uint8Array(32);
  // One buy only. If registerAdmit fails afterward, return the serial so UI can recover prepare
  // separately — never silently retry buyTicket.
  const buy = args.adult
    ? await callV2(host, 'buyTicketAdult', [args.typeId, empty, args.asOf])
    : await callV2(host, 'buyTicket', [args.typeId, empty]);
  const serial = buy.result as bigint;
  try {
    const st = await stateV2(host);
    const row = st?.tickets.find((t) => t.serial === serial);
    if (!row) throw new Error('Bought serial not found in ledger');
    const nonce = randomNonce32();
    const commit = admitCommitFor(host, serial, row.epoch, nonce);
    const reg = await callV2(host, 'registerAdmit', [serial, commit]);
    const packed = packageAdmitCapability({
      networkId: host.networkId,
      contract: host.contract!,
      serial: String(serial),
      epoch: String(row.epoch),
      nonceHex: bytesToHex(nonce),
      ticketName: args.ticketName,
      eventName: args.eventName,
      typeId: String(args.typeId),
    });
    return {
      serial,
      epoch: row.epoch,
      buyTxId: buy.txId,
      admitTxId: reg.txId,
      prepareOk: true as const,
      needsPrepare: false as const,
      ...packed,
    };
  } catch (e: any) {
    return {
      serial,
      buyTxId: buy.txId,
      prepareOk: false as const,
      needsPrepare: true as const,
      prepareError: String(e?.message ?? e),
    };
  }
}

export async function registerAdmitOnly(host: SessionV2Host, serial: bigint, meta?: { ticketName?: string; eventName?: string; typeId?: string }) {
  const st = await stateV2(host);
  const row = st?.ownedTickets.find((t) => t.serial === serial);
  if (!row) throw new Error('Not an owned ticket serial');
  const nonce = randomNonce32();
  const commit = admitCommitFor(host, serial, row.epoch, nonce);
  const reg = await callV2(host, 'registerAdmit', [serial, commit]);
  const packed = packageAdmitCapability({
    networkId: host.networkId,
    contract: host.contract!,
    serial: String(serial),
    epoch: String(row.epoch),
    nonceHex: bytesToHex(nonce),
    ...meta,
    typeId: meta?.typeId ?? String(row.typeId),
  });
  return { serial, epoch: row.epoch, admitTxId: reg.txId, ...packed };
}

/** Organizer gate: decode QR, bind net/contract, call admit. Never uses v1 checkIn. */
export async function admitAtGate(
  host: SessionV2Host,
  text: string,
  acceptedTypeIds: bigint[],
): Promise<AdmitVerdict> {
  const cap = decodeAdmitQr(text.trim());
  if (!cap) return { ok: false, reason: 'Not a CloakTix admit v2 code' };
  if (cap.networkId !== host.networkId)
    return { ok: false, reason: `Wrong network (code ${cap.networkId}, session ${host.networkId})` };
  if (!host.contract || cap.contract !== host.contract)
    return { ok: false, reason: 'Admit issued for another CloakTix contract' };
  const used = gateAdmitUsed(host.contract)[cap.serial];
  if (used) return { ok: false, reason: `Already admitted locally at ${new Date(used).toLocaleTimeString('en-US')}` };

  const st = await stateV2(host);
  const serial = BigInt(cap.serial);
  const row = st?.tickets.find((t) => t.serial === serial);
  if (!row) return { ok: false, reason: 'Serial not on this contract' };
  if (row.status === TicketStatus.consumed) return { ok: false, reason: 'Ticket already consumed' };
  if (row.status !== TicketStatus.owned) return { ok: false, reason: 'Ticket not in owned state (listed or other)' };
  if (!acceptedTypeIds.includes(row.typeId))
    return { ok: false, reason: `Wrong ticket type (#${row.typeId}) for this gate`, };

  // Organizer submits admit — burns/consumes on-chain. Nonce revealed in call args (public).
  const nonce = unhex(cap.nonceHex);
  try {
    const r = await callV2(host, 'admit', [serial, nonce]);
    markAdmitUsed(host.contract, cap.serial);
    return { ok: true, serial, typeId: row.typeId, txId: r.txId };
  } catch (e: any) {
    return { ok: false, reason: String(e?.message ?? e) };
  }
}

export { encodeAdmitQr, encodeAdmitFragmentPath, TicketStatus, PRIVATE_STATE_ID_V2, createPrivateStateV2 };
