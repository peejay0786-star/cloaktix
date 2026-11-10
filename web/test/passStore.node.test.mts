import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import { decodePassQr, encodePassQr } from '../src/passCodec.ts';
import {
  isSavedPass,
  lastContract,
  loadSavedPasses,
  passesForNetwork,
  rememberContract,
  upsertSavedPass,
  type SavedPass,
} from '../src/passStore.ts';
import { isAccessRedirectLocation, isCacheableShellResponse, isStaticShellPath, shouldCacheUrl } from '../src/swPolicy.ts';

function memStorage(initial: Record<string, string> = {}): Storage {
  const map = new Map<string, string>(Object.entries(initial));
  return {
    get length() { return map.size; },
    clear() { map.clear(); },
    getItem(k: string) { return map.has(k) ? map.get(k)! : null; },
    key(i: number) { return [...map.keys()][i] ?? null; },
    removeItem(k: string) { map.delete(k); },
    setItem(k: string, v: string) { map.set(k, String(v)); },
  } as Storage;
}

const sample: SavedPass = {
  v: 1,
  networkId: 'preview',
  contract: '9d619577dab1e2f219eca5634af4578265e54f15cc3c41347e0bb3dc5259bb26',
  typeId: '1',
  passId: 'a'.repeat(64),
  txId: '00' + 'b'.repeat(62),
  at: '2026-11-05T12:00:00.000Z',
  ticketName: 'GA',
  eventName: 'Neon',
};

describe('passCodec', () => {
  it('round-trips QR without SDK', () => {
    const q = encodePassQr(sample.contract, sample.passId, sample.txId);
    assert.equal(q.startsWith('cloaktix:pass:v1?'), true);
    assert.deepEqual(decodePassQr(q), { contract: sample.contract, passId: sample.passId, txId: sample.txId });
  });
  it('rejects malformed payloads', () => {
    assert.equal(decodePassQr('https://example.com'), null);
    assert.equal(decodePassQr('cloaktix:pass:v1?c=x&p=nope&tx=1'), null);
  });
});

describe('passStore offline prepared pass', () => {
  it('loads empty / absent storage', () => {
    assert.deepEqual(loadSavedPasses(memStorage()), []);
  });
  it('ignores malformed JSON and bad entries', () => {
    assert.deepEqual(loadSavedPasses(memStorage({ 'cloaktix:saved-passes:v1': '{not-json' })), []);
    const s = memStorage();
    s.setItem('cloaktix:saved-passes:v1', JSON.stringify([{ bad: true }, sample, { v: 1, networkId: 'preview' }]));
    const loaded = loadSavedPasses(s);
    assert.equal(loaded.length, 1);
    assert.equal(loaded[0]?.passId, sample.passId);
  });
  it('upserts and filters by network/contract', () => {
    const s = memStorage();
    upsertSavedPass(sample, s);
    upsertSavedPass({ ...sample, ticketName: 'GA2' }, s);
    assert.equal(loadSavedPasses(s).length, 1);
    assert.equal(loadSavedPasses(s)[0]?.ticketName, 'GA2');
    assert.equal(passesForNetwork('preview', sample.contract, s).length, 1);
    assert.equal(passesForNetwork('preview', 'other', s).length, 0);
    assert.equal(passesForNetwork('preprod', null, s).length, 0);
  });
  it('guards SavedPass shape', () => {
    assert.equal(isSavedPass(sample), true);
    assert.equal(isSavedPass(null), false);
    assert.equal(isSavedPass({ ...sample, passId: 'zz' }), false);
  });
  it('remembers last contract without hardcoding demo', () => {
    const s = memStorage();
    assert.equal(lastContract('preview', 1, s), null);
    rememberContract('preview', sample.contract, 1, s);
    assert.equal(lastContract('preview', 1, s), sample.contract);
    assert.equal(lastContract('preview', 2, s), null);
    rememberContract('preview', 'aabb' + 'cc'.repeat(30), 2, s);
    assert.equal(lastContract('preview', 2, s)?.startsWith('aabb'), true);
    assert.equal(lastContract('preview', 1, s), sample.contract);
  });
});

describe('swPolicy cache exclusions', () => {
  it('allows shell static paths', () => {
    assert.equal(isStaticShellPath('/icons/icon-256.png'), true);
    assert.equal(isStaticShellPath('/icons/icon-512.png'), true);
    assert.equal(isStaticShellPath('/'), false);
    assert.equal(isStaticShellPath('/index.html'), false);
    assert.equal(isStaticShellPath('/assets/index.js'), true);
    assert.equal(isStaticShellPath('/managed/cloaktix/keys/x'), false);
  });
  it('excludes Access, API, ZK, indexer, pass URLs', () => {
    assert.equal(shouldCacheUrl('https://app.cloaktix.com/'), true);
    assert.equal(shouldCacheUrl('https://app.cloaktix.com/managed/cloaktix/keys/a'), false);
    assert.equal(shouldCacheUrl('https://app.cloaktix.com/indexer'), false);
    assert.equal(shouldCacheUrl('https://app.cloaktix.com/passport/issuer'), false);
    assert.equal(shouldCacheUrl('https://app.cloaktix.com/meta?c=1'), false);
    assert.equal(shouldCacheUrl('https://floral-base.cloudflareaccess.com/cdn-cgi/access/login'), false);
    assert.equal(shouldCacheUrl('cloaktix:pass:v1?c=1&p=2&tx=3'), false);
    assert.equal(isAccessRedirectLocation('https://floral-base-d78f.cloudflareaccess.com/cdn-cgi/access/login/app.cloaktix.com'), true);
    assert.equal(isAccessRedirectLocation('/tickets'), false);
  });
  it('rejects HTML and Access redirects from shell cache', () => {
    assert.equal(isCacheableShellResponse({ status: 200, contentType: 'text/html; charset=utf-8' }), false);
    assert.equal(isCacheableShellResponse({ status: 200, contentType: 'image/png' }), true);
    assert.equal(isCacheableShellResponse({ status: 200, redirected: true, contentType: 'image/png' }), false);
    assert.equal(isCacheableShellResponse({ status: 302, contentType: 'text/html', locationHeader: 'https://x.cloudflareaccess.com/cdn-cgi/access/login' }), false);
    assert.equal(isCacheableShellResponse({ status: 200, type: 'opaqueredirect', contentType: 'text/html' }), false);
    assert.equal(isCacheableShellResponse({ status: 200, contentType: null }), false);
  });
});

describe('no eager wallet SDK', () => {
  it('pass modules do not import midnight load/cloaktix', () => {
    const root = new URL('../src/', import.meta.url);
    const codec = fs.readFileSync(new URL('passCodec.ts', root), 'utf8');
    const store = fs.readFileSync(new URL('passStore.ts', root), 'utf8');
    assert.equal(/midnight\/(load|cloaktix)/.test(codec), false);
    assert.equal(/midnight\/(load|cloaktix)/.test(store), false);
  });
  it('main does not call loadSdk at module top level', () => {
    const main = fs.readFileSync(new URL('../src/main.tsx', import.meta.url), 'utf8');
    assert.equal(/loadSdk\(/.test(main), false);
    assert.match(main, /registerCloakServiceWorker/);
  });
});

describe('network-dependent actions stay gated', () => {
  it('SavedPassesOffline source requires connect for chain actions (static check)', () => {
    const app = fs.readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
    assert.match(app, /SavedPassesOffline/);
    assert.match(app, /Connect wallet for chain actions/);
    assert.match(app, /This screen did not open your wallet/);
    assert.match(app, /encodePassQr\(/);
    // Offline QR path must not call sdkOrThrow for display
    const offlineFn = app.slice(app.indexOf('function OfflineFullQr'));
    assert.equal(/sdkOrThrow/.test(offlineFn.slice(0, offlineFn.indexOf('function ') > 0 ? 800 : 800) || offlineFn.slice(0, 1200)), false);
  });
});

void pathToFileURL; // keep import used for tooling

describe('v2 phone modules stay walletless', () => {
  it('admit phone path does not import midnight Session', () => {
    for (const f of ['../src/v2/AdmitPhoneView.tsx', '../src/v2/admitCodec.ts', '../src/v2/admitStore.ts']) {
      const src = fs.readFileSync(new URL(f, import.meta.url), 'utf8');
      assert.equal(/from ['"]\.\.\/midnight\//.test(src), false, f);
      assert.equal(/loadSdk|sdkOrThrow|Session/.test(src), false, f);
    }
  });
});
