export { PublicCatalog } from './catalog-object.js';

import { handleCatalogRoute } from './catalog-route.js';
import { INDEXER_ALLOW } from './indexer-allow.js';
import { ZK_CHUNKS } from './zk-chunks.js';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.wasm': 'application/wasm',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.ttf': 'font/ttf',
  '.woff2': 'font/woff2',
  '.prover': 'application/octet-stream',
  '.verifier': 'application/octet-stream',
  '.zkir': 'application/octet-stream',
  '.bzkir': 'application/octet-stream',
};

function extOf(pathname) {
  const i = pathname.lastIndexOf('.');
  return i >= 0 ? pathname.slice(i).toLowerCase() : '';
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    let path = url.pathname;
    // Versioned ZK artifact URLs (/zkv/<version>/managed/...): a new version = new URL, so no browser
    // can reuse an older cached response (e.g. the SPA index.html once served for a missing key).
    const zkv = path.match(/^\/zkv\/[0-9a-f]+(\/managed\/.*)$/);
    if (zkv) { path = zkv[1]; url.pathname = path; request = new Request(url, request); }
    if (path === '/passport' || path.startsWith('/passport/')) {
      const iso = { 'Cross-Origin-Opener-Policy': 'same-origin', 'Cross-Origin-Embedder-Policy': 'require-corp', 'Cross-Origin-Resource-Policy': 'same-origin', 'X-Content-Type-Options': 'nosniff' };
      const { handlePassport } = await import('./passport.js'); // lazy: the runtime WASM is only instantiated for /passport/*
      return handlePassport(request, path.slice('/passport'.length) || '/', iso);
    }
    if (path === '/catalog' || path === '/meta') return handleCatalogRoute(request, env, {queryState: async (contract, upstream) => {
      const proxyUrl=new URL('/indexer',url);proxyUrl.searchParams.set('u',upstream);
      const read=new Request(proxyUrl,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({query:'query($a:HexEncoded!){contractAction(address:$a){state}}',variables:{a:contract}})});
      const response=await proxyIndexer(read,env,proxyUrl,false);
      if(!response.ok)throw new Error('Indexer verification unavailable');
      const data=await response.json();if(data.errors)throw new Error('Indexed state unavailable');
      return data?.data?.contractAction?.state??null;
    }});
    // Same-origin indexer proxy. The app sends the wallet's own indexer URI as ?u=, so the wallet stays the source of truth
    // for the upstream; only allowlisted hosts are forwarded (not an open proxy).
    if (path === '/indexer' || path === '/indexer/ws') return proxyIndexer(request, env, url, path === '/indexer/ws');
    // Static assets only answer GET/HEAD (ASSETS returns a bare 405 otherwise). This preview has no
    // same-origin indexer/proof proxy: the app must use the wallet's own service URIs. Explain instead of 405.
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      const msg = path.startsWith('/indexer')
        ? 'This preview has no same-origin indexer proxy; the app must use the indexer URI from the wallet configuration.'
        : `Method ${request.method} not allowed on ${path} (static preview).`;
      return new Response(JSON.stringify({ errors: [{ message: msg }] }), { status: 405, headers: { 'content-type': 'application/json', 'allow': 'GET, HEAD', 'cache-control': 'no-store', 'Cross-Origin-Resource-Policy': 'same-origin', 'X-Content-Type-Options': 'nosniff' } });
    }
    // Large ZK artifacts (>5 MiB, e.g. *Adult.prover) are stored as <path>.part-NN; stream-concatenate them.
    const chunked = ZK_CHUNKS[path];
    if (chunked && (request.method === 'GET' || request.method === 'HEAD')) return serveChunked(request, env, url, path, chunked);
    const res = await env.ASSETS.fetch(request);
    // Never relabel an SPA fallback (index.html) as a non-HTML asset: return a real 404 instead.
    const ext0 = extOf(path);
    if (ext0 && ext0 !== '.html' && MIME[ext0] && (res.headers.get('content-type') || '').includes('text/html')) {
      return new Response(`Not found: ${path}`, { status: 404, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', 'Cross-Origin-Resource-Policy': 'same-origin', 'Cross-Origin-Embedder-Policy': 'require-corp', 'Cross-Origin-Opener-Policy': 'same-origin', 'X-Content-Type-Options': 'nosniff' } });
    }
    // Never answer a missing ZK artifact with the SPA's index.html (the SDK would parse HTML as a key).
    if (path.startsWith('/managed/') && (!res.ok || (res.headers.get('content-type') || '').includes('text/html'))) {
      return new Response(`ZK artifact not found: ${path}`, { status: 404, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cross-Origin-Resource-Policy': 'same-origin', 'Cross-Origin-Embedder-Policy': 'require-corp', 'Cross-Origin-Opener-Policy': 'same-origin', 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-store' } });
    }
    const headers = new Headers(res.headers);
    headers.set('Cross-Origin-Opener-Policy', 'same-origin');
    headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
    headers.set('Cross-Origin-Resource-Policy', 'same-origin');
    headers.set('X-Content-Type-Options', 'nosniff');

    const mime = MIME[extOf(path)] || (path === '/' ? 'text/html; charset=utf-8' : path.startsWith('/managed/zk-params/') ? 'application/octet-stream' : null);
    if (mime) headers.set('Content-Type', mime);

    const isHtml = mime?.startsWith('text/html') || path === '/' || path.endsWith('.html');
    if (isHtml || path.startsWith('/managed/')) {
      headers.set('Cache-Control', 'no-store');
    } else {
      headers.set('Cache-Control', 'public, max-age=300');
    }

    // Any .wasm: sniff the first bytes. If the stored asset is gzip (1f 8b) —
    // needed because temporary accounts cap assets at 5 MiB — stream-decompress it
    // so the browser receives raw WASM (00 61 73 6d) as application/wasm.
    if (extOf(path) === '.wasm' && res.ok && res.body) {
      headers.delete('Content-Encoding');
      headers.delete('Content-Length');
      headers.delete('ETag');
      headers.set('Content-Type', 'application/wasm');
      const reader = res.body.getReader();
      let head = new Uint8Array(0);
      const pending = [];
      while (head.length < 4) {
        const { done, value } = await reader.read();
        if (done) break;
        pending.push(value);
        const merged = new Uint8Array(head.length + value.length);
        merged.set(head); merged.set(value, head.length); head = merged;
      }
      const isGzip = head[0] === 0x1f && head[1] === 0x8b;
      const isWasm = head[0] === 0x00 && head[1] === 0x61 && head[2] === 0x73 && head[3] === 0x6d;
      if (!isGzip && !isWasm) {
        reader.cancel();
        // e.g. SPA fallback returned index.html for a missing .wasm: never mislabel HTML as WASM.
        headers.set('Content-Type', 'text/plain; charset=utf-8');
        return new Response(`WASM not found or invalid: ${path}`, { status: 404, headers });
      }
      const replay = new ReadableStream({
        start(c) { for (const chunk of pending) c.enqueue(chunk); },
        async pull(c) { const { done, value } = await reader.read(); if (done) c.close(); else c.enqueue(value); },
        cancel(r) { return reader.cancel(r); },
      });
      const body = isGzip ? replay.pipeThrough(new DecompressionStream('gzip')) : replay;
      if (request.method === 'HEAD') return new Response(null, { status: res.status, headers });
      return new Response(body, { status: res.status, statusText: res.statusText, headers });
    }

    return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
  },
};

async function serveChunked(request, env, url, path, info) {
  const headers = new Headers({
    'Content-Type': MIME[extOf(path)] || 'application/octet-stream',
    'Content-Length': String(info.size),
    'Cache-Control': 'no-store',
    'ETag': `"sha256-${info.sha256}"`,
    'Cross-Origin-Opener-Policy': 'same-origin', 'Cross-Origin-Embedder-Policy': 'require-corp',
    'Cross-Origin-Resource-Policy': 'same-origin', 'X-Content-Type-Options': 'nosniff',
  });
  if (request.method === 'HEAD') return new Response(null, { status: 200, headers });
  // Fetch the first part eagerly so a missing part is a 500, not a truncated 200.
  const first = await env.ASSETS.fetch(new Request(new URL(info.parts[0], url)));
  if (!first.ok || (first.headers.get('content-type') || '').includes('text/html')) return new Response(`chunk missing: ${info.parts[0]}`, { status: 500 });
  const { readable, writable } = new FixedLengthStream(info.size);
  (async () => {
    try {
      for (let i = 0; i < info.parts.length; i++) {
        const r = i === 0 ? first : await env.ASSETS.fetch(new Request(new URL(info.parts[i], url)));
        if (!r.ok || !r.body) throw new Error(`chunk missing: ${info.parts[i]}`);
        await r.body.pipeTo(writable, { preventClose: true });
      }
      await writable.close();
    } catch (e) { await writable.abort(e); }
  })();
  return new Response(readable, { status: 200, headers });
}


// ---- indexer proxy -------------------------------------------------------------------------------------------
// indexer.preprod.midnight.network was decommissioned on 2026-10-09 (410, no CORS headers => "Failed to fetch" in
// browsers). Preprod's live indexer is Blockfrost and needs a project token. If the Worker secret
// BLOCKFROST_PREPROD_PROJECT_ID is set, the retired host is mapped to Blockfrost with the token added server-side;
// otherwise the request goes to the wallet's URI and a 410 is turned into a readable GraphQL error.
const RETIRED_PREPROD = 'indexer.preprod.midnight.network';
const gqlError = (message, code, status = 200) => new Response(JSON.stringify({ errors: [{ message, extensions: { code } }] }),
  { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store', 'Cross-Origin-Resource-Policy': 'same-origin', 'X-Content-Type-Options': 'nosniff' } });

async function proxyIndexer(request, env, url, isWs) {
  let u;
  try { u = new URL(url.searchParams.get('u') || ''); } catch { return gqlError('Indexer proxy: missing or invalid ?u= (wallet indexer URI).', 'PROXY_BAD_UPSTREAM', 400); }
  if (!INDEXER_ALLOW.has(u.hostname) || !/^(https|wss):$/.test(u.protocol)) return gqlError(`Indexer proxy: upstream host ${u.hostname} is not allowlisted.`, 'PROXY_BAD_UPSTREAM', 403);
  const token = env.BLOCKFROST_PREPROD_PROJECT_ID;
  let target = new URL(u);
  if (u.hostname === RETIRED_PREPROD && token) {
    target = new URL(isWs ? 'https://midnight-preprod.blockfrost.io/api/v0/ws' : 'https://midnight-preprod.blockfrost.io/api/v0');
    target.searchParams.set('project_id', token);
  }
  target.protocol = 'https:'; // Workers open upstream WebSockets with an https:// URL + Upgrade header
  if (isWs) {
    if ((request.headers.get('Upgrade') || '').toLowerCase() !== 'websocket') return gqlError('Indexer proxy: /indexer/ws expects a WebSocket upgrade.', 'PROXY_BAD_REQUEST', 426);
    // Explicit relay (WebSocketPair): echo the client's subprotocol (graphql-transport-ws / graphql-ws) and pipe frames.
    const proto = (request.headers.get('Sec-WebSocket-Protocol') || '').split(',')[0].trim();
    const uh = { Upgrade: 'websocket' }; if (proto) uh['Sec-WebSocket-Protocol'] = proto;
    let r;
    try { r = await fetch(target.toString(), { headers: uh }); } catch (e) { r = null; }
    const up = r && r.status === 101 ? r.webSocket : null;
    if (!up) return new Response(`Indexer WebSocket upstream ${u.hostname} refused the upgrade (HTTP ${r ? r.status : 'network error'}).`, { status: 502, headers: { 'content-type': 'text/plain', 'cache-control': 'no-store' } });
    const [client, server] = Object.values(new WebSocketPair());
    up.accept(); server.accept();
    server.addEventListener('message', (ev) => { try { up.send(ev.data); } catch {} });
    up.addEventListener('message', (ev) => { try { server.send(ev.data); } catch {} });
    const closeBoth = (code, reason) => { try { server.close(code || 1000, reason || ''); } catch {} try { up.close(code || 1000, reason || ''); } catch {} };
    server.addEventListener('close', (ev) => closeBoth(ev.code, ev.reason)); up.addEventListener('close', (ev) => closeBoth(ev.code, ev.reason));
    server.addEventListener('error', () => closeBoth(1011, 'client error')); up.addEventListener('error', () => closeBoth(1011, 'upstream error'));
    const rh = proto ? { 'Sec-WebSocket-Protocol': proto } : {};
    return new Response(null, { status: 101, webSocket: client, headers: rh });
  }
  if (request.method === 'OPTIONS') return new Response(null, { status: 204 });
  if (request.method !== 'POST' && request.method !== 'GET') return gqlError(`Indexer proxy: method ${request.method} not supported.`, 'PROXY_BAD_REQUEST', 405);
  let r;
  try {
    r = await fetch(target.toString(), { method: request.method, headers: { 'content-type': request.headers.get('content-type') || 'application/json', accept: 'application/json' }, body: request.method === 'POST' ? await request.arrayBuffer() : undefined });
  } catch (e) { return gqlError(`Indexer proxy: upstream ${u.hostname} unreachable (${e.message}).`, 'PROXY_UPSTREAM_UNREACHABLE', 502); }
  if (r.status === 410 && u.hostname === RETIRED_PREPROD) {
    return gqlError(`Your wallet's indexer (${u.hostname}) was decommissioned on 2026-10-09 (HTTP 410). The Preprod indexer is now Blockfrost (https://midnight-preprod.blockfrost.io/api/v0) and needs a project token: set it in your wallet's network settings, or configure this preview's proxy.`, 'ENDPOINT_DECOMMISSIONED');
  }
  if (r.status === 403 && target.hostname === 'midnight-preprod.blockfrost.io') {
    return gqlError('Indexer proxy: Blockfrost rejected the request (HTTP 403, missing or invalid project token).', 'PROXY_UPSTREAM_AUTH');
  }
  const headers = new Headers({ 'content-type': r.headers.get('content-type') || 'application/json', 'cache-control': 'no-store', 'Cross-Origin-Resource-Policy': 'same-origin', 'X-Content-Type-Options': 'nosniff' });
  return new Response(r.body, { status: r.status, headers });
}


