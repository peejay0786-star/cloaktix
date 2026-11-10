// CloakTix — contract circuit ZK proofs generated in headless Chrome (WASM), txs submitted to the local devnet.
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { randomBytes } from 'node:crypto';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { deployContract, submitCallTx } from '@midnight-ntwrk/midnight-js-contracts';
import { encodeUserAddress } from '@midnight-ntwrk/midnight-js-protocol/compact-runtime';
import { CostModel } from '@midnight-ntwrk/midnight-js-protocol/ledger';
import { dappConnectorProofProvider } from '@midnight-ntwrk/midnight-js-dapp-connector-proof-provider';
import pino from 'pino';
import { getConfig } from './config.js';
import { MidnightWalletProvider, resolveWallet, syncWallet } from './wallet.js';
import { buildProviders } from './providers.js';
import { BrowserProver } from './browser-prover.js';
import { CompiledCloakTix, zkConfigPath, pureCircuits } from '../contract/index.js';
import { createPrivateState } from '../contract/witnesses.js';
// @ts-ignore plain ESM helper
import { newIssuerSecret, issuerPublicKey, signAgeCredential, adultFromBirthdate } from '../contract/age-credential.mjs';
import type { EnvironmentConfiguration } from '@midnight-ntwrk/testkit-js';

const logger = pino({ level: 'info', transport: { target: 'pino-pretty' } });
const NIGHT = '0'.repeat(64);
const PRICE = 10_000_000n, CAP = 12_000_000n, BPS = 300n;
const fee = (p: bigint) => (p * BPS) / 10000n;
const issuerSk = newIssuerSecret();
const asOf = () => BigInt(Math.floor(Date.now() / 1000) - 600);

describe('CloakTix — preuve WASM navigateur', () => {
  const config = getConfig();
  const bp = new BrowserProver();
  let org: MidnightWalletProvider, feeW: MidnightWalletProvider, buyer: MidnightWalletProvider;
  let orgP: any, buyerP: any, addr: any;
  const sk = { admin: randomBytes(32), org: randomBytes(32), buyer: randomBytes(32) };
  const night = async (w: MidnightWalletProvider) => (await w.wallet.waitForSyncedState()).unshielded.balances[NIGHT] ?? 0n;
  const waitChange = async (w: MidnightWalletProvider, before: bigint) => {
    for (let i = 0; i < 60; i++) { const b = await night(w); if (b !== before) return b; await new Promise(r => setTimeout(r, 2000)); }
    return night(w);
  };
  const userAddr = async (w: MidnightWalletProvider) => ({ bytes: encodeUserAddress((await w.wallet.unshielded.getAddress()).hexString) });
  const callTx = async (P: any, psId: string, circuitId: string, args: any[]) => {
    const t0 = Date.now();
    const r: any = await submitCallTx(P, { compiledContract: CompiledCloakTix, contractAddress: addr, privateStateId: psId, circuitId, args } as any);
    console.log(`${circuitId.toUpperCase()} ok tx=${r.public.txId} en ${Date.now() - t0} ms`);
    return r;
  };

  beforeAll(async () => {
    setNetworkId(config.networkId);
    const env: EnvironmentConfiguration = { walletNetworkId: config.networkId, networkId: config.networkId, indexer: config.indexer, indexerWS: config.indexerWS, node: config.node, nodeWS: config.nodeWS, faucet: config.faucet, proofServer: config.proofServer };
    const mk = async (role: string) => { const w = await MidnightWalletProvider.build(logger, env, resolveWallet('local', role).secret); await w.start(); await syncWallet(logger, w.wallet, 10 * 60_000); return w; };
    org = await mk('ALICE'); feeW = await mk('BOB'); buyer = await mk('CHARLIE');
    orgP = buildProviders(org, zkConfigPath, config);
    await bp.start();
    const base = buildProviders(buyer, zkConfigPath, config);
    // Buyer: contract circuit proofs are made in the browser (not by the proof server).
    buyerP = { ...base, proofProvider: await dappConnectorProofProvider(bp.api() as any, base.zkConfigProvider, CostModel.initialCostModel()) };
  });
  afterAll(async () => { await bp.stop(); for (const w of [org, feeW, buyer]) await w?.stop(); });

  it('buyTicket and proveHolder proven in headless Chrome', async () => {
    const deployed = await deployContract(orgP, {
      compiledContract: CompiledCloakTix, privateStateId: 'org', initialPrivateState: createPrivateState(sk.org),
      args: ['ipfs://cloaktix/{id}', BPS, await userAddr(feeW), pureCircuits.accountId(sk.admin), issuerPublicKey(issuerSk)],
    } as any);
    addr = deployed.deployTxData.public.contractAddress;
    console.log(`DEPLOY ok ${addr}`);
    orgP.privateStateProvider.setContractAddress(addr);
    buyerP.privateStateProvider.setContractAddress(addr);
    await buyerP.privateStateProvider.set('buyer', createPrivateState(sk.buyer));
    const ev = (await callTx(orgP, 'org', 'createEvent', [await userAddr(org)])).private.result as bigint;
    const ga = (await callTx(orgP, 'org', 'addTicketType', [ev, PRICE, fee(PRICE), 10n, 0, CAP, false])).private.result as bigint;
    const adult = (await callTx(orgP, 'org', 'addTicketType', [ev, PRICE, fee(PRICE), 10n, 0, CAP, true])).private.result as bigint;

    const [o0, f0] = [await night(org), await night(feeW)];
    await callTx(buyerP, 'buyer', 'buyTicket', [ga]);
    const [o1, f1] = [await waitChange(org, o0), await waitChange(feeW, f0)];
    console.log(`VENTE (preuve navigateur) organisateur Δ${o1 - o0} frais Δ${f1 - f0}`);
    expect(o1 - o0).toEqual(PRICE - fee(PRICE)); expect(f1 - f0).toEqual(fee(PRICE));
    await callTx(buyerP, 'buyer', 'proveHolder', [ga]);
    // 18+ type: the age credential is verified inside the browser-proven circuit
    await buyerP.privateStateProvider.set('buyer', createPrivateState(sk.buyer, signAgeCredential({ issuerSk, holder: pureCircuits.accountId(sk.buyer), adultFrom: adultFromBirthdate('1990-04-12') })));
    await callTx(buyerP, 'buyer', 'buyTicketAdult', [adult, asOf()]);
    const proofs = bp.stats.filter(s => s.op === 'prove');
    console.log(`STATS ${JSON.stringify(bp.stats)}`);
    console.log(`TIMINGS ${proofs.map(p => `${p.loc.split('/').pop()}=${(p.ms / 1000).toFixed(1)}s`).join(' ')}`);
    expect(proofs.length).toBeGreaterThanOrEqual(3);
  });
});
