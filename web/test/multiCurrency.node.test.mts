import {it} from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdtempSync,readFileSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {createRateClient,parseRates,parseKraken,combineSamples,quoteUsd,RATE_URL,KRAKEN_URL} from '../src/rates.ts';
import {recordPurchase,loadPurchase} from '../src/purchaseReceipts.ts';
const now=Date.now();
const raw={ 'midnight-3':{usd:0.05,last_updated_at:Math.floor(now/1000)},cardano:{usd:0.5,last_updated_at:Math.floor(now/1000)} };
const rates=parseRates(raw,now)!;
it('public price parser validates mapped coin IDs, finite prices, completeness and provider freshness',()=>{
 assert.equal(rates.nightUsd,0.05);assert.equal(parseRates({},now),null);
 assert.equal(parseRates({...raw,cardano:{usd:0,last_updated_at:now/1000}},now),null);
 assert.equal(parseRates(raw,now+700_000),null);
 assert.equal(parseRates({...raw,cardano:{usd:Infinity,last_updated_at:now/1000}},now),null);
});
it('Kraken ticker parser and sample combine keep sanity bounds',()=>{
 const k=parseKraken({result:{NIGHTUSD:{c:['0.04']},ADAUSD:{c:['0.55']}}},now)!;assert.equal(k.nightUsd,0.04);assert.equal(k.adaUsd,0.55);
 assert.equal(parseKraken({error:['EQuery:Unknown']},now),null);
 assert.equal(parseKraken({result:{NIGHTUSD:{c:['99']},ADAUSD:{c:['0.5']}}},now),null);
 const combined=combineSamples([rates,k])!;assert.ok(combined.nightUsd>0);assert.ok(combined.adaUsd>0);
});
it('when CoinGecko fails, Kraken alone can still produce a ready rate',async()=>{
 const client=createRateClient({now:()=>now,fetcher:async(url)=>{
  if(String(url)===RATE_URL) return new Response('',{status:502});
  assert.equal(String(url),KRAKEN_URL);
  return new Response(JSON.stringify({result:{NIGHTUSD:{c:['0.05']},ADAUSD:{c:['0.5']}}}));
 }});
 assert.equal((await client.load()).kind,'ready');
});
it('USD seller price converts to exact atomic settlement units and rejects invalid input',()=>{
 assert.deepEqual(quoteUsd('10.00',{kind:'ready',rates}),{kind:'ready',cents:1000n,atoms:200_000_000n});
 for(const value of ['-1','NaN','1.001',''])assert.equal(quoteUsd(value,{kind:'ready',rates}).kind,'unavailable');
 assert.equal(quoteUsd('10',{kind:'unavailable'}).kind,'unavailable');
});
it('USD quote rounds settlement upward by at most one atomic unit, never changes fiat into a fake USD transaction',()=>{
 const quote=quoteUsd('0.01',{kind:'ready',rates:{...rates,nightUsd:0.03}});assert.deepEqual(quote,{kind:'ready',cents:1n,atoms:333334n});
 assert.equal(quoteUsd('99999999999999999999999',{kind:'ready',rates}).kind,'unavailable');
});
it('public rate requests omit credentials/referrer and deduplicate concurrent callers',async()=>{
 let calls=0;const seen=new Set<string>();
 let unlock!:()=>void;const gate=new Promise<void>(resolve=>{unlock=resolve;});
 const client=createRateClient({now:()=>now,fetcher:async(url,options)=>{
  calls++;seen.add(String(url));assert.equal(options?.credentials,'omit');assert.equal(options?.referrerPolicy,'no-referrer');
  await gate;
  if(String(url).includes('kraken')) return new Response(JSON.stringify({result:{NIGHTUSD:{c:['0.05']},ADAUSD:{c:['0.5']}}}));
  return new Response(JSON.stringify(raw));
 }});
 const a=client.load(),b=client.load();
 for(let i=0;i<20 && calls<2;i++)await new Promise(r=>setTimeout(r,0));
 assert.equal(calls,2);unlock();assert.equal((await a).kind,'ready');assert.deepEqual(await b,await a);await client.load();assert.equal(calls,2);assert.ok(seen.has(RATE_URL));assert.ok([...seen].some(u=>u.includes('kraken')));
});
it('fresh public cache is reusable without a network request',async()=>{
 let calls=0;const client=createRateClient({now:()=>now,storage:{getItem:()=>JSON.stringify(raw),setItem(){}},fetcher:async()=>{calls++;throw new Error('must not fetch');}});
 assert.equal((await client.load()).kind,'ready');assert.equal(calls,0);
});
it('rate failures degrade to unavailable with cooldown and no cache/identity deletion',async()=>{
 let calls=0,time=now;const client=createRateClient({now:()=>time,storage:{getItem:()=>'{bad',setItem(){throw new Error('storage disabled');}},fetcher:async()=>{calls++;return new Response('',{status:429});}});
 assert.equal((await client.load()).kind,'unavailable');await client.load();assert.equal(calls,2); // CoinGecko + Kraken once each
 time+=61_000;await client.load();assert.equal(calls,4);
});
it('old server rates are not presented as a current conversion',async()=>{
 const client=createRateClient({now:()=>now+700_000,fetcher:async()=>new Response(JSON.stringify(raw))});assert.equal((await client.load()).kind,'unavailable');
});
it('confirmed purchase receipt preserves its own amount rather than current ticket type price',()=>{
 const store=new Map<string,string>();Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:(key:string)=>store.get(key)??null,setItem:(key:string,value:string)=>store.set(key,value)}});
 recordPurchase('preview','ab'.repeat(32),'1',200_000_000n,{kind:'ready',rates});const receipt=loadPurchase('preview','ab'.repeat(32),'1');assert.equal(receipt?.atoms,'200000000');assert.equal(receipt?.usdCents,'1000');
 assert.equal(loadPurchase('preview','ab'.repeat(32),'2'),undefined);
});
it('missing rates or denied receipt storage never turn a confirmed purchase into a failed payment',()=>{
 Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem(){throw new Error('denied');},setItem(){throw new Error('denied');}}});
 assert.doesNotThrow(()=>recordPurchase('preview','ab','1',10n,{kind:'unavailable'}));assert.equal(loadPurchase('preview','ab','1'),undefined);
});
const require=createRequire(new URL('../package.json',import.meta.url));const {buildSync}=require('esbuild');const dir=mkdtempSync(`${tmpdir()}/ct-multi-`);const src=new URL('../src/',import.meta.url).pathname;
buildSync({stdin:{contents:`import React from ${JSON.stringify(require.resolve('react'))};import {renderToStaticMarkup} from ${JSON.stringify(require.resolve('react-dom/server'))};import {CheckoutPanel,executeSelectedPayment} from ${JSON.stringify(src+'Checkout.tsx')};import {EventCard} from ${JSON.stringify(src+'App.tsx')};import {RatesContext} from ${JSON.stringify(src+'useRates.tsx')};import {Price} from ${JSON.stringify(src+'Price.tsx')};const render=(Component,props,state)=>renderToStaticMarkup(React.createElement(RatesContext.Provider,{value:state},React.createElement(Component,props)));export const checkout=(method,state)=>render(CheckoutPanel,{amount:200000000n,method,onMethod(){},onPay(){}},state);export const price=(state)=>render(Price,{amount:200000000n},state);export const event=(s,st,state)=>render(EventCard,{s,st,e:st.events[0],run:async()=>{},bump(){}},state);export {executeSelectedPayment};`,resolveDir:new URL('../',import.meta.url).pathname,loader:'tsx'},bundle:true,platform:'node',format:'cjs',jsx:'automatic',define:{'import.meta.env.VITE_NETWORK':'"preview"'},outfile:dir+'/render.cjs'});
Object.defineProperty(globalThis,'location',{configurable:true,value:{search:'?network=preview',hash:'',pathname:'/',origin:'https://example.test',hostname:'example.test'}});
Object.defineProperty(globalThis,'sessionStorage',{configurable:true,value:{getItem:()=>null,setItem(){}}});
Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:(key:string)=>key.includes(':ev:')?JSON.stringify({name:'Midnight Summit — Montréal',date:'2026-12-05',venue:'Montréal'}):key.includes(':tt:')?JSON.stringify({name:'General admission'}):null,setItem(){}}});
const render=require(dir+'/render.cjs');const ready={kind:'ready',rates};
it('checkout is NIGHT only: no ADA, no USD payment',()=>{
 const html=render.checkout('NIGHT',ready);assert.equal((html.match(/type="radio"/g)||[]).length,0);assert.match(html,/Pay from your Midnight wallet/);assert.doesNotMatch(html,/ADA on Cardano|Pay with ADA|ADA/);assert.match(html,/200.00 NIGHT/);assert.match(html,/Pay with NIGHT/);assert.match(html,/Kraken/);assert.doesNotMatch(html,/Pay with ETH|Pay with USD|ETH/);
});
it('a non-NIGHT method is refused and never calls the NIGHT callback',async()=>{
 let calls=0;await assert.rejects(render.executeSelectedPayment('ADA',async()=>{calls++;}),/Only NIGHT/);assert.equal(calls,0);
});
it('NIGHT executes the existing callback exactly once without dependence on market rates',async()=>{
 let calls=0;await render.executeSelectedPayment('NIGHT',async()=>{calls++;});assert.equal(calls,1);const html=render.checkout('NIGHT',{kind:'unavailable'});assert.match(html,/USD rate unavailable/);assert.match(html,/200.00 NIGHT/);assert.doesNotMatch(html,/disabled=""/);
});
it('USD/NIGHT price display (no ADA equivalent) does not relabel the raw settlement amount as USD',()=>{
 const html=render.price(ready);assert.match(html,/\$10.00 USD/);assert.match(html,/200.00 NIGHT/);assert.doesNotMatch(html,/ADA/);assert.doesNotMatch(html,/\$200.00|ETH/);
});
it('real-render event and checkout mocks are generated using explicitly synthetic reference rates',()=>{
 const s={schema:2,contract:'ab'.repeat(32),networkId:'preview'};const st={schemaVersion:2,events:[{id:1n,mine:false,open:true,isKey:false}],types:[{id:1n,eventId:1n,price:200_000_000n,fee:6_000_000n,supply:100n,sold:1n,resale:0,maxResale:240_000_000n,adultOnly:false}],listings:[],held:{},checkIns:new Map()};
 const css=readFileSync(src+'styles.css','utf8');const art='data:image/webp;base64,'+readFileSync(new URL('../public/art/quantum-club.webp',import.meta.url)).toString('base64');
 const page=(body:string)=>'<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>CloakTix · multi-currency local preview</title><style>'+css+'</style></head><body><div class="app"><p class="small muted">LOCAL MOCK · synthetic rates, not a live quote · no payment submitted</p><main>'+body.replace(/src="\/art\/[^\"]+"/g,'src="'+art+'"')+'</main></div></body></html>';
 writeFileSync('/workspace/ct-multi-event.html',page(render.event(s,st,ready)));writeFileSync('/workspace/ct-multi-checkout.html',page(render.checkout('NIGHT',ready)));writeFileSync('/workspace/ct-multi-checkout-ada.html',page(render.checkout('ADA',ready)));
});
