import { it } from 'node:test';
import assert from 'node:assert/strict';
import { buyResaleAndPrepare, preparePurchasedResale } from '../src/v2/resalePurchase.ts';
const cap={v:2 as const,networkId:'preview',contract:'ab'.repeat(32),serial:'7',epoch:'3',nonceHex:'cd'.repeat(32)};
const args={listingId:4n,serial:7n,typeId:2n,listedEpoch:2n,adult:false,asOf:100n,ticketName:'GA',eventName:'Event'};
it('actual resale helper purchases once, observes owned epoch and only exposes confirmed prepare', async()=>{
  const calls:string[]=[];
  const result=await buyResaleAndPrepare({
    call:async(circuit,params)=>{assert.deepEqual(params,[4n]);calls.push(circuit);return {txId:'buy'};},
    state:async()=>{calls.push('state');return {ownedTickets:[{serial:7n,typeId:2n,epoch:3n}]};},
    registerAdmitOnly:async(serial)=>{assert.equal(serial,7n);calls.push('prepare');return {cap,admitTxId:'prepare'};},
  },args);
  assert.deepEqual(calls,['buyResale','state','prepare']);assert.equal(result.kind,'ready');
  if(result.kind==='ready')assert.equal(result.cap,cap);
});
it('signing failure keeps purchase receipt; retry performs prepare only',async()=>{
  let buys=0;let prepares=0;let fail=true;
  const host={call:async()=>{buys++;return {txId:'buy'};},state:async()=>({ownedTickets:[{serial:7n,typeId:2n,epoch:3n}]}),registerAdmitOnly:async()=>{prepares++;if(fail)throw new Error('Signature rejected');return {cap,admitTxId:'ready'};}};
  const result=await buyResaleAndPrepare(host,args);assert.equal(result.kind,'needs-prepare');assert.equal('cap' in result,false);assert.equal(result.receipt.serial,7n);
  fail=false;const retry=await preparePurchasedResale(host,result.receipt);
  assert.equal(retry.kind,'ready');assert.equal(buys,1);assert.equal(prepares,2);
});
it('indexer failure retains serial and no QR; later retry never purchases again',async()=>{
  let available=false;let buys=0;let prepares=0;
  const host={call:async()=>{buys++;return {txId:'buy'};},state:async()=>{if(!available)throw new Error('Indexer unavailable');return {ownedTickets:[{serial:7n,typeId:2n,epoch:3n}]};},registerAdmitOnly:async()=>{prepares++;return {cap,admitTxId:'ready'};}};
  const result=await buyResaleAndPrepare(host,args);assert.equal(result.kind,'needs-prepare');assert.equal(prepares,0);
  available=true;assert.equal((await preparePurchasedResale(host,result.receipt)).kind,'ready');assert.equal(buys,1);
});
it('stale epoch cannot prepare and adult purchase preserves circuit args',async()=>{
  let prepares=0;
  const result=await buyResaleAndPrepare({call:async(c,p)=>{assert.equal(c,'buyResaleAdult');assert.deepEqual(p,[4n,100n]);return {txId:'buy'};},state:async()=>({ownedTickets:[{serial:7n,typeId:2n,epoch:4n}]}),registerAdmitOnly:async()=>{prepares++;return {cap,admitTxId:'prepare'};}},{...args,adult:true});
  assert.equal(result.kind,'needs-prepare');assert.equal(prepares,0);assert.equal('cap' in result,false);
});
