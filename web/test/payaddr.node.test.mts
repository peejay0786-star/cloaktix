import {it} from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdtempSync,readFileSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {
  validateNightPayout, publicEventMeta,
} from '../src/payoutAddresses.ts';
import {saveOrganizerPayouts, loadOrganizerPayouts, eventIdFromCircuitResult} from '../src/organizerPayoutStore.ts';
import {canPay, executeSelectedPayment} from '../src/paymentMethod.ts';

it('NIGHT field rejects Cardano addr1 with a specific Midnight-only message',()=>{
  const preview=validateNightPayout('addr_test1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq','preview');
  assert.equal(preview.kind,'invalid');
  if(preview.kind==='invalid') assert.match(preview.message,/This is a Cardano address\. Enter your Midnight \(mn_addr…\) address\./);
  const main=validateNightPayout('addr1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq','mainnet');
  assert.equal(main.kind,'invalid');
  if(main.kind==='invalid') assert.match(main.message,/Cardano address/);
});
it('Preview requires mn_addr_preview1 and rejects shielded/dust/mainnet prefixes',()=>{
  assert.equal(validateNightPayout('mn_addr_preview1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq', 'preview').kind,'valid');
  assert.equal(validateNightPayout('mn_addr1abc', 'preview').kind,'invalid');
  assert.equal(validateNightPayout('mn_shield-addr_preview1abc', 'preview').kind,'invalid');
  assert.equal(validateNightPayout('mn_dust_preview1abc', 'preview').kind,'invalid');
});
it('publicEventMeta strips payout fields before buyer/publish surfaces',()=>{
  const pub=publicEventMeta({name:'E',date:'2026-12-05',venue:'X',nightPayout:'secret',adaPayout:'secret2',cover:'c'});
  assert.deepEqual(pub,{name:'E',date:'2026-12-05',venue:'X',cover:'c'});
  assert.equal('nightPayout' in pub,false);
});
it('organizer payout store is private to local key and round-trips',()=>{
  const store=new Map<string,string>();
  Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:(k:string)=>store.get(k)??null,setItem:(k:string,v:string)=>store.set(k,v)}});
  saveOrganizerPayouts('preview','ab'.repeat(32),'1',{nightPayout:'mn_addr_preview1abc'});
  const loaded=loadOrganizerPayouts('preview','ab'.repeat(32),'1');
  assert.equal(loaded?.nightPayout,'mn_addr_preview1abc');
  assert.equal(loadOrganizerPayouts('preview','ab'.repeat(32),'2'),null);
  assert.ok([...store.keys()][0].includes('org-payout'));
});

it('circuit result ids and payout lookup survive wrappers and network-key drift',()=>{
  assert.equal(eventIdFromCircuitResult(4n),'4');
  assert.equal(eventIdFromCircuitResult({value:4n}),'4');
  assert.equal(eventIdFromCircuitResult({result:'4'}),'4');
  const store=new Map<string,string>();
  Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{
    getItem:(k:string)=>store.get(k)??null,
    setItem:(k:string,v:string)=>{store.set(k,v);},
    get length(){return store.size;},
    key:(i:number)=>[...store.keys()][i]??null,
  }});
  const contract='ab'.repeat(32);
  saveOrganizerPayouts('preview',contract,'4',{nightPayout:'mn_addr_preview1abc'});
  assert.equal(loadOrganizerPayouts('preview',contract,'4')?.nightPayout,'mn_addr_preview1abc');
  assert.equal(loadOrganizerPayouts('othernet',contract,'4')?.nightPayout,'mn_addr_preview1abc');
  // Legacy records that also carried adaPayout still load (NIGHT only is read).
  store.set('cloaktix:org-payout:v1:preview:'+contract+':5',JSON.stringify({nightPayout:'mn_addr_preview1old',adaPayout:'addr_test1old',at:''}));
  assert.deepEqual(loadOrganizerPayouts('preview',contract,'5'),{nightPayout:'mn_addr_preview1old',at:''});
});
it('only NIGHT is payable; any other method is refused without calling the NIGHT handler',async()=>{
  assert.equal(canPay('ADA' as any),false); assert.equal(canPay('NIGHT'),true);
  let calls=0; await assert.rejects(executeSelectedPayment('ADA' as any,async()=>{calls++;}),/Only NIGHT/); assert.equal(calls,0);
});

const require=createRequire(new URL('../package.json',import.meta.url));
const {buildSync}=require('esbuild');
const dir=mkdtempSync(`${tmpdir()}/ct-payaddr-`);
const src=new URL('../src/',import.meta.url).pathname;
buildSync({stdin:{contents:`import React from ${JSON.stringify(require.resolve('react'))};import {renderToStaticMarkup} from ${JSON.stringify(require.resolve('react-dom/server'))};import {EventCreateForm} from ${JSON.stringify(src+'EventCreateForm.tsx')};import {CheckoutPanel} from ${JSON.stringify(src+'Checkout.tsx')};import {RatesContext} from ${JSON.stringify(src+'useRates.tsx')};import {Price} from ${JSON.stringify(src+'Price.tsx')};const rates={kind:'ready',rates:{nightUsd:0.04,adaUsd:0.2,asOf:Date.now()}};const wrap=(el)=>renderToStaticMarkup(React.createElement(RatesContext.Provider,{value:rates},el));export const create=()=>wrap(React.createElement(EventCreateForm,{network:'preview',initial:{name:'Summit',date:'2026-12-05',venue:'Montréal'},onSubmit(){}}));export const price=()=>wrap(React.createElement(Price,{amount:200000000n}));export const priceV3=()=>wrap(React.createElement(Price,{usdCents:'2500'}));export const nightCheckout=()=>wrap(React.createElement(CheckoutPanel,{amount:200000000n,method:'NIGHT',onMethod(){},onPay(){}}));`,resolveDir:new URL('../',import.meta.url).pathname,loader:'tsx'},bundle:true,platform:'node',format:'cjs',jsx:'automatic',define:{'import.meta.env.VITE_NETWORK':'"preview"'},outfile:dir+'/render.cjs'});
const render=require(dir+'/render.cjs');
it('create form asks only for the NIGHT payout and shows no platform fee address',()=>{
  const html=render.create();
  assert.match(html,/NIGHT payout address \(Midnight network\)/); assert.match(html,/NIGHT on Cardano/); assert.match(html,/mn_addr/);
  assert.doesNotMatch(html,/ADA payout|Cardano network\)|addr_test1|future ADA/);
  assert.match(html,/never shown to buyers/);
  assert.doesNotMatch(html,/PLATFORM_ADA_FEE|fee address|3%/i);
});
it('NIGHT checkout states Midnight-only payment and rejects Cardano NIGHT wording',()=>{
  const html=render.nightCheckout();
  assert.match(html,/NIGHT on Midnight/);
  assert.match(html,/Pay from your Midnight wallet/);
  assert.match(html,/NIGHT on Cardano isn(?:'|&#x27;|&apos;)t accepted/);
  assert.match(html,/Pay with NIGHT on Midnight/);
  assert.doesNotMatch(html,/cNIGHT/);
  assert.doesNotMatch(html,/ADA on Cardano|Pay with ADA|Koios|CIP-30|confirmations/);
});
it('writes reviewable mocks from real components',()=>{
  const css=readFileSync(new URL('../src/styles.css',import.meta.url),'utf8');
  const page=(title:string,body:string)=>`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><style>${css}</style></head><body><div class="app"><p class="small muted">LOCAL MOCK · CT-PAYADDR · no real addresses</p><main>${body}</main></div></body></html>`;
  writeFileSync('/workspace/ct-payaddr-create.html',page('Create event payouts',render.create()));
  writeFileSync('/workspace/ct-payaddr-checkout-night.html',page('NIGHT checkout Midnight-only',render.nightCheckout()));
});
it('platform ADA fee config stays outside the web bundle graph',()=>{
  const app=readFileSync(new URL('../src/App.tsx',import.meta.url),'utf8');
  const checkout=readFileSync(new URL('../src/Checkout.tsx',import.meta.url),'utf8');
  assert.doesNotMatch(app,/platformFees|PLATFORM_ADA_FEE/);
  assert.doesNotMatch(checkout,/platformFees|PLATFORM_ADA_FEE/);
  assert.equal(require('node:fs').existsSync(new URL('../../preview-worker/platform-fees.example.env',import.meta.url)),true);
});

it('CT-NIGHT-ONLY: price line shows USD + NIGHT equivalent and no ADA equivalent',()=>{
  for(const html of [render.price(),render.priceV3()]){
    assert.match(html,/USD/); assert.match(html,/NIGHT/); assert.doesNotMatch(html,/ADA/);
  }
  assert.match(render.priceV3(),/\$25\.00 USD/);
});
it('CT-NIGHT-ONLY: NIGHT pay path stays wired; no ADA client code shipped in src',()=>{
  const app=readFileSync(new URL('../src/App.tsx',import.meta.url),'utf8');
  const checkout=readFileSync(new URL('../src/Checkout.tsx',import.meta.url),'utf8');
  assert.match(app,/buyNightV3\(/); assert.match(checkout,/Pay with NIGHT on Midnight/); assert.match(checkout,/executeSelectedPayment\(method, legacyNightPurchase\)/);
  assert.doesNotMatch(app+checkout,/Pay with ADA|ADA on Cardano|buyAdaV3|adaMint|organizerAda|fetchAdaFeeStatus|payAdaOnPreview/);
  assert.equal(require('node:fs').existsSync(new URL('../src/ada',import.meta.url)),false);
});
