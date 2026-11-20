/**
 * EGG-40 session layer. Sibling of session-v3.ts, which is not modified here.
 * Payment order matches buyNightV3: signed quote, amounts, one buyTicket (or buyTicketAdult),
 * then pack the admit capability if the minted serial is known, otherwise registerAdmit.
 * Never a second buy. Door circuits set doorSk on the EGG-40 private state immediately before submit.
 */
import { readContractState } from './contractStateRead';
import {
  CompiledCloakTixEgg40,
  PRIVATE_STATE_ID_EGG40,
  createPrivateStateEgg40,
  ledgerEgg40,
  TicketStatusEgg40,
  pureCircuitsEgg40,
} from './contract-egg40';
import { submitCallTx } from '@midnight-ntwrk/midnight-js-contracts';
import type { ContractState } from './viewTypes';
import { networkTagBytes, contractAddressStruct } from './schema';
import { buyTicketV3Call, v3NightAmounts, nowInWindow } from './circuitArgs';
import { fetchSignedRateQuote } from '../rate/rateSignerClient';
import { randomNonce32, bytesToHex } from '../v2/admitCodec';
import { packageAdmitCapability } from '../v2/prepareAdmit';
import { sleep, withPendingRetry } from './walletPending';
import type { SessionV3Host } from './session-v3';

const hex = (b: Uint8Array) => [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
const EMPTY = new Uint8Array(32);
const MINT_EPOCH = 1n;
type BuyMeta = { typeId: bigint; adult: boolean; asOf?: bigint; ticketName?: string; eventName?: string };

export type SessionEgg40Host = SessionV3Host;

async function seedEgg40(host: SessionEgg40Host, doorSk?: Uint8Array | null) {
  await host.P.privateStateProvider.seed(
    PRIVATE_STATE_ID_EGG40,
    createPrivateStateEgg40(host.sk, host.age as never, doorSk ?? null),
  );
}

export async function callEgg40(host: SessionEgg40Host, circuitId: string, args: unknown[], doorSk?: Uint8Array | null) {
  if (!host.contract) throw new Error('No CloakTix EGG-40 contract selected');
  await seedEgg40(host, doorSk);
  const t0 = performance.now();
  // EGG-40 keys, not the session's rate-v3 ZK config (same circuit names, different keys).
  const { egg40Providers } = await import('./providers-egg40');
  const P = await egg40Providers(host as any);
  const r: any = await submitCallTx(P, {
    compiledContract: CompiledCloakTixEgg40,
    contractAddress: host.contract,
    privateStateId: PRIVATE_STATE_ID_EGG40,
    circuitId,
    args,
  } as any);
  return { txId: r.public.txId as string, result: r.private.result, ms: Math.round(performance.now() - t0) };
}

export async function authorizeDoorKeyEgg40(host: SessionEgg40Host, args: unknown[]) {
  return callEgg40(host, 'authorizeDoorKey', args);
}
export async function revokeDoorKeyEgg40(host: SessionEgg40Host, args: unknown[]) {
  return callEgg40(host, 'revokeDoorKey', args);
}
export async function admitByDoorEgg40(host: SessionEgg40Host, args: unknown[], doorSk: Uint8Array) {
  return callEgg40(host, 'admitByDoor', args, doorSk);
}
export async function admitByDoor4Egg40(host: SessionEgg40Host, args: unknown[], doorSk: Uint8Array) {
  return callEgg40(host, 'admitByDoor4', args, doorSk);
}
export async function admitEgg40(host: SessionEgg40Host, args: unknown[]) {
  return callEgg40(host, 'admit', args);
}

export async function stateEgg40(host: SessionEgg40Host): Promise<Extract<ContractState, { schemaVersion: 3 }> | null> {
  if (!host.contract) return null;
  const cs = await readContractState(host.P.publicDataProvider, host.contract);
  if (!cs) return null;
  const L = ledgerEgg40(cs.data);
  if (Number(L.schemaVersion) !== 3) throw new Error('ledger schemaVersion is not 3');
  const mpk = host.metaKey ? (await host.metaKey())?.pk : undefined;
  const accountId = host.accountId ?? '';
  const tickets = [...L.tickets].map(([serial, t]) => ({
    serial: serial as bigint,
    typeId: t.typeId as bigint,
    status: Number(t.status),
    epoch: t.epoch as bigint,
    hasAdmit: !!t.hasAdmit,
    mine: !!accountId && hex(t.owner) === accountId,
    listingId: t.listingId as bigint,
  }));
  const owned = tickets.filter((t) => t.mine && t.status === TicketStatusEgg40.owned);
  const held: Record<string, number> = {};
  for (const t of owned) held[String(t.typeId)] = (held[String(t.typeId)] ?? 0) + 1;
  return {
    schemaVersion: 3 as const,
    feeBps: L.feeBps as bigint,
    networkTag: L.networkTag as Uint8Array,
    ageIssuer: L.ageIssuer as { x: bigint; y: bigint },
    events: [...L.events]
      .map(([id, e]) => ({
        id: id as bigint,
        mine: !!accountId && hex(e.organizer) === accountId,
        open: e.open as boolean,
        isKey: !!mpk && hex(e.payout.bytes) === mpk,
      }))
      .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)),
    types: [...L.ticketTypes]
      .map(([id, t]) => {
        const row = t as any;
        return {
          id: id as bigint,
          eventId: row.eventId as bigint,
          price: row.priceUsdCents as bigint,
          priceUsdCents: row.priceUsdCents as bigint,
          supply: row.supply as bigint,
          sold: row.sold as bigint,
          resale: row.resale,
          maxResale: row.maxResaleUsdCents as bigint,
          maxResaleUsdCents: row.maxResaleUsdCents as bigint,
          adultOnly: row.adultOnly as boolean,
        };
      })
      .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)) as any,
    tickets,
    ownedTickets: owned,
    held,
    checkIns: new Map<string, bigint>(),
    listings: [...L.listings]
      .map(([id, l]) => ({
        id: id as bigint,
        mine: !!accountId && hex(l.seller) === accountId,
        serial: l.serial as bigint,
        typeId: l.typeId as bigint,
        price: (l as any).priceUsdCents ?? (l as any).price ?? 0n,
      }))
      .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)),
  };
}

export function contractKeyEgg40(host: Pick<SessionEgg40Host, 'contract'>): Uint8Array {
  if (!host.contract) throw new Error('No CloakTix EGG-40 contract selected');
  return pureCircuitsEgg40.contractKeyOf(contractAddressStruct(host.contract));
}
export function networkTagHexEgg40(host: Pick<SessionEgg40Host, 'networkId'>): string {
  return hex(networkTagBytes(host.networkId));
}
export function contractKeyHexEgg40(host: Pick<SessionEgg40Host, 'contract'>): string {
  return hex(contractKeyEgg40(host));
}

async function prepareAdmitEgg40(host: SessionEgg40Host, serial: bigint, buyTxId: string, meta: BuyMeta, extra: Record<string, unknown>) {
  try {
    const deadline = Date.now() + 180_000;
    let row: NonNullable<Awaited<ReturnType<typeof stateEgg40>>>['tickets'][number] | undefined;
    while (Date.now() < deadline) {
      const st = await stateEgg40(host);
      row = st?.tickets.find((t) => t.serial === serial);
      if (row) break;
      await sleep(2_500);
    }
    if (!row) throw new Error('Timed out waiting for bought serial in ledger');
    await sleep(4_000);
    const nonce = randomNonce32();
    const commit = pureCircuitsEgg40.admitCommitOf(networkTagBytes(host.networkId), contractKeyEgg40(host), serial, row.epoch, nonce);
    const reg = await withPendingRetry(
      'Register admit',
      () => callEgg40(host, 'registerAdmit', [serial, commit]),
      () => {},
    );
    const packed = packageAdmitCapability({
      networkId: host.networkId, contract: host.contract!, serial: String(serial), epoch: String(row.epoch),
      nonceHex: bytesToHex(nonce), ticketName: meta.ticketName, eventName: meta.eventName, typeId: String(meta.typeId),
    });
    return { serial, epoch: row.epoch, buyTxId, admitTxId: reg.txId, txId: reg.txId, prepareOk: true as const, needsPrepare: false as const, ...extra, ...packed };
  } catch (e: any) {
    return { serial, buyTxId, txId: buyTxId, prepareOk: false as const, needsPrepare: true as const, prepareError: String(e?.message ?? e), ...extra };
  }
}

async function readNextSerialEgg40(host: SessionEgg40Host): Promise<bigint | null> {
  try {
    if (!host.contract) return null;
    const cs = await readContractState(host.P.publicDataProvider, host.contract);
    if (!cs) return null;
    const c = (ledgerEgg40(cs.data) as any).serialCount;
    if (typeof c === 'bigint') return c + 1n;
    if (typeof c === 'number' && Number.isSafeInteger(c) && c >= 0) return BigInt(c) + 1n;
    return null;
  } catch {
    return null;
  }
}

/**
 * EGG-40 NIGHT primary buy. Same payment order as buyNightV3.
 * Fetch a signed USD→NIGHT quote, compute nightPaid/fee, then one buyTicket / buyTicketAdult.
 * Refuses unsigned quotes. Never submits a second buy.
 */
export async function buyNightEgg40(host: SessionEgg40Host, args: BuyMeta & { priceUsdCents: bigint; feeBps: bigint; fetcher?: typeof fetch }) {
  const signed = await fetchSignedRateQuote({ networkTagHex: networkTagHexEgg40(host), contractKeyHex: contractKeyHexEgg40(host), fetcher: args.fetcher });
  const { nightPaid, fee } = v3NightAmounts(args.priceUsdCents, signed.quote.atomsPerUsdCent, args.feeBps);
  const now = nowInWindow(signed.quote.issuedAt, signed.quote.expiresAt);
  const extra = { nightPaid, method: 'NIGHT' as const };
  const nextSerial = await readNextSerialEgg40(host);
  const nonce = nextSerial !== null ? randomNonce32() : null;
  const admitCommit = nextSerial !== null && nonce
    ? pureCircuitsEgg40.admitCommitOf(networkTagBytes(host.networkId), contractKeyEgg40(host), nextSerial, MINT_EPOCH, nonce)
    : EMPTY;
  const call = buyTicketV3Call({ typeId: args.typeId, admitCommit, nightPaid, fee, quote: signed.quote, now, asOf: args.adult ? args.asOf : undefined });
  const buy = await callEgg40(host, call.circuit, call.args);
  const serial = buy.result as bigint;
  if (nextSerial !== null && nonce && serial === nextSerial) {
    const packed = packageAdmitCapability({
      networkId: host.networkId, contract: host.contract!, serial: String(serial), epoch: String(MINT_EPOCH),
      nonceHex: bytesToHex(nonce), ticketName: args.ticketName, eventName: args.eventName, typeId: String(args.typeId),
    });
    return { serial, epoch: MINT_EPOCH, buyTxId: buy.txId, txId: buy.txId, prepareOk: true as const, needsPrepare: false as const, ...extra, ...packed };
  }
  return prepareAdmitEgg40(host, serial, buy.txId, args, extra);
}
