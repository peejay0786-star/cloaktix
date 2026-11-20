import { ContractState } from '@midnight-ntwrk/midnight-js-protocol/v9/onchain-runtime'; // same v4 instance compact-runtime 0.21 uses
import { ledger as v1 } from '../../../contract/managed/cloaktix/contract/index.js';
import { ledger as v2 } from '../../../contract/managed/cloaktix-v2/contract/index.js';
import { ledger as v3 } from '../../../contract/managed/cloaktix-rate-v3/contract/index.js';
import { ledger as egg40 } from '../../../contract/managed/cloaktix-egg40/contract/index.js';
const hex=(bytes:Uint8Array)=>Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
export function decodeCatalogState(stateHex:string){
  if(!/^[0-9a-f]+$/i.test(stateHex)||stateHex.length%2)throw new Error('Invalid indexed state');
  const bytes=Uint8Array.from(stateHex.match(/../g)??[],x=>parseInt(x,16));
  const state=ContractState.deserialize(bytes),data=state.data;
  // EGG-40 also reports schemaVersion 3 but has a different ledger layout: the v3 decoder reads it as empty maps
  // (no error), so organizer listings were rejected as "not indexed". Its door-key circuit identifies it.
  const isEgg40=state.operations().some(op=>String(op)==='authorizeDoorKey');
  const decoders=isEgg40?[[3,egg40]] as const:[[3,v3],[2,v2],[1,v1]] as const;
  for(const [expected,decode] of decoders){
    try{
      const ledger=decode(data);
      const version='schemaVersion' in ledger?Number(ledger.schemaVersion):1;
      if(version!==expected)continue;
      return {events:new Map([...ledger.events].map(([id,e])=>[String(id),{organizer:hex(e.organizer),payout:hex(e.payout.bytes)}])),types:new Map([...ledger.ticketTypes].map(([id,t])=>[String(id),{eventId:String(t.eventId)}]))};
    }catch{/* The schemas have different ledger shapes; accept only the matching version. */}
  }
  throw new Error('Unsupported CloakTix ledger');
}
