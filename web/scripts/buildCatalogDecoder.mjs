import {createRequire} from 'node:module';
import {mkdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const require=createRequire(root+'package.json');const {buildSync}=require('esbuild');
mkdirSync(root+'.catalog-runtime',{recursive:true});
buildSync({entryPoints:[root+'src/catalog/chainDecoder.ts'],bundle:true,packages:'external',platform:'node',format:'esm',outfile:root+'.catalog-runtime/chain.mjs'});
console.log('Local public-state decoder ready (read-only; no wallet or transaction).');
