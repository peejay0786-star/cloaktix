import {it} from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdtempSync,readFileSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {pathToFileURL} from 'node:url';
import {walletAdapters} from '../src/midnight/walletAdapter.ts';
import {connectionWait} from '../src/midnight/connectionWait.ts';
import {savedTicketItems} from '../src/v2/ticketLibraryModel.ts';
it('fresh wallet adapter works with frozen read-only methods and preserves receiver',async()=>{
 let calls=0;
 const extension=Object.freeze({connect(network:string){assert.equal(this,extension);assert.equal(network,'preview');calls++;return Promise.resolve('connected');}});
 const wallets=walletAdapters({'1am':extension});assert.equal(wallets[0].name,'1AM');assert.notEqual(wallets[0],extension);
 assert.equal(await wallets[0].connect('preview'),'connected');assert.equal(calls,1);
});
it('fresh discovery can see an extension injected after the first lookup',()=>{
 const injected:Record<string,unknown>={};assert.equal(walletAdapters(injected).length,0);
 injected['1am']=Object.freeze({connect:()=>Promise.resolve(null)});assert.equal(walletAdapters(injected).length,1);
 assert.equal(walletAdapters({bad:{connect:1}}).length,0);
});
it('long-wait diagnostic schedules 15 seconds and cleanup never retries a connection',()=>{
 let callback=()=>{};let cancelled=false;let notifications=0;
 const cleanup=connectionWait(()=>notifications++,(cb,ms)=>{assert.equal(ms,15_000);callback=cb;return ()=>{cancelled=true;};});
 assert.equal(notifications,0);callback();assert.equal(notifications,1);cleanup();assert.equal(cancelled,true);
});
it('real list/detail render has list only first, exactly three prepared detail actions, offline display without wallet',async()=>{
 const require=createRequire(new URL('../package.json',import.meta.url));const {buildSync}=require('esbuild');
 const dir=mkdtempSync(`${tmpdir()}/cloaktix-library-`);
 const entry=`import React from ${JSON.stringify(require.resolve('react'))};import {renderToStaticMarkup} from ${JSON.stringify(require.resolve('react-dom/server'))};import {TicketLibrary,TicketDetail} from ${JSON.stringify(new URL('../src/v2/TicketLibrary.tsx',import.meta.url).pathname)};export function list(items){return renderToStaticMarkup(React.createElement(TicketLibrary,{items}));}export function detail(ticket){return renderToStaticMarkup(React.createElement(TicketDetail,{ticket,status:'',onPrint(){},onShow(){},onSend(){}}));}`;
 buildSync({stdin:{contents:entry,resolveDir:new URL('../',import.meta.url).pathname,loader:'tsx'},bundle:true,platform:'node',format:'cjs',jsx:'automatic',outfile:dir+'/render.cjs'});
 const render=require(dir+'/render.cjs');
 const cap={v:2 as const,networkId:'preview',contract:'ab'.repeat(32),serial:'1',epoch:'1',nonceHex:'cd'.repeat(32),eventName:'Example event',ticketName:'General admission'};
 const items=savedTicketItems([cap]);assert.equal(items[0].cap,cap);
 const list=render.list(items);assert.ok(list.includes('Example event'));assert.ok(list.includes('Ticket #1'));assert.ok(!list.includes('<svg'));assert.ok(!list.includes('Print ticket'));
 const detail=render.detail({...items[0],date:'2026-12-05'});assert.equal((detail.match(/<button/g)||[]).length,3);
 for(const label of ['Print ticket','Show QR','Send to phone'])assert.ok(detail.includes(label));assert.ok(!detail.includes('Connect wallet'));assert.ok(!detail.includes('<svg'));
 // Reviewable synthetic DOM artifacts (no real capabilities embedded in this initial list/detail markup).
 const styles=readFileSync(new URL('../src/styles.css',import.meta.url),'utf8');
 const page=(body:string)=>'<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>'+styles+'</style></head><body><div class="app"><main>'+body+'</main></div></body></html>';
 writeFileSync('/workspace/ct-fix6-list-mock.html',page(list));
 writeFileSync('/workspace/ct-fix6-detail-mock.html',page(detail));
});
it('picker opening rescans and connecting status is outside connected-only main',()=>{
 const source=readFileSync(new URL('../src/App.tsx',import.meta.url),'utf8');assert.match(source,/setWallets\(discoverWallets\(\)\); setPicker\(true\)/);
 assert.ok(source.indexOf('{connecting &&')<source.search(/\{s && <main(?: id="main")?>/));assert.match(source,/connectionWait\(/);
});
