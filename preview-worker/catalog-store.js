import {parseEventDetails,parseListingType} from '../web/src/catalog/model.ts';
const message=(j)=>`cloaktix:meta:v1|${j.c}|${j.kind}|${j.id}|${j.ts}|${JSON.stringify(j.v)}`;
const unhex=(v)=>Uint8Array.from(v.match(/../g),x=>parseInt(x,16));
const failure=(status,error)=>({status,body:{error}});
export function validWrite(j){
  return j&&/^[0-9a-f]{64}$/.test(j.c)&&['ev','tt'].includes(j.kind)&&typeof j.id==='string'&&/^\d{1,19}$/.test(j.id)&&/^[0-9a-f]{64}$/.test(j.pk)&&/^[0-9a-f]{128}$/.test(j.sig)&&Number.isSafeInteger(j.ts)&&Math.abs(Date.now()-j.ts)<=600000;
}
export async function authenticateWrite(j){
  if(!validWrite(j))return false;
  try{const key=await crypto.subtle.importKey('raw',unhex(j.pk),{name:'Ed25519'},false,['verify']);return await crypto.subtle.verify('Ed25519',key,unhex(j.sig),new TextEncoder().encode(message(j)));}catch{return false;}
}
// No network I/O here: verification uses a state snapshot obtained through the existing allowlisted proxy.
export function createSqlCatalog(sql,decodeState){
  sql.exec(`CREATE TABLE IF NOT EXISTS records(kind TEXT NOT NULL,id TEXT NOT NULL,v TEXT NOT NULL,ts INTEGER NOT NULL,eventId TEXT NOT NULL,PRIMARY KEY(kind,id)); CREATE TABLE IF NOT EXISTS key_events(id TEXT PRIMARY KEY);`);
  const rows=()=>sql.exec('SELECT kind,id,v,ts,eventId FROM records').toArray();
  const metadata=()=>{const all=rows();return {ev:Object.fromEntries(all.filter(x=>x.kind==='ev').map(x=>[x.id,JSON.parse(x.v)])),tt:Object.fromEntries(all.filter(x=>x.kind==='tt').map(x=>[x.id,JSON.parse(x.v)])),keys:sql.exec('SELECT id FROM key_events').toArray().map(x=>x.id)};};
  return {
    metadata,
    catalog(contract){const all=rows();const keys=new Set(sql.exec('SELECT id FROM key_events').toArray().map(x=>x.id));return {source:'organizer-published',contract,events:all.filter(x=>x.kind==='ev'&&!keys.has(x.id)).flatMap(x=>{const details=parseEventDetails(JSON.parse(x.v));if(!details)return [];return [{...details,id:x.id,publishedAt:x.ts,tickets:all.filter(t=>t.kind==='tt'&&t.eventId===x.id).map(t=>({id:t.id,...JSON.parse(t.v)}))}];})};},
    async publish(j,stateHex){
      if(!validWrite(j))return failure(400,'Invalid listing write.');
      const parsed=j.kind==='ev'?parseEventDetails(j.v):parseListingType({id:j.id,...j.v});
      if(!parsed)return failure(400,'Complete event details or ticket options are required.');
      if(!await authenticateWrite(j))return failure(403,'Invalid organizer signature.');
      let state;try{state=decodeState(stateHex);}catch{return failure(503,'Indexed state could not be verified.');}
      const eventId=j.kind==='ev'?j.id:state.types.get(j.id)?.eventId;
      const target=eventId&&state.events.get(eventId);
      if(!target)return failure(404,'Event or ticket type is not indexed yet.');
      const registered=[...state.events].find(([,e])=>e.organizer===target.organizer&&e.payout===j.pk);
      if(!registered)return failure(403,'Signing key is not registered to this organizer.');
      const value=j.kind==='ev'?parsed:Object.fromEntries(Object.entries(parsed).filter(([k])=>k!=='id'));
      const json=JSON.stringify(value);
      // Synchronous read/check/write after all awaits prevents stale updates from winning races.
      const previous=sql.exec('SELECT ts,length(v) AS size FROM records WHERE kind=? AND id=?',j.kind,j.id).toArray()[0];
      if(previous&&previous.ts>=j.ts)return failure(409,'Replay or older update.');
      const size=sql.exec('SELECT COALESCE(sum(length(v)),0) AS size,count(*) AS count FROM records').one();
      if(size.size-(previous?.size??0)+json.length>10*1024*1024||(!previous&&size.count>=5000))return failure(507,'Listing storage is full.');
      if(!previous&&j.kind==='ev'&&sql.exec("SELECT count(*) AS count FROM records WHERE kind='ev'").one().count>=200)return failure(507,'Event listing limit reached.');
      sql.exec('INSERT INTO records(kind,id,v,ts,eventId) VALUES(?,?,?,?,?) ON CONFLICT(kind,id) DO UPDATE SET v=excluded.v,ts=excluded.ts,eventId=excluded.eventId',j.kind,j.id,json,j.ts,eventId);
      sql.exec('INSERT OR IGNORE INTO key_events(id) VALUES(?)',registered[0]);
      return {status:201,body:{ok:true}};
    }
  };
}
