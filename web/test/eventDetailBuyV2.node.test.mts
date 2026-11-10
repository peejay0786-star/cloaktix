import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(new URL('../package.json', import.meta.url));
const { buildSync, transformSync } = require('esbuild');
import { buildEventShareUrl } from '../src/v2/shareLinks.ts';
import { resolveSchema, contractStorageKey } from '../src/midnight/schema.ts';

describe('buildEventShareUrl always carries schema + network', () => {
  it('includes schema=2 and network for v2 organizer shares', () => {
    const url = buildEventShareUrl({
      origin: 'https://app.cloaktix.com',
      eventId: 1,
      contract: '7fd12c111c2d1aff5731774402d30e75ec92f343caff9b46934656a905aae421',
      networkId: 'preview',
      schema: 2,
      metaB64: 'abc',
    });
    const u = new URL(url);
    assert.equal(u.pathname, '/e/1');
    assert.equal(u.searchParams.get('schema'), '2');
    assert.equal(u.searchParams.get('network'), 'preview');
    assert.equal(
      u.searchParams.get('contract'),
      '7fd12c111c2d1aff5731774402d30e75ec92f343caff9b46934656a905aae421',
    );
    assert.equal(u.searchParams.get('m'), 'abc');
  });

  it('includes schema=1 for legacy shares (v1 intact)', () => {
    const url = buildEventShareUrl({
      origin: 'https://app.cloaktix.com',
      eventId: 3,
      contract: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      networkId: 'preview',
      schema: 1,
    });
    const u = new URL(url);
    assert.equal(u.searchParams.get('schema'), '1');
    assert.equal(u.searchParams.get('network'), 'preview');
    assert.equal(u.searchParams.has('m'), false);
  });
});

describe('resolveSchema infers v2 from remembered contract when schema omitted', () => {
  it('returns 2 when URL contract matches s2 storage', () => {
    const mem: Record<string, string> = {};
    (globalThis as any).location = {
      search: '?contract=7fd12c111c2d1aff5731774402d30e75ec92f343caff9b46934656a905aae421&network=preview',
      hostname: 'app.cloaktix.com',
    };
    (globalThis as any).localStorage = {
      getItem: (k: string) => mem[k] ?? null,
      setItem: (k: string, v: string) => {
        mem[k] = v;
      },
      removeItem: (k: string) => {
        delete mem[k];
      },
    };
    mem[contractStorageKey(2, 'preview')] =
      '7fd12c111c2d1aff5731774402d30e75ec92f343caff9b46934656a905aae421';
    assert.equal(resolveSchema(), 2);
  });

  it('honors explicit schema=1 even if contract was saved as v2', () => {
    const mem: Record<string, string> = {};
    (globalThis as any).location = {
      search:
        '?contract=7fd12c111c2d1aff5731774402d30e75ec92f343caff9b46934656a905aae421&network=preview&schema=1',
      hostname: 'x',
    };
    (globalThis as any).localStorage = {
      getItem: (k: string) => mem[k] ?? null,
      setItem: (k: string, v: string) => {
        mem[k] = v;
      },
    };
    mem[contractStorageKey(2, 'preview')] =
      '7fd12c111c2d1aff5731774402d30e75ec92f343caff9b46934656a905aae421';
    assert.equal(resolveSchema(), 1);
  });
});

/** Mirrors buyTicketV2Flow schema + single-call buy semantics without loading React/WASM. */
async function buyTicketV2FlowLogic(
  s: { schema: number; buyAndPrepareAdmit: (a: any) => Promise<any> },
  run: <T>(l: string, f: () => Promise<T>) => Promise<T | undefined>,
  t: { id: bigint; adultOnly: boolean },
  names: { ticketName: string },
  nowAsOf: () => bigint,
) {
  return run(`Buy+admit prepare ${names.ticketName}`, async () => {
    if (s.schema !== 2) {
      throw new Error('This event is schema v2 but the session is not (?schema=2 missing)');
    }
    const r = await s.buyAndPrepareAdmit({
      typeId: t.id,
      adult: !!t.adultOnly,
      asOf: t.adultOnly ? nowAsOf() : undefined,
    });
    const txId = r?.admitTxId ?? r?.buyTxId;
    return { ...r, txId };
  });
}

describe('buyTicketV2Flow handler logic (actual calls, not regex-only)', () => {
  it('refuses schema≠2 inside run without calling buyAndPrepareAdmit', async () => {
    const calls: string[] = [];
    const run = async <T,>(label: string, f: () => Promise<T>): Promise<T | undefined> => {
      calls.push(`run:${label}`);
      try {
        return await f();
      } catch (e: any) {
        calls.push(`err:${e.message}`);
        return undefined;
      }
    };
    let buys = 0;
    await buyTicketV2FlowLogic(
      {
        schema: 1,
        buyAndPrepareAdmit: async () => {
          buys++;
          return {};
        },
      },
      run,
      { id: 1n, adultOnly: false },
      { ticketName: 'GA' },
      () => 0n,
    );
    assert.equal(buys, 0);
    assert.ok(calls.some((c) => c.startsWith('run:Buy+admit')));
    assert.ok(calls.some((c) => c.includes('schema')));
  });

  it('calls buyAndPrepareAdmit once and normalizes txId', async () => {
    const run = async <T,>(_l: string, f: () => Promise<T>) => f();
    let buys = 0;
    const r = await buyTicketV2FlowLogic(
      {
        schema: 2,
        buyAndPrepareAdmit: async (args) => {
          buys++;
          assert.equal(args.typeId, 7n);
          assert.equal(args.adult, false);
          return { serial: 9n, buyTxId: 'buytx', admitTxId: 'admittx', prepareOk: true };
        },
      },
      run,
      { id: 7n, adultOnly: false },
      { ticketName: 'GA' },
      () => 0n,
    );
    assert.equal(buys, 1);
    assert.equal(r?.txId, 'admittx');
    assert.equal(r?.serial, 9n);
  });

  it('source keeps sync sdkOrThrow (Vite-safe) and schema guard', () => {
    const src = fs.readFileSync(new URL('../src/v2/TicketsGateV2.tsx', import.meta.url), 'utf8');
    assert.match(src, /import \{ sdkOrThrow \} from '\.\.\/midnight\/load'/);
    assert.doesNotMatch(src, /import\('\.\.\/midnight\/load'\)\.then\(\s*\(?m\)?\s*=>/);
    assert.match(src, /if \(s\.schema !== 2\)/);
    assert.match(src, /return run\(`Buy\+admit prepare/);
  });

  it('buyAndPrepareAdmit retains serial when prepare fails (no silent re-buy)', () => {
    const src = fs.readFileSync(new URL('../src/midnight/session-v2.ts', import.meta.url), 'utf8');
    assert.match(src, /needsPrepare: true as const/);
    assert.match(src, /prepareOk: false as const/);
    const buyIdx = src.indexOf("await callV2(host, 'buyTicket'");
    const tryIdx = src.indexOf('try {', buyIdx);
    const regIdx = src.indexOf("await callV2(host, 'registerAdmit'", buyIdx);
    assert.ok(buyIdx > 0 && tryIdx > buyIdx && regIdx > tryIdx);
  });

  it('App shareUrl and connect rememberContract use real schema', () => {
    const app = fs.readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
    assert.match(app, /buildEventShareUrl/);
    assert.match(app, /rememberContract\(x\.networkId, x\.contract, x\.schema\)/);
    assert.match(app, /const schema = s\.schema;/);
    assert.match(app, /addTicketTypeArgs\(s\.schema,/);
    assert.doesNotMatch(
      app,
      /if \(x\.contract\) rememberContract\(x\.networkId, x\.contract, 1\);/,
    );
  });
});

// Compile the actual lightweight schema module with Vite-style env replacement, not a mirror resolver.
let schemaFixtureId = 0;
async function resolveFixture(env: Record<string,string>, search = '', remembered: Record<string,string> = {}, storageBlocked = false) {
  const previousLocation = Object.getOwnPropertyDescriptor(globalThis, 'location');
  const previousStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'location', {configurable:true, value:{search}});
  Object.defineProperty(globalThis, 'localStorage', {configurable:true, value:{getItem:(key:string)=>{if(storageBlocked)throw new Error('Storage unavailable');return remembered[key]??null;}}});
  try {
    const {outputFiles} = buildSync({entryPoints:[new URL('../src/midnight/schema.ts',import.meta.url).pathname],bundle:true,platform:'node',format:'esm',write:false,define:{'import.meta.env':JSON.stringify(env)}});
    const module = await import('data:text/javascript;base64,'+Buffer.from(outputFiles[0].text).toString('base64')+'#schema-'+schemaFixtureId++);
    return module.resolveSchema();
  } finally {
    if(previousLocation)Object.defineProperty(globalThis,'location',previousLocation);else Reflect.deleteProperty(globalThis,'location');
    if(previousStorage)Object.defineProperty(globalThis,'localStorage',previousStorage);else Reflect.deleteProperty(globalThis,'localStorage');
  }
}
const fixtureContract='ab'.repeat(32), otherContract='cd'.repeat(32);
describe('Preview v3 schema selection with real Vite-style replacement',()=>{
 const cases:[string,Record<string,string>,string,Record<string,string>,number,boolean?][]=[
  ['unconfigured app retains schema 1',{},'',{},1],
  ['valid baked v3 contract defaults to 3',{VITE_RATE_V3_CONTRACT:fixtureContract},'',{},3],
  ['invalid baked contract does not select v3',{VITE_RATE_V3_CONTRACT:'not-a-contract'},'',{},1],
  ['baked v3 defaults survive blocked storage',{VITE_RATE_V3_CONTRACT:fixtureContract},'?contract='+otherContract,{},3,true],
  ['explicit schema 1 wins over v3 env and remembered contract',{VITE_CLOAKTIX_SCHEMA:'3',VITE_RATE_V3_CONTRACT:fixtureContract},'?schema=1&contract='+fixtureContract+'&network=preview',{'cloaktix:l9:contract:s3:preview':fixtureContract},1],
  ['explicit schema 2 wins over configured v3',{VITE_CLOAKTIX_SCHEMA:'3',VITE_RATE_V3_CONTRACT:fixtureContract},'?schema=2',{},2],
  ['explicit schema 3 wins over env 2',{VITE_CLOAKTIX_SCHEMA:'2'},'?schema=3',{},3],
  ['schema env 3 is honored',{VITE_CLOAKTIX_SCHEMA:'3'},'',{},3],
  ['schema env 2 is honored over v3 fallback',{VITE_CLOAKTIX_SCHEMA:'2',VITE_RATE_V3_CONTRACT:fixtureContract},'',{},2],
  ['URL matches s3 storage with normalized prefix/case',{},'?contract=0X'+fixtureContract.toUpperCase()+'&network=preview',{'cloaktix:l9:contract:s3:preview':fixtureContract},3],
  ['URL matches last s3 storage',{},'?contract='+fixtureContract+'&network=preview',{'cloaktix:last-contract:s3:preview':'0x'+fixtureContract.toUpperCase()},3],
  ['URL matches baked contract without usable storage',{VITE_RATE_V3_CONTRACT:'0X'+fixtureContract.toUpperCase()},'?contract='+fixtureContract,{},3,true],
  ['s3 memory takes precedence over duplicate s2 memory',{},'?contract='+fixtureContract+'&network=preview',{'cloaktix:l9:contract:s3:preview':fixtureContract,'cloaktix:l9:contract:s2:preview':fixtureContract},3],
  ['s2 inference remains ahead of baked default',{VITE_RATE_V3_CONTRACT:otherContract},'?contract='+fixtureContract+'&network=preview',{'cloaktix:l9:contract:s2:preview':'0x'+fixtureContract.toUpperCase()},2],
  ['last s2 inference still works',{},'?contract='+fixtureContract+'&network=preview',{'cloaktix:last-contract:s2:preview':fixtureContract},2],
  ['different-network memory does not match',{},'?contract='+fixtureContract+'&network=preview',{'cloaktix:l9:contract:s3:preprod':fixtureContract},1],
  ['unknown contract and no configured default remain schema 1',{},'?contract='+otherContract+'&network=preview',{'cloaktix:l9:contract:s3:preview':fixtureContract},1],
 ];
 for(const [label,env,search,memory,expected,blocked] of cases)it(label,async()=>assert.equal(await resolveFixture(env,search,memory,blocked),expected));
 it('schema module does not import compiled contract/runtime modules',()=>{
  const source=fs.readFileSync(new URL('../src/midnight/schema.ts',import.meta.url),'utf8');assert.doesNotMatch(source,/from ['"].*contract-v3/);
 });
});

// Execute the real detector, substituting only the external generated-ledger readers.
async function detectorFixture(){
 const {outputFiles}=await require('esbuild').build({entryPoints:[new URL('../src/midnight/detectSchema.ts',import.meta.url).pathname],bundle:true,platform:'node',format:'esm',write:false,plugins:[{name:'test-ledger-boundary',setup(build:any){
  build.onResolve({filter:/\/contract-v[234]$/},(args:any)=>({path:args.path,namespace:'test-ledger'}));
  build.onResolve({filter:/\/contractStateRead$/},()=>({path:'contractStateRead',namespace:'test-read'}));
  build.onLoad({filter:/.*/,namespace:'test-read'},()=>({contents:'export const readContractState=(p,a)=>p.queryContractState(a);',loader:'js'}));
  build.onLoad({filter:/.*/,namespace:'test-ledger'},(args:any)=>{const version=Number(args.path.slice(-1));return {contents:`export function ledgerV${version}(data){data.calls.push(${version});if(typeof data.v${version}!=='number')throw new Error('Unreadable ledger');return {schemaVersion:BigInt(data.v${version})};}`,loader:'js'};});
 }}]});
 return import('data:text/javascript;base64,'+Buffer.from(outputFiles[0].text).toString('base64'));
}
describe('on-chain detection is evidence-based and prefers v4 then v3',()=>{
 for(const [label,v4,v3,v2,expected,calls] of [
  ['v4 reader wins',4,3,2,4,[4]],['v3 reader wins',undefined,3,2,3,[4,3]],['v2 reader can report version 3',undefined,undefined,3,3,[4,3,2]],['v2 remains supported',undefined,undefined,2,2,[4,3,2]],['explicit version 1 is not invented',undefined,undefined,1,1,[4,3,2]],['unreadable state is unknown',undefined,undefined,undefined,null,[4,3,2]],['unsupported version is unknown',5,5,5,null,[4,3,2]],
 ] as const)it(label,async()=>{const {detectOnChainSchema}=await detectorFixture();const data={v4,v3,v2,calls:[]};assert.equal(await detectOnChainSchema({queryContractState:async()=>({data})},fixtureContract),expected);assert.deepEqual(data.calls,calls);});
 it('missing or failed indexer query returns unknown',async()=>{const {detectOnChainSchema}=await detectorFixture();assert.equal(await detectOnChainSchema({queryContractState:async()=>null},fixtureContract),null);assert.equal(await detectOnChainSchema({queryContractState:async()=>{throw new Error('offline');}},fixtureContract),null);});
});

// Execute Session.connect's actual source method with wallet/provider I/O replaced. No wallet signing or network.
async function connectFixture(detected:number|null,explicit?:1|2|3|4){
 const source=fs.readFileSync(new URL('../src/midnight/cloaktix.ts',import.meta.url),'utf8');
 const start=source.indexOf('  static async connect('),end=source.indexOf('\n  age:',start);assert.ok(start>=0&&end>start);
 const code=`export async function execute(detected,explicit){
 const contract='${fixtureContract}',calls=[],states=[],memory=new Map([['test-key','test-only']]);let probes=0;
 const location={search:'?network=preview&contract='+contract+(explicit?'&schema='+explicit:'')};
 const localStorage={getItem:key=>memory.get(key)??null,setItem:(key,value)=>memory.set(key,value)};
 const resolveSchema=()=>explicit??1;const contractStorageKey=(schema,network)=>'cloaktix:contract:s'+schema+':'+network;
 const detectOnChainSchema=async()=>{probes++;return detected;};
 const createProviders=async(api,{schema})=>{calls.push(schema);return {providers:{publicDataProvider:{},privateStateProvider:{seed:(id,value)=>states.push(id)}},config:{networkId:'preview'}};};
 const api={getConnectionStatus:async()=>({networkId:'preview'}),getConfiguration:async()=>({networkId:'preview'}),hintUsage:async()=>{},getUnshieldedAddress:async()=>({unshieldedAddress:'test-only-address'})};
 const skKey=()=> 'test-key';const unhex=()=>new Uint8Array(32);const deriveFromWallet=()=>{throw new Error('Unexpected signing path');};
 const PRIVATE_STATE_ID='v1',PRIVATE_STATE_ID_V2='v2',PRIVATE_STATE_ID_V3='v3',PRIVATE_STATE_ID_V4='v4';
 const createPrivateState=()=>({}),createPrivateStateV2=()=>({}),createPrivateStateV3=()=>({});
 const parseCredential=()=>{throw new Error('No test credential');};
 class Session {constructor(){this.schema=explicit??1;this.contract=null;this.ageKey='test-age';this.sk=new Uint8Array(32);}
 ${source.slice(start,end)}
 }
 const session=await Session.connect({name:'Test wallet',connect:async()=>api},'preview');
 return {schema:session.schema,contract:session.contract,calls,states,probes,remembered:memory.get('cloaktix:contract:s'+session.schema+':preview')};
 }`;
 const js=transformSync(code,{loader:'ts',format:'esm',target:'es2022'}).code;
 const {execute}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
 return execute(detected,explicit);
}
describe('real Session.connect upgrades providers and session together',()=>{
 for(const schema of [2,3,4])it('on-chain version '+schema+' rebinds providers, private state and remembered contract',async()=>{
  const result=await connectFixture(schema);assert.equal(result.schema,schema);assert.equal(result.contract,fixtureContract);assert.equal(result.remembered,fixtureContract);assert.deepEqual(result.calls,[1,schema]);assert.deepEqual(result.states,['v'+schema]);assert.equal(result.probes,1);
 });
 it('explicit schema 1 bypasses upgrading even when the contract would detect as 3',async()=>{const result=await connectFixture(3,1);assert.equal(result.schema,1);assert.deepEqual(result.calls,[1]);assert.deepEqual(result.states,['v1']);assert.equal(result.probes,0);});
});
