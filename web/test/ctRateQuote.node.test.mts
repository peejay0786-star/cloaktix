import {it} from 'node:test';
import assert from 'node:assert/strict';
import {atomsPerUsdCentFromNightUsd, quoteNightForUsd, secondsLeft} from '../src/rate/quoteMath.ts';
import {createRequire} from 'node:module';
import {mkdtempSync,readFileSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
it('quote math converts USD cents to NIGHT atoms with countdown helpers',()=>{
 assert.equal(atomsPerUsdCentFromNightUsd(0.05),200_000n);
 const q=quoteNightForUsd(1000n,0.05,180);assert.equal(q.nightAtoms,200_000_000n);assert.equal(secondsLeft(q.expiresAt,q.issuedAt),180);
});
it('RateQuotePanel real render shows USD and NIGHT without ETH',()=>{
 const require=createRequire(new URL('../package.json',import.meta.url));const {buildSync}=require('esbuild');
 const dir=mkdtempSync(`${tmpdir()}/ct-rate-panel-`);const src=new URL('../src/',import.meta.url).pathname;
 buildSync({stdin:{contents:`import React from ${JSON.stringify(require.resolve('react'))};import {renderToStaticMarkup} from ${JSON.stringify(require.resolve('react-dom/server'))};import {RateQuotePanel} from ${JSON.stringify(src+'rate/RateQuotePanel.tsx')};export const panel=(usd,night)=>renderToStaticMarkup(React.createElement(RateQuotePanel,{usdCents:usd,nightUsd:night,ttlSec:180}));`,resolveDir:new URL('../',import.meta.url).pathname,loader:'tsx'},bundle:true,platform:'node',format:'cjs',jsx:'automatic',outfile:dir+'/render.cjs'});
 const html=require(dir+'/render.cjs').panel(1000n,0.05);
 assert.match(html,/Live NIGHT quote/);assert.match(html,/200\.00 NIGHT/);assert.match(html,/\$10\.00 USD/);assert.doesNotMatch(html,/ETH/);
 const css=readFileSync(new URL('../src/styles.css',import.meta.url),'utf8');
 writeFileSync('/workspace/ct-rate-quote.html','<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>CT-RATE quote</title><style>'+css+'</style></head><body><div class="app"><p class="small muted">LOCAL MOCK · CT-RATE quote countdown</p><main>'+html+'</main></div></body></html>');
});
