// SPDX-License-Identifier: Apache-2.0
// "Dev wallet" bridge — LOCAL DEVNET ONLY (public genesis seeds).
// Stands in for the 1AM/Lace extension in headless Chrome, which has no extensions.
// It does what a wallet does: balance (DUST/NIGHT), sign, submit.
// ZK PROOFS are generated IN THE PAGE (WASM zkir-v2), not here.
// It also serves the public files the browser prover needs
// (zkir WASM, midnight/* ledger keys, SRS parameters).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import pino from 'pino';
import * as Rx from 'rxjs';
import { WebSocket } from 'ws';
import { WasmProver } from '@midnight-ntwrk/wallet-sdk-prover-client/effect';
import { Transaction } from '@midnight-ntwrk/midnight-js-protocol/ledger';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { MidnightBech32m, ShieldedCoinPublicKey, ShieldedEncryptionPublicKey } from '@midnight-ntwrk/wallet-sdk-address-format';
import { LOCAL_CONFIG as C } from '../../e2e/config.js';
import { MidnightWalletProvider, LOCAL_SEEDS, syncWallet } from '../../e2e/wallet.js';

(globalThis as any).WebSocket ??= WebSocket;
const PORT = Number(process.env.BRIDGE_PORT ?? 8790);
const here = path.dirname(new URL(import.meta.url).pathname);
const SRS = path.resolve(here, '../../.srs-cache');
const ZKIR_DIR = path.dirname(createRequire(import.meta.url).resolve('@midnight-ntwrk/zkir-v2'));
const log = pino({ level: 'warn' });
setNetworkId(C.networkId);
const env: any = { walletNetworkId: C.networkId, networkId: C.networkId, indexer: C.indexer, indexerWS: C.indexerWS, node: C.node, nodeWS: C.nodeWS, faucet: C.faucet, proofServer: C.proofServer };
const s3: any = WasmProver.makeDefaultKeyMaterialProvider();
const hex = (u: Uint8Array) => Buffer.from(u).toString('hex');
const unhex = (s: string) => new Uint8Array(Buffer.from(s, 'hex'));
const wallets = new Map<string, Promise<MidnightWalletProvider>>();
const getW = (role: string) => {
  if (!(role in LOCAL_SEEDS)) throw new Error('unknown role ' + role);
  if (!wallets.has(role)) wallets.set(role, (async () => {
    const w = await MidnightWalletProvider.build(log, env, { kind: 'seed', value: (LOCAL_SEEDS as any)[role] });
    await w.start(); await syncWallet(log, w.wallet, 10 * 60_000); console.log('wallet ready', role); return w;
  })());
  return wallets.get(role)!;
};
const enc = (codec: any, v: any) => codec.codec.encode(C.networkId, v).asString();

async function call(role: string, method: string, a: any[]) {
  const w = await getW(role);
  switch (method) {
    case 'getConfiguration':
      return { indexerUri: C.indexer, indexerWsUri: C.indexerWS, substrateNodeUri: C.nodeWS, networkId: C.networkId };
    case 'getConnectionStatus': return { status: 'connected', networkId: C.networkId };
    case 'getUnshieldedAddress':
      return { unshieldedAddress: MidnightBech32m.encode(C.networkId, await w.wallet.unshielded.getAddress() as any).asString() };
    case 'getShieldedAddresses': {
      const cpk = ShieldedCoinPublicKey.fromHexString(w.getCoinPublicKey() as any);
      const epk = ShieldedEncryptionPublicKey.fromHexString(w.getEncryptionPublicKey() as any);
      return { shieldedAddress: '', shieldedCoinPublicKey: enc(ShieldedCoinPublicKey, cpk), shieldedEncryptionPublicKey: enc(ShieldedEncryptionPublicKey, epk) };
    }
    case 'getUnshieldedBalances': {
      // Latest known state, NOT waitForSyncedState(): right after its own tx the wallet resyncs and
      // waitForSyncedState() blocked for minutes, which kept the UI "busy" long after the tx was in a block.
      const s: any = await Rx.firstValueFrom(w.wallet.state());
      return Object.fromEntries(Object.entries(s.unshielded.balances).map(([k, v]) => [k, String(v)]));
    }
    case 'getDustBalance': { const s: any = await Rx.firstValueFrom(w.wallet.state()); return { balance: String(s.dust.balance(new Date())), cap: '0' }; }
    case 'balanceUnsealedTransaction': {
      const tx = Transaction.deserialize('signature', 'proof', 'pre-binding', unhex(a[0]));
      const t0 = Date.now(); const bal = await w.balanceTx(tx as any);
      console.log(`[${role}] balance+sign in ${Date.now() - t0} ms`);
      return { tx: hex(bal.serialize()) };
    }
    case 'submitTransaction': {
      const tx = Transaction.deserialize('signature', 'proof', 'binding', unhex(a[0]));
      const id = await w.submitTx(tx as any); console.log(`[${role}] submitted ${id}`); return { txId: id }; // dev extension: returns the id actually submitted
    }
  }
  throw new Error('unsupported method ' + method);
}

const b64 = (u: Uint8Array) => Buffer.from(u).toString('base64');
http.createServer(async (rq, rs) => {
  const u = new URL(rq.url!, 'http://x');
  try {
    if (u.pathname.startsWith('/devwallet/')) {
      const [, , role, method] = u.pathname.split('/');
      let body = ''; for await (const c of rq) body += c;
      const r = await call(role, method, body ? JSON.parse(body) : []);
      rs.setHeader('content-type', 'application/json'); return rs.end(JSON.stringify({ ok: r }));
    }
    if (u.pathname.startsWith('/zk/zkir/')) {
      const f = path.join(ZKIR_DIR, path.basename(u.pathname));
      rs.setHeader('content-type', f.endsWith('.wasm') ? 'application/wasm' : 'text/javascript');
      return rs.end(fs.readFileSync(f));
    }
    if (u.pathname === '/zk/km') { // public ledger keys (zswap/dust), mirror of Midnight S3
      const m = await s3.lookupKey(u.searchParams.get('loc')!);
      if (!m) { rs.statusCode = 404; return rs.end(); }
      return rs.end(JSON.stringify({ proverKey: b64(m.proverKey), verifierKey: b64(m.verifierKey), ir: b64(m.ir) }));
    }
    if (u.pathname.startsWith('/zk/params/')) {
      const k = Number(path.basename(u.pathname)); const f = path.join(SRS, `bls_midnight_2p${k}`);
      fs.mkdirSync(SRS, { recursive: true });
      if (!fs.existsSync(f)) fs.writeFileSync(f, await s3.getParams(k));
      return rs.end(fs.readFileSync(f));
    }
    rs.statusCode = 404; rs.end();
  } catch (e: any) {
    console.log('[bridge] error', u.pathname, String(e?.message ?? e).slice(0, 300));
    rs.statusCode = 500; rs.setHeader('content-type', 'application/json'); rs.end(JSON.stringify({ error: String(e?.message ?? e) }));
  }
}).listen(PORT, '127.0.0.1', () => {
  console.log(`dev wallet bridge on :${PORT}`);
  for (const r of ['ALICE', 'BOB', 'CHARLIE', 'DAVE']) getW(r).catch((e) => console.log('wallet', r, e));
});
