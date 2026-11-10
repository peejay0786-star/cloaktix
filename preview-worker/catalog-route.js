import {authenticateWrite,validWrite} from './catalog-store.js';
const headers={'cache-control':'no-store','Cross-Origin-Resource-Policy':'same-origin','X-Content-Type-Options':'nosniff'};
const json=(body,status=200)=>Response.json(body,{status,headers});
async function readBody(request){
  const reader=request.body?.getReader();if(!reader)throw new Error('Empty body');let size=0;const parts=[];
  try{for(;;){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>400000){await reader.cancel();throw new Error('Body too large');}parts.push(value);}}
  finally{reader.releaseLock();}
  const bytes=new Uint8Array(size);let offset=0;for(const part of parts){bytes.set(part,offset);offset+=part.length;}return JSON.parse(new TextDecoder().decode(bytes));
}
export async function handleCatalogRoute(request,env,{queryState}={}){
  const url=new URL(request.url),path=url.pathname;
  if(!['/catalog','/meta'].includes(path))return json({error:'Not found'},404);
  if(path==='/catalog'&&!['GET','HEAD'].includes(request.method))return json({error:'Catalog is read only.'},405);
  if(!env.PUBLIC_CATALOG)return json({error:'Organizer-published catalog storage is not configured. Connect for live ledger availability.'},503);
  try{
    if(['GET','HEAD'].includes(request.method)){
      const c=(url.searchParams.get('c')??'').toLowerCase();if(!/^[0-9a-f]{64}$/.test(c))return json({error:'Invalid contract.'},400);
      const store=env.PUBLIC_CATALOG.getByName(c);
      const response=json(path==='/catalog'?await store.catalog(c):await store.metadata());
      return request.method==='HEAD'?new Response(null,{status:response.status,headers:response.headers}):response;
    }
    if(request.method!=='POST')return json({error:'Method not allowed.'},405);
    let j;try{j=await readBody(request);}catch{return json({error:'Invalid or oversized metadata request.'},400);}
    if(!validWrite(j))return json({error:'Invalid metadata request.'},400);
    if(!await authenticateWrite(j))return json({error:'Invalid organizer signature.'},403);
    const upstream=request.headers.get('x-cloaktix-indexer');
    if(!upstream||!queryState)return json({error:'Wallet indexer URI is required to verify organizer ownership.'},503);
    const state=await queryState(j.c,upstream);if(!state)return json({error:'Contract state is not indexed yet.'},404);
    const result=await env.PUBLIC_CATALOG.getByName(j.c).publish(j,state);
    return json(result.body,result.status);
  }catch{return json({error:'Catalog unavailable. No purchase was made.'},503);}
}
