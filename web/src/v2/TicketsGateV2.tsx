import { GateV4 } from '../multigate/GateV4';
import { useRates } from '../useRates';
import { quoteUsd, currentUsdInput } from '../rates';
import { loadPurchase } from '../purchaseReceipts';
import { TicketLibrary } from './TicketLibrary';
import { ticketTypeLabel } from './ticketTypeLabel';
import { centsInput, resalePriceUnits, serialResaleArgs } from './serialTicketSchema';
import { saveAdmitDetails } from './prepareAdmit';
import { savedTicketItems, ticketMetadata } from './ticketLibraryModel';
import { TransferTicket } from './TransferTicket';
import { matchingPreparedTicket } from './simpleTicket';
/**
 * Serial-ticket (schema 2/3) buyer and organizer gate UI.
 * Never calls checkIn. Phone export is fragment/QR capability (not sk).
 * Display does not claim on-chain validity.
 */
import { useEffect, useState } from 'react';
import type { Session } from '../midnight/types';
import { sdkOrThrow } from '../midnight/load';
import { cameraScanSupported, Scanner } from '../Scanner';
import { type AdmitCapabilityV2 } from './admitCodec';
import { loadSavedAdmits, upsertSavedAdmit } from './admitStore';

type St = Awaited<ReturnType<Session['state']>>;
type Run = <T>(l: string, f: () => Promise<T>) => Promise<T | undefined>;

const CAPPED = 0, NO_RESALE = 2;

export function schemaIsV2(s: Session, st: St | null | undefined): boolean {
  const v = st?.schemaVersion as unknown;
  return s?.schema === 2 || v === 2 || v === 2n || Number(v) === 2;
}

export function TicketsV2({
  s,
  st,
  run,
  bump,
  evName,
  ttName,
  eventDetails,
  onBrowseEvents,
}: {
  s: Session;
  st: St;
  run: Run;
  bump: () => void;
  evName: (s: Session, id: bigint) => string;
  ttName: (s: Session, id: bigint) => string;
  eventDetails?: (eventId: bigint) => { date?: string; venue?: string; cover?: string };
  onBrowseEvents?: () => void;
}) {
  const rates=useRates();
  const [resale, setResale] = useState<Record<string, string>>({});
  const [phone, setPhone] = useState<{ cap: AdmitCapabilityV2 } | null>(null);
  const [busySerial, setBusySerial] = useState<string | null>(null);
  const owned = (st?.ownedTickets ?? []) as Array<{
    serial: bigint;
    typeId: bigint;
    epoch: bigint;
    hasAdmit: boolean;
  }>;
  const saved = loadSavedAdmits().filter((a) => a.networkId === s.networkId && a.contract === s.contract);
  useEffect(() => {
    if (!st || !eventDetails) return;
    for (const cap of saved) {
      const row=(st.tickets ?? []).find((ticket)=>String(ticket.serial)===cap.serial);
      const type=st.types.find((ticketType: {id:bigint})=>row ? ticketType.id===row.typeId : String(ticketType.id)===cap.typeId);
      const details=type ? eventDetails(type.eventId) : undefined;
      if (details) {
        const enriched = ticketMetadata({ ...details, eventName: evName(s, type!.eventId), ticketName: ticketTypeLabel(ttName(s, type!.id), type!.id, !!(type as any).adultOnly) }, { ...cap, date: cap.eventDate });
        if (enriched.date !== cap.eventDate || enriched.venue !== cap.venue || enriched.cover !== cap.cover || enriched.eventName !== cap.eventName || enriched.ticketName !== cap.ticketName) {
          try { upsertSavedAdmit({ ...cap, eventName: enriched.eventName, ticketName: enriched.ticketName, eventDate: enriched.date, venue: enriched.venue, cover: enriched.cover }); } catch { /* Display still works when local storage is unavailable. */ }
        }
      }
    }
  }, [st, s, eventDetails, evName, ttName]);

  const prepare = async (serial: bigint, typeId: bigint) => {
    const type = st?.types.find((t) => t.id === typeId);
    const savedCap = saved.find((cap) => cap.serial === String(serial));
    const info = ticketMetadata({ ...eventDetails?.(type?.eventId ?? 0n), ticketName: ticketTypeLabel(ttName(s,typeId), typeId, !!(type as any)?.adultOnly), eventName: evName(s,type?.eventId ?? 0n) }, savedCap ? { ...savedCap, date: savedCap.eventDate } : undefined);
    setBusySerial(String(serial));
    const r = await run(`Prepare phone admit #${serial}`, () =>
      s.registerAdmitOnly(serial, { ticketName: info.ticketName, eventName: info.eventName,
        typeId: String(typeId), eventDate: info.date, venue: info.venue, cover: info.cover }),
    ) as Awaited<ReturnType<Session['registerAdmitOnly']>> | undefined;
    setBusySerial(null);
    if (!r) return;
    let cap = r.cap;
    try { cap = saveAdmitDetails(cap, info); } catch { /* Saved capability still works. */ }
    setPhone({ cap });
    bump();
  };

  const list = async (serial: bigint, typeId: bigint, priceStr: string) => {
    const t = st?.types.find((x) => x.id === typeId);
    if (!t) return;
    const mode = Number(t.resale);
    const r = await run(`List serial #${serial}`, () => {
      const quote=quoteUsd(priceStr,rates);
      if(quote.kind!=='ready')throw new Error(quote.message);
      const pr=resalePriceUnits(s.schema, quote);
      if (mode===CAPPED && pr>t.maxResale) throw new Error('Price exceeds this ticket’s resale cap.');
      return s.call('listForResale', serialResaleArgs(s.schema, serial, quote, s.userAddress(), (atoms) => sdkOrThrow().feeOf(atoms)));
    });
    if (r) bump();
  };

  if (!s.contract || !st) return <TicketLibrary items={savedTicketItems(saved)} onBrowseEvents={onBrowseEvents} controls={()=><p className="small muted">Connect to the ticket’s event to manage resale.</p>} />;

  const items = owned.map((ticket) => {
    const type = st.types.find((row: { id: bigint }) => row.id === ticket.typeId);
    const details = type ? eventDetails?.(type.eventId) : undefined;
    const savedCap = saved.find((cap) => cap.serial === String(ticket.serial));
    const info = ticketMetadata({ ...details, eventName: type ? evName(s,type.eventId) : undefined, ticketName: ticketTypeLabel(ttName(s,ticket.typeId), ticket.typeId, !!(type as any)?.adultOnly) }, savedCap ? { ...savedCap, date: savedCap.eventDate } : undefined);
    return { key:`${s.networkId}:${s.contract}:${ticket.serial}`,serial:String(ticket.serial),...info,eventName:info.eventName || 'Saved ticket',ticketName:info.ticketName || 'Admission',
      cap:matchingPreparedTicket(saved,ticket),purchase:loadPurchase(s.networkId,s.contract!,String(ticket.serial)) };
  });
  // Preserve saved capabilities not known to the current ledger, but never advertise known non-owned tickets as current.
  const extra = saved.filter((cap)=>!(st.tickets ?? []).some((ticket: { serial: bigint })=>String(ticket.serial)===cap.serial));
  return <>
    <TicketLibrary items={[...items,...savedTicketItems(extra)]} onBrowseEvents={onBrowseEvents} controls={(item)=>{
      const ticket=owned.find((row)=>String(row.serial)===item.serial);
      if(!ticket)return <p className="small muted">Connect the owning wallet to manage resale.</p>;
      const type=st.types.find((row: {id:bigint})=>row.id===ticket.typeId);
      const mode=type ? Number(type.resale) : NO_RESALE;
      const price=resale[item.serial] ?? (type ? ((s.schema===3 || s.schema===4) ? centsInput(mode===CAPPED ? type.maxResale : type.price) : currentUsdInput(mode===CAPPED ? type.maxResale : type.price,rates)) : '');
      const parsedPrice=quoteUsd(price,rates);
      return <>
        {!item.cap && <button disabled={busySerial===item.serial} onClick={()=>{
          if(!ticket.hasAdmit || confirm('Replace the missing ticket link? Previous copies will stop working.'))void prepare(ticket.serial,ticket.typeId);
        }}>{ticket.hasAdmit ? 'Recover missing ticket link' : 'Prepare ticket'}</button>}
        {mode===NO_RESALE && <p className="small muted">Resale is not allowed for this ticket.</p>}
        {mode!==NO_RESALE && <details className="resell"><summary>Resale options</summary>
          <div className="row"><input aria-label="Resale price in USD" placeholder="USD" value={price} onChange={(e)=>setResale({...resale,[item.serial]:e.target.value})} />
            <button disabled={parsedPrice.kind!=='ready' || (mode===CAPPED && !!type && resalePriceUnits(s.schema,parsedPrice)>type.maxResale)} onClick={()=>list(ticket.serial,ticket.typeId,price)}>List for resale</button></div>
          {parsedPrice.kind!=='ready' && <p role="alert" className="warn">{parsedPrice.message}</p>}
          <p className="small muted">Listing invalidates existing ticket copies.</p>
        </details>}
      </>;
    }} />
    {phone && <PhoneAdmitModal cap={phone.cap} onClose={()=>setPhone(null)} />}
  </>;
}

function PhoneAdmitModal({ cap, onClose }: { cap: AdmitCapabilityV2; onClose: () => void }) {
  return <div className="fullqr"><div className="fq-card"><TransferTicket cap={cap} /><button onClick={onClose}>Done</button></div></div>;
}

export function GateV2(props: GateProps) {
  if (props.s.schema === 4) return <GateV4 {...props} />;
  return <LegacyGateV2 {...props} />;
}
type GateProps = { s: Session; st: St; evName: (s: Session, id: bigint) => string; ttName: (s: Session, id: bigint) => string };
function LegacyGateV2({
  s,
  st,
  evName,
  ttName,
}: {
  s: Session;
  st: St;
  evName: (s: Session, id: bigint) => string;
  ttName: (s: Session, id: bigint) => string;
}) {
  const [code, setCode] = useState('');
  const [r, setR] = useState<any>(null);
  const [b, setB] = useState(false);
  const [cam, setCam] = useState(false);
  const types = st?.types ?? [];
  const [acc, setAcc] = useState('');
  const accept = acc || (types.length ? `t:${types[0].id}` : '');
  const accepted = accept.startsWith('e:')
    ? types.filter((t: any) => `e:${t.eventId}` === accept).map((t: any) => t.id)
    : types.filter((t: any) => `t:${t.id}` === accept).map((t: any) => t.id);

  const verify = async (c = code) => {
    setB(true);
    setR(null);
    try {
      setR(await s.admitAtGate(c, accepted));
    } catch (e: any) {
      setR({ ok: false, reason: String(e?.message ?? e) });
    }
    setB(false);
  };

  if (!s.contract || !st) return <p className="muted">Select an event contract.</p>;
  return (
    <>
      <h2>Check-in</h2>
      <div className="card gate">
        <label>
          Accepted ticket type
          <select value={accept} onChange={(e) => setAcc(e.target.value)}>
            {st.events.map((e: any) => [
              <option key={'e' + e.id} value={`e:${e.id}`}>
                {evName(s, e.id)} — any ticket type
              </option>,
              ...types
                .filter((t: any) => t.eventId === e.id)
                .map((t: any) => (
                  <option key={'t' + t.id} value={`t:${t.id}`}>
                    {evName(s, e.id)} — {ttName(s, t.id)} only
                  </option>
                )),
            ])}
          </select>
        </label>
        <p className="muted">
          Scan a <code>cloaktix:admit:v2</code> code. You must be the event organizer. This calls on-chain{' '}
          <code>admit</code> (not v1 checkIn). Serial alone cannot consume.
        </p>
        <div className="row">
          <input
            placeholder="cloaktix:admit:v2?…"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <button className="primary" disabled={b || !code} onClick={() => verify()}>
            Admit
          </button>
          <button
            onClick={() => {
              if (cameraScanSupported()) setCam(true);
            }}
          >
            Scan
          </button>
        </div>
        {cam && (
          <Scanner
            onClose={() => setCam(false)}
            onCode={(c) => {
              setCam(false);
              setCode(c);
              verify(c);
            }}
          />
        )}
        {r && (
          <div className={r.ok ? 'verdict ok' : 'verdict ko'}>
            {r.ok ? (
              <>
                ✓ Admitted — {ttName(s, r.typeId)}
                <small>
                  serial {String(r.serial)} · tx {String(r.txId).slice(0, 12)}…
                </small>
              </>
            ) : (
              <>
                ✕ Refused<small>{r.reason}</small>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}

/**
 * Buy one unit + prepare admit (schema 2).
 * All work runs inside `run` so failures surface in Activity/err (never a silent no-op).
 * Uses sync sdkOrThrow — Vite mangled the old dynamic load-then-sdkOrThrow pattern
 * by resolving nowAsOf/feeOf from the load module (which does not export them).
 */
export async function buyTicketV2Flow(
  s: Session,
  run: Run,
  t: { id: bigint; adultOnly: boolean },
  names: { ticketName: string; eventName: string },
) {
  return run(`Buy+admit prepare ${names.ticketName}`, async () => {
    if (!s) throw new Error('Connect a wallet before buying.');
    if (s.schema !== 2) {
      throw new Error(
        'This event is schema v2 but the session is not (?schema=2 missing). Re-open the share link that includes schema=2&network=…, then connect again.',
      );
    }
    if (typeof (s as any).buyAndPrepareAdmit !== 'function') {
      throw new Error('buyAndPrepareAdmit is not available on this session (reload the app).');
    }
    const { nowAsOf } = sdkOrThrow();
    const r = await s.buyAndPrepareAdmit({
      typeId: t.id,
      adult: !!t.adultOnly,
      asOf: t.adultOnly ? nowAsOf() : undefined,
      ticketName: names.ticketName,
      eventName: names.eventName,
    });
    // Activity log expects txId; buy+prepare returns buyTxId/admitTxId.
    const txId = (r as any)?.admitTxId ?? (r as any)?.buyTxId;
    return { ...r, txId };
  });
}
