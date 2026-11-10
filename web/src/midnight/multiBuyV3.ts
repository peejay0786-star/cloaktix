/**
 * CT-MULTI-BUY (option B): buy 2 to 4 tickets of one v3 type in ONE transaction.
 * N buyTicket calls are composed in a Midnight.js 5 scoped transaction (each against the running state of the
 * previous one), proved in the tab (one proof per ticket), then balanced + DUST-paid + submitted by the wallet once:
 * one 1AM approval, all-or-nothing. The single-ticket path (session-v3.ts buyNightV3) is not used or changed here.
 */
import { submitCallTx, withLedger9ContractScopedTransaction } from '@midnight-ntwrk/midnight-js-contracts';
import { CompiledCloakTixV3, PRIVATE_STATE_ID_V3, ledgerV3, pureCircuitsV3 } from './contract-v3';
import { readContractState } from './contractStateRead';
import { networkTagBytes } from './schema';
import { buyTicketV3Call, v3NightAmounts, nowInWindow } from './circuitArgs';
import { fetchSignedRateQuote } from '../rate/rateSignerClient';
import { randomNonce32, bytesToHex } from '../v2/admitCodec';
import { packageAdmitCapability } from '../v2/prepareAdmit';
import { contractKeyHexV3, contractKeyV3, networkTagHexV3, type SessionV3Host } from './session-v3';
import { onLocalProof } from './localProver';
import { isPendingTxWalletError } from './walletPending';
import { LedgerTransaction } from '@midnight-ntwrk/midnight-js-types';
import { mergeLedgerTxIntoOneIntent } from './singleIntent';

export const MAX_MULTI_BUY = 4;
/** Ledger key locations look like `contract:<address>/<circuit>?vk=<hash>` (or a bare circuit name). */
export const circuitOfKeyLocation = (k: string): string => k.replace(/\?.*$/, '').split('/').pop() ?? k;
const MINT_EPOCH = 1n;

export type MultiBuyStage = 'quote' | 'building' | 'proving' | 'wallet' | 'submitting' | 'confirming';
export type MultiBuyProgress = { stage: MultiBuyStage; proved: number; total: number };
export const multiBuyProgressLabel = (p: MultiBuyProgress): string =>
  p.stage === 'proving' ? `Proving ticket ${Math.min(p.proved + 1, p.total)} of ${p.total}…`
    : p.stage === 'wallet' ? `Approve 1 transaction for ${p.total} tickets in your wallet…`
      : p.stage === 'submitting' || p.stage === 'confirming' ? `Submitting ${p.total} tickets in one transaction…`
        : p.stage === 'quote' ? 'Getting a signed NIGHT rate…' : `Preparing ${p.total} tickets…`;

export type MultiBuyFailureKind = 'nothing-bought' | 'wallet-refused-multi' | 'network-rejected' | 'wallet-pending' | 'unknown-after-submit';
/** Failures where buying one ticket at a time is a sensible next step (nothing was bought). */
export const offersOneAtATime = (kind: unknown) => kind === 'wallet-refused-multi' || kind === 'network-rejected';
export class MultiBuyError extends Error {
  constructor(public kind: MultiBuyFailureKind, message: string, public cause?: unknown) { super(message); this.name = 'MultiBuyError'; }
}

const errText = (e: unknown): string => {
  const parts: string[] = []; let c: any = e;
  for (let i = 0; c && i < 6; i++) { parts.push(String(c?.message ?? c)); c = c?.cause; }
  return parts.join(' <- ');
};
/** Wallet errors that are about fees/pending state, not about the multi-call shape. */
/** Node/wallet text for a transaction refused at submission (never included in a block). */
export const isNodeRejection = (t: string) => /\b1010\b|invalid transaction|submissionerror|transaction submission error|submit transaction failed|custom error/i.test(t);
const isFeeOrCancel = (t: string) => /dust|fee|insufficient|not enough|rejected by user|user rejected|denied|cancel/i.test(t);

export type MultiBuyTicket = ReturnType<typeof packageAdmitCapability> & { serial: bigint; epoch: bigint };
export type MultiBuyResult = { txId: string; tickets: MultiBuyTicket[]; nightPaid: bigint; nightPaidEach: bigint; method: 'NIGHT'; qty: number };

type Deps = {
  fetchQuote?: typeof fetchSignedRateQuote;
  scoped?: typeof withLedger9ContractScopedTransaction;
  /** Test only: keep Midnight.js's one-intent-per-call shape (reproduces the 227 shape). */
  keepIntentPerCall?: boolean;
  call?: typeof submitCallTx;
  readSerialCount?: () => Promise<bigint | null>;
  ownsSerial?: (serial: bigint) => Promise<boolean>;
};

async function readSerialCount(host: SessionV3Host): Promise<bigint | null> {
  try {
    if (!host.contract) return null;
    const cs = await readContractState(host.P.publicDataProvider, host.contract);
    if (!cs) return null;
    const c = (ledgerV3(cs.data) as any).serialCount;
    return typeof c === 'bigint' ? c : typeof c === 'number' && Number.isSafeInteger(c) ? BigInt(c) : null;
  } catch { return null; }
}
async function ownsSerial(host: SessionV3Host, serial: bigint): Promise<boolean> {
  try {
    if (!host.contract || !host.accountId) return false;
    const cs = await readContractState(host.P.publicDataProvider, host.contract);
    if (!cs) return false;
    const L: any = ledgerV3(cs.data);
    if (!L.tickets.member(serial)) return false;
    const t = L.tickets.lookup(serial);
    return [...t.owner].map((b: number) => b.toString(16).padStart(2, '0')).join('') === host.accountId;
  } catch { return false; }
}

/** Wrap balance/submit to know which stage failed, without changing what they do. */
function stagedProviders(P: any, onStage: (s: MultiBuyStage) => void, onWalletError: (e: unknown) => void, markers: Uint8Array[] = [], onSubmitError: (e: unknown) => void = () => {}) {
  const walletProvider = new Proxy(P.walletProvider, { get(t, k, r) {
    const v = Reflect.get(t, k, r);
    if (k === 'balanceTx' && typeof v === 'function') return async (...a: unknown[]) => { onStage('wallet'); try { return await v.apply(t, a); } catch (e) { onWalletError(e); throw e; } };
    return typeof v === 'function' ? v.bind(t) : v;
  } });
  const midnightProvider = new Proxy(P.midnightProvider, { get(t, k, r) {
    const v = Reflect.get(t, k, r);
    if (k === 'submitTx' && typeof v === 'function') return async (...a: unknown[]) => { onStage('submitting'); let id: unknown; try { id = await v.apply(t, a); } catch (e) { onSubmitError(e); throw e; } onStage('confirming'); return id; };
    return typeof v === 'function' ? v.bind(t) : v;
  } });
  // CT-MULTI-BUY-227: one intent (calls in order) before proving, so 1AM balances one NIGHT demand and the ledger
  // applies the calls in sequence. Without this, N random-segment intents => node error 227 (duplicate NIGHT input).
  const proofProvider = markers.length > 1 && P.proofProvider ? new Proxy(P.proofProvider, { get(t, k, r) {
    const v = Reflect.get(t, k, r);
    if (k === 'proveTx' && typeof v === 'function') return async (tx: any, ...rest: unknown[]) => v.call(t, mergeLedgerTxIntoOneIntent(tx, markers, LedgerTransaction as any), ...rest);
    return typeof v === 'function' ? v.bind(t) : v;
  } }) : P.proofProvider;
  return { ...P, walletProvider, midnightProvider, proofProvider };
}

export async function buyNightV3Multi(host: SessionV3Host, args: {
  typeId: bigint; qty: number; priceUsdCents: bigint; feeBps: bigint; ticketName?: string; eventName?: string;
  fetcher?: typeof fetch; onProgress?: (p: MultiBuyProgress) => void;
}, deps: Deps = {}): Promise<MultiBuyResult> {
  const qty = Math.trunc(args.qty);
  if (!host.contract) throw new MultiBuyError('nothing-bought', 'No CloakTix v3 contract selected. Nothing was bought.');
  if (!(qty >= 2 && qty <= MAX_MULTI_BUY)) throw new MultiBuyError('nothing-bought', `Choose 2 to ${MAX_MULTI_BUY} tickets (1 uses the normal Buy). Nothing was bought.`);
  const S: { stage: MultiBuyStage } = { stage: 'quote' }; let proved = 0;
  const report = () => args.onProgress?.({ stage: S.stage, proved, total: qty });
  const setStage = (s: MultiBuyStage) => { S.stage = s; report(); };
  report();

  let signed: Awaited<ReturnType<typeof fetchSignedRateQuote>>, nightPaid: bigint, fee: bigint, now: bigint, count: bigint | null;
  try {
    signed = await (deps.fetchQuote ?? fetchSignedRateQuote)({ networkTagHex: networkTagHexV3(host), contractKeyHex: contractKeyHexV3(host), fetcher: args.fetcher });
    ({ nightPaid, fee } = v3NightAmounts(args.priceUsdCents, signed.quote.atomsPerUsdCent, args.feeBps));
    now = nowInWindow(signed.quote.issuedAt, signed.quote.expiresAt);
    count = await (deps.readSerialCount ?? (() => readSerialCount(host)))();
  } catch (e) {
    throw new MultiBuyError('nothing-bought', `Nothing was bought. Could not get a signed NIGHT rate: ${errText(e).slice(0, 200)}`, e);
  }
  if (count === null) throw new MultiBuyError('nothing-bought', 'Could not read the ticket counter. Nothing was bought. Try again, or buy one at a time.');
  const first = count + 1n;
  const tag = networkTagBytes(host.networkId), key = contractKeyV3(host);
  const nonces = Array.from({ length: qty }, () => randomNonce32());
  const calls = nonces.map((nonce, i) => buyTicketV3Call({ typeId: args.typeId, nightPaid, fee, quote: signed.quote, now,
    admitCommit: pureCircuitsV3.admitCommitOf(tag, key, first + BigInt(i), MINT_EPOCH, nonce) }));

  setStage('building');
  const results: bigint[] = [];
  let walletErr: unknown = null;
  let submitErr: unknown = null;
  const P = stagedProviders(host.P, setStage, (e) => { walletErr = e; }, deps.keepIntentPerCall ? [] : calls.map((c) => c.args[1] as Uint8Array), (e) => { submitErr = e; });
  const stop = onLocalProof((e) => {
    if (circuitOfKeyLocation(e.keyLocation) !== 'buyTicket') return;
    if (e.phase === 'start' && S.stage === 'building') setStage('proving');
    if (e.phase === 'done') { proved = Math.min(qty, proved + 1); report(); }
  });
  let fin: any;
  try {
    fin = await (deps.scoped ?? withLedger9ContractScopedTransaction)(P, async (ctx: any) => {
      for (const c of calls) {
        const r: any = await (deps.call ?? (submitCallTx as any))(P, { compiledContract: CompiledCloakTixV3, contractAddress: host.contract!,
          privateStateId: PRIVATE_STATE_ID_V3, circuitId: c.circuit, args: c.args } as any, ctx);
        results.push(r?.private?.result as bigint);
      }
    }, { scopeName: `cloaktix-multi-buy-${qty}` } as any);
  } catch (e) {
    const t = errText(e);
    if (S.stage === 'submitting' || S.stage === 'confirming') {
      // Submitted: the chain decides. Never tell the buyer "nothing bought" if their tickets exist.
      const own = deps.ownsSerial ?? ((s: bigint) => ownsSerial(host, s));
      const all = (await Promise.all(Array.from({ length: qty }, (_, i) => own(first + BigInt(i))))).every(Boolean);
      if (all) { fin = { public: { txId: '' }, recovered: true }; for (let i = 0; i < qty; i++) results[i] = first + BigInt(i); }
      else if (S.stage === 'submitting' && submitErr !== null && isNodeRejection(errText(submitErr))) {
        // The node refused the transaction itself (e.g. "1010: Invalid Transaction"): it never entered a block.
        throw new MultiBuyError('network-rejected', `The network rejected the ${qty}-ticket transaction. Nothing was bought and no NIGHT was spent. You can buy them one at a time. (${errText(submitErr).slice(0, 200)})`, e);
      }
      else throw new MultiBuyError('unknown-after-submit', `The ${qty}-ticket transaction was sent but not confirmed yet. Check My tickets in a minute before buying again. (${t.slice(0, 200)})`, e);
    } else if (S.stage === 'wallet' && walletErr !== null && isPendingTxWalletError(walletErr)) {
      throw new MultiBuyError('wallet-pending', 'Your wallet still has a pending transaction. Nothing was bought. Wait for it to finish, then try again.', e);
    } else if (S.stage === 'wallet' && walletErr !== null && isFeeOrCancel(errText(walletErr))) {
      throw new MultiBuyError('nothing-bought', `Nothing was bought. Your wallet did not approve the transaction: ${errText(walletErr).slice(0, 200)}`, e);
    } else if (S.stage === 'wallet') {
      // The wallet saw the N-call transaction and refused it for a reason other than fees/cancel: offer one at a time.
      throw new MultiBuyError('wallet-refused-multi', `Your wallet did not accept ${qty} tickets in one transaction. Nothing was bought. You can buy them one at a time. (${errText(walletErr ?? e).slice(0, 200)})`, e);
    } else {
      throw new MultiBuyError('nothing-bought', `Nothing was bought. ${t.slice(0, 300)}`, e);
    }
  } finally { stop(); }

  const serials = results.map((r, i) => (typeof r === 'bigint' ? r : first + BigInt(i)));
  if (serials.some((s, i) => s !== first + BigInt(i))) {
    // Commits are bound to predicted serials. Mismatch cannot validate on chain; refuse to package wrong links.
    throw new MultiBuyError('unknown-after-submit', 'Ticket numbers did not match the prepared entry links. Open My tickets and prepare each ticket there; do not buy again.');
  }
  const tickets = serials.map((serial, i) => ({ serial, epoch: MINT_EPOCH, ...packageAdmitCapability({
    networkId: host.networkId, contract: host.contract!, serial: String(serial), epoch: String(MINT_EPOCH),
    nonceHex: bytesToHex(nonces[i]), ticketName: args.ticketName, eventName: args.eventName, typeId: String(args.typeId) }) }));
  return { txId: String(fin?.public?.txId ?? ''), tickets, nightPaid: nightPaid * BigInt(qty), nightPaidEach: nightPaid, method: 'NIGHT', qty };
}
