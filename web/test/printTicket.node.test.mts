import { it } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { mkdtempSync,readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const require = createRequire(new URL('../package.json',import.meta.url));
const { buildSync } = require('esbuild');
const dir=mkdtempSync(`${tmpdir()}/cloaktix-print-test-`);
for (const name of ['printTicket','ticketImage']) buildSync({entryPoints:[new URL(`../src/v2/${name}.ts`,import.meta.url).pathname],bundle:true,platform:'node',format:'esm',outfile:`${dir}/${name}.mjs`});
const {buildTicketPrintDocument,printTicket}=await import(pathToFileURL(`${dir}/printTicket.mjs`).href);
const {ticketImageModel}=await import(pathToFileURL(`${dir}/ticketImage.mjs`).href);
const cap={v:2,networkId:'preview',contract:'ab'.repeat(32),serial:'1',epoch:'3',nonceHex:'cd'.repeat(32),eventName:'Test <event>',ticketName:'General admission'};
it('real printable document renders precisely PNG admission QR modules, not navigation or identity',()=>{
 const html=buildTicketPrintDocument(cap,{date:'2026-12-05',venue:'Test Hall'});
 const model=ticketImageModel(cap);let path='';const n=model.qr.getModuleCount();
 for(let y=0;y<n;y++)for(let x=0;x<n;x++)if(model.qr.isDark(y,x))path+=`M${x+4} ${y+4}h1v1h-1z`;
 assert.ok(html.includes(`d="${path}"`));assert.ok(html.includes(`viewBox="0 0 ${n+8} ${n+8}"`));
 assert.ok(html.includes('Test &lt;event&gt;'));assert.ok(html.includes('General admission'));assert.ok(html.includes('2026-12-05'));assert.ok(html.includes('Test Hall'));assert.ok(html.includes('Epoch 3'));
 assert.ok(!html.includes('https://app.'));assert.ok(!html.includes('cloaktix:key:'));assert.ok(!html.includes(cap.nonceHex));assert.ok(!html.includes('<script'));assert.ok(!html.includes('<nav'));
});
it('absent metadata is omitted and malicious labels are escaped; print document requests no external resources',()=>{
 const html=buildTicketPrintDocument({...cap,eventName:'<script>alert(1)</script>'});
 assert.ok(html.includes('&lt;script&gt;'));assert.ok(!html.includes('<script>'));assert.ok(!html.includes('undefined'));assert.ok(!html.includes('Test Hall'));assert.ok(html.includes("default-src 'none'"));assert.ok(!/<(?:img|link|iframe)\b/.test(html));
});
it('real print action appends local iframe and opens native dialog only after load; failures reported',()=>{
 const old=globalThis.document;let appended=0,printed=0,removed=0;let status='';
 const frame={title:'',style:{cssText:''},srcdoc:'',onload:()=>{},remove:()=>{removed++;},contentWindow:{addEventListener:()=>{},focus:()=>{},print:()=>{printed++;}}};
 Object.defineProperty(globalThis,'document',{configurable:true,value:{createElement:()=>frame,body:{appendChild:()=>{appended++;}}}});
 try {printTicket(cap,{},(text:string)=>{status=text;});assert.equal(appended,1);assert.equal(printed,0);frame.onload();assert.equal(printed,1);assert.match(status,/Print dialog requested/);
 frame.contentWindow.print=()=>{throw new Error('blocked');};frame.onload();assert.equal(removed,1);assert.match(status,/could not open/);
 }finally{Object.defineProperty(globalThis,'document',{configurable:true,value:old});}
});
it('PC component wires print on click and has no preparation or purchase call',()=>{
 const source=readFileSync(new URL('../src/v2/TransferTicket.tsx',import.meta.url),'utf8');
 assert.match(source,/onClick=\{\(\) => printTicket\(cap, details, setStatus\)\}/);assert.doesNotMatch(source,/registerAdmit|buyTicket|\.call\(/);
});
