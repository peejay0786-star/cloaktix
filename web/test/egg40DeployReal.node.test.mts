/**
 * EGG-40 step 1 through the REAL midnight-js deployContract (same SDK copies as the web bundle), up to the
 * wallet's balanceUnsealedTransaction. Checks the pre-wallet guard on the exact handle 1AM would receive.
 * Nothing is signed or submitted: the fake wallet records the tx and refuses.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { register } from 'node:module';

const here = path.dirname(fileURLToPath(import.meta.url));
const LEDGER_V9 = new URL('../node_modules/@midnight-ntwrk/midnight-js-protocol/node_modules/@midnightntwrk/ledger-v9/', import.meta.url).href;
register('data:text/javascript,' + encodeURIComponent(`export async function resolve(s, c, n) {
  if (s === '@midnightntwrk/ledger-v9' || s.startsWith('@midnightntwrk/ledger-v9/')) return n(s, { ...c, parentURL: ${JSON.stringify(LEDGER_V9 + 'x.js')} });
  return n(s, c); }`));
const MANAGED = path.resolve(here, '../../contract/managed/cloaktix-egg40');

const SDK: any = await import('@midnight-ntwrk/midnight-js-contracts');
const PROTO: any = await import('@midnight-ntwrk/midnight-js-protocol/v9');
const TXMOD: any = await import('@midnight-ntwrk/midnight-js-protocol/transaction');
const DC: any = await import('@midnight-ntwrk/midnight-js-dapp-connector-proof-provider');
const ZK: any = await import('@midnight-ntwrk/midnight-js-fetch-zk-config-provider');
const RT: any = await import('@midnight-ntwrk/compact-runtime');
const { CompiledContract }: any = await import('@midnight-ntwrk/compact-js');
const EGG: any = await import(path.join(MANAGED, 'contract/index.js'));
const { witnesses }: any = await import('../../contract/witnesses-egg40.ts');
(globalThis as any).window ??= { location: { origin: 'http://zk.test' }, crypto: globalThis.crypto };
const { deployEgg40Batched } = await import('../src/midnight/deployEgg40.ts');
const { planEgg40DeploySteps, deployTxVkProblems } = await import('../src/midnight/deployEgg40Plan.ts');
const { createCloakPrivateStateProvider } = await import('../src/midnight/privateStateProvider.ts');

function memStorage() {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k), key: (i: number) => [...m.keys()][i] ?? null, get length() { return m.size; }, clear: () => m.clear() } as Storage;
}

/** Runs step 1 with real providers; returns what reached the wallet (or the error). */
export async function runStep1(opts: { noOmitPatch?: boolean } = {}) {
  const reached: string[] = [];
  const api: any = {
    getShieldedAddresses: async () => ({ shieldedCoinPublicKey: PROTO.sampleCoinPublicKey(), shieldedEncryptionPublicKey: PROTO.sampleEncryptionPublicKey() }),
    balanceUnsealedTransaction: async (txHex: string) => { reached.push(txHex); throw new Error('TEST-WALLET-STOP'); },
    submitTransaction: async () => { throw new Error('must not submit'); },
    getProvingProvider: async () => ({ check: async () => { throw new Error('no proving expected'); }, prove: async () => { throw new Error('no proving expected'); } }),
  };
  const fetchFunc = async (url: string) => { const rel = decodeURIComponent(new URL(url).pathname.replace(/^\/managed\/cloaktix-egg40\//, '')); const f = path.join(MANAGED, rel);
    return fs.existsSync(f) ? new Response(fs.readFileSync(f)) : new Response('nf', { status: 404 }); };
  const zkConfigProvider = new ZK.FetchZkConfigProvider('http://zk.test/managed/cloaktix-egg40', { fetchFunc: fetchFunc as any });
  const proofProvider = await DC.dappConnectorProofProvider(api, zkConfigProvider, PROTO.CostModel.initialCostModel());
  const { walletProvider, midnightProvider } = await DC.dappConnectorWalletProviders(api);
  const pdp: any = {
    queryLatestProtocolVersion: async () => 2001100,
    queryBlock: async () => ({ hash: '00'.repeat(32), height: 1, timestamp: Date.now(), protocolVersion: 2001100 }),
    queryContractState: async () => null, queryZSwapAndContractState: async () => null,
  };
  const storage = memStorage();
  const P: any = { config: { networkId: 'preview', ttlSeconds: 1800 }, zkConfigProvider, proofProvider, walletProvider, midnightProvider, publicDataProvider: pdp,
    privateStateProvider: createCloakPrivateStateProvider({ networkId: 'preview', storage }) };
  const compiled = CompiledContract.make('CloakTixEgg40', EGG.Contract).pipe(CompiledContract.withWitnesses(witnesses), CompiledContract.withCompiledFileAssets('managed/cloaktix-egg40'));
  const sk = new Uint8Array(32).fill(7);
  const host: any = { schema: 3, contract: null, networkId: 'preview', sk, age: null, P, userAddress: () => ({ bytes: new Uint8Array(32).fill(3) }) };
  let error: any = null;
  try {
    await deployEgg40Batched(host, 'fee', async () => RT.ecMulGenerator(5n), { storage, deps: {
      P, compiled, ContractStateCls: opts.noOmitPatch ? class { setOperation() {} } : RT.ContractState, deployFn: SDK.deployContract, insertFn: async () => { throw new Error('no insert'); },
      fetchVk: async () => new Uint8Array(), listOnChain: async () => [], waitForCircuits: async () => {},
      sampleKey: RT.sampleSigningKey, verifyingKeyOf: RT.signatureVerifyingKey,
      accountId: (k: Uint8Array) => EGG.pureCircuits.accountId(k), rateSignerPk: RT.ecMulGenerator(9n),
      createPrivateState: (k: Uint8Array) => ({ sk: k, age: null, doorSk: null }),
    } as any });
  } catch (e) { error = e; }
  const tx = reached.length ? await TXMOD.deserializeTransactionAtStage('v9', 'Unbound', Uint8Array.from(Buffer.from(reached[0], 'hex'))) : null;
  return { reached, error, tx };
}

describe('EGG-40 step 1 through real deployContract', { skip: !fs.existsSync(new URL('../../contract/managed/cloaktix-egg40/keys/createEvent.verifier', import.meta.url)) && 'needs the compiled verifier keys (not published; compile locally with Compact)' }, () => {
  it('guard lets the real deploy handle through to the wallet, with exactly the 10 planned keys', async () => {
    const { reached, error, tx } = await runStep1();
    const msg = String(error?.message ?? error) + ' <- ' + String(error?.cause?.message ?? '');
    assert.equal(reached.length, 1, `wallet was not reached: ${msg}`);
    assert.match(msg, /TEST-WALLET-STOP/);
    assert.deepEqual(deployTxVkProblems(tx, planEgg40DeploySteps().deployCircuits), []);
  });
  it('guard still blocks a real deploy with empty deferred slots (Custom error 110) before the wallet', async () => {
    const { reached, error } = await runStep1({ noOmitPatch: true });
    assert.equal(reached.length, 0, 'wallet must not be reached');
    const msg = String(error?.cause?.message ?? error?.message ?? error);
    assert.match(msg, /stopped before the wallet.*empty verifier key slot/);
  });
});
