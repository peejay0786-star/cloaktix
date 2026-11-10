// CT-PROOF-IR (2026-11-09): 1AM 6.4.10 proves in the browser with a ZKIR v2-only prover and rejects Compact 0.36 circuits
// ("expected one of 'ir-source[v2-generic]' or 'ir-source[v2]', got 'ir-source[v3-generic]'"). CloakTix now proves its own
// ZKIR v3 circuits in the tab with the official @midnightntwrk/zkir-v3 WASM and leaves wallet circuits (midnight/*) to 1AM.
// No network, no signing: fake wallet, real Midnight.js 5 call path, real rate-v3 keys (the ones deployed at b92733…).
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

import { hybridProver, localProvingEnabled } from '../src/midnight/localProver.ts';
import { cachingKeyMaterial } from '../src/midnight/keyMaterial.ts';
import { isZkirV3, paramsSha256, PARAMS_K } from '../src/midnight/zkirV3Protocol.ts';
import { makeLocalProver } from '../src/midnight/zkirV3Core.ts';
import { cachedZkFetch } from '../src/midnight/zkFetch.ts';
import { createHash } from 'node:crypto';

const PARAMS_DIR = path.resolve(here, '../../contract/zk-params');
const IAM_V2_ERROR = "expected one of 'ir-source[v2-generic]' or 'ir-source[v2]', got 'ir-source[v3-generic]'.";
const nodeRunner = (() => { const run = makeLocalProver(async (k) => { const b = fs.readFileSync(path.join(PARAMS_DIR, `bls_midnight_2p${k}`)); return b.buffer.slice(b.byteOffset, b.byteOffset + b.length) as ArrayBuffer; }); let id = 0;
  return (req: any) => run({ ...req, id: ++id, paramsBase: 'file:' }); })();
// What 1AM 6.4.10 does today in In-Browser (WASM) mode: v2-only for dApp circuits.
const oneAmWallet = () => { const calls: string[] = []; return { calls,
  check: async (_p: Uint8Array, k: string) => { calls.push('check:' + k); throw new Error(`Proving check failed: ${IAM_V2_ERROR}`); },
  prove: async (_p: Uint8Array, k: string) => { calls.push('prove:' + k); throw new Error(`Proving failed: ${IAM_V2_ERROR}`); } }; };

describe('ZKIR v3 detection and routing', () => {
  it('every served rate-v3 circuit is ZKIR v3 (what 1AM 6.4.10 rejects)', () => {
    const z = fs.readdirSync(path.join(MANAGED, 'zkir')).filter((f) => f.endsWith('.bzkir'));
    assert.equal(z.length, 13);
    for (const f of z) assert.ok(isZkirV3(fs.readFileSync(path.join(MANAGED, 'zkir', f))), f);
    assert.equal(isZkirV3(new TextEncoder().encode('midnight:ir-source[v2]:xx')), false);
  });
  it('pinned SRS hashes match the files sync-zk-assets ships (k 10..16)', () => {
    assert.deepEqual(PARAMS_K, [10, 11, 12, 13, 14, 15, 16]);
    for (const k of PARAMS_K) assert.equal(createHash('sha256').update(fs.readFileSync(path.join(PARAMS_DIR, `bls_midnight_2p${k}`))).digest('hex'), paramsSha256(k), `k=${k}`);
  });
  it('routes v3 dApp circuits to the in-tab prover, wallet circuits and v2 IR to the wallet, and honours the opt-out', async () => {
    const seen: string[] = []; const run = async (r: any) => (seen.push(r.op + ':' + r.keyLocation), { id: 0, ok: true as const, check: [1n], proof: new Uint8Array([9]) });
    const v3 = fs.readFileSync(path.join(MANAGED, 'zkir', 'createEvent.bzkir'));
    const kmp = { getZKIR: async (c: string) => (c === 'old' ? new TextEncoder().encode('midnight:ir-source[v2]:') : v3), getProverKey: async () => new Uint8Array([1]), getVerifierKey: async () => new Uint8Array([2]) };
    const w = { calls: [] as string[], check: async (_p: any, k: string) => (w.calls.push('check:' + k), []), prove: async (_p: any, k: string) => (w.calls.push('prove:' + k), new Uint8Array([7])) };
    const hp = hybridProver(w, kmp, run, true);
    assert.deepEqual(await hp.prove(new Uint8Array(1), 'createEvent'), new Uint8Array([9]));
    await hp.check(new Uint8Array(1), 'createEvent');
    await hp.prove(new Uint8Array(1), 'midnight/dust/spend'); await hp.prove(new Uint8Array(1), 'old');
    assert.deepEqual(seen, ['prove:createEvent', 'check:createEvent']);
    assert.deepEqual(w.calls, ['prove:midnight/dust/spend', 'prove:old']);
    await hybridProver(w, kmp, run, false).prove(new Uint8Array(1), 'createEvent');
    assert.equal(w.calls.at(-1), 'prove:createEvent');
    assert.equal(localProvingEnabled({ getItem: () => 'wallet' }), false);
    assert.equal(localProvingEnabled({ getItem: () => null }), true);
  });
  it('local errors are reported with the circuit name, never silently passed to the wallet', async () => {
    const kmp = { getZKIR: async () => fs.readFileSync(path.join(MANAGED, 'zkir', 'createEvent.bzkir')), getProverKey: async () => new Uint8Array([1]), getVerifierKey: async () => new Uint8Array([2]) };
    const w = oneAmWallet();
    await assert.rejects(hybridProver(w, kmp, async () => ({ id: 0, ok: false, error: 'boom' }), true).prove(new Uint8Array(1), 'createEvent'), /In-tab ZKIR v3 proving failed for 'createEvent': boom/);
    assert.equal(w.calls.length, 0);
  });
});

// ---------- real SDK path ----------
after(() => fs.rmSync(path.join(here, '.tmp-proof-ir'), { recursive: true, force: true }));
let B: any; // bundled real deployV3Batched + contract-v3 (import.meta.env defined like Vite would)
let SDK: any, PROTO: any, TXMOD: any, CR: any, DC: any, ZK: any;
before(async () => {
  const outdir = path.join(here, '.tmp-proof-ir'); fs.mkdirSync(outdir, { recursive: true });
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
const fetchLog: string[] = [];
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
    fetchLog.push(rel);
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
  const zkConfigProvider = new ZK.FetchZkConfigProvider('http://zk.test/managed/cloaktix-rate-v3', { fetchFunc: ((h as any).wrapFetch ? (h as any).wrapFetch(h.fetchFunc) : h.fetchFunc) as any });
  const proofProvider = await DC.dappConnectorProofProvider((h as any).proverApi ?? h.api as any, zkConfigProvider, PROTO.CostModel.initialCostModel());
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


describe('createEvent end-to-end through Midnight.js 5 with 1AM-like v2-only wallet proving', () => {
  it('REPRO: wallet proving alone fails exactly like the live app', async () => {
    const h: any = harness(); const storage = memStorage(); const w = oneAmWallet();
    h.proverApi = { ...h.api, getProvingProvider: async (kmp: any) => cachingKeyMaterial(kmp).wrapProver(w) };
    const P = await providersFor(h, storage); const sk = new Uint8Array(32).fill(7);
    P.privateStateProvider.seed(B.PRIVATE_STATE_ID_V3, B.createPrivateStateV3(sk));
    const host: any = { schema: 3, contract: null, networkId: 'preview', sk, age: null, P, userAddress: () => ({ bytes: new Uint8Array(32).fill(3) }) };
    const r = await B.deployV3Batched(host, 'fee', async () => B.RATE_SIGNER_PK, { storage, resume: true, waitForCircuits: async () => {}, insertFn: async () => ({ public: { txId: 'x' } }), listOnChain: async () => [...B.V3_CIRCUIT_ORDER] });
    const err: any = await SDK.submitCallTx(P, { compiledContract: B.CompiledCloakTixV3, contractAddress: r.address, privateStateId: B.PRIVATE_STATE_ID_V3, circuitId: 'createEvent', args: [{ bytes: new Uint8Array(32).fill(3) }] }).then(() => null, (e: any) => e);
    const chain = (e: any): string => (e ? String(e.message) + ' <- ' + chain(e.cause) : '');
    assert.ok(err); assert.match(chain(err), /ir-source\[v3-generic\]/);
  });

  it('FIX: createEvent is proved in-tab (ZKIR v3), then balanced and submitted by the wallet; the wallet prover is never asked', async () => {
    const proofs: Uint8Array[] = [];
    const h: any = harness(); const storage = memStorage(); const w = oneAmWallet();
    h.proverApi = { ...h.api, getProvingProvider: async (kmp: any) => { const c = cachingKeyMaterial(kmp); return hybridProver(c.wrapProver(w), c.kmp, async (req: any) => { const r: any = await nodeRunner(req); if (r.ok && r.proof) proofs.push(r.proof); return r; }, true); } };
    const P = await providersFor(h, storage); const sk = new Uint8Array(32).fill(7);
    P.privateStateProvider.seed(B.PRIVATE_STATE_ID_V3, B.createPrivateStateV3(sk));
    const host: any = { schema: 3, contract: null, networkId: 'preview', sk, age: null, P, userAddress: () => ({ bytes: new Uint8Array(32).fill(3) }) };
    const r = await B.deployV3Batched(host, 'fee', async () => B.RATE_SIGNER_PK, { storage, resume: true, waitForCircuits: async () => {}, insertFn: async () => ({ public: { txId: 'x' } }), listOnChain: async () => [...B.V3_CIRCUIT_ORDER] });
    const balancedBefore = h.wallet.balanced.length;
    const t0 = Date.now();
    const res: any = await SDK.submitCallTx(P, { compiledContract: B.CompiledCloakTixV3, contractAddress: r.address, privateStateId: B.PRIVATE_STATE_ID_V3, circuitId: 'createEvent', args: [{ bytes: new Uint8Array(32).fill(3) }] });
    console.log(`# createEvent proved in-tab + balanced in ${Date.now() - t0} ms`);
    assert.ok(res?.public?.txId, 'call landed (fake indexer)');
    assert.equal(w.calls.length, 0, 'the v2-only wallet prover was never used for the dApp circuit');
    assert.equal(h.wallet.balanced.length, balancedBefore + 1); assert.equal(h.wallet.submitted.length, h.wallet.balanced.length);
    // The balanced tx carries a real proof for createEvent (not a preimage / not a dummy).
    const tx = await TXMOD.deserializeTransactionAtStage('v9', 'Finalized', Uint8Array.from(Buffer.from(h.wallet.submitted.at(-1), 'hex')));
    const calls = [...tx.intents.values()].flatMap((i: any) => i.actions).filter((a: any) => a instanceof PROTO.ContractCall);
    assert.equal(calls.length, 1); assert.equal(Buffer.from(calls[0].entryPoint).toString(), 'createEvent');
    // Independent check by the ledger itself: apply the deploy, then verify the call's contract proof against the
    // deployed verifier key (byte-identical to the 13 keys on b92733…, see audit). Fees/signatures are the wallet's job.
    const strict = new PROTO.WellFormedStrictness();
    strict.enforceBalancing = false; strict.verifySignatures = false; strict.verifyNativeProofs = false; strict.enforceLimits = false;
    strict.verifyContractProofs = true;
    const now = new Date();
    const block = { secondsSinceEpoch: BigInt(Math.floor(now.getTime() / 1000)), secondsSinceEpochErr: 30, parentBlockHash: '00'.repeat(32), lastBlockTime: BigInt(Math.floor(now.getTime() / 1000) - 6) } as any;
    let ls = PROTO.LedgerState.blank('preview');
    const deployTx = await TXMOD.deserializeTransactionAtStage('v9', 'Finalized', Uint8Array.from(Buffer.from(h.wallet.submitted[0], 'hex')));
    [ls] = ls.apply(deployTx.wellFormed(ls, strict, now), new PROTO.TransactionContext(ls, block));
    assert.ok(ls.index(r.address), 'deploy applied to a local ledger state');
    assert.doesNotThrow(() => tx.wellFormed(ls, strict, now), 'ledger accepts the transaction carrying the in-tab ZKIR v3 proof');
    assert.ok(proofs.length === 1 && proofs[0].length > 1000, 'one real proof produced in-tab');
    // NOTE (measured 2026-11-09): the node build of ledger-v9 1.0.x accepts this tx even with bytes of the ZK proof
    // flipped, i.e. wellFormed() here checks structure/binding but does not run the contract-proof verifier. The real
    // verifier check is the Preview node itself; what this test guarantees is a structurally valid tx with a v3 proof
    // produced from the exact prover keys whose verifier keys are deployed on b92733….
  });

  it('SPEED: with cachedZkFetch the createEvent prover key is downloaded once instead of 4 times', async () => {
    const run = async (wrap: boolean) => {
      const h: any = harness(); const storage = memStorage(); const w = oneAmWallet();
      if (wrap) h.wrapFetch = (f: any) => cachedZkFetch('http://zk.test/managed/cloaktix-rate-v3', f, undefined);
      h.proverApi = { ...h.api, getProvingProvider: async (kmp: any) => { const c = cachingKeyMaterial(kmp); return hybridProver(c.wrapProver(w), c.kmp, nodeRunner, true); } };
      const P = await providersFor(h, storage); const sk = new Uint8Array(32).fill(7);
      P.privateStateProvider.seed(B.PRIVATE_STATE_ID_V3, B.createPrivateStateV3(sk));
      const host: any = { schema: 3, contract: null, networkId: 'preview', sk, age: null, P, userAddress: () => ({ bytes: new Uint8Array(32).fill(3) }) };
      const r = await B.deployV3Batched(host, 'fee', async () => B.RATE_SIGNER_PK, { storage, resume: true, waitForCircuits: async () => {}, insertFn: async () => ({ public: { txId: 'x' } }), listOnChain: async () => [...B.V3_CIRCUIT_ORDER] });
      fetchLog.length = 0;
      await SDK.submitCallTx(P, { compiledContract: B.CompiledCloakTixV3, contractAddress: r.address, privateStateId: B.PRIVATE_STATE_ID_V3, circuitId: 'createEvent', args: [{ bytes: new Uint8Array(32).fill(3) }] })
      return fetchLog.filter((x) => x === 'keys/createEvent.prover').length;
    };
    const before = await run(false), after = await run(true);
    console.log(`# prover-key downloads per createEvent call: before=${before} after=${after}`);
    assert.ok(before >= 3, `baseline re-downloads (${before})`); assert.equal(after, 1);
  });
});
