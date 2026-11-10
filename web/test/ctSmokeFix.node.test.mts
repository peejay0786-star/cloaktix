import {it} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildAdaFeePlan} from '../../preview-worker/adaFeePlan.mjs';
import {buildAdaFeePlan as liveBuild} from '../../preview-worker/rate-signer-unreleased/adaFeePlan.mjs';
import {verifyAdaPaymentForAttest} from '../../preview-worker/rate-signer-unreleased/adaVerifyKoios.mjs';
import {humanizeTxError} from '../src/txError.ts';

const A='addr_test1qsameaddressfortest000000000000000000000';
const B='addr_test1qotherorganizer0000000000000000000000000';
const env={PLATFORM_ADA_FEE_ADDRESS:A};

it('ADA fee plan: same organizer/platform address → one combined 100% output',()=>{
  for(const f of [buildAdaFeePlan,liveBuild]){
    const p:any=f({totalLovelace:1_000_000n,organizerAddress:A,env});
    assert.equal(p.ok,true);assert.equal(p.sameAddress,true);
    assert.deepEqual(p.outputs,[{role:'combined',address:A,lovelace:'1000000'}]);
  }
});
it('ADA fee plan: different addresses keep the 97/3 split',()=>{
  const p:any=buildAdaFeePlan({totalLovelace:1_000_000n,organizerAddress:B,env});
  assert.deepEqual(p.outputs.map((o:any)=>[o.role,o.lovelace]),[['organizer','970000'],['platform','30000']]);
});

function fetcher(outputs:Array<{address:string;value:string}>){
  return async(url:string)=>({ok:true,json:async()=>/tip/.test(url)?[{block_height:110}]:[{block_height:100,outputs:outputs.map(o=>({payment_addr:{bech32:o.address},value:o.value}))}]}) as any;
}
async function attest(org:string,outs:any[]){
  return verifyAdaPaymentForAttest({txHash:'a'.repeat(64),expectedLovelace:1_000_000n,organizerAddress:org,platformFeeAddress:A,minConfirmations:2,fetcher:fetcher(outs)} as any);
}
it('ADA attest: same address needs the full total, no double counting',async()=>{
  const ok:any=await attest(A,[{address:A,value:'1000000'}]);
  assert.equal(ok.ok,true);assert.equal(ok.lovelacePaid,1_000_000n);
  const under:any=await attest(A,[{address:A,value:'970000'}]);
  assert.equal(under.ok,false);
});
it('ADA attest: different addresses still enforce the split',async()=>{
  assert.equal(((await attest(B,[{address:B,value:'970000'},{address:A,value:'30000'}])) as any).ok,true);
  assert.equal(((await attest(B,[{address:B,value:'1000000'}])) as any).ok,false);
});
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
