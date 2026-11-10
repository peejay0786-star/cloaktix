import {configuredRateV3Contract} from '../midnight/contract-v3';
import {resolveSchema} from '../midnight/schema';
import { useEffect, useState } from 'react';
import { parsePublishedCatalog, formatPublishedUsd, type PublishedCatalog, type PublicListing } from './model';
import { buyerCatalog } from './buyerView';
export type CatalogState = {kind:'loading'} | {kind:'unavailable';message:string} | {kind:'ready';catalog:PublishedCatalog};
export function usePublicCatalog(contract:string|null, initial?:CatalogState){
  const [state,setState]=useState<CatalogState>(initial??{kind:'loading'});const [attempt,setAttempt]=useState(0);
  useEffect(()=>{
    if(initial)return;
    if(!contract){setState({kind:'unavailable',message:'No event contract is selected. Open an event link or connect a wallet.'});return;}
    const abort=new AbortController();setState({kind:'loading'});
    void (async()=>{try{
      const response=await fetch(`/catalog?c=${encodeURIComponent(contract)}`,{credentials:'same-origin',signal:abort.signal,headers:{accept:'application/json'}});
      if(!response.ok)throw new Error('Catalog unavailable');
      const catalog=parsePublishedCatalog(await response.json());if(!catalog||catalog.contract!==contract)throw new Error('Invalid catalog');
      setState({kind:'ready',catalog:buyerCatalog(catalog)});
    }catch{if(!abort.signal.aborted)setState({kind:'unavailable',message:'Organizer-published listings are unavailable right now. Connect for the live catalog, or try again.'});}})();
    return()=>abort.abort();
  },[contract,attempt,initial]);
  return {state,reload:()=>setAttempt(n=>n+1)};
}
export function TicketTrust(){return <p className="ticket-trust">NIGHT on Midnight is the only payment method. After payment, open My tickets to find your pass, print, show QR or Send to phone.</p>;}
export function PurchaseNextSteps(){return <div className="purchase-next"><h3>Find your ticket in My tickets</h3><p>Open your ticket there to print, show QR or Send to phone. If preparation is pending, finish it there — do not buy again.</p><a href="#tickets">Open My tickets →</a></div>;}
export function PublishedListings({state,onConnect,onOpenEvent}:{state:CatalogState;onConnect:()=>void;onOpenEvent?:(id:bigint,contract?:string)=>void}){
  if(state.kind==='loading')return <p className="catalog-state" role="status">Loading organizer-published listings…</p>;
  if(state.kind==='unavailable')return <p className="catalog-state" role="status">{state.message}</p>;
  const {catalog}=state;
  if(!catalog.events.length)return <p className="catalog-state">No organizer-published listings yet. Existing on-chain events still appear after connection; organizers must save complete public details to list them here.</p>;
  return <section className="published-listings" aria-label="Organizer-published events"><p className="catalog-public-note">Organizer-published listings, not live seat counts. Prices and availability are confirmed after connection. No purchase is made when you connect.</p>
    <div className="grid catalog-grid">{catalog.events.map(event=><PublishedEventCard key={event.id} event={event} contract={catalog.contract} onConnect={onConnect} onOpenEvent={onOpenEvent}/>)}</div>
  </section>;
}
export function PublishedEventCard({event,contract,onConnect,onOpenEvent}:{event:PublicListing;contract:string;onConnect:()=>void;onOpenEvent?:(id:bigint,contract?:string)=>void}){
  const query=new URLSearchParams(typeof location==='undefined'?'':location.search);query.set('contract',contract);query.delete('m');const network=query.get('network')??import.meta.env.VITE_NETWORK??'undeployed';query.set('network',network);query.set('schema',String(contract===configuredRateV3Contract(network)?3:resolveSchema()));
  const href=`/e/${event.id}?${query}`;
  return <article className="card event published-card"><div className="cover"><img src={event.cover} alt=""/>{event.demoArt==='true'&&<span className="badge demo-art">Demo art</span>}</div><div className="event-content">
    <div className="evhead"><div><a className="ev-title-link" href={href} onClick={e=>{if(onOpenEvent){e.preventDefault();onOpenEvent(BigInt(event.id),contract);}}}><h3>{event.name}</h3></a><p className="muted">{event.date} · {event.venue}</p></div><span className="tag">Organizer-published</span></div>
    <p className="published-description">{event.description}</p>
    {event.tickets.length?event.tickets.map(ticket=><div key={ticket.id} className="published-ticket"><b>{ticket.name}</b>{ticket.usdCents!==undefined&&<span>{formatPublishedUsd(ticket.usdCents)} · published price</span>}<small>{ticket.resaleSummary}</small></div>):<p className="small muted">Ticket options are not published yet.</p>}
    <p className="small muted">Live availability and current prices are confirmed after connection.</p><button type="button" className="primary" onClick={()=>{onOpenEvent?.(BigInt(event.id),contract);onConnect();}}>Connect to buy</button>
  </div></article>;
}
export function EventInformation({description,rules}:{description?:string;rules:string[]}){
  return <section className="card event-information"><h2>About this event</h2><p>{description||'The organizer has not added a description yet.'}</p><h3>Your ticket</h3><p>A private single-use pass. After payment, open My tickets to prepare it, print, show QR or Send to phone. Keep your pass private.</p><h3>Resale rules</h3>{rules.length?<ul>{rules.map((rule,i)=><li key={i}>{rule}</li>)}</ul>:<p>Ticket types and organizer resale rules must be confirmed before buying.</p>}<TicketTrust/></section>;
}
export function PublicEventDetail({event,onConnect}:{event:PublicListing;onConnect:()=>void}){
  return <main id="main" className="public-event-detail"><header className="page-header"><p className="kicker">Organizer-published event</p><h1>{event.name}</h1><p className="muted">{event.date} · {event.venue}</p></header><div className="public-detail-grid"><div><div className="event-landing-art"><img src={event.cover} alt=""/>{event.demoArt==='true'&&<span className="badge">Demo art</span>}</div><EventInformation description={event.description} rules={event.tickets.map(t=>`${t.name}: ${t.resaleSummary}`)}/></div><aside className="card public-detail-buy"><h2>Ticket options</h2>{event.tickets.map(t=><div className="published-ticket" key={t.id}><b>{t.name}</b>{t.usdCents!==undefined&&<span>{formatPublishedUsd(t.usdCents)} · published price</span>}</div>)}<p>Availability, seat counts and current prices are confirmed after connection.</p><button className="primary big" onClick={onConnect}>Connect to buy</button><p className="small muted">No purchase is made when you connect.</p></aside></div></main>;
}
