import {it} from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdtempSync,readFileSync,writeFileSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {parseNight,requireNight} from '../src/midnight/amount.ts';
import {walletAdapters} from '../src/midnight/walletAdapter.ts';
const require=createRequire(new URL('../package.json',import.meta.url));
const {buildSync}=require('esbuild');
const dir=mkdtempSync(`${tmpdir()}/cloaktix-clean-`);
const src=new URL('../src/',import.meta.url).pathname;
buildSync({stdin:{contents:`import React from ${JSON.stringify(require.resolve('react'))};import {renderToStaticMarkup} from ${JSON.stringify(require.resolve('react-dom/server'))};import {HomeScreen,EventCard,App} from ${JSON.stringify(src+'App.tsx')};import {RatesContext} from ${JSON.stringify(src+'useRates.tsx')};import {Price,formatNight} from ${JSON.stringify(src+'Price.tsx')};import {TicketLibrary,TicketDetail} from ${JSON.stringify(src+'v2/TicketLibrary.tsx')};import {AdmitPhoneView} from ${JSON.stringify(src+'v2/AdmitPhoneView.tsx')};import {Dialog} from ${JSON.stringify(src+'Dialog.tsx')};import {AppBoundary} from ${JSON.stringify(src+'AppBoundary.tsx')};const rates={kind:'ready',rates:{nightUsd:1,adaUsd:0.5,asOf:Date.now()}};const render=(component,props)=>renderToStaticMarkup(React.createElement(RatesContext.Provider,{value:rates},React.createElement(component,props)));export const home=()=>render(HomeScreen,{onConnect(){},onTickets(){},savedCount:0});export const event=(s,st)=>render(EventCard,{s,st,e:st.events[0],run:async()=>{},bump(){}});export const list=(items)=>render(TicketLibrary,{items});export const detail=(ticket)=>render(TicketDetail,{ticket,status:'',onPrint(){},onShow(){},onSend(){}});export const price=(amount)=>render(Price,{amount});export const phone=(initial)=>render(AdmitPhoneView,{initial});export const dialog=()=>render(Dialog,{label:'Send ticket to phone',onClose(){},children:'Phone ticket'});export const boundary=()=>{const instance=new AppBoundary({children:'safe'});instance.state=AppBoundary.getDerivedStateFromError();return renderToStaticMarkup(instance.render());};export const app=()=>render(App,{});export {formatNight};`,resolveDir:new URL('../',import.meta.url).pathname,loader:'tsx'},bundle:true,platform:'node',format:'cjs',jsx:'automatic',define:{'import.meta.env.VITE_NETWORK':'"preview"'},outfile:dir+'/render.cjs'});
const store=new Map<string,string>();
Object.defineProperty(globalThis,'location',{configurable:true,value:{search:'?network=preview',hash:'',pathname:'/',origin:'https://example.test',hostname:'example.test'}});
Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:(k:string)=>store.get(k)??null,setItem:(k:string,v:string)=>store.set(k,v)}});
Object.defineProperty(globalThis,'sessionStorage',{configurable:true,value:{getItem:()=>null,setItem(){}}});
const render=require(dir+'/render.cjs');
const contract='ab'.repeat(32);
store.set(`cloaktix:meta:${contract}:ev:1`,JSON.stringify({name:'Midnight Summit — Montréal · A complete event name, never cut off',date:'2026-12-05',venue:'Montréal'}));
store.set(`cloaktix:meta:${contract}:tt:1`,JSON.stringify({name:'General admission'}));
const session={schema:2,contract,networkId:'preview'};
const state={schemaVersion:2,events:[{id:1n,mine:false,open:true,isKey:false}],types:[{id:1n,eventId:1n,price:10_000_000n,fee:300_000n,supply:100n,sold:1n,resale:0,maxResale:12_000_000n,adultOnly:false}],listings:[],held:{'1':1},checkIns:new Map()};
const item={key:'synthetic-ticket-1',serial:'1',eventName:'Midnight Summit — Montréal · A complete event name, never cut off',ticketName:'General admission',date:'2026-12-05',venue:'Montréal',cap:{v:2,networkId:'preview',contract,serial:'1',epoch:'1',nonceHex:'cd'.repeat(32)},offline:true};
it('exact amount parser keeps units beyond Number.MAX_SAFE_INTEGER without rounding',()=>{
 assert.deepEqual(parseNight('9007199254.740993'),{kind:'valid',amount:9007199254740993n});
 assert.equal(requireNight('1,234.000001'),1_234_000_001n);
});
it('invalid and overprecise inputs are data, not render-time exceptions',()=>{
 for(const text of ['','-1','NaN','Infinity','0.0000001','3e5','wat','18446744073709.551616'])assert.equal(parseNight(text).kind,'invalid');
 assert.throws(()=>requireNight('-1'),/NIGHT amount/);
});
it('all formatted atomic-unit amounts roundtrip exactly, including smallest unit and uint64 maximum',()=>{
 for(const value of [0n,1n,10n,10001n,10_000_000n,9007199254740993n,18_446_744_073_709_551_615n])assert.equal(requireNight(render.formatNight(value)),value);
});
it('real price component shows USD with NIGHT reference equivalent only (no ADA)',()=>{
 const html=render.price(10_000_001n);assert.match(html,/\$10\.00 USD/);assert.match(html,/NIGHT/);assert.doesNotMatch(html,/ADA/);assert.doesNotMatch(html,/balance|ETH/);
});
it('one poisoned extension entry never hides a healthy wallet',async()=>{
 const source={get broken(){throw new Error('extension unavailable');},'1am':{connect:()=>Promise.resolve('ok')}};
 const wallets=walletAdapters(source);assert.equal(wallets.length,1);assert.equal(await wallets[0].connect('preview'),'ok');
});
it('malformed connect getter does not prevent other v4 connectors from being discovered',()=>{
 const wallets=walletAdapters({broken:{get connect(){throw new Error('not ready');}},lace:{apiVersion:'4.0',connect:()=>Promise.resolve(null)}});assert.equal(wallets.length,1);assert.equal(wallets[0].name,'lace');
});
it('real home and event rendering use English buyer flow with exact prices and no fee address',()=>{
 const home=render.home();assert.match(home,/Private tickets on/);assert.match(home,/Connect wallet/);
 const event=render.event(session,state);assert.match(event,/Midnight Summit/);assert.match(event,/\$10\.00/);assert.match(event,/<small>≈/);assert.doesNotMatch(event,/fee address|wallet balance/i);
});
it('corrupt optional metadata cannot blank the event page or discard identities',()=>{
 store.set(`cloaktix:meta:${contract}:ev:1`,'not json');assert.match(render.event(session,state),/Event #1/);
 store.set(`cloaktix:meta:${contract}:ev:1`,JSON.stringify({name:item.eventName,date:item.date,venue:item.venue}));
});
it('real list/detail keep text complete, render three primary actions and explain offline validity',()=>{
 assert.match(render.list([item]),/A complete event name, never cut off/);const detail=render.detail(item);assert.equal((detail.match(/<button/g)||[]).length,3);assert.match(detail,/gate checks current validity/);assert.doesNotMatch(detail,/nonceHex|cdcdcd/);
});
it('real empty ticket list offers an understandable local state without wallet requests',()=>{
 const html=render.list([]);assert.match(html,/No tickets on this browser yet/);assert.doesNotMatch(html,/Connecting|Print ticket/);
});
it('real modal is named and modal to accessibility APIs',()=>{
 const html=render.dialog();assert.match(html,/role="dialog"/);assert.match(html,/aria-modal="true"/);assert.match(html,/aria-label="Send ticket to phone"/);
});
it('React failure fallback never asks to clear data and offers recovery without exposing internal errors',()=>{
 const html=render.boundary();assert.match(html,/Do not clear browser data/);assert.match(html,/Refresh page/);assert.doesNotMatch(html,/stack|private|nonce/i);
});
it('retired duplicated v2 identity panels and legacy v1 #import UI are absent',()=>{
 for(const name of ['LinkDevice.tsx','LinkDeviceV2.tsx','deviceIdentity.ts','identityTransfer.ts'])assert.equal(existsSync(src+'v2/'+name),false);
 const app=readFileSync(src+'App.tsx','utf8');assert.doesNotMatch(app,/#import=/);assert.doesNotMatch(app,/function Devices/);assert.doesNotMatch(app,/importTransferCode\(paste\)/);
});
it('renders four reviewable mock pages from real production components, without capabilities',()=>{
 const css=readFileSync(src+'styles.css','utf8');
 const asset=(path:string)=>{try{return 'data:image/'+(path.endsWith('.svg')?'svg+xml':'webp')+';base64,'+readFileSync(new URL('../public'+path,import.meta.url)).toString('base64');}catch{return path;}};
 const page=(body:string)=>'<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>CloakTix · local mock</title><style>'+css+'</style></head><body><div class="app"><p class="small muted">LOCAL MOCK · synthetic data · not a real ticket</p><main>'+body.replace(/src="(\/(?:art|brand)\/[^\"]+)"/g,(_,path)=>'src="'+asset(path)+'"')+'</main></div></body></html>';
 const screens={home:render.home(),event:render.event(session,state),list:render.list([item]),detail:render.detail(item)};
 for(const [name,html] of Object.entries(screens)){assert.doesNotMatch(html,/cdcdcd|nonceHex|cloaktix:admit/);writeFileSync('/workspace/ct-clean-'+name+'.html',page(html));}
});

it('synchronous action gate prevents same-tick duplicate wallet submissions',async()=>{
 const {createActionGate}=await import('../src/midnight/actionGate.ts');const gate=createActionGate();let submitted=0;let release=()=>{};
 const first=gate(async()=>{submitted++;return await new Promise<number>(resolve=>{release=()=>resolve(1);});});
 assert.deepEqual(await gate(async()=>{submitted++;return 2;}),{kind:'busy'});assert.equal(submitted,1);release();assert.deepEqual(await first,{kind:'completed',value:1});
 assert.deepEqual(await gate(async()=>3),{kind:'completed',value:3});
});
it('rejected wallet action releases the latch so retry is explicit and possible',async()=>{
 const {createActionGate}=await import('../src/midnight/actionGate.ts');const gate=createActionGate();
 await assert.rejects(gate(async()=>{throw new Error('rejected');}),/rejected/);assert.deepEqual(await gate(async()=>true),{kind:'completed',value:true});
});

it('real phone screen displays the selected ticket without technical contract clutter',()=>{
 Object.defineProperty(globalThis,'window',{configurable:true,value:{innerWidth:390,innerHeight:844}});
 const html=render.phone({...item.cap,serial:'2',eventName:'Second event'});
 assert.match(html,/Second event/);assert.match(html,/Ticket #2/);assert.doesNotMatch(html,/Epoch|contract ababab/);assert.match(html,/Save ticket/);
});
