import {it} from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdtempSync,readFileSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {parseKraken,combineSamples,parseRates,inBounds} from '../src/rates.ts';
import {validateNightPayout} from '../src/payoutAddresses.ts';
import {canPay} from '../src/paymentMethod.ts';

const now=Date.now();
const gecko={ 'midnight-3':{usd:0.05,last_updated_at:Math.floor(now/1000)},cardano:{usd:0.5,last_updated_at:Math.floor(now/1000)} };

it('audit: empty checkout alert is not rendered until an error exists',()=>{
  const src=readFileSync(new URL('../src/Checkout.tsx',import.meta.url),'utf8');
  assert.ok(src.includes('{error ? <p role="alert" className="warn">{error}</p> : null}'));
  assert.ok(!src.includes('<p role="alert" className="warn">{error}</p>\n    <p className="small muted">USD'));
});
it('audit: ticket list cards expose accessible names and are real buttons',()=>{
  const src=readFileSync(new URL('../src/v2/TicketLibrary.tsx',import.meta.url),'utf8');
  assert.match(src,/aria-label=\{`\$\{item\.eventName\}/);
  assert.match(src,/type="button"/);
  assert.match(src,/role="list"/);
});

it('audit: Cardano address in NIGHT payout field is rejected explicitly',()=>{
  const r=validateNightPayout('addr_test1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq','preview');
  assert.equal(r.kind,'invalid');
  if(r.kind==='invalid') assert.match(r.message,/This is a Cardano address/);
});

it('audit: NIGHT is the only payable method',()=>{
  assert.equal(canPay('NIGHT'),true);assert.equal(canPay('ADA' as any),false);
});

it('audit: rate sources stay in public bounds and combine',()=>{
  const g=parseRates(gecko,now)!;const k=parseKraken({result:{NIGHTUSD:{c:['0.06']},ADAUSD:{c:['0.4']}}},now)!;
  assert.ok(inBounds('nightUsd',g.nightUsd));assert.ok(inBounds('adaUsd',k.adaUsd));
  assert.ok(combineSamples([g,k]));
});

const require=createRequire(new URL('../package.json',import.meta.url));
const {buildSync}=require('esbuild');
const dir=mkdtempSync(`${tmpdir()}/ct-audit-`);
const src=new URL('../src/',import.meta.url).pathname;
buildSync({stdin:{contents:`import React from ${JSON.stringify(require.resolve('react'))};import {renderToStaticMarkup} from ${JSON.stringify(require.resolve('react-dom/server'))};import {HomeScreen,EventCard} from ${JSON.stringify(src+'App.tsx')};import {CheckoutPanel} from ${JSON.stringify(src+'Checkout.tsx')};import {EventCreateForm} from ${JSON.stringify(src+'EventCreateForm.tsx')};import {TicketLibrary,TicketDetail} from ${JSON.stringify(src+'v2/TicketLibrary.tsx')};import {RatesContext} from ${JSON.stringify(src+'useRates.tsx')};const rates={kind:'ready',rates:{nightUsd:0.05,adaUsd:0.5,asOf:Date.now()}};const wrap=(c)=>renderToStaticMarkup(React.createElement(RatesContext.Provider,{value:rates},c));export const home=()=>wrap(React.createElement(HomeScreen,{onConnect(){},onTickets(){},savedCount:0}));export const checkout=()=>wrap(React.createElement(CheckoutPanel,{amount:200000000n,method:'NIGHT',onMethod(){},onPay(){}}));export const create=()=>wrap(React.createElement(EventCreateForm,{network:'preview',onSubmit(){}}));export const list=(items)=>wrap(React.createElement(TicketLibrary,{items}));export const detail=(ticket)=>wrap(React.createElement(TicketDetail,{ticket,status:'',onPrint(){},onShow(){},onSend(){}}));export const event=(s,st)=>wrap(React.createElement(EventCard,{s,st,e:st.events[0],run:async()=>{},bump(){}}));`,resolveDir:new URL('../',import.meta.url).pathname,loader:'tsx'},bundle:true,platform:'node',format:'cjs',jsx:'automatic',define:{'import.meta.env.VITE_NETWORK':'"preview"'},outfile:dir+'/render.cjs'});
Object.defineProperty(globalThis,'location',{configurable:true,value:{search:'?network=preview',hash:'',pathname:'/',origin:'https://example.test',hostname:'example.test'}});
Object.defineProperty(globalThis,'sessionStorage',{configurable:true,value:{getItem:()=>null,setItem(){}}});
Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:(key:string)=>key.includes(':ev:')?JSON.stringify({name:'Midnight Summit — Montréal',date:'2026-12-05',venue:'Montréal'}):key.includes(':tt:')?JSON.stringify({name:'General admission'}):null,setItem(){}}});
Object.defineProperty(globalThis,'window',{configurable:true,value:{innerWidth:390,innerHeight:844}});
const render=require(dir+'/render.cjs');
const item={key:'1',serial:'1',eventName:'Midnight Summit — Montréal',ticketName:'General admission',date:'2026-12-05',venue:'Montréal',cap:{v:2,networkId:'preview',contract:'ab'.repeat(32),serial:'1',epoch:'1',nonceHex:'cd'.repeat(32)},offline:true};

it('audit: home labels NIGHT on Midnight; checkout cites both rate sources',()=>{
  assert.match(render.home(),/NIGHT on Midnight/);
  const html=render.checkout();
  assert.match(html,/NIGHT on Midnight/);assert.match(html,/CoinGecko/);assert.match(html,/Kraken/);
  assert.doesNotMatch(html,/role="alert"/);assert.doesNotMatch(html,/ADA on Cardano|Pay with ADA/);assert.match(html,/Pay with NIGHT on Midnight/);
});

it('audit: create form keeps NIGHT payout only and no platform fee address',()=>{
  const html=render.create();
  assert.match(html,/NIGHT payout address \(Midnight network\)/);
  assert.doesNotMatch(html,/ADA payout|addr_test1|ADA on Cardano/);
  assert.doesNotMatch(html,/PLATFORM_ADA|fee address/i);
});

it('audit: writes before/after review mocks',()=>{
  const css=readFileSync(new URL('../src/styles.css',import.meta.url),'utf8');
  const art=(()=>{try{return 'data:image/webp;base64,'+readFileSync(new URL('../public/art/neon-nights.webp',import.meta.url)).toString('base64');}catch{return '/art/neon-nights.webp';}})();
  const page=(title:string,body:string)=>'<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+title+'</title><style>'+css+'</style></head><body><div class="app"><p class="small muted">LOCAL MOCK · CT-FULL-AUDIT · synthetic</p><main>'+body.replace(/src="\/art\/[^\"]+"/g,'src="'+art+'"')+'</main></div></body></html>';
  const s={schema:2,contract:'ab'.repeat(32),networkId:'preview'};
  const st={schemaVersion:2,events:[{id:1n,mine:false,open:true,isKey:false}],types:[{id:1n,eventId:1n,price:200_000_000n,fee:6_000_000n,supply:100n,sold:1n,resale:0,maxResale:240_000_000n,adultOnly:false}],listings:[],held:{},checkIns:new Map()};
  writeFileSync('/workspace/ct-audit-home.html',page('Audit home',render.home()));
  writeFileSync('/workspace/ct-audit-event.html',page('Audit event',render.event(s,st)));
  writeFileSync('/workspace/ct-audit-checkout.html',page('Audit checkout',render.checkout()));
  writeFileSync('/workspace/ct-audit-create.html',page('Audit create',render.create()));
  writeFileSync('/workspace/ct-audit-tickets.html',page('Audit tickets',render.list([item])));
  writeFileSync('/workspace/ct-audit-ticket-detail.html',page('Audit ticket detail',render.detail(item)));
});
