// SPDX-License-Identifier: Apache-2.0
// ZK proofs generated in headless Chrome (WASM zkir-v2), driven over CDP (no added dependency).
// Exposes an object compatible with DApp Connector `getProvingProvider`, used with dappConnectorProofProvider.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn, type ChildProcess } from 'node:child_process';
import { createRequire } from 'node:module';
import WebSocket from 'ws';
import { WasmProver } from '@midnight-ntwrk/wallet-sdk-prover-client/effect';

const req = createRequire(import.meta.url);
const ZKIR_DIR = path.dirname(req.resolve('@midnight-ntwrk/zkir-v2'));
const HTML = path.resolve(new URL('.', import.meta.url).pathname, '../browser/index.html');
const SRS_CACHE = path.resolve(new URL('.', import.meta.url).pathname, '../.srs-cache');
type KMP = { lookupKey(l: string): Promise<any>; getParams(k: number): Promise<Uint8Array> };
type DappKMP = { getZKIR(l: string): Promise<Uint8Array>; getProverKey(l: string): Promise<Uint8Array>; getVerifierKey(l: string): Promise<Uint8Array> };
const b64 = (u: Uint8Array) => Buffer.from(u).toString('base64');

export class BrowserProver {
  server!: http.Server; chrome!: ChildProcess; ws!: WebSocket; id = 0; pending = new Map<number, any>();
  contractKmp: DappKMP | undefined; s3 = WasmProver.makeDefaultKeyMaterialProvider() as KMP;
  stats: { op: string; loc: string; ms: number }[] = [];
  userAgent = '';

  async start(port = 8765, cdpPort = 9333) {
    fs.mkdirSync(SRS_CACHE, { recursive: true });
    this.server = http.createServer(async (rq, rs) => {
      try {
        const u = new URL(rq.url!, 'http://x');
        rs.setHeader('Cross-Origin-Opener-Policy', 'same-origin'); rs.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
        if (u.pathname === '/') { rs.setHeader('content-type', 'text/html'); return rs.end(fs.readFileSync(HTML)); }
        if (u.pathname.startsWith('/zkir/')) {
          const f = path.join(ZKIR_DIR, path.basename(u.pathname));
          rs.setHeader('content-type', f.endsWith('.wasm') ? 'application/wasm' : 'text/javascript');
          return rs.end(fs.readFileSync(f));
        }
        if (u.pathname === '/km') {
          const loc = u.searchParams.get('loc')!;
          // Ledger keys (zswap/dust): Midnight S3; contract keys: the DApp Connector KeyMaterialProvider.
          const c = this.contractKmp;
          const m = loc.startsWith('midnight/') || !c ? await this.s3.lookupKey(loc)
            : { proverKey: await c.getProverKey(loc), verifierKey: await c.getVerifierKey(loc), ir: await c.getZKIR(loc) };
          if (!m) { rs.statusCode = 404; return rs.end(); }
          return rs.end(JSON.stringify({ proverKey: b64(m.proverKey), verifierKey: b64(m.verifierKey), ir: b64(m.ir) }));
        }
        if (u.pathname.startsWith('/params/')) {
          const k = Number(path.basename(u.pathname)); const f = path.join(SRS_CACHE, `bls_midnight_2p${k}`);
          if (!fs.existsSync(f)) fs.writeFileSync(f, await this.s3.getParams(k));
          return rs.end(fs.readFileSync(f));
        }
        rs.statusCode = 404; rs.end();
      } catch (e) { console.log('[km] erreur', rq.url, String(e)); rs.statusCode = 500; rs.end(String(e)); }
    });
    await new Promise<void>((r) => this.server.listen(port, '127.0.0.1', r));
    this.chrome = spawn('google-chrome', ['--headless=new', `--remote-debugging-port=${cdpPort}`, '--user-data-dir=/tmp/cloaktix-chrome', '--no-first-run', '--no-default-browser-check', `http://127.0.0.1:${port}/`], { stdio: 'ignore' });
    let target: any;
    for (let i = 0; i < 60 && !target; i++) {
      await new Promise((r) => setTimeout(r, 500));
      try { target = ((await (await fetch(`http://127.0.0.1:${cdpPort}/json/list`)).json()) as any[]).find((t) => t.type === 'page' && t.url.includes(String(port))); } catch {}
    }
    if (!target) throw new Error('Chrome headless injoignable');
    this.ws = new WebSocket(target.webSocketDebuggerUrl, { maxPayload: 1 << 30 });
    await new Promise((r) => this.ws.once('open', r));
    this.ws.on('message', (m) => {
      const j = JSON.parse(String(m));
      if (j.id && this.pending.has(j.id)) { const p = this.pending.get(j.id); this.pending.delete(j.id); j.error ? p.rej(new Error(j.error.message)) : p.res(j.result); }
      else if (j.method === 'Runtime.exceptionThrown') console.log('[chrome]', JSON.stringify(j.params.exceptionDetails).slice(0, 400));
    });
    await this.send('Runtime.enable');
    for (let i = 0; i < 120; i++) { if (await this.eval('window.zkReady === true')) break; await new Promise((r) => setTimeout(r, 500)); }
    this.userAgent = await this.eval('navigator.userAgent');
    console.log(`CHROME ready (${this.userAgent}), WASM loaded in ${Math.round(await this.eval('window.zk.loadMs'))} ms, crossOriginIsolated=${await this.eval('self.crossOriginIsolated')}`);
  }
  send(method: string, params: any = {}) {
    const id = ++this.id; this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise<any>((res, rej) => this.pending.set(id, { res, rej }));
  }
  async eval(expression: string) {
    const r = await this.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error('navigateur: ' + (r.exceptionDetails.exception?.description ?? r.exceptionDetails.text));
    return r.result.value;
  }
  // API style DApp Connector : getProvingProvider(keyMaterialProvider) -> ProvingProvider
  api() {
    return {
      getProvingProvider: async (kmp: DappKMP) => {
        this.contractKmp = kmp;
        return {
          check: async (pre: Uint8Array, loc: string) => {
            const t = Date.now();
            const v: (string | null)[] = await this.eval(`window.zk.check(${JSON.stringify(b64(pre))})`);
            this.stats.push({ op: 'check', loc, ms: Date.now() - t });
            return v.map((x) => (x === null ? undefined : BigInt(x)));
          },
          prove: async (pre: Uint8Array, loc: string, ob?: bigint) => {
            const r = await this.eval(`window.zk.prove(${JSON.stringify(b64(pre))}, ${ob === undefined ? 'null' : JSON.stringify(ob.toString())})`);
            this.stats.push({ op: 'prove', loc, ms: Math.round(r.ms) });
            console.log(`PREUVE NAVIGATEUR ${loc} en ${Math.round(r.ms)} ms (${Buffer.from(r.proof, 'base64').length} octets)`);
            return new Uint8Array(Buffer.from(r.proof, 'base64'));
          },
        };
      },
    };
  }
  async stop() { try { this.ws?.close(); } catch {} this.chrome?.kill(); this.server?.close(); }
}
