import { Price } from '../Price';
import { Dialog } from '../Dialog';
import { useState, type ReactNode } from 'react';
import { Qr } from '../Qr';
import { encodeAdmitQr } from './admitCodec';
import { printTicket } from './printTicket';
import { TransferTicket } from './TransferTicket';
import type { TicketListItem } from './ticketLibraryModel';

/** List first; displaying, printing or sending never performs a chain operation. */
export function TicketLibrary({ items, controls, onBrowseEvents }: { items: TicketListItem[]; controls?: (item: TicketListItem)=>ReactNode; onBrowseEvents?: () => void }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [view, setView] = useState<'none'|'show'|'send'>('none');
  const [status, setStatus] = useState('');
  const ticket = items.find((item)=>item.key===selected);
  if (!ticket) return <section className="tix-page"><header className="page-header"><h2>My tickets</h2></header>
    {!items.length && <div className="card empty">
      <h3>No tickets yet</h3>
      <p className="muted">No tickets on this browser yet. Buy a ticket or open a private ticket link saved on this device.</p>
      {onBrowseEvents && <button type="button" className="primary" onClick={onBrowseEvents}>Browse events</button>}
    </div>}
    <div className="ticket-list" role="list">{items.map((item)=><div role="listitem" key={item.key}><button type="button" className="card ticket-list-card"
      aria-label={`${item.eventName}, ${item.ticketName}, ticket ${item.serial}${item.date ? `, ${item.date}` : ''}`}
      onClick={()=>{setSelected(item.key);setView('none');setStatus('');}}>
      <TicketCover cover={item.cover} />
      <span className="ticket-list-copy"><strong>{keepHyphenatedWords(item.eventName)}</strong><span className="muted small">Ticket #{item.serial}</span><TypeLabel name={item.ticketName} />{item.date && <span className="muted">{item.date}</span>}<span className="ticket-open small">Open ticket & options →</span></span>
    </button></div>)}</div>
  </section>;
  const cap=ticket.cap ? { ...ticket.cap, eventName: ticket.eventName, ticketName: ticket.ticketName, eventDate: ticket.date, venue: ticket.venue, cover: ticket.cover } : undefined;
  return <section className="tix-page">
    <button type="button" onClick={()=>{setSelected(null);setView('none');}}>← Back to tickets</button>
    <TicketDetail ticket={ticket} controls={controls?.(ticket)} status={status} onPrint={()=>{if(cap)printTicket(cap,{date:ticket.date,venue:ticket.venue},setStatus);}} onShow={()=>setView('show')} onSend={()=>setView('send')} />
    {cap && view==='show' && <Dialog className="fullqr" label="Admission ticket" onClose={()=>setView('none')}><div className="fq-card"><h2>Ticket #{ticket.serial}</h2><p className="fq-type"><TypeLabel name={ticket.ticketName} /></p><Qr text={encodeAdmitQr(cap)} size={Math.min(380,window.innerWidth-64)} /><p>Show this QR to the organizer at the entrance.</p><button type="button" onClick={()=>setView('none')}>Close</button></div></Dialog>}
    {cap && view==='send' && <Dialog className="fullqr" label="Send ticket to phone" onClose={()=>setView('none')}><div className="fq-card"><TransferTicket cap={cap} showPrint={false} /><button type="button" onClick={()=>setView('none')}>Close</button></div></Dialog>}
  </section>;
}

export function TicketDetail({ ticket, controls, status, onPrint, onShow, onSend }: {
  ticket: TicketListItem; controls?: ReactNode; status: string;
  onPrint:()=>void; onShow:()=>void; onSend:()=>void;
}) {
  return <div className="card ticket-detail"><TicketCover cover={ticket.cover} /><h2>{keepHyphenatedWords(ticket.eventName)}</h2><p><TypeLabel name={ticket.ticketName} /> · Ticket #{ticket.serial}</p>
    {ticket.date && <p>{ticket.date}</p>}{ticket.venue && <p>{ticket.venue}</p>}
    <div className="purchase-price"><span className="muted small">Purchase price</span>{ticket.purchase?.usdCents ? <><Price usdCents={ticket.purchase.usdCents} /><p className="small muted">USD estimate recorded at purchase; equivalents use current rates.</p></> : <p className="small muted">Purchase price unavailable on this browser.</p>}</div>
    <div className="row" role="group" aria-label="Ticket actions">
      <button type="button" disabled={!ticket.cap} onClick={onPrint}>Print ticket</button>
      <button type="button" disabled={!ticket.cap} onClick={onShow}>Show QR</button>
      <button type="button" disabled={!ticket.cap} onClick={onSend}>Send to phone</button>
    </div>
    <p role="status">{status}</p>
    {ticket.offline && <p className="small muted">Saved on this browser. Resale or replacement invalidates old copies; the gate checks current validity.</p>}
    {!ticket.cap && <p className="muted">Ticket not prepared or the saved link is missing.</p>}
    {controls}
  </div>;
}

/** Type name with the 18+ part shown as a badge ("after party" + 18+). */
export function TypeLabel({ name }: { name: string }) {
  const m = name.match(/^(.*) · 18\+$/);
  return <span className="ticket-type-label">{m ? <>{m[1]} <span className="tag age">18+</span></> : name}</span>;
}

function TicketCover({ cover }: { cover?: string }) {
  return <img className="ticket-cover" loading="lazy" decoding="async" src={cover || '/art/neon-nights.webp'} alt="" onError={(event)=>{
    event.currentTarget.onerror=null;
    if (!event.currentTarget.src.endsWith('/art/neon-nights.webp')) event.currentTarget.src='/art/neon-nights.webp';
  }} />;
}

/** Keep names such as st-jean intact; spaces remain wrap points. */
function keepHyphenatedWords(name: string) {
  return name.replace(/(\S+[-‐]\S+)/g, (word) => word.replace(/[-‐]/g, '\u2011'));
}
