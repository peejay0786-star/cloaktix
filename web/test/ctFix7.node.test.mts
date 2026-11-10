import {it} from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdtempSync,readFileSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
const require=createRequire(new URL('../package.json',import.meta.url));
const {buildSync}=require('esbuild');
const dir=mkdtempSync(`${tmpdir()}/cloaktix-cards-`);
const entry=`import React from ${JSON.stringify(require.resolve('react'))};import {renderToStaticMarkup} from ${JSON.stringify(require.resolve('react-dom/server'))};import {TicketLibrary,TicketDetail} from ${JSON.stringify(new URL('../src/v2/TicketLibrary.tsx',import.meta.url).pathname)};export function list(items){return renderToStaticMarkup(React.createElement(TicketLibrary,{items}));}export function detail(ticket){return renderToStaticMarkup(React.createElement(TicketDetail,{ticket,status:'',onPrint(){},onShow(){},onSend(){}}));}`;
buildSync({stdin:{contents:entry,resolveDir:new URL('../',import.meta.url).pathname,loader:'tsx'},bundle:true,platform:'node',format:'cjs',jsx:'automatic',outfile:dir+'/render.cjs'});
const render=require(dir+'/render.cjs');
const ticket={key:'synthetic-1',serial:'1',eventName:'Midnight Summit — Montréal — A longer event title for narrow screens',ticketName:'General admission',date:'2026-12-05',cover:'/art/neon-nights.webp',cap:{v:2,networkId:'preview',contract:'ab'.repeat(32),serial:'1',epoch:'1',nonceHex:'cd'.repeat(32)}};
it('real ticket list renders prominent card, event cover, event name and date without admission QR',()=>{
 const html=render.list([ticket]);assert.ok(html.includes('ticket-list-card'));assert.ok(html.includes('src="/art/neon-nights.webp"'));assert.ok(html.includes('Midnight Summit — Montréal'));assert.ok(!html.includes('View ticket'));assert.ok(html.includes('A longer event title for narrow screens'));assert.ok(html.includes('2026-12-05'));assert.ok(!html.includes('<svg'));
 const fallback=render.list([{...ticket,cover:undefined}]);assert.ok(fallback.includes('src="/art/neon-nights.webp"'));
});
it('real detail includes event cover but keeps exactly the three existing ticket actions',()=>{
 const html=render.detail(ticket);assert.ok(html.includes('ticket-cover'));assert.equal((html.match(/<button/g)||[]).length,3);
 for(const text of ['Print ticket','Show QR','Send to phone'])assert.ok(html.includes(text));
});
it('Activity defaults collapsed and compact sizing is independent from ticket prominence',()=>{
 const source=readFileSync(new URL('../src/App.tsx',import.meta.url),'utf8');assert.ok(source.includes('<details className="activity"><summary>Activity'));assert.ok(!source.includes('<details className="activity" open'));
 const css=readFileSync(new URL('../src/styles.css',import.meta.url),'utf8');assert.match(css,/\.ticket-list-card[^}]*min-height:230px/);assert.match(css,/\.activity \{ max-width:600px/);
 // Portable mock from the real component renderer and existing nonsecret art asset.
 const image='data:image/webp;base64,'+readFileSync(new URL('../public/art/neon-nights.webp',import.meta.url)).toString('base64');
 const body=render.list([{...ticket,cover:image}]);
 writeFileSync('/workspace/ct-fix7-list-mock.html','<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>'+css+'</style></head><body><div class="app has-activity"><main>'+body+'<details class="activity"><summary>Activity <span class="muted">· 1 update</span></summary><div class="activity-body">Synthetic preview only</div></details></main></div></body></html>');
});

it('card copy fully wraps with no ellipsis, line clamp or fixed text height',()=>{
 const css=readFileSync(new URL('../src/styles.css',import.meta.url),'utf8');
 const rules=[...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].filter((match)=>match[1].includes('.ticket-list'));
 assert.ok(rules.length>0);
 for(const rule of rules){assert.doesNotMatch(rule[2],/text-overflow\s*:\s*ellipsis|line-clamp|white-space\s*:\s*nowrap/);}
 assert.match(css,/\.ticket-list-copy, \.ticket-list-copy > \*[^}]*white-space:normal[^}]*overflow-wrap:anywhere/);
 assert.match(css,/\.ticket-list-card[^}]*white-space:normal/);
 assert.match(css,/\.activity \{[^}]*position:fixed[^}]*bottom:/);
 assert.match(css,/\.has-activity \{ padding-bottom:calc\(230px/);
});
