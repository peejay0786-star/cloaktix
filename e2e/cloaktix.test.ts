// CloakTix E2E — local "undeployed" devnet, real proofs (proof-server 8.1.3). No real funds.
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { randomBytes } from 'node:crypto';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { deployContract, submitCallTx } from '@midnight-ntwrk/midnight-js-contracts';
import { encodeUserAddress } from '@midnight-ntwrk/midnight-js-protocol/compact-runtime';
import pino from 'pino';
import { getConfig } from './config.js';
import { MidnightWalletProvider, resolveWallet, syncWallet } from './wallet.js';
import { buildProviders } from './providers.js';
import { CompiledCloakTix, ledger, zkConfigPath, pureCircuits } from '../contract/index.js';
import { createPrivateState } from '../contract/witnesses.js';
// @ts-ignore plain ESM helper
import { newIssuerSecret, issuerPublicKey, signAgeCredential, adultFromBirthdate } from '../contract/age-credential.mjs';
import type { EnvironmentConfiguration } from '@midnight-ntwrk/testkit-js';

const logger = pino({ level: 'info', transport: { target: 'pino-pretty' } });
const NIGHT = '0'.repeat(64);
const BPS = 300n; // 3%
const fee = (p: bigint) => (p * BPS) / 10000n;
const PRICE = 10_000_000n, CAP = 12_000_000n;
const t = () => Date.now();
const issuerSk = newIssuerSecret(); // local test issuer ("Passport stub"), never leaves this process
const asOf = () => BigInt(Math.floor(Date.now() / 1000) - 600);

describe('CloakTix E2E (local)', () => {
  const config = getConfig();
  let org: MidnightWalletProvider, feeW: MidnightWalletProvider, buyer: MidnightWalletProvider;
  let orgP: any, buyerP: any, addr: any;
  const sk = { admin: randomBytes(32), org: randomBytes(32), buyer: randomBytes(32), buyer2: randomBytes(32) };
  const night = async (w: MidnightWalletProvider) => (await w.wallet.waitForSyncedState()).unshielded.balances[NIGHT] ?? 0n;
  const waitChange = async (w: MidnightWalletProvider, before: bigint) => {
    for (let i = 0; i < 60; i++) { const b = await night(w); if (b !== before) return b; await new Promise(r => setTimeout(r, 2000)); }
    return night(w);
  };
  const userAddr = async (w: MidnightWalletProvider) => ({ bytes: encodeUserAddress((await w.wallet.unshielded.getAddress()).hexString) });
  const callTx = async (P: any, psId: string, circuitId: string, args: any[]) => {
    const t0 = t();
    const r: any = await submitCallTx(P, { compiledContract: CompiledCloakTix, contractAddress: addr, privateStateId: psId, circuitId, args } as any);
    console.log(`${circuitId.toUpperCase()} ok tx=${r.public.txId} en ${t() - t0} ms${r.private.result !== undefined ? ' result=' + r.private.result : ''}`);
    return r;
  };
  const expectFail = async (P: any, psId: string, circuitId: string, args: any[], re: RegExp) => {
    let err: any = null;
    try { await callTx(P, psId, circuitId, args); } catch (e) { err = e; }
    expect(String(err?.message ?? err)).toMatch(re);
    console.log(`${circuitId.toUpperCase()} rejected (expected): ${String(err?.message ?? err).slice(0, 140)}`);
  };
  const state = async () => ledger((await orgP.publicDataProvider.queryContractState(addr))!.data);

  beforeAll(async () => {
    setNetworkId(config.networkId);
    const env: EnvironmentConfiguration = { walletNetworkId: config.networkId, networkId: config.networkId, indexer: config.indexer, indexerWS: config.indexerWS, node: config.node, nodeWS: config.nodeWS, faucet: config.faucet, proofServer: config.proofServer };
    const mk = async (role: string) => { const w = await MidnightWalletProvider.build(logger, env, resolveWallet('local', role).secret); await w.start(); await syncWallet(logger, w.wallet, 10 * 60_000); return w; };
    org = await mk('ALICE'); feeW = await mk('BOB'); buyer = await mk('CHARLIE');
    orgP = buildProviders(org, zkConfigPath, config);
    buyerP = buildProviders(buyer, zkConfigPath, config);
  });
  afterAll(async () => { for (const w of [org, feeW, buyer]) await w?.stop(); });

  it('event, 3% sale, capped resale with 3% fee, proveHolder', async () => {
    let t0 = t();
    const deployed = await deployContract(orgP, {
      compiledContract: CompiledCloakTix, privateStateId: 'org', initialPrivateState: createPrivateState(sk.org),
      args: ['ipfs://cloaktix/{id}', BPS, await userAddr(feeW), pureCircuits.accountId(sk.admin), issuerPublicKey(issuerSk)],
    } as any);
    addr = deployed.deployTxData.public.contractAddress;
    console.log(`DEPLOY ok ${addr} en ${t() - t0} ms`);
    orgP.privateStateProvider.setContractAddress(addr);
    await orgP.privateStateProvider.set('buyer2', createPrivateState(sk.buyer2));
    buyerP.privateStateProvider.setContractAddress(addr);
    await buyerP.privateStateProvider.set('buyer', createPrivateState(sk.buyer));

    const ev = (await callTx(orgP, 'org', 'createEvent', [await userAddr(org)])).private.result as bigint;
    const ga = (await callTx(orgP, 'org', 'addTicketType', [ev, PRICE, fee(PRICE), 100n, 0, CAP, false])).private.result as bigint;

    // Vente primaire
    let [o0, f0, b0] = [await night(org), await night(feeW), await night(buyer)];
    await callTx(buyerP, 'buyer', 'buyTicket', [ga]);
    let [o1, f1, b1] = [await waitChange(org, o0), await waitChange(feeW, f0), await waitChange(buyer, b0)];
    console.log(`VENTE organisateur Δ${o1 - o0} frais Δ${f1 - f0} acheteur Δ${b1 - b0}`);
    expect(o1 - o0).toEqual(PRICE - fee(PRICE)); expect(f1 - f0).toEqual(fee(PRICE)); expect(b0 - b1).toEqual(PRICE);
    await callTx(buyerP, 'buyer', 'proveHolder', [ga]);

    // Resale: above the cap rejected, at the cap accepted
    await expectFail(buyerP, 'buyer', 'listForResale', [ga, CAP + 1n, fee(CAP + 1n), await userAddr(buyer)], /Above max resale price/);
    const lid = (await callTx(buyerP, 'buyer', 'listForResale', [ga, CAP, fee(CAP), await userAddr(buyer)])).private.result as bigint;
    [o0, f0, b0] = [await night(org), await night(feeW), await night(buyer)];
    await callTx(orgP, 'buyer2', 'buyResale', [lid]); // 2nd buyer: ALICE wallet, different secret key
    [o1, f1, b1] = [await waitChange(org, o0), await waitChange(feeW, f0), await waitChange(buyer, b0)];
    console.log(`REVENTE acheteur2 Δ${o1 - o0} frais Δ${f1 - f0} vendeur Δ${b1 - b0}`);
    expect(o0 - o1).toEqual(CAP); expect(f1 - f0).toEqual(fee(CAP)); expect(b1 - b0).toEqual(CAP - fee(CAP));

    await callTx(orgP, 'buyer2', 'proveHolder', [ga]);
    await expectFail(buyerP, 'buyer', 'proveHolder', [ga], /Not holder/);
    const st = await state();
    console.log(`LEDGER sold=${st.ticketTypes.lookup(ga).sold} maxResale=${st.ticketTypes.lookup(ga).maxResale} listings=${st.listings.size()}`);
    expect(st.ticketTypes.lookup(ga).sold).toEqual(1n);
  });

  it('18+ ticket type: no credential and minor refused, adult admitted', async () => {
    const ev = (await callTx(orgP, 'org', 'createEvent', [await userAddr(org)])).private.result as bigint;
    const adult = (await callTx(orgP, 'org', 'addTicketType', [ev, PRICE, fee(PRICE), 10n, 0, CAP, true])).private.result as bigint;
    const holder = pureCircuits.accountId(sk.buyer);
    await buyerP.privateStateProvider.set('buyer', createPrivateState(sk.buyer));
    await expectFail(buyerP, 'buyer', 'buyTicket', [adult], /age proof required \(buyTicketAdult\)/);
    await expectFail(buyerP, 'buyer', 'buyTicketAdult', [adult, asOf()], /Age credential required/);
    const minor = new Date(); minor.setUTCFullYear(minor.getUTCFullYear() - 16);
    await buyerP.privateStateProvider.set('buyer', createPrivateState(sk.buyer, signAgeCredential({ issuerSk, holder, adultFrom: adultFromBirthdate(minor.toISOString().slice(0, 10)) })));
    await expectFail(buyerP, 'buyer', 'buyTicketAdult', [adult, asOf()], /Under 18/);
    await buyerP.privateStateProvider.set('buyer', createPrivateState(sk.buyer, signAgeCredential({ issuerSk, holder, adultFrom: adultFromBirthdate('1990-04-12') })));
    await callTx(buyerP, 'buyer', 'buyTicketAdult', [adult, asOf()]);
    await callTx(buyerP, 'buyer', 'proveHolder', [adult]);
    // 18+ resale: buyResale refuses, buyResaleAdult (2nd buyer with own credential) succeeds
    const lid = (await callTx(buyerP, 'buyer', 'listForResale', [adult, CAP, fee(CAP), await userAddr(buyer)])).private.result as bigint;
    await expectFail(orgP, 'buyer2', 'buyResale', [lid], /age proof required \(buyResaleAdult\)/);
    await orgP.privateStateProvider.set('buyer2', createPrivateState(sk.buyer2, signAgeCredential({ issuerSk, holder: pureCircuits.accountId(sk.buyer2), adultFrom: adultFromBirthdate('1985-01-01') })));
    await callTx(orgP, 'buyer2', 'buyResaleAdult', [lid, asOf()]);
    await callTx(orgP, 'buyer2', 'proveHolder', [adult]);
    const st = await state();
    console.log(`LEDGER 18+ adultOnly=${st.ticketTypes.lookup(adult).adultOnly} sold=${st.ticketTypes.lookup(adult).sold}`);
    expect(st.ticketTypes.lookup(adult).sold).toEqual(1n);
  });
});
