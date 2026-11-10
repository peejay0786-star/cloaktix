import { parseEventDetails, parseListingType } from '../web/src/catalog/model.ts';
// Static server for the Preprod build only (no /devwallet, no /zk bridge proxy).
// Usage: node serve.mjs <dist-dir> [port]   ·   Blockfrost key: env BLOCKFROST_PROJECT_ID, else file blockfrost.key next to this script.
// Public event metadata (name/date/venue, ticket-type names): GET/POST /meta, stored in meta.json next to this script;
// writes are signed and checked against the on-chain organizer (build the read-only decoder with web/scripts/buildCatalogDecoder.mjs).
import http from 'node:http'; import https from 'node:https'; import tls from 'node:tls'; import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath, pathToFileURL } from 'node:url'; import crypto from 'node:crypto';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const T = { '.html':'text/html; charset=utf-8', '.js':'text/javascript', '.css':'text/css', '.wasm':'application/wasm', '.svg':'image/svg+xml', '.png':'image/png', '.ico':'image/x-icon', '.ttf':'font/ttf', '.json':'application/json', '.webmanifest':'application/manifest+json', '.webp':'image/webp' };
const UP = 'midnight-preprod.blockfrost.io';

// ---- Metadata store: off-chain labels only (no secrets, no balances). Only the event's ON-CHAIN organizer may write.
// Proof of organizer (no contract change, the organizer secret never leaves the browser):
//  * organizer id O = H(sk) is on-chain (events[e].organizer). The browser derives an Ed25519 key from sk:
//    seed = SHA-256("cloaktix:meta-key:v1:" || sk), and registers its public key pk ON-CHAIN once by calling
//    createEvent(payout = pk). The contract sets that event's organizer = me() = H(sk) inside the ZK proof,
//    so the ledger itself states "O controls pk" — nobody else can create an event with organizer O.
//  * each write is signed with that key; the server checks the signature and that some on-chain event has
//    (organizer == O of the target event, payout == pk). Updates allowed (newer ts wins, replays rejected).
// Chain decoding uses web/.catalog-runtime/chain.mjs, built from the existing generated schemas.
const MAX_KEYS = 5000; const SKEW = 10 * 60 * 1000;
const SPKI = Buffer.from('302a300506032b6570032100', 'hex');
export const metaMessage = (c, kind, id, ts, v) => `cloaktix:meta:v1|${c}|${kind}|${id}|${ts}|${JSON.stringify(v)}`;
export function createMetaHandler({ file = path.join(HERE, 'meta.json'), queryState, decodeState } = {}) {
  let db = {}; try { db = JSON.parse(fs.readFileSync(file, 'utf8')); } catch { /* new store */ }
  for (const r of Object.values(db)) for (const k of ['ev', 'tt']) for (const [id, x] of Object.entries(r[k] ?? {})) if (!x.v || !x.ts) delete r[k][id]; // legacy unsigned entries: dropped (unverified)
  const save = () => { const tmp = file + '.tmp'; fs.writeFileSync(tmp, JSON.stringify(db)); fs.renameSync(tmp, file); };
  const send = (res, code, body) => { res.writeHead(code, { 'content-type': 'application/json', 'cache-control': 'no-store', 'cross-origin-resource-policy': 'same-origin' }); res.end(JSON.stringify(body)); };
  const clean = (kind, v) => {
    if (kind === 'ev') return parseEventDetails(v);
    if (!v || typeof v.name !== 'string' || !v.name.trim() || v.name.length > 80) return null;
    const item = parseListingType({id:'0', ...v, resaleSummary:v.resaleSummary || 'Resale rules confirmed after connection'});
    if (!item) return null;
    const {id:unused, ...out}=item; return out;
  };
  let chain; const decode = async (hexState) => {
    if (decodeState) return decodeState(hexState);
    // Local public decoder is built from the existing generated schemas, never a wallet session.
    chain ??= await import('../web/.catalog-runtime/chain.mjs');
    return chain.decodeCatalogState(hexState);
  };
  return (req, res) => {
    const u = new URL(req.url, 'http://x'); const c = (u.searchParams.get('c') ?? '').toLowerCase();
    if (req.method === 'GET' || req.method === 'HEAD') {
      if (!/^[0-9a-f]{64}$/.test(c)) return send(res, 400, { error: 'bad contract' });
      const r = db[c] ?? {};
      if (u.pathname === '/catalog') {
        const events = Object.entries(r.ev ?? {}).flatMap(([id,row]) => {
          const details=parseEventDetails(row.v);if(!details || (r.keys??[]).includes(id))return [];
          const tickets=Object.entries(r.tt??{}).filter(([,t])=>t.eventId===id).flatMap(([typeId,t])=>{const parsed=parseListingType({id:typeId,...t.v});return parsed?[parsed]:[];});
          return [{...details,id,publishedAt:row.ts,tickets}];
        });
        return send(res,200,{source:'organizer-published',contract:c,events});
      }
      const flat = (k) => Object.fromEntries(Object.entries(r[k] ?? {}).map(([id, x]) => [id, x.v]));
      return send(res, 200, { ev: flat('ev'), tt: flat('tt'), keys: r.keys ?? [] });
    }
    if (u.pathname === '/catalog') return send(res,405,{error:'read only'});
    if (req.method !== 'POST') return send(res, 405, { error: 'method' });
    let body = ''; let big = false;
    req.setEncoding('utf8');
    req.on('data', (d) => { if (big) return; body += d; if (body.length > 400000) { big = true; send(res, 413, { error: 'too large' }); req.destroy(); } });
    req.on('end', async () => {
      if (big) return;
      try {
        let j; try { j = JSON.parse(body); } catch { return send(res, 400, { error: 'json' }); }
        const cc = String(j.c ?? '').toLowerCase(); const id = String(j.id ?? ''); const v = clean(j.kind, j.v);
        const pk = String(j.pk ?? '').toLowerCase(); const sig = String(j.sig ?? ''); const ts = Number(j.ts);
        if (!/^[0-9a-f]{64}$/.test(cc) || !['ev', 'tt'].includes(j.kind) || !/^\d{1,19}$/.test(id) || !v || !/^[0-9a-f]{64}$/.test(pk) || !/^[0-9a-f]{128}$/.test(sig) || !Number.isSafeInteger(ts)) return send(res, 400, { error: 'invalid' });
        if (Math.abs(Date.now() - ts) > SKEW) return send(res, 400, { error: 'stale timestamp' });
        const key = crypto.createPublicKey({ key: Buffer.concat([SPKI, Buffer.from(pk, 'hex')]), format: 'der', type: 'spki' });
        if (!crypto.verify(null, Buffer.from(metaMessage(cc, j.kind, id, ts, j.v)), key, Buffer.from(sig, 'hex'))) return send(res, 403, { error: 'bad signature' });
        if (!queryState) return send(res, 503, { error: 'no chain access' });
        const st = await queryState(cc); if (!st) return send(res, 404, { error: 'unknown contract' });
        const { events, types } = await decode(st);
        const evId = j.kind === 'ev' ? id : types.get(id)?.eventId; const target = evId && events.get(evId);
        if (!target) return send(res, 404, { error: 'not on-chain yet' });
        const reg = [...events].find(([, e]) => e.organizer === target.organizer && e.payout === pk);
        if (!reg) return send(res, 403, { error: 'not the organizer (key not registered on-chain for this organizer)' });
        const rec = (db[cc] ??= { ev: {}, tt: {}, keys: [] }); rec.keys ??= [];
        const prev = rec[j.kind][id]; if (prev && prev.ts >= ts) return send(res, 409, { error: 'replay or older update' });
        if (!prev && j.kind==='ev' && Object.keys(rec.ev).length>=200) return send(res,507,{error:'event listing limit reached'});
        if (!prev && Object.values(db).reduce((n, r) => n + Object.keys(r.ev).length + Object.keys(r.tt).length, 0) >= MAX_KEYS) return send(res, 507, { error: 'full' });
        rec[j.kind][id] = { v, ts, ...(j.kind==='tt'?{eventId:evId}:{}) };
        if (JSON.stringify(db).length > 10*1024*1024) {if(prev)rec[j.kind][id]=prev;else delete rec[j.kind][id];return send(res,507,{error:'catalog storage full'});}
        if (!rec.keys.includes(reg[0])) rec.keys.push(reg[0]); save(); send(res, 201, { ok: true });
      } catch (e) { console.error('meta', e?.message); send(res, 500, { error: 'server' }); }
    });
  };
}
// GraphQL contract state (hex) from an indexer endpoint function post(bodyString) -> parsed JSON.
export const stateQuery = (post) => async (c) => (await post(JSON.stringify({ query: 'query($a:HexEncoded!){contractAction(address:$a){state}}', variables: { a: c } })))?.data?.contractAction?.state ?? null;

function main() {
  const ROOT = path.resolve(process.argv[2]); const PORT = Number(process.argv[3] ?? 5190);
  // Indexer proxy: the Blockfrost project id is read server-side (env, else blockfrost.key) and never sent to the browser.
  let KEY = process.env.BLOCKFROST_PROJECT_ID?.trim();
  if (!KEY) try { KEY = fs.readFileSync(path.join(HERE, 'blockfrost.key'), 'utf8').trim(); } catch { /* missing */ }
  if (!KEY) { console.error('BLOCKFROST_PROJECT_ID missing (set env or create blockfrost.key next to serve.mjs)'); process.exit(1); }
  const bf = (body) => new Promise((ok, ko) => { const r = https.request({ host: UP, path: '/api/v0', method: 'POST', headers: { 'content-type': 'application/json', project_id: KEY } }, (x) => { let d = ''; x.on('data', (c) => d += c); x.on('end', () => { try { ok(JSON.parse(d)); } catch (e) { ko(e); } }); }); r.on('error', ko); r.end(body); });
  const meta = createMetaHandler({ queryState: stateQuery(bf) });
  function proxyHttp(req, res) {
    const chunks = []; let n = 0;
    req.on('data', c => { n += c.length; if (n > 1e6) req.destroy(); else chunks.push(c); });
    req.on('end', () => {
      const up = https.request({ host: UP, path: '/api/v0', method: 'POST', headers: { 'content-type': 'application/json', project_id: KEY } }, r => {
        res.writeHead(r.statusCode ?? 502, { 'content-type': r.headers['content-type'] ?? 'application/json', 'cross-origin-resource-policy': 'same-origin' }); r.pipe(res);
      });
      up.on('error', () => { res.writeHead(502).end(); }); up.end(Buffer.concat(chunks));
    });
  }
  const server = http.createServer((req, res) => {
    const u0 = new URL(req.url, 'http://x').pathname;
    if (u0 === '/indexer' && req.method === 'POST') return proxyHttp(req, res);
    if (u0 === '/meta' || u0 === '/catalog') return meta(req, res);
    const u = decodeURIComponent(u0);
    if (req.method !== 'GET' && req.method !== 'HEAD' || u.startsWith('/devwallet') || u.startsWith('/zk')) { res.writeHead(404).end(); return; }
    let f = path.resolve(ROOT, '.' + u);
    if (!f.startsWith(ROOT + path.sep) && f !== ROOT) { res.writeHead(403).end(); return; }
    if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { if (u.startsWith('/managed/') || u.startsWith('/assets/')) { res.writeHead(404).end(); return; } f = path.join(ROOT, 'index.html'); }
    res.writeHead(200, { 'content-type': T[path.extname(f)] ?? 'application/octet-stream', 'cross-origin-opener-policy':'same-origin', 'cross-origin-embedder-policy':'require-corp', 'cross-origin-resource-policy':'same-origin', 'cache-control': f.endsWith('index.html') ? 'no-cache' : 'public, max-age=3600' });
    fs.createReadStream(f).pipe(res);
  });
  server.on('upgrade', (req, sock, head) => {
    if (new URL(req.url, 'http://x').pathname !== '/indexer/ws') return sock.destroy();
    const up = tls.connect(443, UP, { servername: UP }, () => {
      const h = [`GET /api/v0/ws HTTP/1.1`, `Host: ${UP}`, 'Upgrade: websocket', 'Connection: Upgrade', `project_id: ${KEY}`];
      for (const k of ['sec-websocket-key', 'sec-websocket-version', 'sec-websocket-protocol', 'sec-websocket-extensions']) if (req.headers[k]) h.push(`${k}: ${req.headers[k]}`);
      up.write(h.join('\r\n') + '\r\n\r\n'); if (head?.length) up.write(head);
      up.pipe(sock); sock.pipe(up);
    });
    const end = () => { up.destroy(); sock.destroy(); }; up.on('error', end); sock.on('error', end); up.on('close', end); sock.on('close', end);
  });
  server.listen(PORT, '127.0.0.1', () => console.log('serving', ROOT, PORT));
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) main();
