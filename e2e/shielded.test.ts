// CloakTix shielded variant — local devnet E2E, real proofs. No real funds.
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { randomBytes } from 'node:crypto';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { deployContract, submitCallTx } from '@midnight-ntwrk/midnight-js-contracts';
import { encodeUserAddress, encodeCoinPublicKey, encodeRawTokenType, encodeShieldedCoinInfo } from '@midnight-ntwrk/midnight-js-protocol/compact-runtime';
import { createShieldedCoinInfo, rawTokenType } from '@midnight-ntwrk/midnight-js-protocol/ledger';
import pino from 'pino';
import { getConfig } from './config.js';
import { MidnightWalletProvider, resolveWallet, syncWallet } from './wallet.js';
import { buildProviders } from './providers.js';
import { CompiledCloakTixShielded as C, ledger, zkConfigPathShielded, pureCircuits } from '../contract/shielded.js';
import { createPrivateState } from '../contract/witnesses.js';

const logger = pino({ level: 'info', transport: { target: 'pino-pretty' } });
const NIGHT = '0'.repeat(64);
const BPS = 300n, fee = (p: bigint) => (p * BPS) / 10000n;
const PRICE = 10_000_000n, CAP = 12_000_000n;
const dom = new Uint8Array(32); dom.set(new TextEncoder().encode('cloaktix:wnight:'));
const t = () => Date.now();
const hex = (b: Uint8Array) => Buffer.from(b).toString('hex');

describe('CloakTix shielded E2E (local)', () => {
  const config = getConfig();
  let org: MidnightWalletProvider, feeW: MidnightWalletProvider, buyer: MidnightWalletProvider;
  let orgP: any, buyerP: any, addr: any, color = '';
  const sk = { admin: randomBytes(32), org: randomBytes(32), buyer: randomBytes(32), buyer2: randomBytes(32) };
  const night = async (w: MidnightWalletProvider) => (await w.wallet.waitForSyncedState()).unshielded.balances[NIGHT] ?? 0n;
  const wn = async (w: MidnightWalletProvider) => (await w.wallet.waitForSyncedState()).shielded.balances[color] ?? 0n;
  const waitBal = async (f: () => Promise<bigint>, want: bigint) => {
    for (let i = 0; i < 120; i++) { const b = await f(); if (b === want) return b; await new Promise(r => setTimeout(r, 2000)); }
    return f();
  };
  const map = (...ws: MidnightWalletProvider[]) => new Map(ws.map(w => [w.getCoinPublicKey(), w.getEncryptionPublicKey()]));
  const coin = (v: bigint) => encodeShieldedCoinInfo(createShieldedCoinInfo(color, v));
  const callTx = async (P: any, psId: string, circuitId: string, args: any[], extra: any = {}) => {
    const t0 = t();
    const r: any = await submitCallTx(P, { compiledContract: C, contractAddress: addr, privateStateId: psId, circuitId, args, ...extra } as any);
    console.log(`${circuitId.toUpperCase()} ok tx=${r.public.txId} en ${t() - t0} ms${r.private.result !== undefined ? ' result=' + r.private.result : ''}`);
    return r;
  };
  const expectFail = async (p: Promise<any>, re: RegExp, label: string) => {
    let err: any = null; try { await p; } catch (e) { err = e; }
    expect(String(err?.message ?? err)).toMatch(re);
    console.log(`${label} rejected (expected): ${String(err?.message ?? err).slice(0, 120)}`);
  };
  const state = async () => ledger((await orgP.publicDataProvider.queryContractState(addr))!.data);

  beforeAll(async () => {
    setNetworkId(config.networkId);
    const env: any = { walletNetworkId: config.networkId, networkId: config.networkId, indexer: config.indexer, indexerWS: config.indexerWS, node: config.node, nodeWS: config.nodeWS, faucet: config.faucet, proofServer: config.proofServer };
    const mk = async (role: string) => { const w = await MidnightWalletProvider.build(logger, env, resolveWallet('local', role).secret); await w.start(); await syncWallet(logger, w.wallet, 10 * 60_000); return w; };
    org = await mk('ALICE'); feeW = await mk('BOB'); buyer = await mk('CHARLIE');
    orgP = buildProviders(org, zkConfigPathShielded, config);
    buyerP = buildProviders(buyer, zkConfigPathShielded, config);
  });
  afterAll(async () => { for (const w of [org, feeW, buyer]) await w?.stop(); });

  it('wrap NIGHT->wNIGHT, 3% shielded sale, shielded resale, seller withdrawal, unwrap', async () => {
    let t0 = t();
    const d = await deployContract(orgP, { compiledContract: C, privateStateId: 'org', initialPrivateState: createPrivateState(sk.org),
      args: ['ipfs://cloaktix/{id}', BPS, { bytes: encodeCoinPublicKey(feeW.getCoinPublicKey()) }] } as any);
    addr = d.deployTxData.public.contractAddress;
    color = rawTokenType(dom, addr);
    console.log(`DEPLOY ok ${addr} en ${t() - t0} ms ; wNIGHT color=${color}`);
    orgP.privateStateProvider.setContractAddress(addr);
    await orgP.privateStateProvider.set('buyer2', createPrivateState(sk.buyer2));
    buyerP.privateStateProvider.setContractAddress(addr);
    await buyerP.privateStateProvider.set('buyer', createPrivateState(sk.buyer));

    // 1) Wrap : NIGHT non-shielded -> wNIGHT shielded (acheteur 20, acheteur2 15)
    const n0 = await night(buyer);
    await callTx(buyerP, 'buyer', 'wrap', [20_000_000n, new Uint8Array(randomBytes(32))]);
    await callTx(orgP, 'org', 'wrap', [15_000_000n, new Uint8Array(randomBytes(32))]);
    console.log(`WRAP acheteur wNIGHT=${await waitBal(() => wn(buyer), 20_000_000n)} NIGHT Δ${(await night(buyer)) - n0}`);
    expect(await waitBal(() => wn(org), 15_000_000n)).toEqual(15_000_000n);

    const ev = (await callTx(orgP, 'org', 'createEvent', [{ bytes: encodeCoinPublicKey(org.getCoinPublicKey()) }])).private.result as bigint;
    const ga = (await callTx(orgP, 'org', 'addTicketType', [ev, PRICE, fee(PRICE), 100n, CAP])).private.result as bigint;

    // 2) Primary sale paid in shielded wNIGHT
    await expectFail(callTx(buyerP, 'buyer', 'buyTicket', [ga, coin(fee(PRICE) - 1n), coin(PRICE - fee(PRICE) + 1n)], { additionalCoinEncPublicKeyMappings: map(feeW, org) }), /Wrong fee coin/, 'BUYTICKET frais faux');
    let [o0, f0, b0] = [await wn(org), await wn(feeW), await wn(buyer)];
    await callTx(buyerP, 'buyer', 'buyTicket', [ga, coin(fee(PRICE)), coin(PRICE - fee(PRICE))], { additionalCoinEncPublicKeyMappings: map(feeW, org) });
    let o1 = await waitBal(() => wn(org), o0 + PRICE - fee(PRICE)), f1 = await waitBal(() => wn(feeW), f0 + fee(PRICE)), b1 = await waitBal(() => wn(buyer), b0 - PRICE);
    console.log(`VENTE wNIGHT organisateur Δ${o1 - o0} frais Δ${f1 - f0} acheteur Δ${b1 - b0}`);
    expect(o1 - o0).toEqual(PRICE - fee(PRICE)); expect(f1 - f0).toEqual(fee(PRICE)); expect(b0 - b1).toEqual(PRICE);
    await callTx(buyerP, 'buyer', 'proveHolder', [ga]);

    // 3) Shielded resale: the seller publishes no wallet key
    const lid = (await callTx(buyerP, 'buyer', 'listForResale', [ga, CAP, fee(CAP)])).private.result as bigint;
    [o0, f0] = [await wn(org), await wn(feeW)];
    await callTx(orgP, 'buyer2', 'buyResale', [lid, coin(fee(CAP)), coin(CAP - fee(CAP))], { additionalCoinEncPublicKeyMappings: map(feeW) });
    o1 = await waitBal(() => wn(org), o0 - CAP); f1 = await waitBal(() => wn(feeW), f0 + fee(CAP));
    console.log(`RESALE wNIGHT buyer2 Δ${o1 - o0} fee Δ${f1 - f0} ; seller reserve=${(await state()).proceeds.lookup(lid).value}`);
    expect(o0 - o1).toEqual(CAP); expect(f1 - f0).toEqual(fee(CAP));
    await expectFail(callTx(orgP, 'org', 'claimProceeds', [lid]), /Not seller/, 'CLAIMPROCEEDS par un autre');
    b0 = await wn(buyer);
    await callTx(buyerP, 'buyer', 'claimProceeds', [lid]);
    b1 = await waitBal(() => wn(buyer), b0 + CAP - fee(CAP));
    console.log(`RETRAIT vendeur Δ${b1 - b0}`);
    expect(b1 - b0).toEqual(CAP - fee(CAP));
    await callTx(orgP, 'buyer2', 'proveHolder', [ga]);
    await expectFail(callTx(buyerP, 'buyer', 'proveHolder', [ga]), /Not holder/, 'PROVEHOLDER former holder');

    // 4) Unwrap: fees become unshielded NIGHT again
    const fp = buildProviders(feeW, zkConfigPathShielded, config);
    fp.privateStateProvider.setContractAddress(addr);
    await fp.privateStateProvider.set('fee', createPrivateState(randomBytes(32)));
    const fn0 = await night(feeW), fw0 = await wn(feeW);
    await submitCallTx(fp as any, { compiledContract: C, contractAddress: addr, privateStateId: 'fee', circuitId: 'unwrap',
      args: [coin(fw0), { bytes: encodeUserAddress((await feeW.wallet.unshielded.getAddress()).hexString) }] } as any);
    const fn1 = await waitBal(() => night(feeW), fn0 + fw0);
    console.log(`UNWRAP frais wNIGHT ${fw0} -> NIGHT Δ${fn1 - fn0} ; wNIGHT restant=${await waitBal(() => wn(feeW), 0n)}`);
    expect(fn1 - fn0).toEqual(fw0);

    // 5) Leaks: the buyer's Zswap key and secret key do not appear in public state
    const st = await state();
    const dump = JSON.stringify(st, (_k, v) => v instanceof Uint8Array ? hex(v) : typeof v === 'bigint' ? v.toString() : v)
      + JSON.stringify([...st.events].map(([, e]) => hex(e.payout.bytes)));
    const buyerCpk = hex(encodeCoinPublicKey(buyer.getCoinPublicKey()));
    console.log(`LEAK buyer cpk in state: ${dump.includes(buyerCpk)} ; organizer cpk published (by design): ${dump.includes(hex(encodeCoinPublicKey(org.getCoinPublicKey())))}`);
    expect(dump.includes(buyerCpk)).toBe(false);
    console.log(`LEDGER sold=${st.ticketTypes.lookup(ga).sold} listings=${st.listings.size()} proceeds=${st.proceeds.size()} wrapped=${st.wrapped}`);
  });
});
