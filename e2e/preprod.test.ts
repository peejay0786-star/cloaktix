// CloakTix on Preprod (public testnet, tNIGHT only). One funded dev wallet (ALICE) pays every tx;
// the CloakTix roles (org, buyer, buyer2, admin) are separate contract secret keys.
// Secrets: wallet seed and contract keys stay in .secrets/ (mode 600); nothing secret is logged.
// Run: MIDNIGHT_NETWORK=preprod NODE_OPTIONS='--experimental-vm-modules' npx vitest run -c vitest.config.mjs --silent=false e2e/preprod.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { deployContract, submitCallTx, findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import { encodeUserAddress } from '@midnight-ntwrk/midnight-js-protocol/compact-runtime';
import { createKeystore, PublicKey } from '@midnight-ntwrk/wallet-sdk/unshielded';
import { WalletSeeds, type EnvironmentConfiguration } from '@midnight-ntwrk/testkit-js';
import { MidnightWalletProvider, syncWallet, waitForNightThenDust } from '@midnightntwrk/mnkit-wallet';
import pino from 'pino';
import { preprodConfig } from './config.js';
import { buildProviders } from './providers.js';
import { CompiledCloakTix, ledger, zkConfigPath, pureCircuits } from '../contract/index.js';
import { createPrivateState } from '../contract/witnesses.js';

const ROOT = path.resolve(__dirname, '..');
const SECRETS = path.join(ROOT, '.secrets');
const OUT = path.join(ROOT, 'logs', 'preprod-result.json');
const STUB = 'http://127.0.0.1:8798';
const logger = pino({ level: 'info', transport: { target: 'pino-pretty' } });
const NIGHT = '0'.repeat(64);
const BPS = 300n; const fee = (p: bigint) => (p * BPS) / 10000n;
const PRICE = 2_000_000n, CAP = 2_400_000n; // 2 tNIGHT, resale cap 2.4 tNIGHT
const asOf = () => BigInt(Math.floor(Date.now() / 1000) - 600);
// ALICE preprod seed was minted on this box on 2026-11-02 17:30 HNE (file mtime), long after the shipped
// preseed reference (height 2779435, 2026-09-30). Birthday = a height safely BEFORE minting (tip 3255289 at
// 19:47 HNE minus 2000 blocks), so the fast-sync guard (reference <= birthday) holds without hiding history.
const ALICE_BIRTHDAY = 3_253_289;

const envFile = (f: string) => Object.fromEntries(fs.readFileSync(f, 'utf8').split('\n').filter(l => /^\w+=/.test(l)).map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]));
const result: any = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : { network: 'preprod', txs: [] };
const save = () => fs.writeFileSync(OUT, JSON.stringify(result, (_, v) => typeof v === 'bigint' ? v.toString() : v, 2));
const hex = (u: Uint8Array) => Buffer.from(u).toString('hex');

function loadOrCreate<T>(file: string, make: () => T): T {
  const f = path.join(SECRETS, file);
  if (fs.existsSync(f)) return JSON.parse(fs.readFileSync(f, 'utf8'));
  const v = make(); fs.writeFileSync(f, JSON.stringify(v), { mode: 0o600 }); return v;
}

describe('CloakTix on Preprod', () => {
  const config = preprodConfig();
  let alice: MidnightWalletProvider; let P: any; let addr: string;
  const sk = Object.fromEntries(Object.entries(loadOrCreate('preprod-cloaktix-sks.json', () => ({ admin: hex(randomBytes(32)), org: hex(randomBytes(32)), buyer: hex(randomBytes(32)), buyer2: hex(randomBytes(32)) }))).map(([k, v]) => [k, Uint8Array.from(Buffer.from(v as string, 'hex'))])) as Record<string, Uint8Array>;
  // Fee address: a separate dev address (receive only, never synced here). Seed in .secrets/preprod-fee.json.
  const feeSeed = loadOrCreate('preprod-fee.json', () => ({ seed: hex(randomBytes(32)), createdAt: new Date().toISOString() })).seed;
  const feeKs = createKeystore(WalletSeeds.fromMasterSeed(feeSeed).unshielded, 'preprod');
  const feeHex = PublicKey.fromKeyStore(feeKs).addressHex;
  const night = async () => (await alice.wallet.waitForSyncedState()).unshielded.balances[NIGHT] ?? 0n;

  const callTx = async (psId: string, circuitId: string, args: any[], label = circuitId) => {
    const t0 = Date.now();
    const r: any = await submitCallTx(P, { compiledContract: CompiledCloakTix, contractAddress: addr, privateStateId: psId, circuitId, args } as any);
    const rec = { step: label, circuit: circuitId, txId: r.public.txId, txHash: r.public.txHash, block: r.public.blockHeight, ms: Date.now() - t0, at: new Date().toISOString() };
    result.txs.push(rec); save();
    console.log(`${label} ok tx=${rec.txId} hash=${rec.txHash} block=${rec.block} en ${rec.ms} ms`);
    return r;
  };
  const expectFail = async (psId: string, circuitId: string, args: any[], re: RegExp) => {
    let err: any = null;
    try { await submitCallTx(P, { compiledContract: CompiledCloakTix, contractAddress: addr, privateStateId: psId, circuitId, args } as any); } catch (e) { err = e; }
    expect(String(err?.message ?? err)).toMatch(re);
    console.log(`${circuitId} refused before submission (expected): ${String(err?.message ?? err).match(re)?.[0]}`);
  };
  const state = async () => ledger((await P.publicDataProvider.queryContractState(addr))!.data);

  beforeAll(async () => {
    setNetworkId(config.networkId);
    const env: EnvironmentConfiguration = { walletNetworkId: config.networkId, networkId: config.networkId, indexer: config.indexer, indexerWS: config.indexerWS, node: config.node, nodeWS: config.nodeWS, faucet: config.faucet, proofServer: config.proofServer };
    const seed = envFile(path.join(SECRETS, 'preprod-wallet.env'))['MIDNIGHT_PREPROD_ALICE_SEED'];
    const t0 = Date.now();
    alice = await MidnightWalletProvider.build(logger, env, { kind: 'seed', value: seed }, { fastSync: { referenceRoot: path.join(ROOT, '..', 'examples', 'preseed'), birthday: ALICE_BIRTHDAY } });
    await alice.start();
    await syncWallet(logger, alice.wallet, 3 * 3600_000);
    const address = String(alice.unshieldedKeystore.getBech32Address());
    result.wallet = address; result.syncMs = Date.now() - t0; save();
    console.log(`SYNC ok ${address} en ${Math.round((Date.now() - t0) / 1000)} s, NIGHT=${await night()}`);
    const t1 = Date.now();
    await waitForNightThenDust(logger, alice.wallet, alice.unshieldedKeystore, env, config.faucet, { label: 'ALICE' });
    const s = await alice.wallet.waitForSyncedState();
    console.log(`DUST ok en ${Math.round((Date.now() - t1) / 1000)} s, balance=${s.dust.balance(new Date())}`);
    result.dustMs = Date.now() - t1; save();
    P = buildProviders(alice as any, zkConfigPath, config as any);
  }, 4 * 3600_000);
  afterAll(async () => { await alice?.stop(); });

  it('deploy, event, buy, resale, 18+ buy (stub issuer), checkIn', async () => {
    const issuer = await (await fetch(`${STUB}/issuer`)).json();
    const issuerPk = { x: BigInt(issuer.publicKey.x), y: BigInt(issuer.publicKey.y) };
    const aliceAddr = { bytes: encodeUserAddress((await alice.wallet.unshielded.getAddress()).hexString) };
    const feeAddr = { bytes: encodeUserAddress(feeHex) };
    if (result.contract) {
      addr = result.contract;
      P.privateStateProvider.setContractAddress(addr);
      await findDeployedContract(P, { compiledContract: CompiledCloakTix, contractAddress: addr, privateStateId: 'org', initialPrivateState: createPrivateState(sk.org) } as any);
      console.log(`REUSE contract ${addr}`);
    } else {
      const t0 = Date.now();
      const d: any = await deployContract(P, { compiledContract: CompiledCloakTix, privateStateId: 'org', initialPrivateState: createPrivateState(sk.org),
        args: ['ipfs://cloaktix/{id}', BPS, feeAddr, pureCircuits.accountId(sk.admin), issuerPk] } as any);
      addr = d.deployTxData.public.contractAddress;
      result.contract = addr; result.feeAddressHex = feeHex; result.feeAddress = String(feeKs.getBech32Address());
      result.deploy = { txId: d.deployTxData.public.txId, txHash: d.deployTxData.public.txHash, block: d.deployTxData.public.blockHeight, ms: Date.now() - t0 };
      save();
      console.log(`DEPLOY ok ${addr} tx=${result.deploy.txId} block=${result.deploy.block} en ${result.deploy.ms} ms`);
      P.privateStateProvider.setContractAddress(addr);
    }
    for (const k of ['buyer', 'buyer2']) await P.privateStateProvider.set(k, createPrivateState(sk[k]));

    const n0 = await night();
    const ev = (await callTx('org', 'createEvent', [aliceAddr])).private.result as bigint;
    const ga = (await callTx('org', 'addTicketType', [ev, PRICE, fee(PRICE), 50n, 0, CAP, false], 'addTicketType GA')).private.result as bigint;
    const adult = (await callTx('org', 'addTicketType', [ev, PRICE, fee(PRICE), 50n, 0, CAP, true], 'addTicketType 18+')).private.result as bigint;
    await callTx('buyer', 'buyTicket', [ga], 'buyTicket GA');
    const lid = (await callTx('buyer', 'listForResale', [ga, CAP, fee(CAP), aliceAddr])).private.result as bigint;
    await callTx('buyer2', 'buyResale', [lid], 'buyResale GA');
    // 18+: no credential refused locally, then the stub issuer signs an adult credential for buyer's account id
    await expectFail('buyer', 'buyTicket', [adult], /age proof required/);
    const cr = await (await fetch(`${STUB}/issue`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ holder: hex(pureCircuits.accountId(sk.buyer)), birthdate: '1990-04-12' }) })).json();
    const unhex = (h: string) => Uint8Array.from(Buffer.from(h, 'hex'));
    const pt = (p: any) => ({ x: BigInt(p.x), y: BigInt(p.y) });
    const cred = { claim: { holder: unhex(cr.claim.holder), adultFrom: BigInt(cr.claim.adultFrom) }, proof: { issuerMethod: unhex(cr.proof.issuerMethod), createdAt: BigInt(cr.proof.createdAt), challengeHash: unhex(cr.proof.challengeHash), publicKey: pt(cr.proof.publicKey), signature: { r: pt(cr.proof.signature.r), s: BigInt(cr.proof.signature.s) } } };
    await P.privateStateProvider.set('buyer', createPrivateState(sk.buyer, cred as any));
    await callTx('buyer', 'buyTicketAdult', [adult, asOf()], 'buyTicketAdult 18+');
    const passId = randomBytes(32);
    await callTx('buyer2', 'checkIn', [ga, passId], 'checkIn GA (resale buyer)');
    await expectFail('buyer2', 'checkIn', [ga, passId], /Pass already used|Not holder/);

    const st = await state();
    result.ledger = { feeBps: st.feeBps, gaSold: st.ticketTypes.lookup(ga).sold, adultSold: st.ticketTypes.lookup(adult).sold, adultOnly: st.ticketTypes.lookup(adult).adultOnly, listings: st.listings.size(), checkIns: st.checkIns.size() };
    result.nightSpent = n0 - (await night()); save();
    console.log(`LEDGER ${JSON.stringify(result.ledger, (_, v) => typeof v === 'bigint' ? v.toString() : v)} ; NIGHT net spent by ALICE (fees to fee address) = ${result.nightSpent}`);
    expect(st.ticketTypes.lookup(ga).sold).toEqual(1n);
    expect(st.ticketTypes.lookup(adult).sold).toEqual(1n);
    expect(st.checkIns.size()).toEqual(1n);
  }, 3 * 3600_000);
});
