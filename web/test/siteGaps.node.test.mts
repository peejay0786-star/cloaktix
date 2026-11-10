import {it} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {createServer} from 'node:http';
import {generateKeyPairSync,sign} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
import {createSqlCatalog} from '../../preview-worker/catalog-store.js';
import {createMetaHandler,metaMessage} from '../../public-serve/serve.mjs';
import {parseEventDetails,eventDetailsError,parsePublishedCatalog} from '../src/catalog/model.ts';
import {checkInstallAssets} from '../src/installCheck.ts';
import {cameraErrorMessage} from '../src/cameraSupport.ts';
import {handleCatalogRoute} from '../../preview-worker/catalog-route.js';
const details={name:'Midnight Summit · Preview',date:'2026-12-05',venue:'Preview venue',cover:'/art/quantum-club.webp',demoArt:'true',description:'Sample organizer description for a test event only.'};
it('event metadata requires name, valid date, venue, description and an explicit cover choice',()=>{
 assert.ok(parseEventDetails(details));
 for(const field of ['name','date','venue','cover','description'])assert.equal(parseEventDetails({...details,[field]:''}),null);
 for(const name of ['Event #1','—','  '])assert.equal(parseEventDetails({...details,name}),null);
 assert.equal(parseEventDetails({...details,date:'2026-02-30'}),null);
 assert.equal(parseEventDetails({...details,demoArt:'false'}),null);
 assert.equal(parseEventDetails({...details,cover:'javascript:alert(1)'}),null);
 assert.match(eventDetailsError({...details,venue:''})??'',/venue/);
});
it('signed organizer writes persist sanitized public listings without a wallet reader',async()=>{
 const dir=mkdtempSync(tmpdir()+'/ct-catalog-');const file=dir+'/published.json';
 const {publicKey,privateKey}=generateKeyPairSync('ed25519');const pk=publicKey.export({format:'der',type:'spki'}).subarray(-32).toString('hex');
 const contract='ab'.repeat(32);const queryState=async()=> 'synthetic-indexed-state';
 const decodeState=()=>({events:new Map([['1',{organizer:'test-owner',payout:'not-a-key'}],['9',{organizer:'test-owner',payout:pk}]]),types:new Map([['3',{eventId:'1'}]])});
 let handler=createMetaHandler({file,queryState,decodeState});const server=createServer((req,res)=>handler(req,res));
 await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));const address=server.address();assert.ok(address&&typeof address==='object');const base=`http://127.0.0.1:${address.port}`;
 let ts=Date.now();
 const signed=(kind:string,id:string,v:object)=>{const now=++ts;return {c:contract,kind,id,v,ts:now,pk,sig:sign(null,Buffer.from(metaMessage(contract,kind,id,now,v)),privateKey).toString('hex')};};
 const post=(body:object)=>fetch(base+'/meta',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
 try{
  const eventWrite=signed('ev','1',{...details,nightPayout:'must-never-be-public'});assert.equal((await post(eventWrite)).status,201);
  assert.equal((await post(eventWrite)).status,409,'replay rejected');
  const bad=signed('ev','1',details);bad.sig='00'.repeat(64);assert.equal((await post(bad)).status,403);
  assert.equal((await post(signed('ev','1',{name:'Incomplete'}))).status,400);
  assert.equal((await post(signed('tt','3',{name:'General admission · Preview',usdCents:'2500',resaleSummary:'No resale'}))).status,201);
  handler=createMetaHandler({file,queryState,decodeState});
  const response=await fetch(base+`/catalog?c=${contract}`);assert.equal(response.status,200);
  const raw=await response.text();assert.doesNotMatch(raw,/must-never-be-public|nightPayout|not-a-key|test-owner/);
  const catalog=parsePublishedCatalog(JSON.parse(raw));assert.ok(catalog);assert.equal(catalog.events.length,1);assert.equal(catalog.events[0].tickets[0].usdCents,'2500');
  assert.equal((await fetch(base+`/catalog?c=${contract}`,{method:'POST'})).status,405);
  const wrongOwner=()=>({events:new Map([['1',{organizer:'other-owner',payout:'not-a-key'}],['9',{organizer:'test-owner',payout:pk}]]),types:new Map()});
  handler=createMetaHandler({file,queryState,decodeState:wrongOwner});assert.equal((await post(signed('ev','1',details))).status,403);
 }finally{server.closeAllConnections();await new Promise<void>(resolve=>server.close(()=>resolve()));rmSync(dir,{recursive:true,force:true});}
});
it('Worker catalog route is read-only and reads through its contract-scoped durable binding',async()=>{
 const request=new Request('https://app.example.test/catalog?c='+'ab'.repeat(32));
 assert.equal((await handleCatalogRoute(request,{})).status,503);
 assert.equal((await handleCatalogRoute(new Request(request.url,{method:'POST'}),{})).status,405);
 let routed='';const response=await handleCatalogRoute(request,{PUBLIC_CATALOG:{getByName:(c:string)=>{routed=c;return {catalog:async()=>({source:'organizer-published',contract:c,events:[]})};}}});
 assert.equal(response.status,200);assert.equal(routed,'ab'.repeat(32));assert.equal(response.headers.get('cache-control'),'no-store');
 assert.ok(parsePublishedCatalog(await response.json()));
});
it('durable catalog persists verified organizer listings, rejects replay and never exposes organizer keys',async()=>{
 const dir=mkdtempSync(tmpdir()+'/ct-durable-catalog-');const file=dir+'/catalog.sqlite';let db=new DatabaseSync(file);
 const sql={exec:(query:string,...bindings:(string|number)[])=>{if(query.includes('CREATE TABLE')){db.exec(query);return {toArray:()=>[],one:()=>({})};}const statement=db.prepare(query);if(query.startsWith('SELECT')){const rows=statement.all(...bindings);return {toArray:()=>rows,one:()=>{assert.equal(rows.length,1);return rows[0];}};}statement.run(...bindings);return {toArray:()=>[],one:()=>({})};}};
 const {publicKey,privateKey}=generateKeyPairSync('ed25519');const pk=publicKey.export({format:'der',type:'spki'}).subarray(-32).toString('hex');const contract='ab'.repeat(32);let ts=Date.now();
 const signed=(kind:string,id:string,v:object)=>{const now=++ts;return {c:contract,kind,id,v,ts:now,pk,sig:sign(null,Buffer.from(metaMessage(contract,kind,id,now,v)),privateKey).toString('hex')};};
 let owner='test-owner';const decode=()=>({events:new Map([['1',{organizer:owner,payout:'not-public'}],['9',{organizer:'test-owner',payout:pk}]]),types:new Map([['3',{eventId:'1'}]])});
 let store=createSqlCatalog(sql,decode);
 try{
  const write=signed('ev','1',{...details,nightPayout:'never-expose'});
  assert.equal((await store.publish(write,'test-state')).status,201);
  assert.equal((await store.publish(write,'test-state')).status,409);
  const bad=signed('ev','1',details);bad.sig='00'.repeat(64);assert.equal((await store.publish(bad,'test-state')).status,403);
  owner='another-owner';assert.equal((await store.publish(signed('ev','1',details),'test-state')).status,403);owner='test-owner';
  assert.equal((await store.publish(signed('tt','3',{name:'General admission · Preview',usdCents:'2500',resaleSummary:'No resale'}),'test-state')).status,201);
  db.close();db=new DatabaseSync(file);store=createSqlCatalog(sql,decode);
  const catalog=store.catalog(contract);assert.ok(parsePublishedCatalog(catalog));assert.equal(catalog.events.length,1);assert.equal(catalog.events[0].tickets[0].usdCents,'2500');assert.doesNotMatch(JSON.stringify(catalog),/never-expose|not-public|test-owner/);
  const metadata=store.metadata();assert.deepEqual(metadata.keys,['9']);
  const next=signed('ev','1',{...details,description:'Updated organizer description for a preview-only event.'});
  const response=await handleCatalogRoute(new Request('https://app.example.test/meta',{method:'POST',headers:{'content-type':'application/json','x-cloaktix-indexer':'https://indexer.preview.midnight.network/api/v4/graphql'},body:JSON.stringify(next)}),{PUBLIC_CATALOG:{getByName:()=>store}},{queryState:async()=> 'test-state'});
  assert.equal(response.status,201);assert.match(store.catalog(contract).events[0].description,/Updated/);
 }finally{db.close();rmSync(dir,{recursive:true,force:true});}
});
it('install diagnostics send credentials, reject auth HTML and never follow sign-in redirects',async()=>{
 const calls:RequestInit[]=[];
 const fetcher=async(_input:unknown,options?:RequestInit)=>{calls.push(options??{});return calls.length===1?Response.json({icons:[{src:'/icons/icon-256.png'}]},{headers:{'content-type':'application/manifest+json'}}):new Response('',{headers:{'content-type':'image/png'}});};
 const result=await checkInstallAssets(fetcher);assert.ok(result.ok);assert.equal(calls.length,2);assert.ok(calls.every(c=>c.credentials==='include'&&c.redirect==='error'));
 const bad=await checkInstallAssets(async()=>new Response('<html>Sign in</html>',{headers:{'content-type':'text/html'}}));assert.equal(bad.ok,false);
});
it('camera permission errors explain recovery and the paste-code fallback',()=>{
 assert.match(cameraErrorMessage({name:'NotAllowedError'}),/Allow camera access/);
 assert.match(cameraErrorMessage({name:'NotFoundError'}),/Paste the ticket code/);
 assert.match(cameraErrorMessage({name:'NotReadableError'}),/Close other camera apps/);
 const source=readFileSync(new URL('../src/Scanner.tsx',import.meta.url),'utf8');assert.match(source,/if\(stopped\|\|!video.current\)\{release\(\);return;\}/);
});
