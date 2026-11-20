import {it} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {humanizeTxError} from '../src/txError.ts';

it('FailFallible becomes a clear message without raw JSON',()=>{
  const raw='{ "circuitId": "buyTicket", "tx": { "__wbg_ptr": 4746688 }, "status": "FailFallible", "txId": "00a9" }';
  const m=humanizeTxError(raw);
  assert.match(m,/contract rejected the purchase/);assert.match(m,/No ticket was minted/);
  assert.doesNotMatch(m,/wbg_ptr|txId|\{/);
  assert.equal(humanizeTxError("x failed assert: Sold out"),'Refused by the contract: Sold out');
  assert.doesNotMatch(humanizeTxError('{"tx":{"__wbg_ptr":1}}'),/wbg/);
});
it('Dialog portals to body; modal is above activity/boot-error and opaque',()=>{
  const d=readFileSync(new URL('../src/Dialog.tsx',import.meta.url),'utf8');
  assert.match(d,/createPortal\(node, document\.body\)/);
  const css=readFileSync(new URL('../src/styles.css',import.meta.url),'utf8');
  const z=Number(css.match(/\.modal \{[^}]*z-index: (\d+)/)![1]);
  assert.ok(z>80&&z>45);
  assert.match(css,/\.modal \.card \{[^}]*background: var\(--bg2\)/);
});

it('organizer shows v3 deploy even when a contract is already connected',()=>{
  const src=readFileSync(new URL('../src/App.tsx',import.meta.url),'utf8');
  assert.match(src,/\(!s\.contract \|\| s\.schema === 3\)/);
  assert.match(src,/Deploy schema v3/);
});

it('CT-NIGHT-ONLY: app worker has no /koios proxy and ships no CSL chunks',()=>{
  const w=readFileSync(new URL('../../preview-worker/worker.js',import.meta.url),'utf8');
  assert.doesNotMatch(w,/koios/i);
  const chunks=readFileSync(new URL('../../preview-worker/zk-chunks.js',import.meta.url),'utf8');
  assert.doesNotMatch(chunks,/cardano_serialization_lib/);
  assert.match(chunks,/cloaktix-rate-v3\/keys\/buyTicket\.prover/);
  const sync=readFileSync(new URL('../../preview-worker/sync-zk-assets.mjs',import.meta.url),'utf8');
  assert.doesNotMatch(sync,/cardano_serialization_lib/);
});
