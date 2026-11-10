/**
 * Schema-v3 deploy helper (USD rate quotes, NIGHT payments). Does NOT submit unless caller invokes deployV3
 * from the user's browser wallet (1AM). Agent must never call this with a server key.
 */
import { readContractState } from './contractStateRead';
import {
  CompiledCloakTixV3,
  PRIVATE_STATE_ID_V3,
  createPrivateStateV3,
  ledgerV3,
  TicketStatusV3,
  RATE_SIGNER_PK,
} from './contract-v3';
import { submitCallTx } from '@midnight-ntwrk/midnight-js-contracts';
import { deployV3Batched, type DeployStepEvent } from './deployV3Batched';
import type { ContractState } from './viewTypes';
import { pureCircuitsV3 } from './contract-v3';
import { networkTagBytes, contractAddressStruct } from './schema';
import { buyTicketV3Call, v3NightAmounts, nowInWindow } from './circuitArgs';
import { fetchSignedRateQuote } from '../rate/rateSignerClient';
import { randomNonce32, bytesToHex } from '../v2/admitCodec';
import { packageAdmitCapability } from '../v2/prepareAdmit';
import { sleep, withPendingRetry } from './walletPending';

const hex = (b: Uint8Array) => [...b].map((x) => x.toString(16).padStart(2, '0')).join('');

export type SessionV3Host = {
  schema: 3;
  contract: string | null;
  networkId: string;
  sk: Uint8Array;
  P: any;
  userAddress: (bech?: string) => { bytes: Uint8Array };
  age: unknown;
  accountId?: string;
  metaKey?: () => Promise<{ priv: CryptoKey; pk: string } | null>;
};

export async function deployV3(
  host: SessionV3Host,
  feeAddressBech: string,
  stubIssuer: () => Promise<{ x: bigint; y: bigint }>,
  onStep?: (e: DeployStepEvent) => void,
  opts?: { forceNew?: boolean },
) {
  const r = await deployV3Batched(host, feeAddressBech, stubIssuer, { onStep, resume: true, forceNew: opts?.forceNew });
  return { address: r.address, txId: r.txIds[0] ?? '', txIds: r.txIds, steps: r.steps };
}

export async function callV3(host: SessionV3Host, circuitId: string, args: any[]) {
  if (!host.contract) throw new Error('No CloakTix v3 contract selected');
  const t0 = performance.now();
  const r: any = await submitCallTx(host.P, {
    compiledContract: CompiledCloakTixV3,
    contractAddress: host.contract,
    privateStateId: PRIVATE_STATE_ID_V3,
    circuitId,
    args,
  } as any);
  return { txId: r.public.txId as string, result: r.private.result, ms: Math.round(performance.now() - t0) };
}

/** Full UI state; empty maps/arrays are OK (not an error). */
export async function stateV3(host: SessionV3Host): Promise<Extract<ContractState, { schemaVersion: 3 }> | null> {
  if (!host.contract) return null;
  const cs = await readContractState(host.P.publicDataProvider, host.contract);
  if (!cs) return null;
  const L = ledgerV3(cs.data);
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
  const owned = tickets.filter((t) => t.mine && t.status === TicketStatusV3.owned);
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
          // UI legacy fields: for schema 3 these hold USD cents (not NIGHT atoms).
          // Prefer Price usdCents= / priceUsdCents when rendering.
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

export function contractKeyV3(host: Pick<SessionV3Host, 'contract'>): Uint8Array {
  if (!host.contract) throw new Error('No CloakTix v3 contract selected');
  return pureCircuitsV3.contractKeyOf(contractAddressStruct(host.contract));
}
export function networkTagHexV3(host: Pick<SessionV3Host, 'networkId'>): string {
  return hex(networkTagBytes(host.networkId));
}
export function contractKeyHexV3(host: Pick<SessionV3Host, 'contract'>): string {
  return hex(contractKeyV3(host));
}

type BuyMeta = { typeId: bigint; adult: boolean; asOf?: bigint; ticketName?: string; eventName?: string };
const EMPTY = new Uint8Array(32);

/** After a v3 primary buy: register the phone-admit commit (same capability format as v2). */
async function prepareAdmitV3(host: SessionV3Host, serial: bigint, buyTxId: string, meta: BuyMeta, extra: Record<string, unknown>) {
  try {
    // Payment succeeded: wait for its serial, never submit another buy on failure here.
    const deadline = Date.now() + 180_000;
    let row: NonNullable<Awaited<ReturnType<typeof stateV3>>>['tickets'][number] | undefined;
    while (Date.now() < deadline) {
      const st = await stateV3(host);
      row = st?.tickets.find((t) => t.serial === serial);
      if (row) break;
      await sleep(2_500);
    }
    if (!row) throw new Error('Timed out waiting for bought serial in ledger');
    // Extra beat so the wallet can clear its pending queue after indexer sees the tx.
    await sleep(4_000);
    const nonce = randomNonce32();
    const commit = pureCircuitsV3.admitCommitOf(networkTagBytes(host.networkId), contractKeyV3(host), serial, row.epoch, nonce);
    const reg = await withPendingRetry(
      'Register admit',
      () => callV3(host, 'registerAdmit', [serial, commit]),
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

/**
 * v3 NIGHT primary buy: fetch a SIGNED USD→NIGHT quote at purchase time, compute nightPaid/fee
 * exactly as the deployed circuit checks them, then buyTicket / buyTicketAdult. Refuses unsigned quotes.
 */
export async function buyNightV3(host: SessionV3Host, args: BuyMeta & { priceUsdCents: bigint; feeBps: bigint; fetcher?: typeof fetch }) {
  const signed = await fetchSignedRateQuote({ networkTagHex: networkTagHexV3(host), contractKeyHex: contractKeyHexV3(host), fetcher: args.fetcher });
  const { nightPaid, fee } = v3NightAmounts(args.priceUsdCents, signed.quote.atomsPerUsdCent, args.feeBps);
  const now = nowInWindow(signed.quote.issuedAt, signed.quote.expiresAt);
  const extra = { nightPaid, method: 'NIGHT' as const };
  // CT-ONE-BUY: predict the minted serial and register the admit commit inside buyTicket (one wallet tx).
  const nextSerial = await readNextSerialV3(host);
  const nonce = nextSerial !== null ? randomNonce32() : null;
  const admitCommit = nextSerial !== null && nonce
    ? pureCircuitsV3.admitCommitOf(networkTagBytes(host.networkId), contractKeyV3(host), nextSerial, MINT_EPOCH, nonce)
    : EMPTY;
  const call = buyTicketV3Call({ typeId: args.typeId, admitCommit, nightPaid, fee, quote: signed.quote, now, asOf: args.adult ? args.asOf : undefined });
  const buy = await callV3(host, call.circuit, call.args);
  const serial = buy.result as bigint;
  if (nextSerial !== null && nonce && serial === nextSerial) {
    const packed = packageAdmitCapability({
      networkId: host.networkId, contract: host.contract!, serial: String(serial), epoch: String(MINT_EPOCH),
      nonceHex: bytesToHex(nonce), ticketName: args.ticketName, eventName: args.eventName, typeId: String(args.typeId),
    });
    return { serial, epoch: MINT_EPOCH, buyTxId: buy.txId, txId: buy.txId, prepareOk: true as const, needsPrepare: false as const, ...extra, ...packed };
  }
  // Unreadable counter or race (commit was for another serial): registerAdmit overwrites. Never buy again.
  return prepareAdmitV3(host, serial, buy.txId, args, extra);
}

const MINT_EPOCH = 1n;

/** serialCount + 1 from the public ledger, or null when it cannot be read. */
async function readNextSerialV3(host: SessionV3Host): Promise<bigint | null> {
  try {
    if (!host.contract) return null;
    const cs = await readContractState(host.P.publicDataProvider, host.contract);
    if (!cs) return null;
    const c = (ledgerV3(cs.data) as any).serialCount;
    if (typeof c === 'bigint') return c + 1n;
    if (typeof c === 'number' && Number.isSafeInteger(c) && c >= 0) return BigInt(c) + 1n;
    return null;
  } catch {
    return null;
  }
}


export { PRIVATE_STATE_ID_V3, createPrivateStateV3, RATE_SIGNER_PK };
export type { DeployStepEvent };

/** Buyer id the deployed v3 circuit compares against me() (persistentHash of the CloakTix sk). */
export function buyerHexV3(host: Pick<SessionV3Host, 'sk'>): string {
  return hex(pureCircuitsV3.accountId(host.sk));
}
