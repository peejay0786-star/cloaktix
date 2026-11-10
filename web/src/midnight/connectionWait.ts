/** Diagnostic only: never aborts, reconnects or repeats a wallet request. */
export function connectionWait(onWait: ()=>void, schedule: (callback:()=>void, ms:number)=>()=>void = (callback,ms)=>{
  const timer=setTimeout(callback,ms); return ()=>clearTimeout(timer);
}): ()=>void {
  return schedule(onWait,15_000);
}
