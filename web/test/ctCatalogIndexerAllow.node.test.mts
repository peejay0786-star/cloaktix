import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, sign } from 'node:crypto';
import { allowedIndexerUrl, INDEXER_ALLOW } from '../../preview-worker/indexer-allow.js';
import { handleCatalogRoute } from '../../preview-worker/catalog-route.js';
import { listingSaveError } from '../src/catalog/listingErrors.ts';
import { metaMessage } from '../../public-serve/serve.mjs';

const details = {
  name: 'CloakTix Launch Night',
  date: '2026-12-12',
  venue: 'Montreal, QC',
  cover: '/art/neon-nights.webp',
  demoArt: 'true',
  description: 'A private launch night for CloakTix in Montreal. Buy with NIGHT on Midnight, then enter with a single-use pass.',
};

describe('CT-CATALOG-META-503 wallet indexer allowlist', () => {
  it('allows the official Preview indexer and the 1AM Preview indexer, and rejects anything else', () => {
    assert.equal(allowedIndexerUrl('https://indexer.preview.midnight.network/api/v4/graphql'), true);
    assert.equal(allowedIndexerUrl('https://api-preview.1am.xyz/api/v4/graphql'), true);
    assert.equal(allowedIndexerUrl('wss://api-preview.1am.xyz/api/v4/graphql'), true);
    assert.equal(allowedIndexerUrl('https://api-preview.1am.xyz/api/v4/graphql?token=not-a-secret'), true);
    assert.equal(INDEXER_ALLOW.has('api-preview.1am.xyz'), true);
    assert.equal(allowedIndexerUrl('http://indexer.preview.midnight.network/api/v4/graphql'), false);
    assert.equal(allowedIndexerUrl('https://evil.example/api/v4/graphql'), false);
    assert.equal(allowedIndexerUrl('not a url'), false);
    assert.equal(allowedIndexerUrl(''), false);
  });

  it('POST /meta with the 1AM indexer host reaches state verification; an unknown host is refused before queryState', async () => {
    const { publicKey, privateKey } = generateKeyPairSync('ed25519');
    const pk = publicKey.export({ format: 'der', type: 'spki' }).subarray(-32).toString('hex');
    const contract = 'ab'.repeat(32);
    const ts = Date.now();
    const body = {
      c: contract, kind: 'ev', id: '3', v: details, pk, ts,
      sig: sign(null, Buffer.from(metaMessage(contract, 'ev', '3', ts, details)), privateKey).toString('hex'),
    };
    const env = { PUBLIC_CATALOG: { getByName: () => ({ publish: async () => ({ status: 201, body: { ok: true } }) }) } };

    let queried: string | undefined;
    const allowed = await handleCatalogRoute(
      new Request('https://app.example.test/meta', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-cloaktix-indexer': 'https://api-preview.1am.xyz/api/v4/graphql' },
        body: JSON.stringify(body),
      }),
      env,
      { queryState: async (_c: string, upstream: string) => { queried = upstream; return 'test-state'; } },
    );
    assert.equal(allowed.status, 201);
    assert.equal(queried, 'https://api-preview.1am.xyz/api/v4/graphql');

    let called = false;
    const blocked = await handleCatalogRoute(
      new Request('https://app.example.test/meta', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-cloaktix-indexer': 'https://evil.example/api/v4/graphql' },
        body: JSON.stringify({ ...body, ts: ts + 1, sig: sign(null, Buffer.from(metaMessage(contract, 'ev', '3', ts + 1, details)), privateKey).toString('hex') }),
      }),
      env,
      { queryState: async () => { called = true; return 'test-state'; } },
    );
    assert.equal(blocked.status, 503);
    assert.deepEqual(await blocked.json(), { error: 'The wallet indexer is not allowlisted for catalog verification.' });
    assert.equal(called, false);
    assert.match(listingSaveError({ ok: false, status: 503, error: 'The wallet indexer is not allowlisted for catalog verification.' }), /cannot use this wallet indexer yet/);
    assert.doesNotMatch(listingSaveError({ ok: false, status: 503, error: 'The wallet indexer is not allowlisted for catalog verification.' }), /create the event or ticket types again and add|—|–/);
  });
});
