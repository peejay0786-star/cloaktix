import { it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { matchingPreparedTicket } from '../src/v2/simpleTicket.ts';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { mkdtempSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const require = createRequire(new URL('../package.json', import.meta.url));
const { buildSync } = require('esbuild');
const output = mkdtempSync(`${tmpdir()}/cloaktix-export-test-`) + '/ticketImage.mjs';
buildSync({ entryPoints: [new URL('../src/v2/ticketImage.ts', import.meta.url).pathname], bundle: true, platform: 'node', format: 'esm', outfile: output });
const { ticketImageModel, createTicketPng } = await import(pathToFileURL(output).href);
import { encodeAdmitQr, parseAdmitFromLocation } from '../src/v2/admitCodec.ts';
import { buildPhoneTransferUrl } from '../src/v2/phoneTransfer.ts';
const cap = { v: 2 as const, networkId: 'preview', contract: 'ab'.repeat(32), serial: '1', epoch: '1', nonceHex: 'cd'.repeat(32), eventName: 'Test event', ticketName: 'General admission' };
it('reuses existing prepared serial without preparing or rotating and rejects stale epochs', () => {
  assert.equal(matchingPreparedTicket([cap], {serial:1n,epoch:1n,hasAdmit:true}), cap);
  assert.equal(matchingPreparedTicket([cap], {serial:1n,epoch:2n,hasAdmit:true}), undefined);
  assert.equal(matchingPreparedTicket([cap], {serial:1n,epoch:1n,hasAdmit:false}), undefined);
});
it('PNG model uses exact entrance payload, not transfer URL, preserves names and domain', () => {
  const model = ticketImageModel(cap);
  assert.equal(model.payload, encodeAdmitQr(cap));
  assert.notEqual(model.payload, buildPhoneTransferUrl({origin:'https://example.test', cap}));
  assert.equal(model.title, 'Test event');assert.equal(model.subtitle, 'General admission');
  assert.equal(model.contract, cap.contract);assert.equal(model.epoch,'1');
  assert.ok(model.qr.getModuleCount()>0);
  assert.deepEqual(parseAdmitFromLocation(new URL(buildPhoneTransferUrl({origin:'https://example.test',cap})).hash),cap);
});
it('real PNG renderer draws QR and metadata then requests PNG blob, without wallet or network', async () => {
  let cells=0;const texts:string[]=[];let requested='';
  const old=globalThis.document;
  Object.defineProperty(globalThis,'document',{configurable:true,value:{createElement:()=>({width:0,height:0,getContext:()=>({fillStyle:'',font:'',fillRect:()=>{cells++;},fillText:(text:string)=>{texts.push(text);}}),toBlob:(callback:(blob:Blob)=>void,type:string)=>{requested=type;callback(new Blob(['synthetic canvas output'],{type}));}})}});
  try { const blob=await createTicketPng(cap);assert.equal(blob.type,'image/png');assert.equal(requested,'image/png');assert.ok(cells>100);assert.ok(texts.includes('Test event'));assert.ok(texts.includes('General admission'));assert.ok(texts.includes(cap.contract)); }
  finally { Object.defineProperty(globalThis,'document',{configurable:true,value:old}); }
});
it('primary integration has no duplicate identity components and uses ticket list/detail', () => {
  const source=fs.readFileSync(new URL('../src/v2/TicketsGateV2.tsx',import.meta.url),'utf8');
  assert.doesNotMatch(source, /<LinkDevice/);assert.doesNotMatch(source,/Rotate phone admit link/);
  assert.match(source, /matchingPreparedTicket\(saved,ticket\)/);assert.match(source, /<TicketLibrary/);
  const transfer=fs.readFileSync(new URL('../src/v2/TransferTicket.tsx',import.meta.url),'utf8');
  assert.doesNotMatch(transfer,/registerAdmit|buyTicket|\.call\(/);
  const phone=fs.readFileSync(new URL('../src/v2/AdmitPhoneView.tsx',import.meta.url),'utf8');
  assert.match(phone,/onClick=\{saveTicket\}/);assert.match(phone,/upsertSavedAdmit/);
});
it('real browser store saves and reopens the capability without regenerating nonce', async () => {
  const storeOutput = output.replace('ticketImage.mjs','admitStore.mjs');
  buildSync({entryPoints:[new URL('../src/v2/admitStore.ts',import.meta.url).pathname],bundle:true,platform:'node',format:'esm',outfile:storeOutput});
  const store = await import(pathToFileURL(storeOutput).href);
  let data=''; const previous=globalThis.localStorage;
  Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:()=>data||null,setItem:(_key:string,value:string)=>{data=value;}}});
  try {
    store.upsertSavedAdmit({...cap,at:'2026-11-05T00:00:00Z'});
    const reopened=store.loadSavedAdmits();assert.equal(reopened.length,1);
    assert.equal(reopened[0].nonceHex,cap.nonceHex);assert.equal(reopened[0].epoch,cap.epoch);
    assert.equal(reopened[0].eventName,cap.eventName);
    store.upsertSavedAdmit({...cap,at:'2026-11-06T00:00:00Z'});assert.equal(store.loadSavedAdmits().length,1);
  } finally {Object.defineProperty(globalThis,'localStorage',{configurable:true,value:previous});}
});
