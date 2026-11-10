// CT-PSP-L9: Midnight.js 5 private-state provider + real deployContract / submitInsertVerifierKeyTx paths.
// Real midnight-js-contracts 5.0.0, real CloakTix rate-v3 artifacts, real DApp-connector providers over a FAKE
// wallet API (no network, no signing, no proving keys used: a deploy/maintenance tx carries no proofs).
import assert from 'node:assert/strict';
import { describe, it, before, after } from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire, register } from 'node:module';
import { createCloakPrivateStateProvider, pendingDeployKeyStorageKey } from '../src/midnight/privateStateProvider.ts';

const here = path.dirname(fileURLToPath(import.meta.url));
// Mirror vite.config.ts: a single @midnightntwrk/ledger-v9 (the copy midnight-js-protocol pins).
const LEDGER_V9 = new URL('../node_modules/@midnight-ntwrk/midnight-js-protocol/node_modules/@midnightntwrk/ledger-v9/', import.meta.url).href;
if (!process.env.PSP_NO_DEDUPE) register('data:text/javascript,' + encodeURIComponent(`export async function resolve(s, c, n) {
  if (s === '@midnightntwrk/ledger-v9' || s.startsWith('@midnightntwrk/ledger-v9/')) return n(s, { ...c, parentURL: ${JSON.stringify(LEDGER_V9 + 'x.js')} });
  return n(s, c); }`));
const require = createRequire(import.meta.url);
const MANAGED = path.resolve(here, '../../contract/managed/cloaktix-rate-v3');

function memStorage() {
  const m = new Map<string, string>();
  return { getItem: (k: string) => (m.has(k) ? m.get(k)! : null), setItem: (k: string, v: string) => void m.set(k, String(v)),
    removeItem: (k: string) => void m.delete(k), key: (i: number) => [...m.keys()][i] ?? null, get length() { return m.size; }, _m: m } as any;
}

describe('CloakPrivateStateProvider (Midnight.js 5 interface)', () => {
  it('forContract scopes state per contract, seed is the unscoped fallback, addresses are lower-cased', async () => {
    const p = createCloakPrivateStateProvider({ networkId: 'preview', storage: memStorage() });
    const A = 'AB'.repeat(32), B = 'cd'.repeat(32);
    assert.equal(await p.forContract(A).get('id'), null);
    p.seed('id', { v: 'seed' });
    assert.deepEqual(await p.forContract(A).get('id'), { v: 'seed' }); // pre-deploy seed visible to a new contract
    await p.forContract(A).set('id', { v: 'a' });
    assert.deepEqual(await p.forContract(A.toLowerCase()).get('id'), { v: 'a' });
    assert.deepEqual(await p.forContract(B).get('id'), { v: 'seed' }); // B unaffected by A
    assert.equal(p.forContract(A).contractAddress, A.toLowerCase());
    p.seed('id', { v: 'age-updated' }); // re-seed overwrites per-contract copies (age credential change)
    assert.deepEqual(await p.forContract(A).get('id'), { v: 'age-updated' });
    await p.forContract(A).remove('id');
    assert.deepEqual(await p.forContract(A).get('id'), { v: 'age-updated' });
    await p.forContract(B).set('other', 1); await p.forContract(B).clear();
    assert.equal(await p.forContract(B).get('other'), null);
    await p.clearAll();
    assert.equal(await p.forContract(A).get('id'), null);
  });
  it('signing keys persist in storage per network/address and survive a new provider (reload)', async () => {
    const st = memStorage();
    const p1 = createCloakPrivateStateProvider({ networkId: 'preview', storage: st });
    const k = { tag: 'schnorr', value: '11'.repeat(32) } as any;
    await p1.setSigningKey('EE'.repeat(32) as any, k);
    const p2 = createCloakPrivateStateProvider({ networkId: 'preview', storage: st });
    assert.deepEqual(await p2.getSigningKey('ee'.repeat(32) as any), k);
    assert.equal(await createCloakPrivateStateProvider({ networkId: 'preprod', storage: st }).getSigningKey('ee'.repeat(32) as any), null);
    await p2.clearSigningKeys();
    assert.equal(await p1.getSigningKey('ee'.repeat(32) as any), null);
  });
});

// ---------- real SDK path ----------
after(() => fs.rmSync(path.join(here, '.tmp-psp'), { recursive: true, force: true }));
let B: any; // bundled real deployV3Batched + contract-v3 (import.meta.env defined like Vite would)
let SDK: any, PROTO: any, TXMOD: any, CR: any, DC: any, ZK: any;
before(async () => {
  const outdir = path.join(here, '.tmp-psp'); fs.mkdirSync(outdir, { recursive: true });
  const entry = path.join(outdir, 'entry.ts');
  fs.writeFileSync(entry, `export * from '../../src/midnight/deployV3Batched';\nexport * from '../../src/midnight/contract-v3';\nexport { toContractState } from '../../src/midnight/contractStateRead';\n`);
  await require('esbuild').build({ entryPoints: [entry], bundle: true, platform: 'node', format: 'esm', packages: 'external',
    outfile: path.join(outdir, 'bundle.mjs'), logLevel: 'silent',
    define: { 'import.meta.env': JSON.stringify({ VITE_ZK_ASSETS_PATH_V3: 'managed/cloaktix-rate-v3' }) } });
  B = await import(path.join(outdir, 'bundle.mjs'));
  SDK = await import('@midnight-ntwrk/midnight-js-contracts');
  PROTO = await import('@midnight-ntwrk/midnight-js-protocol/v9');
  TXMOD = await import('@midnight-ntwrk/midnight-js-protocol/transaction');
  CR = await import('@midnight-ntwrk/compact-runtime');
  DC = await import('@midnight-ntwrk/midnight-js-dapp-connector-proof-provider');
  ZK = await import('@midnight-ntwrk/midnight-js-fetch-zk-config-provider');
});

const hexOf = (u: Uint8Array) => Buffer.from(u).toString('hex');
function harness() {
  const wallet = { balanced: [] as string[], submitted: [] as string[] };
  let deployedState: Uint8Array | null = null; // what the fake indexer serves after the deploy "lands"
  const api = {
    getShieldedAddresses: async () => ({ shieldedCoinPublicKey: PROTO.sampleCoinPublicKey(), shieldedEncryptionPublicKey: PROTO.sampleEncryptionPublicKey() }),
    balanceUnsealedTransaction: async (txHex: string) => {
      wallet.balanced.push(txHex);
      const unbound = await TXMOD.deserializeTransactionAtStage('v9', 'Unbound', Uint8Array.from(Buffer.from(txHex, 'hex')));
      const tx = unbound.bind(); // the wallet would add DUST fees; binding is enough here
      const deploy = tx.intents?.get(1)?.actions?.find?.((a: any) => a instanceof PROTO.ContractDeploy);
      if (deploy) deployedState = deploy.initialState.serialize();
      return { tx: hexOf(tx.serialize()) };
    },
    submitTransaction: async (txHex: string) => { wallet.submitted.push(txHex); },
    getProvingProvider: async () => ({ check: async () => { throw new Error('no proving in this test'); }, prove: async () => { throw new Error('no proving in this test'); } }),
  };
  const fetchFunc = async (url: string) => {
    const u = new URL(url); const rel = decodeURIComponent(u.pathname.replace(/^\/managed\/cloaktix-rate-v3\//, ''));
    const f = path.join(MANAGED, rel);
    return fs.existsSync(f) ? new Response(fs.readFileSync(f)) : new Response('not found', { status: 404, statusText: 'Not Found' });
  };
  const records = new Map<string, any>();
  const publicDataProvider: any = {
    queryLatestProtocolVersion: async () => 2001100,
    queryBlock: async () => ({ hash: '00'.repeat(32), height: 1, timestamp: Date.now(), protocolVersion: 2001100 }), // Preview head protocolVersion on 2026-11-09 (ledger 9)
    watchForTxData: async (txId: string) => records.get(txId) ?? { era: 'v9', status: PROTO_SUCCEED, txId },
    queryZSwapAndContractState: async () => deployedState ? {
      protocolVersion: 2001100,
      contractState: TYPES.SerializedContractState.fromBytes('v9', deployedState),
      zswapChainState: TYPES.SerializedZswapChainState.fromBytes('v9', new PROTO.ZswapChainState().serialize()),
      ledgerParameters: TYPES.SerializedLedgerParameters.fromBytes('v9', PROTO.LedgerParameters.initialParameters().serialize()),
    } : null,
    queryContractState: async () => deployedState
      ? { protocolVersion: 2001100, contractState: TYPES.SerializedContractState.fromBytes('v9', deployedState) } : null,
  };
  return { api, fetchFunc, publicDataProvider, wallet, get deployedState() { return deployedState; } };
}
let PROTO_SUCCEED: any, TYPES: any;
before(async () => { TYPES = await import('@midnight-ntwrk/midnight-js-types'); PROTO_SUCCEED = TYPES.SucceedEntirely; });

async function providersFor(h: ReturnType<typeof harness>, storage: any) {
  const zkConfigProvider = new ZK.FetchZkConfigProvider('http://zk.test/managed/cloaktix-rate-v3', { fetchFunc: h.fetchFunc as any });
  const proofProvider = await DC.dappConnectorProofProvider(h.api as any, zkConfigProvider, PROTO.CostModel.initialCostModel());
  const { walletProvider, midnightProvider } = await DC.dappConnectorWalletProviders(h.api as any);
  // Fake indexer: answer watchForTxData with a v9 record whose tx handle is the submitted transaction.
  const pdp = h.publicDataProvider;
  const origSubmit = midnightProvider.submitTx.bind(midnightProvider);
  (midnightProvider as any).submitTx = async (tx: any) => {
    const id = await origSubmit(tx);
    pdp.watchForTxData = async (txId: string) => ({ era: 'v9', tx, status: TYPES.SucceedEntirely, txId, identifiers: [txId],
      txHash: '00'.repeat(32), blockHash: '00'.repeat(32), blockHeight: 1, blockTimestamp: Date.now(), segmentStatusMap: undefined, unshielded: { created: [], spent: [] } });
    return id;
  };
  return { config: { networkId: 'preview', ttlSeconds: 1800 }, zkConfigProvider, proofProvider, walletProvider, midnightProvider,
    publicDataProvider: pdp, privateStateProvider: createCloakPrivateStateProvider({ networkId: 'preview', storage }) };
}

describe('real Midnight.js 5 deploy path with the CloakTix provider', () => {
  it('deployV3Batched step 1 (real deployContract) lands, stores private state under forContract(address) and the signing key, then a real insert reaches the wallet', async () => {
    const h = harness(); const storage = memStorage();
    const P = await providersFor(h, storage);
    const sk = new Uint8Array(32).fill(7);
    // What Session.connect does before any contract exists:
    P.privateStateProvider.seed(B.PRIVATE_STATE_ID_V3, B.createPrivateStateV3(sk));
    const host: any = { schema: 3, contract: null, networkId: 'preview', sk, age: null, P, userAddress: () => ({ bytes: new Uint8Array(32).fill(3) }) };
    let deployResult: any;
    const steps: string[] = [];
    let insertAttempt: any = null;
    const result = await B.deployV3Batched(host, 'fee', async () => B.RATE_SIGNER_PK, {
      storage, resume: true,
      onStep: (e: any) => steps.push(e.label),
      deployFn: async (...a: any[]) => (deployResult = await SDK.deployContract(...(a as [any, any]))),
      waitForCircuits: async () => {},
      fetchVk: async (id: string) => new Uint8Array(fs.readFileSync(path.join(MANAGED, 'keys', id + '.verifier'))),
      // Real submitInsertVerifierKeyTx: stop at the wallet so the test proves the signing key was found.
      insertFn: async (...a: any[]) => {
        const before = h.wallet.balanced.length;
        try { return await SDK.submitInsertVerifierKeyTx(...(a as [any, any, any, any, any])); }
        catch (e: any) { insertAttempt = { reachedWallet: h.wallet.balanced.length > before, err: String(e?.message ?? e) + ' <- ' + String(e?.cause?.message ?? '') }; throw e; }
        finally { insertAttempt ??= { reachedWallet: h.wallet.balanced.length > before }; }
      },
    });
    assert.ok(deployResult, 'deployContract resolved (no forContract TypeError)');
    const address = deployResult.deployTxData.public.contractAddress as string;
    assert.match(address, /^[0-9a-f]{64}$/);
    assert.equal(h.wallet.submitted.length >= 1, true, 'deploy reached wallet submit');
    // Private state stored by deployContract AFTER landing, under the contract scope:
    const ps = await P.privateStateProvider.forContract(address).get(B.PRIVATE_STATE_ID_V3);
    assert.ok(ps && ps.sk instanceof Uint8Array && ps.sk[0] === 7);
    // Signing key persisted under the address and the pending pre-deploy copy cleared:
    const k = await P.privateStateProvider.getSigningKey(address as any);
    assert.ok(k && k.tag === 'schnorr' && /^[0-9a-f]{64}$/.test(k.value));
    assert.equal(storage.getItem(pendingDeployKeyStorageKey('preview')), null);
    // The on-chain maintenance authority is the persisted key:
    const cs = B.toContractState(await P.publicDataProvider.queryContractState(address));
    assert.deepEqual(cs.maintenanceAuthority.committee[0], CR.signatureVerifyingKey(k));
    // contractStateRead decodes the Midnight.js 5 read record: 11 deploy circuits present, deferred ones absent.
    const onChain = await B.listOnChainVkCircuits(P.publicDataProvider, address);
    assert.deepEqual([...onChain].sort(), [...B.V3_CIRCUIT_ORDER.slice(0, 11)].sort());
    // Real insert got past getExistingSigningKey and built/proved the maintenance tx up to the wallet:
    assert.ok(insertAttempt?.reachedWallet, 'submitInsertVerifierKeyTx reached balanceTx (signing key found): ' + insertAttempt?.err);
    assert.ok(steps.some((s) => /Install verifier keys/.test(s)));
    // Whole batched deploy ran: 1 deploy + 2 real verifier-key inserts, each through the wallet once.
    assert.equal(result.address, address); assert.equal(result.steps, 3);
    assert.equal(h.wallet.balanced.length, 3); assert.equal(h.wallet.submitted.length, 3);
    assert.equal(result.txIds.filter((t: unknown) => typeof t === 'string' && t.length > 0).length, 3, 'insert txIds read from .public.txId');
    assert.equal(B.loadV3DeployProgress('preview', storage)?.status, 'done');
  });

  it('a resumed deploy whose maintenance key is missing refuses before any 1AM prompt', async () => {
    const h = harness(); const storage = memStorage();
    const P = await providersFor(h, storage);
    const sk = new Uint8Array(32).fill(7);
    P.privateStateProvider.seed(B.PRIVATE_STATE_ID_V3, B.createPrivateStateV3(sk));
    const host: any = { schema: 3, contract: null, networkId: 'preview', sk, age: null, P, userAddress: () => ({ bytes: new Uint8Array(32).fill(3) }) };
    let address = '';
    await assert.rejects(B.deployV3Batched(host, 'fee', async () => B.RATE_SIGNER_PK, { storage, resume: true, waitForCircuits: async () => {},
      deployFn: async (...a: any[]) => { const d = await SDK.deployContract(...(a as [any, any])); address = d.deployTxData.public.contractAddress; throw new Error('simulated reload after landing'); } }));
    // Simulate the 2026-11-09 incident: key never stored, but this time the pending key exists, so it is adopted.
    await P.privateStateProvider.removeSigningKey(address as any);
    const p = B.loadV3DeployProgress('preview', storage) ?? {};
    B.saveV3DeployProgress('preview', { ...p, address, status: 'inserting', done: B.V3_CIRCUIT_ORDER.slice(0, 11), pending: ['buyTicketAdaAdult', 'adminSet'] }, storage);
    assert.ok(storage.getItem(pendingDeployKeyStorageKey('preview')), 'pending key kept because step 1 did not finish');
    const balancedBefore = h.wallet.balanced.length; let inserts = 0;
    await assert.rejects(B.deployV3Batched(host, 'fee', async () => B.RATE_SIGNER_PK, { storage, resume: true, waitForCircuits: async () => {}, fetchVk: async () => new Uint8Array(1),
      insertFn: async () => { inserts++; throw new Error('stop'); } }), /stop/);
    assert.equal(inserts, 1, 'pending key adopted (matches on-chain authority) so the insert proceeds');
    assert.ok(await P.privateStateProvider.getSigningKey(address as any));
    // Now lose every copy of the key (what actually happened to e96bb6fe…): refuse clearly, no wallet prompt.
    await P.privateStateProvider.removeSigningKey(address as any); storage.removeItem(pendingDeployKeyStorageKey('preview'));
    await assert.rejects(B.deployV3Batched(host, 'fee', async () => B.RATE_SIGNER_PK, { storage, resume: true, waitForCircuits: async () => {}, fetchVk: async () => new Uint8Array(1),
      insertFn: async () => { inserts++; throw new Error('must not be called'); } }), (e: any) => e.name === 'MaintenanceKeyMissingError');
    assert.equal(inserts, 1); assert.equal(h.wallet.balanced.length, balancedBefore);
  });

  it('REGRESSION: the old Midnight.js 4 style provider fails exactly like the live app, AFTER the deploy was submitted', async () => {
    const h = harness(); const storage = memStorage();
    const P: any = await providersFor(h, storage);
    const st = new Map<string, any>(); const k = new Map<string, any>();
    P.privateStateProvider = { setContractAddress: () => {}, set: async (i: string, v: any) => void st.set(i, v), get: async (i: string) => st.get(i) ?? null,
      setSigningKey: async (a: string, v: any) => void k.set(a, v), getSigningKey: async (a: string) => k.get(a) ?? null };
    const host: any = { schema: 3, contract: null, networkId: 'preview', sk: new Uint8Array(32).fill(7), age: null, P, userAddress: () => ({ bytes: new Uint8Array(32).fill(3) }) };
    await assert.rejects(B.deployV3Batched(host, 'fee', async () => B.RATE_SIGNER_PK, { storage, resume: true, waitForCircuits: async () => {} }),
      /forContract is not a function/);
    assert.equal(h.wallet.submitted.length, 1, 'the step-1 deploy was already submitted when the error surfaced');
    assert.ok(h.deployedState, 'a contract was created');
    assert.equal(k.size, 0, 'Midnight.js never stored its sampled signing key');
    assert.ok(storage.getItem(pendingDeployKeyStorageKey('preview')), 'with the fix, the key now exists BEFORE submit');
  });

  it('submitCallTx (createEvent) on the deployed contract finds the seeded private state via forContract and runs the circuit up to proving', async () => {
    const h = harness(); const storage = memStorage();
    const P = await providersFor(h, storage);
    const sk = new Uint8Array(32).fill(7);
    P.privateStateProvider.seed(B.PRIVATE_STATE_ID_V3, B.createPrivateStateV3(sk));
    const host: any = { schema: 3, contract: null, networkId: 'preview', sk, age: null, P, userAddress: () => ({ bytes: new Uint8Array(32).fill(3) }) };
    const r = await B.deployV3Batched(host, 'fee', async () => B.RATE_SIGNER_PK, { storage, resume: true, waitForCircuits: async () => {},
      insertFn: async () => ({ public: { txId: 'x' } }), listOnChain: async () => [...B.V3_CIRCUIT_ORDER] });
    // Fresh provider = page reload: only the Session.connect seed exists, nothing stored per contract.
    P.privateStateProvider = createCloakPrivateStateProvider({ networkId: 'preview', storage });
    await assert.rejects(SDK.submitCallTx(P, { compiledContract: B.CompiledCloakTixV3, contractAddress: r.address, privateStateId: B.PRIVATE_STATE_ID_V3, circuitId: 'createEvent', args: [{ bytes: new Uint8Array(32).fill(3) }] }),
      /PrivateStateNotFound|No private state/);
    P.privateStateProvider.seed(B.PRIVATE_STATE_ID_V3, B.createPrivateStateV3(sk));
    const err: any = await SDK.submitCallTx(P, { compiledContract: B.CompiledCloakTixV3, contractAddress: r.address, privateStateId: B.PRIVATE_STATE_ID_V3, circuitId: 'createEvent', args: [{ bytes: new Uint8Array(32).fill(3) }] }).then(() => null, (e: any) => e);
    const chain = (e: any): string => (e ? String(e.message) + ' <- ' + chain(e.cause) : '');
    assert.ok(err, 'fake prover must stop the call');
    assert.match(chain(err), /no proving in this test|proveTx|prove/i, 'failed at proving, i.e. after private state + circuit execution: ' + chain(err));
  });
});
