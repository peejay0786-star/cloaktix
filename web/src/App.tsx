import { organizerEventFromLocation, organizerEventHref, ownedOrganizerEvent, organizerEventStats } from './organizer/eventRoute';
import { DoorsStaff, StaffIdentity } from './multigate/DoorsStaff';
import { checkInstallAssets } from './installCheck';
import { DEMO_COVERS, parseEventDetails, formatPublishedUsd, type EventDetails } from './catalog/model';
import { usePublicCatalog, PublishedListings, PublicEventDetail, EventInformation, TicketTrust, PurchaseNextSteps, type CatalogState } from './catalog/PublicCatalog';
import { EventCreateForm, EventEditForm } from './EventCreateForm';
import { buyerVisibleEvents, collapseDuplicateTypes, duplicateTypeName } from './catalog/buyerView';
import { eventListedInCatalog, publishExistingEventListing, publishMeta, publishMetaResult, ticketListingValues } from './catalog/listingPublish';
import { listingSaveError } from './catalog/listingErrors';
import { PendingButton, WalletPendingButton, PENDING_SAVE, PENDING_WALLET } from './PendingButton';
import { adultBuyBlock, ageStatusFor, asOfNow, AGE_CHANGED_EVENT, AGE_CHECK_ANCHOR } from './midnight/ageCredential';
import { errorChainText, humanizeTxError } from './txError';
import { loadOrganizerPayouts, saveOrganizerPayouts, eventIdFromCircuitResult } from './organizerPayoutStore';
import { publicEventMeta } from './payoutAddresses';
import { PurchaseButton } from './Checkout';
import { maxQty } from './multiBuyQty';
import { multiBuyProgressLabel } from './midnight/multiBuyV3';
import { prewarmV3Circuit } from './midnight/prewarm.ts';
import { b64u, shareLinkEventMeta } from './shareMeta.ts';
import { useRates } from './useRates';
import { quoteUsd, currentUsdInput } from './rates';
import { recordPurchase } from './purchaseReceipts';
import { createActionGate } from './midnight/actionGate';
import { Dialog } from './Dialog';
import { Price } from './Price';
import { connectionWait } from './midnight/connectionWait';
import { buyResaleAndPrepare, preparePurchasedResale, type ResaleOutcome } from './v2/resalePurchase';
import { TransferTicket } from './v2/TransferTicket';
import { loadSavedAdmits } from './v2/admitStore';
import { SavedPhoneTickets } from './v2/SavedPhoneTickets';
import { isAdmitCapabilityV2, type AdmitCapabilityV2 } from './v2/admitCodec';
import { lazy, Suspense, useEffect, useMemo, useState, useRef } from 'react';
import type { Session, Verdict, Wallet } from './midnight/types';
import { AGE_NOTE, discoverWallets } from './midnight/lite';
import { loadSdk, sdkOrThrow } from './midnight/load';
import { proofLog } from './midnight/proofLog';
import { Qr } from './Qr';
import { cameraScanSupported, Scanner } from './Scanner';
import { encodePassQr } from './passCodec';
import {
  lastContract,
  passesForNetwork,
  rememberContract,
  upsertSavedPass,
  type SavedPass,
} from './passStore';
import { parseAdmitFromLocation } from './v2/admitCodec';
const AdmitPhoneView=lazy(()=>import('./v2/AdmitPhoneView').then(m=>({default:m.AdmitPhoneView})));
import { schemaUsesSerialTickets } from './v2/serialTicketSchema';
import { saveAdmitDetails } from './v2/prepareAdmit';
import { GateV2, TicketsV2, buyTicketV2Flow, schemaIsV2 } from './v2/TicketsGateV2';
import { resolveSchema } from './midnight/schema';
import { planV3DeploySteps, loadV3DeployProgress } from './midnight/deployV3Plan';
import { configuredRateV3Contract } from './midnight/contract-v3';
import { buildEventShareUrl } from './v2/shareLinks';
import { addTicketTypeArgs, listForResaleArgs } from './midnight/circuitArgs';
import { v3PurchaseProps } from './v3/purchaseProps';

const NETWORK = new URLSearchParams(location.search).get('network') ?? (import.meta.env.VITE_NETWORK as string) ?? 'undeployed';
const SEARCH = new URLSearchParams(location.search);
const URL_CONTRACT = SEARCH.get('contract');
const preferTicketsStart = SEARCH.get('start') === 'tickets' || location.hash.slice(1) === 'tickets';
function resolveContractHint(): string | null {
  const schema = resolveSchema();
  return URL_CONTRACT || lastContract(NETWORK, schema) || (schema === 3 ? configuredRateV3Contract(NETWORK) : null);
}
// Public metadata may be read from the configured v3 contract without changing wallet schema defaults.
function resolveCatalogContractHint(): string | null { return resolveContractHint() || configuredRateV3Contract(NETWORK); }
// FEE_BPS is used only inside feeOf(...) contract args — never surface fee % or fee address in UI.
const CAPPED = 0, UNLIMITED = 1, NO_RESALE = 2; // ResaleMode enum in the contract
const resaleLabel = (t: { resale: unknown; maxResale: bigint }) => Number(t.resale) === CAPPED ? 'capped resale' : Number(t.resale) === UNLIMITED ? 'resale: no cap' : 'no resale';
const short = (s: string, n = 6) => (s.length > 2 * n + 3 ? `${s.slice(0, n + 4)}…${s.slice(-n)}` : s);
const now = () => new Date().toLocaleTimeString('en-US');
const meta = {
  get: (k: string) => {try {return JSON.parse(localStorage.getItem('cloaktix:meta:' + k) ?? 'null');} catch {return null;}},
  set: (k: string, v: unknown) => localStorage.setItem('cloaktix:meta:' + k, JSON.stringify(v)),
};
// Per-event share link: /e/<eventId>?contract=…&m=<base64url JSON {e:{name,date,venue}, t:{typeId:name}}>.
// Event/ticket names are off-chain (demo: localStorage), so the link carries them for buyers on another device.
const unb64u = (x: string) => new TextDecoder().decode(Uint8Array.from(atob(x.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0)));
// /organizer = organizer space (wallet login); public pages never show organizer controls.
const orgHref = () => { const q = new URLSearchParams(location.search); q.delete('m'); return `/organizer${q.size ? '?' + q : ''}`; };
// Public metadata store (/meta on the same server): labels are visible to every visitor, not only this browser.
const pullMeta = async (c?: string | null) => {
  if (!c) return false; let changed = false;
  try { const r = await fetch(`/meta?c=${c}`); if (!r.ok) return false; const j = await r.json();
    for (const id of j.keys ?? []) KEY_EVENTS.add(String(id));
    for (const k of ['ev', 'tt'] as const) for (const [id, v] of Object.entries(j[k] ?? {})) {
      const key = `${c}:${k}:${id}`;
      if (JSON.stringify(meta.get(key)) !== JSON.stringify(v)) { meta.set(key, v); changed = true; } }
  } catch { /* offline: local/link metadata still works */ }
  return changed;
};
// Writes are signed with the organizer's metadata key; the server checks it against the on-chain organizer.
// One-time: register that key on-chain via createEvent(payout = pk) (organizer = H(sk) is set by the contract's proof).
const KEY_EVENTS = new Set<string>(); // key-registration events (not real events): hidden everywhere
const ROUTE_ORG = /^\/organizer\/?$/.test(location.pathname);
const ROUTE_EVENT: bigint | null = (() => { const m = location.pathname.match(/^\/e\/(\d+)\/?$/); return m ? BigInt(m[1]) : null; })();
(() => {
  const q = new URLSearchParams(location.search); const c = q.get('contract'); const m = q.get('m');
  if (ROUTE_EVENT === null || !c || !m) return;
  try {
    const j = JSON.parse(unb64u(m));
    if (j.e && !meta.get(`${c}:ev:${ROUTE_EVENT}`)) meta.set(`${c}:ev:${ROUTE_EVENT}`, j.e);
    for (const [id, name] of Object.entries(j.t ?? {})) if (!meta.get(`${c}:tt:${id}`)) meta.set(`${c}:tt:${id}`, { name });
  } catch { /* malformed link: on-chain data still works */ }
})();
type St = Awaited<ReturnType<Session['state']>>;
type Log = { label: string; txId?: string; ms?: number; ok: boolean; err?: string; at: string };
type Tab = 'home' | 'events' | 'organizer' | 'tickets' | 'gate';
type Pass = { typeId: string; passId: string; txId: string; at: string };
const DEMO_ART = DEMO_COVERS;
const coverFor = (id: bigint | string, m?: { cover?: string } | null) => m?.cover || DEMO_ART[Number(id) % DEMO_ART.length];

export function App() {
  const [admitCap,setAdmitCap]=useState(()=>parseAdmitFromLocation(location.hash));
  useEffect(()=>{
    const update=()=>setAdmitCap(parseAdmitFromLocation(location.hash));
    window.addEventListener('hashchange',update);window.addEventListener('popstate',update);
    return ()=>{window.removeEventListener('hashchange',update);window.removeEventListener('popstate',update);};
  },[]);
  return admitCap ? <Suspense fallback={<div className="card empty" role="status">Opening your ticket…</div>}><AdmitPhoneView initial={admitCap} /></Suspense> : <BuyerApp />;
}

function BuyerApp() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [s, setS] = useState<Session | null>(null);
  const [picker, setPicker] = useState(false);
  const [org, setOrg] = useState(ROUTE_ORG);
  const h0 = location.hash.slice(1);
  const initialBuyerTab = (): Tab => {
    if (ROUTE_EVENT !== null) return 'events';
    if (h0 === 'tickets' || preferTicketsStart) return 'tickets';
    if (h0 === 'events') return 'events';
    return 'home';
  };
  const [tab, setTab0] = useState<Tab>(ROUTE_ORG ? (h0 === 'gate' ? 'gate' : 'organizer') : initialBuyerTab());
  const [savedTick, setSavedTick] = useState(0);
  const [evRoute, setEvRoute] = useState<bigint | null>(ROUTE_EVENT);
  const [managedEvent, setManagedEvent] = useState<bigint | null>(() => organizerEventFromLocation(location));
  const [st, setSt] = useState<St>(null);
  const savedPasses = useMemo(
    () => passesForNetwork(NETWORK, resolveContractHint()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [savedTick, s],
  );
  // Leaving the event page: back to the full app, keeping ?contract (and ?network) but dropping the link metadata.
  const setTab = (t: Tab) => {
    const toOrg = t === 'organizer' || t === 'gate';
    if (evRoute !== null || managedEvent !== null || new URLSearchParams(location.search).has('event') || toOrg !== org) {
      const q = new URLSearchParams(location.search); q.delete('m'); q.delete('event');
      // Prefer retaining contract from session or last hint without hardcoding a demo address.
      if (!q.get('contract')) {
        const c = s?.contract || resolveContractHint();
        if (c) q.set('contract', c);
      }
      history.pushState({}, '', `${toOrg ? '/organizer' : '/'}${q.size ? '?' + q : ''}#${t}`); setEvRoute(null); setOrg(toOrg);
    } else if (location.hash !== `#${t}`) {
      history.pushState({}, '', `${location.pathname}${location.search}#${t}`);
    }
    setManagedEvent(null);
    setTab0(t);
  };
  // In-app event page: keep contract / schema / network, drop share metadata.
  const openEventPage = (id: bigint, publishedContract?: string) => {
    const contract = s?.contract || publishedContract || resolveContractHint();
    if (!contract) return;
    const schema = (s?.schema === 4 ? 4 : s?.schema === 3 ? 3 : s?.schema === 2 ? 2 : publishedContract === configuredRateV3Contract(NETWORK) ? 3 : resolveSchema()) as 1 | 2 | 3 | 4;
    const url = buildEventShareUrl({
      origin: location.origin,
      eventId: id,
      contract,
      networkId: s?.networkId || NETWORK,
      schema,
    });
    const u = new URL(url);
    history.pushState({}, '', `${u.pathname}${u.search}`);
    setEvRoute(id);
    setManagedEvent(null);
    setOrg(false);
    setTab0('events');
  };
  const openOrganizerEvent = async (id: bigint) => {
    if (!s) return;
    let state = st;
    if (!ownedOrganizerEvent(state, id)) {
      try { state = await s.state(); } catch { return; }
      if (!ownedOrganizerEvent(state, id)) return;
      setSt(state);
    }
    const href = organizerEventHref({ search: location.search, eventId: id, contract: s.contract, networkId: s.networkId, schema: s.schema });
    history.pushState({}, '', href);
    setEvRoute(null); setManagedEvent(id); setOrg(true); setTab0('organizer');
  };
  const [busy, setBusy] = useState<string | null>(null);
  const [logs, setLogs] = useState<Log[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [bootErr, setBootErr] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [longConnect, setLongConnect] = useState(false);
  const connectLock = useRef(false);
  const actionGate=useRef(createActionGate()).current;
  const openWalletPicker = () => {
    try { setWallets(discoverWallets()); setPicker(true); }
    catch { setBootErr('Wallet detection failed. Unlock your extension and try again.'); }
  };
  const [, force] = useState(0);

  useEffect(() => { const t = setTimeout(() => {try{setWallets(discoverWallets());}catch{setBootErr('Wallet detection failed. Open Connect wallet to retry.');}}, 300); return () => clearTimeout(t); }, []);
  useEffect(() => {
    const restorePage = () => {
      const organizer = /^\/organizer\/?$/.test(location.pathname);
      const event = location.pathname.match(/^\/e\/(\d+)\/?$/);
      const hash = location.hash.slice(1);
      setOrg(organizer);
      setManagedEvent(organizerEventFromLocation(location));
      setEvRoute(event ? BigInt(event[1]) : null);
      const ticketsStart = !hash && new URLSearchParams(location.search).get('start') === 'tickets';
      let next: Tab = 'home';
      if (organizer) next = hash === 'gate' ? 'gate' : 'organizer';
      else if (event || hash === 'events') next = 'events';
      else if (hash === 'tickets' || ticketsStart) next = 'tickets';
      setTab0(next);
    };
    window.addEventListener('popstate', restorePage);
    window.addEventListener('hashchange', restorePage);
    return () => {
      window.removeEventListener('popstate', restorePage);
      window.removeEventListener('hashchange', restorePage);
    };
  }, []);
  useEffect(() => {
    if (managedEvent === null || !s || !st || ownedOrganizerEvent(st, managedEvent)) return;
    // Unknown / not-owned / staff-only deep links return to a safe organizer landing.
    history.replaceState({}, '', organizerEventHref({ search: location.search, eventId: null }));
    setManagedEvent(null);
  }, [managedEvent, s, st]);
  // Background refresh: never blocks the UI (balances may lag a few seconds while the wallet resyncs).
  const refresh = async (x = s) => {
    if (!x) return;
    try {
      const [n] = await Promise.all([x.state(), pullMeta(x.contract)]);
      // Empty ledger (no events/tickets yet) is success — never treat missing arrays as a refresh failure.
      if (!n) { setSt(null); return; }
      const events = Array.isArray(n.events) ? n.events.filter((e) => !e.isKey && !KEY_EVENTS.has(String(e.id))) : [];
      setSt({ ...n, events });
      setErr((prev) => (prev && prev.startsWith('Could not refresh ticket status') ? null : prev));
    } catch (e: any) {
      const msg = String(e?.message ?? e);
      // Schema/network mismatch stays visible; transient empty/decode on a fresh deploy should not block Organizer.
      if (/events|types|Cannot read|undefined/i.test(msg)) {
        console.warn('ticket status refresh soft-fail', e);
        return;
      }
      setErr('Could not refresh ticket status. Check your connection and try again; do not repurchase.');
    }
    // Wallet balances are never fetched or shown: this screen is shown at the door.
  };
  useEffect(() => { pullMeta(new URLSearchParams(location.search).get('contract')).then((ch) => ch && force((n) => n + 1)); }, []);
  useEffect(() => { if (!s) return; refresh(); const i = setInterval(() => refresh(), 6000); return () => clearInterval(i); }, [s]);
  // Promote session-scoped prepared passes into the offline store (no chain calls).
  useEffect(() => {
    if (!s?.contract) return;
    rememberContract(s.networkId, s.contract, s.schema);
    const sessionPasses: Pass[] = meta.get(`passes:${s.networkId}:${s.contract}:${s.accountId}`) ?? [];
    for (const p of sessionPasses) {
      if (!p?.passId || !p?.txId) continue;
      const tMeta = meta.get(`${s.contract}:tt:${p.typeId}`);
      const typeRow = st?.types.find((t) => String(t.id) === p.typeId);
      const eMeta = typeRow ? meta.get(`${s.contract}:ev:${typeRow.eventId}`) : null;
      upsertSavedPass({
        v: 1,
        networkId: s.networkId,
        contract: s.contract,
        typeId: String(p.typeId),
        passId: String(p.passId).toLowerCase(),
        txId: String(p.txId),
        at: String(p.at ?? new Date().toISOString()),
        accountId: s.accountId,
        ticketName: tMeta?.name,
        eventName: eMeta?.name,
      });
    }
    setSavedTick((n) => n + 1);
  }, [s, st]);

  const own = (x: Session) => `own:${x.networkId}:${x.contract}:${x.accountId}`;
  // Chain balances when readable (same identity on another device = same tickets), else local counts.
  const owned: Record<string, number> = s ? (st as any)?.held ?? meta.get(own(s)) ?? {} : {};
  const bump = (typeId: bigint, d: number) => { if (!s) return; const o = { ...owned, [String(typeId)]: (owned[String(typeId)] ?? 0) + d }; meta.set(own(s), o); force((n) => n + 1); };
  const passKey = (x: Session) => `passes:${x.networkId}:${x.contract}:${x.accountId}`;
  const passes: Pass[] = s ? meta.get(passKey(s)) ?? [] : [];
  const addPass = (p: Pass) => {
    if (!s || !s.contract) return;
    meta.set(passKey(s), [p, ...passes]);
    const tMeta = meta.get(`${s.contract}:tt:${p.typeId}`);
    const typeRow = st?.types.find((t) => String(t.id) === p.typeId);
    const eMeta = typeRow ? meta.get(`${s.contract}:ev:${typeRow.eventId}`) : null;
    upsertSavedPass({
      v: 1,
      networkId: s.networkId,
      contract: s.contract,
      typeId: p.typeId,
      passId: p.passId.toLowerCase(),
      txId: p.txId,
      at: p.at,
      accountId: s.accountId,
      ticketName: tMeta?.name,
      eventName: eMeta?.name,
    });
    rememberContract(s.networkId, s.contract, s.schema);
    setSavedTick((n) => n + 1);
    force((n) => n + 1);
  };

  // Busy only while proving + balancing + submitting; submitCallTx resolves once the tx is in a block.
  async function run<T>(label: string, f: () => Promise<T>): Promise<T | undefined> {
    const outcome=await actionGate(async()=>{
    setBusy(label); setErr(null);
    try {
      const r: any = await f();
      setLogs((l) => [{ label, txId: r?.txId, ms: r?.ms, ok: true, at: now() }, ...l]);
      void refresh(); return r;
    } catch (e: any) {
      const raw = errorChainText(e); const m = humanizeTxError(raw); setErr(m);
      console.error(`[CloakTix] ${label} failed:`, raw);
      setLogs((l) => [{ label, ok: false, err: raw.slice(0, 900), at: now() }, ...l]);
    } finally { setBusy(null); }
    });
    if(outcome.kind==='busy'){setErr('Another wallet action is already in progress. Wait for it to finish.');return;}
    return outcome.value;
  }
  async function connect(w: Wallet) {
    if (connectLock.current) return;
    connectLock.current=true;setConnecting(true);setLongConnect(false);
    const clearWait=connectionWait(()=>setLongConnect(true));
    setPicker(false);
    setBootErr(null);
    const x = await run(`Connect ${w.name}`, async () => {
      let Session: Awaited<ReturnType<typeof loadSdk>>['Session'];
      try {
        ({ Session } = await loadSdk());
      } catch (e: any) {
        const msg = String(e?.message ?? e);
        setBootErr(`Midnight SDK / WASM failed to load: ${msg}. The UI still works; wallet actions need a successful SDK load (try disabling Brave Shields, or use Chrome).`);
        throw e;
      }
      try {
        return await Session.connect(w, NETWORK);
      } catch (e: any) {
        // The in-app error box only renders once connected, so surface connect failures in the global banner.
        setBootErr(`Wallet connection failed (${w.name}): ${String(e?.message ?? e)}. Unlock the wallet, check it is on the ${NETWORK} network, approve the request, then try again.`);
        throw e;
      }
    });
    clearWait();connectLock.current=false;setConnecting(false);setLongConnect(false);
    if (x) {
      setS(x);
      if (x.contract) {try{rememberContract(x.networkId, x.contract, x.schema);}catch{setBootErr('Connected, but this browser could not remember the contract. Keep your event link.');}}
      refresh(x);
    }
  }

  const showActivity = !!(s && org && logs.length);
  const staffOnly = st?.schemaVersion === 4 && st.staffOnly;
  return (
    <div className={showActivity ? 'app has-activity' : 'app'}>
      <a className="skip-link" href="#main">Skip to content</a>
      {connecting && <div className="busy" role="status">Connecting… {longConnect && 'Still waiting. Check the wallet extension and pending permission request. No automatic retry will be made.'}</div>}
      {bootErr && <div className="error boot-error" onClick={() => setBootErr(null)} role="alert">{bootErr}</div>}
      <header className="top">
        <a className="brand" href="/#home" onClick={(e) => { e.preventDefault(); setTab('home'); }}><img src="/brand/cloaktix_lockup_transparent_on-dark.svg" alt="CloakTix" /></a>
        {evRoute === null ? <nav aria-label={org ? "Organizer navigation" : "Main navigation"}>{org && <span className="kicker hide-sm">Organizer</span>}{((org ? (staffOnly ? ['gate'] : ['organizer', 'gate']) : ['home', 'events', 'tickets']) satisfies Tab[]).map((t) => (
          <button key={t} className={(staffOnly && tab === 'organizer' ? 'gate' : tab) === t ? 'on' : ''} aria-current={(staffOnly && tab === 'organizer' ? 'gate' : tab) === t ? 'page' : undefined} onClick={() => setTab(t)}>{{ home: 'Home', events: 'Events', organizer: 'My events', tickets: 'My tickets', gate: 'Check-in' }[t]}</button>))}
        </nav> : <nav className="slim"><button type="button" className="nav-back" onClick={() => setTab('events')}>← Back to events</button><button type="button" onClick={() => setTab('tickets')}>My tickets</button></nav>}
        <div className="right">
          {!org && <a className="orglink" href={orgHref()} onClick={(e) => { e.preventDefault(); setTab('organizer'); }}>For organizers</a>}
          <span className="net hide-sm">{NETWORK === 'undeployed' ? 'Local devnet' : NETWORK}</span>
          {s ? <div className="chip"><span className="dot" />{s.walletName.replace('Dev wallet · ', '')}<b>Connected</b></div>
            : <button className="primary" onClick={openWalletPicker}>Connect wallet</button>}
        </div>
      </header>

      {!s && evRoute !== null && <EventLanding id={evRoute} onConnect={openWalletPicker} />}
      {!s && org && <section className="hero center">
        <img src="/brand/cloaktix_icon_transparent.svg" alt="" className="mark" />
        <p className="kicker">Organizer gate</p>
        <h1>Organizer <span className="amber">space</span></h1>
        <p>Connect the wallet you organize with. Your organizer identity comes from it, and you only see the events you created. On-chain, only you can add ticket types or open and close sales for them.</p>
        <button className="primary big" onClick={openWalletPicker}>Connect wallet</button>
      </section>}
      {evRoute === null && !org && tab === 'home' && <HomeScreen connected={!!s} onBrowseEvents={() => setTab('events')} onTickets={() => setTab('tickets')} savedCount={savedPasses.length} />}
      {!s && evRoute === null && !org && tab === 'events' && <DisconnectedEvents onConnect={openWalletPicker} onOpenEvent={openEventPage} />}
      {!s && evRoute === null && !org && tab === 'tickets' && (
        <> {(loadSavedAdmits().length > 0 || savedPasses.length === 0) ? <main id="main"><SavedPhoneTickets onConnect={openWalletPicker} onBrowseEvents={()=>setTab('events')} /></main> : <SavedPassesOffline
          passes={savedPasses}
          onConnect={openWalletPicker}
          onRefresh={() => setSavedTick((n) => n + 1)}
        />}</>
      )}

      {picker && <Dialog label="Connect a Midnight wallet" onClose={()=>setPicker(false)}><div className="card">
        <h3>Connect a Midnight wallet</h3>
        {wallets.length === 0 && <p className="muted">No wallet detected. Install 1AM (recommended) or Lace, then reload the page.</p>}
        {wallets.map((w) => <button key={w.rdns} className="wallet" onClick={() => connect(w)}>
          {w.icon && <img src={w.icon} alt="" />}<span>{w.name}</span>{w.dev ? <em>devnet</em> : /1am/i.test(w.name) ? <em>recommended</em> : null}</button>)}
        <p className="fine">1AM first, Lace as a fallback. This site never asks for a password or a key.</p>
        <button type="button" className="ghost wide" onClick={()=>setPicker(false)}>Close</button>
      </div></Dialog>}

      {s && tab !== 'home' && <main id="main" className={tab === 'events' && evRoute === null ? 'buyer-catalog-main' : undefined}>
        {busy && <div className="busy" role="status"><span className="spin" />{busy}. Approve in your wallet when prompted. A proof may run in the browser first; then we wait for confirmation on the network.{/18\+/.test(busy) && ' The 18+ age proof is a larger circuit: allow about 1–2 minutes.'}</div>}
        {err && <div className="error" onClick={() => setErr(null)} role="alert">{err.slice(0, 300)}</div>}
        {evRoute !== null && <EventPage s={s} st={st} run={run} bump={bump} id={evRoute} openTickets={() => setTab('tickets')} />}
        {evRoute === null && tab === 'events' && <Events s={s} st={st} run={run} bump={bump} openEvent={openEventPage} />}
        {evRoute === null && tab === 'organizer' && (staffOnly ? <GateV2 s={s} st={st} evName={evName} ttName={ttName} /> : managedEvent !== null ? <OrganizerEvent key={String(managedEvent)} s={s} st={st} run={run} eventId={managedEvent} onBack={() => setTab('organizer')} onOrganize={openOrganizerEvent} /> : <Organizer s={s} st={st} run={run} setBusy={setBusy} onOrganize={openOrganizerEvent} />)}
        {evRoute === null && tab === 'tickets' && (schemaUsesSerialTickets(s, st)
          ? <TicketsV2 s={s} st={st} run={run} bump={() => force((n) => n + 1)} evName={evName} ttName={ttName} eventDetails={(id) => meta.get(`${s.contract}:ev:${id}`) ?? {}} onBrowseEvents={() => setTab('events')} />
          : <Tickets s={s} st={st} run={run} owned={owned} bump={bump} passes={passes} addPass={addPass} onBrowseEvents={() => setTab('events')} />)}
        {evRoute === null && tab === 'gate' && (schemaUsesSerialTickets(s, st)
          ? <GateV2 s={s} st={st} evName={evName} ttName={ttName} />
          : <Gate s={s} st={st} />)}
        {org && <Activity logs={logs} s={s} />}
      </main>}
      <footer className="site-foot">{org
        ? <a href={`/${location.search}#events`} onClick={(e) => { e.preventDefault(); setTab('events'); }}>← Events</a>
        : <a href={orgHref()} onClick={(e) => { e.preventDefault(); setTab('organizer'); }}>For organizers</a>}
        <span> · CloakTix · Midnight Preview demo, no real funds · <span className="muted">not audited</span></span>
      </footer>
    </div>
  );
}

type P = { s: Session; st: St; run: <T>(l: string, f: () => Promise<T>) => Promise<T | undefined>; setBusy?: (v: string | null) => void };
type Run = P['run'];
const evName = (s: Session, id: bigint) => meta.get(`${s.contract}:ev:${id}`)?.name ?? `Event #${id}`;
const ttName = (s: Session, id: bigint) => meta.get(`${s.contract}:tt:${id}`)?.name ?? `Ticket #${id}`;

function NoContract({ s }: { s: Session }) {
  const sch = s.schema;
  return <div className="card empty"><h3>No CloakTix schema v{sch} contract on this network</h3>
    <p className="muted">An organizer must deploy schema v{sch} first (at <code>/organizer?schema={sch}</code>), or open a <code>?schema={sch}&amp;contract=…</code> link. Each schema stores its addresses separately. An address of another schema will not open here.</p>
    {s.contract && <code>{s.contract}</code>}
    <p style={{ marginTop: 18 }}><button className="primary" onClick={() => { location.assign(orgHref() + (orgHref().includes('?') ? '&' : '?') + 'schema=' + sch); }}>For organizers · deploy schema v{sch} →</button></p></div>;
}

export function EventsHeader() {
  return <header className="page-header catalog-header">
    <p className="kicker">Ticket catalog</p>
    <h2>Events</h2>
    <p className="page-sub muted">Pay with NIGHT on Midnight. Your wallet stays private.</p>
    <TicketTrust />
  </header>;
}

export function DisconnectedEvents({ onConnect, onOpenEvent, initialCatalog }: { onConnect: () => void; onOpenEvent?: (id:bigint,contract?:string)=>void; initialCatalog?:CatalogState }) {
  const {state,reload}=usePublicCatalog(resolveCatalogContractHint(),initialCatalog);
  const hasListings=state.kind==='ready'&&state.catalog.events.length>0;
  return <main id="main" className="events-page">
    <EventsHeader />
    <PublishedListings state={state} onConnect={onConnect} onOpenEvent={onOpenEvent}/>
    {state.kind==='unavailable'&&<button type="button" className="catalog-retry" onClick={reload}>Retry public listings</button>}
    {!hasListings&&<div className="catalog-intro">
      <section className="card catalog-connect" aria-labelledby="catalog-connect-title">
        <div className="catalog-symbol" aria-hidden="true"><svg viewBox="0 0 48 48" fill="none"><path d="M10 12h28v8a4 4 0 0 0 0 8v8H10v-8a4 4 0 0 0 0-8v-8Z" /><path d="M29 16v3m0 4v3m0 4v2" /></svg></div>
        <p className="kicker">Live catalog</p>
        <h3 id="catalog-connect-title">Connect to see available events</h3>
        <p className="muted">Connect a Midnight wallet to load all events and ticket options from the network. No purchase is made when you connect.</p>
        <button className="primary big" onClick={onConnect}>Connect wallet</button>
        <p className="catalog-wallet-note">1AM recommended · Lace supported</p>
      </section>
      <aside className="catalog-context" aria-labelledby="catalog-context-title">
        <div className="catalog-preview-art"><img src={DEMO_ART[5]} alt="" /><span>Demo artwork · not a live listing</span></div>
        <div className="catalog-context-copy">
          <h3 id="catalog-context-title">Before you buy</h3>
          <ul><li>Compare ticket options and prices in one place.</li><li>Pay with NIGHT on Midnight. Your wallet stays private.</li><li>Check each organizer's entry and resale rules.</li></ul>
        </div>
      </aside>
    </div>}
    <ol className="catalog-path" aria-label="Buying steps">
      <li><span>01</span><div><b>Connect here</b><p>Load the live catalog from Midnight.</p></div></li>
      <li><span>02</span><div><b>Choose your ticket</b><p>Review the price before you buy.</p></div></li>
      <li><span>03</span><div><b>Open My tickets</b><p>Keep your pass ready for the entrance.</p></div></li>
    </ol>
    <p className="catalog-disclaimer">{hasListings?'Organizer-published listings are not live ledger state. Availability and current prices refresh after connection.':'No live events are shown until you connect. Demo artwork is a preview, not a list of events for sale.'}</p>
  </main>;
}

function eventMetaLine(m?: { date?: string; venue?: string } | null): string {
  return [m?.date, m?.venue]
    .filter((part): part is string => typeof part === 'string' && !!part.trim() && !/^[-–—]+$/.test(part.trim()))
    .map((part) => part.trim()).join(' · ');
}

export function Events({ s, st, run, bump, openEvent }: P & { bump: (t: bigint, d: number) => void; openEvent: (id: bigint) => void }) {
  const rates=useRates();
  const [purchaseNotice,setPurchaseNotice]=useState(false);
  const [resaleResult, setResaleResult] = useState<ResaleOutcome | null>(null);
  const resaleLock = useRef(false);
  const [resaleBusy, setResaleBusy] = useState(false);
  const buyResale = async (listing: NonNullable<St>['listings'][number]) => {
    if (resaleLock.current || resaleResult?.kind === 'needs-prepare') return;
    resaleLock.current = true; setResaleBusy(true);
    try {
      const result = await run('Buy resale and prepare ticket', async () => {
        const serial = 'serial' in listing ? listing.serial : undefined;
        if (typeof serial !== 'bigint') throw new Error('Missing resale serial. Refresh before buying.');
        const ledger = await s.state();
        const ticket = ledger?.tickets?.find((row: { serial: bigint }) => row.serial === serial);
        if (!ticket) throw new Error('Resale ticket not found. Refresh before buying.');
        const type = st?.types.find((row: { id: bigint; adultOnly: boolean; eventId: bigint }) => row.id === listing.typeId);
        return buyResaleAndPrepare(s, {listingId:listing.id,serial,typeId:listing.typeId,listedEpoch:ticket.epoch,
          adult:!!type?.adultOnly,asOf:sdkOrThrow().nowAsOf(),ticketName:ttName(s,listing.typeId),eventName:evName(s,type?.eventId ?? 0n)});
      });
      if (result) { setResaleResult(result); if(s.contract)recordPurchase(s.networkId,s.contract,String(result.receipt.serial),listing.price,rates); bump(listing.typeId, 1); }
    } finally { resaleLock.current = false; setResaleBusy(false); }
  };
  const retryResalePrepare = async () => {
    if (resaleLock.current || !resaleResult || resaleResult.kind !== 'needs-prepare') return;
    resaleLock.current = true;setResaleBusy(true);
    try {
      const result = await run('Prepare purchased ticket', () => preparePurchasedResale(s,resaleResult.receipt));
      if (result) setResaleResult(result);
    } finally {resaleLock.current=false;setResaleBusy(false);}
  };
  if (!s.contract) return <><EventsHeader /><NoContract s={s} /></>;
  if (!st) return <><EventsHeader /><div className="card empty" role="status"><h3>Loading events…</h3><p className="muted">Reading the live catalog from Midnight.</p></div></>;
  const adultTypes = st.types.some((t) => t.adultOnly);
  // CT-POLISH-3: key registrations and events with no ticket types are not shown to buyers.
  const visible = buyerVisibleEvents(st.events, st.types, KEY_EVENTS);
  return <section className="events-catalog">
    <EventsHeader />
    {purchaseNotice&&<div className="card done"><PurchaseNextSteps/></div>}
    {adultTypes && <AgeCheck s={s} run={run} />}
    {visible.length === 0 && <div className="card empty">
      <h3>No events yet</h3>
      <p className="muted">When an organizer opens a sale, it shows up here. Organizers deploy and create events in the organizer space.</p>
      <a className="orglink" href={orgHref()}>Open organizer space →</a>
    </div>}
    <div className="grid catalog-grid">{visible.map((e) => <EventCard key={String(e.id)} s={s} st={st} run={run} bump={bump} e={e} openEvent={openEvent} onBought={()=>setPurchaseNotice(true)} />)}</div>
    {st.listings.length > 0 ? <>
      <h2>Resale <span className="muted small">policy set by the organizer</span></h2>
      <div className="grid catalog-resale-grid">{st.listings.map((l) => <div className="card listing" key={String(l.id)}>
        <div><b>{ttName(s, l.typeId)}</b><p className="muted">Listing #{String(l.id)}{(l as any).serial != null ? ` · serial ${String((l as any).serial)}` : ''} · {evName(s, st.types.find((t) => t.id === l.typeId)?.eventId ?? 0n)}</p></div>
        {l.mine ? <WalletPendingButton run={run} label={`Cancel listing #${l.id}`} action={async () => { const r = await s.call('buyResale', [l.id]); if (r) bump(l.typeId, 1); }}>Withdraw</WalletPendingButton>
          : <PurchaseButton amount={l.price} disabled={resaleBusy || resaleResult?.kind === 'needs-prepare'}
            onOpen={s.schema === 3 ? () => prewarmV3Circuit(st.types.find((t) => t.id === l.typeId)?.adultOnly ? 'buyResaleAdult' : 'buyResale') : undefined}
            legacyNightPurchase={async () => {
            if (schemaIsV2(s, st)) { await buyResale(l); return; }
            const r = await run(`Buy resale #${l.id}`, () => (st.types.find((t) => t.id === l.typeId)?.adultOnly ? s.call('buyResaleAdult', [l.id, sdkOrThrow().nowAsOf()]) : s.call('buyResale', [l.id])));
            if (r) bump(l.typeId, 1);
          }} />}
      </div>)}</div>
    </> : (visible.length > 0 ? <p className="muted small resale-quiet">No resale listings right now.</p> : null)}
    {resaleResult && <div className="card">{resaleResult.kind === 'ready'
      ? <TransferTicket cap={resaleResult.cap} />
      : <><h3>Ticket #{String(resaleResult.receipt.serial)} purchased</h3><p>Preparation did not finish. Your purchase is kept. Do not buy again.</p><p className="small muted">{resaleResult.error}</p><PendingButton disabled={resaleBusy} pending={resaleBusy} pendingLabel={PENDING_WALLET} onClick={retryResalePrepare}>Prepare my ticket</PendingButton></>}</div>}
  </section>;
}

type Ev = NonNullable<St>['events'][number];
// CT-AGE-CRED: re-render 18+ Buy buttons when a credential is added or removed.
function useAgeStatus(s: Session, st: St) {
  const [, force] = useState(0);
  useEffect(() => { const f = () => force((n) => n + 1); window.addEventListener(AGE_CHANGED_EVENT, f); return () => window.removeEventListener(AGE_CHANGED_EVENT, f); }, []);
  return ageStatusFor(s.age, asOfNow(), st?.ageIssuer ?? null);
}
export function AgeGate({ message }: { message: string }) {
  return <div className="buy-action age-gate"><p className="note" role="note">{message}</p>
    <button type="button" onClick={() => document.getElementById(AGE_CHECK_ANCHOR)?.scrollIntoView({ block: 'center', behavior: 'smooth' })}>Get age credential</button></div>;
}
export function EventCard({ s, st, run, bump, e, onBought, openEvent }: P & { bump: (t: bigint, d: number) => void; e: Ev; onBought?: (r?: any) => void; openEvent?: (id: bigint) => void }) {
  const rates = useRates();
  const ageStatus = useAgeStatus(s, st);
  const m = meta.get(`${s.contract}:ev:${e.id}`);
  const cover = coverFor(e.id, m);
  const demoCover = !m?.cover || m?.demoArt === 'true';
  const details = eventMetaLine(m);
  const hasTickets = !!st?.types.some((t) => t.eventId === e.id);
  const href = openEvent && s.contract ? buildEventShareUrl({
    origin: location.origin, eventId: e.id, contract: s.contract, networkId: s.networkId || NETWORK,
    schema: s.schema,
  }) : undefined;
  const go = (ev: { preventDefault(): void }) => { if (!openEvent) return; ev.preventDefault(); openEvent(e.id); };
  return <div className="card event">
    <div className="cover">{href
      ? <a className="ev-cover-link" href={href} onClick={go}><img src={cover} alt="" />{demoCover && <span className="badge demo-art">Demo art</span>}</a>
      : <><img src={cover} alt="" />{demoCover && <span className="badge demo-art">Demo art</span>}</>}
    </div>
    <div className="event-content">
    <div className="evhead"><div>{href
      ? <a className="ev-title-link" href={href} onClick={go}><h3>{evName(s, e.id)}</h3></a>
      : <h3>{evName(s, e.id)}</h3>}
      {details && <p className="muted">{details}</p>}</div><span className={e.open && hasTickets ? 'tag ok' : 'tag'}>{!hasTickets ? 'No tickets yet' : e.open ? 'On sale' : 'Closed'}</span></div>
    {/* CT-POLISH-3: identical types (same name, price and rules) show as one option; buys go to the first type with stock. */}
    {collapseDuplicateTypes(st!.types.filter((x) => x.eventId === e.id), (id) => ttName(s, id)).map((g) => { const t = g.primary; return <div className="ttype" key={g.key}>
      <div className="ticket-type-details"><b>{ttName(s, t.id)}</b>{t.adultOnly && <span className="tag age">18+</span>}<span className="muted">{String(g.sold)}/{String(g.supply)} sold · {resaleLabel(t)}</span></div>
      {s.schema === 4 ? <p className="note">Schema 4 local preview · purchasing unavailable.</p> : t.adultOnly && adultBuyBlock(ageStatus) ? <AgeGate message={adultBuyBlock(ageStatus)!} /> : (() => { const v3 = v3PurchaseProps({ schema: s.schema, networkId: s.networkId, contract: s.contract, eventId: e.id, typeId: t.id, priceUsdCents: (t as any).priceUsdCents ?? t.price });
      const names = { ticketName: ttName(s, t.id), eventName: evName(s, e.id) };
      const afterV3 = (r: any) => { if (!r) return; if ('cap' in r && r.cap) { try { r.cap = saveAdmitDetails(r.cap, m ?? {}); } catch { /* Ticket remains usable if storage is unavailable. */ } } if (s.contract && typeof r.serial === 'bigint' && typeof r.nightPaid === 'bigint') recordPurchase(s.networkId, s.contract, String(r.serial), r.nightPaid, rates); bump(t.id, 1); onBought?.(r); };
      // CT-MULTI-BUY: 2..4 tickets in one transaction (v3 primary sale, non-adult). Qty 1 keeps the single-buy path.
      const afterMulti = (r: any) => {
        const caps: AdmitCapabilityV2[] = [];
        for (const tk of r?.tickets ?? []) {
          let cap = tk.cap; try { cap = saveAdmitDetails(tk.cap, m ?? {}); } catch { /* Ticket remains usable if storage is unavailable. */ }
          caps.push(cap);
          if (s.contract && typeof tk.serial === 'bigint' && typeof r.nightPaidEach === 'bigint') recordPurchase(s.networkId, s.contract, String(tk.serial), r.nightPaidEach, rates);
        }
        bump(t.id, caps.length || r?.qty || 1); onBought?.({ cap: caps[0], caps, qty: r?.qty });
      };
      const multi = v3 && !t.adultOnly ? { max: maxQty(t, { open: e.open, multiOk: true }), buy: async (qty: number, onProgress: (text: string) => void) => {
        let failure: unknown = null;
        const r = await run(`Buy ${qty} × ${names.ticketName} (NIGHT)`, async () => {
          try {
            return await (s as any).buyNightV3Multi({ typeId: t.id, qty, ...names, priceUsdCents: v3.usdCents, feeBps: BigInt((st as any)?.feeBps ?? 300n),
              onProgress: (p: any) => onProgress(multiBuyProgressLabel(p)) });
          } catch (err) { failure = err; throw err; }
        });
        if (!r) throw failure ?? new Error('Nothing was bought.');
        afterMulti(r);
      } } : undefined;
      return <PurchaseButton amount={t.price} usdCents={v3?.usdCents} disabled={!e.open || t.sold >= t.supply} multi={multi}
        onOpen={v3 ? () => prewarmV3Circuit(t.adultOnly ? 'buyTicketAdult' : 'buyTicket') : undefined}
        legacyNightPurchase={async () => {
        try {
          if (v3) {
            const r = await run(`Buy ${names.ticketName} (NIGHT)`, () => (s as any).buyNightV3({
              typeId: t.id, adult: !!t.adultOnly, asOf: t.adultOnly ? sdkOrThrow().nowAsOf() : undefined, ...names,
              priceUsdCents: v3.usdCents, feeBps: BigInt((st as any)?.feeBps ?? 300n) }));
            afterV3(r);
            return;
          }
          if (schemaIsV2(s, st)) {
            const r = await buyTicketV2Flow(s, run, t, { ticketName: ttName(s, t.id), eventName: evName(s, e.id) });
            if (r) { if ('cap' in r && r.cap) { try { r.cap = saveAdmitDetails(r.cap, m ?? {}); } catch { /* Ticket remains usable if storage is unavailable. */ } } if(s.contract && typeof r.serial==='bigint')recordPurchase(s.networkId,s.contract,String(r.serial),t.price,rates); bump(t.id, 1); onBought?.(r); }
            return;
          }
          const r = await run(`Buy ${ttName(s, t.id)}`, () => (t.adultOnly ? s.call('buyTicketAdult', [t.id, sdkOrThrow().nowAsOf()]) : s.call('buyTicket', [t.id])));
          if (r) { bump(t.id, 1); onBought?.(r); }
        } catch (err: any) {
          // buyTicketV2Flow should never throw outside run; belt-and-suspenders so Buy is never a silent no-op.
          console.error('Buy click failed', err);
          alert(String(err?.message ?? err));
        }
      }} />; })()}
    </div>; })}
    {st!.types.every((t) => t.eventId !== e.id) && <p className="muted small">No tickets on sale yet.</p>}
    </div>
  </div>;
}

const shareUrl = (s: Session, st: St, id: bigint) => {
  const t = Object.fromEntries((st?.types ?? []).filter((x) => x.eventId === id).map((x) => [String(x.id), ttName(s, x.id)]));
  const schema = s.schema;
  return buildEventShareUrl({
    origin: location.origin,
    eventId: id,
    contract: s.contract!,
    networkId: s.networkId || NETWORK,
    schema,
    metaB64: b64u(JSON.stringify({ e: shareLinkEventMeta(meta.get(`${s.contract}:ev:${id}`)), t })),
  });
};
const copy = async (x: string) => { try { await navigator.clipboard.writeText(x); return true; } catch { return false; } };
function CopyShare({ s, st, id }: { s: Session; st: St; id: bigint }) {
  const [ok, setOk] = useState<boolean | null>(null);
  return <button onClick={async () => { const r = await copy(shareUrl(s, st, id)); setOk(r); if (!r) prompt('Copy this link', shareUrl(s, st, id)); setTimeout(() => setOk(null), 2000); }}>{ok ? 'Link copied ✓' : 'Copy share link'}</button>;
}
function ShareLink({ s, st, id }: { s: Session; st: St; id: bigint }) {
  const url = shareUrl(s, st, id);
  return <div className="row"><input readOnly value={url} onFocus={(e) => e.target.select()} /><CopyShare s={s} st={st} id={id} /></div>;
}

// Shared event link, before connecting: event details from the link + one clear action.
function EventLanding({ id, onConnect }: { id: bigint; onConnect: () => void }) {
  const {state}=usePublicCatalog(resolveCatalogContractHint());
  const event=state.kind==='ready'?state.catalog.events.find(e=>e.id===String(id)):undefined;
  const c = new URLSearchParams(location.search).get('contract'); const m = c ? meta.get(`${c}:ev:${id}`) : null;
  const details = eventMetaLine(m);
  if(event)return <PublicEventDetail event={event} onConnect={onConnect}/>;
  return <main id="main" className="hero evland">
    <div className="event-landing-art"><img src={coverFor(id, m)} alt="" />{(!m?.cover||m?.demoArt==='true') && <span className="badge">Demo art</span>}</div>
    <p className="kicker">Event details</p>
    <h1>{m?.name ?? `Event #${id}`}</h1>
    {details && <p className="evmeta">{details}</p>}
    <button className="primary big" onClick={onConnect}>Connect wallet to buy</button>
    <p className="fine">Use 1AM (recommended). Your wallet address is never shown to the organizer or at the door.</p>
    <EventInformation description={m?.description} rules={[]}/>
  </main>;
}

// Shared event link, connected: only that event, buy buttons, then a direct path to the ticket.
function EventPage({ s, st, run, bump, id, openTickets }: P & { bump: (t: bigint, d: number) => void; id: bigint; openTickets: () => void }) {
  const [bought, setBought] = useState<null | { needsPrepare?: boolean; cap?: AdmitCapabilityV2; caps?: AdmitCapabilityV2[] }>(null);
  const [boughtIx, setBoughtIx] = useState(0);
  if (!s.contract) return <NoContract s={s} />;
  if (!st) return <p className="muted">Loading event…</p>;
  // CT-POLISH-3: a key registration (or an event with nothing to buy) is not a buyer page.
  const e = buyerVisibleEvents(st.events, st.types, KEY_EVENTS).find((x) => x.id === id);
  if (s.schema === 4) return <section className="card"><h2>{evName(s, id)}</h2><p className="note">Schema 4 is local-only. Purchasing is unavailable until a separate v4 deployment and proving keys are authorized. Preview purchases remain schema 3.</p></section>;
  if (!e) return <div className="card empty"><h3>Event not found</h3><p className="muted">This event is not on sale here. Check the link with the organizer.</p></div>;
  const adult = st.types.some((t) => t.eventId === id && t.adultOnly);
  const v2 = schemaIsV2(s, st);
  return <div className="evpage">
    {adult && <AgeCheck s={s} run={run} />}
    <EventCard s={s} st={st} run={run} bump={bump} e={e} onBought={(r) => { setBoughtIx(0); setBought({ needsPrepare: !!r?.needsPrepare || r?.prepareOk === false, cap: isAdmitCapabilityV2(r?.cap) ? r.cap : undefined, caps: Array.isArray(r?.caps) ? r.caps.filter(isAdmitCapabilityV2) : undefined }); }} />
    <EventInformation description={meta.get(`${s.contract}:ev:${id}`)?.description} rules={collapseDuplicateTypes(st.types.filter(t=>t.eventId===id),(x)=>ttName(s,x)).map(g=>g.primary).map(t=>`${ttName(s,t.id)}: ${Number(t.resale)===CAPPED&&s.schema===3?`capped resale, maximum ${formatPublishedUsd(t.maxResale.toString())}`:resaleLabel(t)}`)}/>
    {bought&&<PurchaseNextSteps/>}
    {bought?.caps && bought.caps.length > 1 ? <div className="card multi-bought">
      <h3>✓ {bought.caps.length} tickets bought</h3>
      <p className="muted">Each ticket has its own entry QR and is saved separately in My tickets. Send each one to the person who will use it.</p>
      <div className="row" role="tablist">{bought.caps.map((_, i) => <button key={i} role="tab" aria-selected={i === boughtIx} className={i === boughtIx ? 'primary' : 'ghost'} onClick={() => setBoughtIx(i)}>Ticket {i + 1}</button>)}</div>
      <TransferTicket key={boughtIx} cap={bought.caps[Math.min(boughtIx, bought.caps.length - 1)]} title={`Ticket ${Math.min(boughtIx, bought.caps.length - 1) + 1} of ${bought.caps.length} is ready`} details={meta.get(`${s.contract}:ev:${id}`) ?? {}} />
      <button className="ghost wide" onClick={openTickets}>View all in My tickets</button>
    </div> : bought?.cap ? <div className="card"><TransferTicket cap={bought.cap} details={meta.get(`${s.contract}:ev:${id}`) ?? {}} /></div> : bought && <div className="card done"><h3>✓ Ticket bought</h3><p className="muted">{bought.needsPrepare
      ? 'Purchase landed, but preparing the phone admit link did not finish. Open My tickets to prepare it. Do not buy again.'
      : (v2 || s.schema === 3)
        ? 'It is in My tickets. Open it there to prepare or show the phone admit link.'
        : 'It is in My tickets. At the door, open it and tap “Show entry QR”.'}</p><button className="primary big" onClick={openTickets}>View my ticket</button></div>}
  </div>;
}

// Buyer checkout: 18+ credential from the test issuer, kept on this device; proven in zero knowledge at purchase.
function AgeCheck({ s, run }: { s: Session; run: P['run'] }) {
  const [birth, setBirth] = useState('1990-04-12');
  const [, force] = useState(0);
  const status = s.ageStatus;
  useEffect(() => { const f = () => force((n) => n + 1); window.addEventListener(AGE_CHANGED_EVENT, f); return () => window.removeEventListener(AGE_CHANGED_EVENT, f); }, []);
  return <div className="card agecheck" id={AGE_CHECK_ANCHOR}><h3>Age check for 18+ tickets</h3>
    <p className="muted">18+ tickets (primary and resale) require a zero-knowledge age proof. The contract only learns “adult: yes”, never your birthdate or the credential.</p>
    <p className="note">{AGE_NOTE}</p>
    <div className="row"><label>Birthdate<input type="date" value={birth} onChange={(e) => setBirth(e.target.value)} /></label>
      <WalletPendingButton className="primary" run={run} label="Get age credential" action={async () => { await s.getAgeCredential(birth); force((n) => n + 1); return {}; }}>Get demo age credential</WalletPendingButton>
      {status !== 'none' && <button onClick={async () => { await s.clearAgeCredential(); force((n) => n + 1); }}>Remove credential</button>}</div>
    <p className="small">Credential: <span className={status === 'adult' ? 'tag ok' : 'tag'}>{status === 'none' ? 'none' : status === 'adult' ? 'held (18+)' : 'held (under 18)'}</span></p>
  </div>;
}

export function Organizer({ s, st, run, setBusy, onOrganize }: P & { onOrganize?: (id: bigint) => void }) {
  const [paste, setPaste] = useState('');
  const [ev, setEv] = useState<EventDetails>({name:'',date:'',venue:'',cover:'',description:'',demoArt:'false'});
  const [listingMessage,setListingMessage]=useState('');
  const mine = st?.events.filter((e) => e.mine && !e.isKey) ?? [];
  const [created, setCreated] = useState<bigint | null>(null);
  const [deployedAddress, setDeployedAddress] = useState<string | null>(null);
  if (s.schema === 4 && st?.schemaVersion !== 4) return <><h2>Doors &amp; staff</h2><StaffIdentity s={s} /><p className="note">Schema 4 is local-only. A separate schema-4 contract and proving keys are required; existing Preview events remain schema 3. No deployment or transaction is available here.</p></>;
  if (st?.schemaVersion === 4 && st.staffOnly) return <GateV2 s={s} st={st} evName={evName} ttName={ttName} />;
  return <>
    <h2>My events</h2>
    <div className="organizer-event-list">{mine.map(event => {
      const stats = organizerEventStats(st, event.id);
      return <article className="card myev organizer-event-summary" key={String(event.id)}>
        <div className="myev-h"><div><h3>{evName(s, event.id)}</h3><p className="small muted">{eventMetaLine(meta.get(`${s.contract}:ev:${event.id}`))}</p></div><span className={event.open ? 'tag ok' : 'tag'}>{event.open ? 'On sale' : 'Sales closed'}</span></div>
        <p className="organizer-summary-stats"><span>{String(stats.sold)} / {String(stats.capacity)} sold</span><span>{stats.types.length} ticket types</span><span>{stats.admitted} admitted</span></p>
        <OrganizeEventButton s={s} eventId={event.id} onOrganize={onOrganize} />
      </article>;
    })}</div>
    {mine.length === 0 && <p className="muted">No events yet for this wallet.</p>}
    {s.schema === 4 && <StaffIdentity s={s} />}
    {s.schema !== 4 && (!s.contract || s.schema === 3) && <div className="card"><h3>1 · Deploy the CloakTix platform{s.schema === 3 ? ' (schema v3 · USD quotes / NIGHT)' : s.schema === 2 ? ' (schema v2)' : ''}</h3>
      {s.schema === 3
        ? <>
            <p className="muted">Deploy a <b>new</b> schema v3 contract (USD quotes, paid in NIGHT) on Midnight Preview with <b>your</b> 1AM wallet. The live Preview rate signer public key is baked in. Does <b>not</b> touch live v2 <code>7fd12c11…</code>. Keep <code>?schema=2</code> for existing tickets.</p>
            <p className="note">Block-limit safe: <b>{planV3DeploySteps().totalSteps} wallet confirmations</b> (1 create + verifier-key inserts). After each approval the app waits for on-chain inclusion before the next 1AM prompt (avoids “pending transaction”). If interrupted, click Deploy again. Resume skips steps already on-chain.</p>
            {s.contract ? <p className="note">This deploys a <b>new</b> contract. Existing events stay on the current address until the new one is wired in. Do not create a replacement event until then.</p> : null}
            {(() => { const p = loadV3DeployProgress(NETWORK); return p && p.status !== 'done' && p.address ? <p className="muted small">Resume available: step {p.step}/{p.totalSteps} ({p.message || p.status}).</p> : null; })()}
          </>
        : s.schema === 2
        ? <p className="muted">Deploy a <b>new</b> schema v2 contract on Midnight Preview with this 1AM wallet. Unique ticket serials + phone admit. This does <b>not</b> convert the existing v1 contract. Keep <code>?schema=1</code> for old tickets.</p>
        : <p className="muted">Deploy once for this wallet. Your CloakTix identity (H(sk)) becomes admin (emergency pause, trusted age issuer). Trusted age issuer: the local Passport stub.</p>}
      {s.schema !== 2 && s.schema !== 3 && <p className="muted small">For unique serials / phone admit without burn-on-prepare, open <a href={'/organizer?schema=2&network=' + encodeURIComponent(NETWORK)}>Organizer · schema v2</a>.</p>}
      <p className="note">{AGE_NOTE}</p>
      <WalletPendingButton className="primary" run={run} label={s.schema === 3 ? 'Deploy schema v3 (batched)' : s.schema === 2 ? 'Deploy schema v2 contract (Preview)' : 'Deploy contract'} action={async () => {
        if (s.schema === 3) {
          (s as any)._onDeployStep = (e: { step: number; totalSteps: number; label: string; detail?: string }) => {
            setBusy?.(`${e.label}${e.detail ? ': ' + e.detail : ''}`);
          };
        }
        try {
          const deployed = await s.deploy(s.address);
          if (s.schema === 3 && deployed?.address) setDeployedAddress(deployed.address);
          return deployed;
        }
        finally { if (s.schema === 3) (s as any)._onDeployStep = undefined; }
      }}>{s.schema === 3 ? `Deploy schema v3 (${planV3DeploySteps().totalSteps} steps)` : s.schema === 2 ? 'Deploy schema v2 (Preview)' : 'Deploy'}</WalletPendingButton>
      {deployedAddress ? <p className="note">New contract: <code style={{wordBreak:'break-all'}}>{deployedAddress}</code>. Copy this full address and send it.</p> : null}
      <p className="muted small" style={{marginTop:12}}>or paste a contract address for <b>this</b> schema only (v1 and v2 addresses stay separate)</p>
      <div className="row"><input placeholder="contract address" value={paste} onChange={(e) => setPaste(e.target.value)} /><button onClick={() => { s.setContract(paste.trim()); location.reload(); }}>Use</button></div>
    </div>}
    {s.contract && s.schema !== 4 && <>
      <div className="card"><h3>Create an event</h3>
        <p className="muted">Complete public details are required. They are signed by you and checked against the on-chain organizer before appearing in the public catalog. Live availability is confirmed after connection.</p>
        <EventCreateForm network={NETWORK} initial={ev} onSubmit={async (values) => {
          const details=parseEventDetails(values);if(!details)throw new Error('Complete the event details before creating it.');
          const r = await run('Create event', () => s.call('createEvent', [s.userAddress(values.nightPayout)]));
          if (!r) throw new Error('Event creation did not finish. Check My events and Activity before retrying.');
          const payload = publicEventMeta(details);
          meta.set(`${s.contract}:ev:${r.result}`, payload);
          if (s.contract) saveOrganizerPayouts(s.networkId || NETWORK, s.contract, eventIdFromCircuitResult(r.result) ?? String(r.result), { nightPayout: values.nightPayout });
          const evWrite=await publishMetaResult(s, run, 'ev', r.result as bigint, details);
          setListingMessage(evWrite.ok?'Public listing saved. Add ticket types to publish ticket options.':('Created on Midnight, but the public listing was not saved. '+listingSaveError(evWrite)+' Do not create a duplicate event.'));
          setCreated(r.result as bigint);
          setEv(details);
        }} />
        {listingMessage&&<p role="status" className="note">{listingMessage}</p>}
        {created !== null && <div className="sharebox"><b>✓ {evName(s, created)} created.</b> NIGHT payout is set on Midnight for this event. Open Organize event to add ticket types and manage entry. Buyer share link:<ShareLink s={s} st={st} id={created} /><OrganizeEventButton s={s} eventId={created} onOrganize={onOrganize} /></div>}
      </div>

      <p className="muted small">Contract: <code>{s.contract}</code> · share link: <code>?contract={short(s.contract, 8)}</code></p>
    </>}
  </>;
}


function PublicListingPanel({ s, st, run, eventId }: P & { eventId: bigint }) {
  const details = parseEventDetails(meta.get(`${s.contract}:ev:${eventId}`) ?? {});
  const types = (st?.types ?? []).filter((type) => type.eventId === eventId);
  const [status, setStatus] = useState<'checking' | 'listed' | 'unlisted' | 'unavailable'>('checking');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const refresh = async () => {
    if (!s.contract) { setStatus('unavailable'); return; }
    try {
      const response = await fetch(`/catalog?c=${encodeURIComponent(s.contract)}`, { credentials: 'same-origin', headers: { accept: 'application/json' } });
      if (!response.ok) { setStatus('unavailable'); return; }
      const catalog = await response.json();
      setStatus(eventListedInCatalog(catalog, eventId) ? 'listed' : 'unlisted');
    } catch { setStatus('unavailable'); }
  };
  useEffect(() => { void refresh(); }, [s.contract, eventId]);
  const publish = async () => {
    if (!details || !types.length || s.schema === 4 || busy) return;
    setBusy(true); setMessage('');
    try {
      let lastFail: Parameters<typeof listingSaveError>[0] = { ok: false };
      const result = await publishExistingEventListing({
        eventId,
        details,
        types,
        ticketValue: (type) => ticketListingValues(s.schema, type, ttName(s, type.id), meta.get(`${s.contract}:tt:${type.id}`)),
        publish: async (kind, id, values) => {
          const write = await publishMetaResult(s, run, kind, id, values);
          if (write.ok) { meta.set(`${s.contract}:${kind}:${id}`, kind === 'ev' ? details : values); return true; }
          lastFail = write; return false;
        },
      });
      if (result === 'ok') { setMessage('Public listing saved. Visitors can see it on Events without connecting a wallet.'); await refresh(); }
      else if (result === 'options-pending') { setMessage('Event details saved, but some ticket options are not published yet. Retry Publish to public catalog; do not recreate the event or ticket types.'); await refresh(); }
      else setMessage(listingSaveError(lastFail));
    } finally { setBusy(false); }
  };
  const blocked = s.schema === 4 || !details || types.length === 0 || busy;
  return <section className="card organizer-public-listing" aria-labelledby="organizer-public-listing-heading">
    <h2 id="organizer-public-listing-heading">Public catalog listing</h2>
    <p>Visitors who have not connected a wallet only see events you publish here. This does not create a new event and does not change existing tickets.</p>
    <p className="note" role="status">{status === 'checking' ? 'Checking whether this event is in the public catalog…' : status === 'listed' ? 'Listed in the public catalog.' : status === 'unlisted' ? 'Not listed in the public catalog yet.' : 'Public catalog status is unavailable right now.'}</p>
    {!details && <p className="note">Complete public details first with Edit details, then publish. Do not create the event again.</p>}
    {details && types.length === 0 && <p className="note">Add a ticket type first. The public catalog hides events that have no published ticket options.</p>}
    <PendingButton type="button" className="primary" pending={busy} pendingLabel={PENDING_SAVE} disabled={blocked} onClick={() => void publish()}>Publish to public catalog</PendingButton>
    {s.schema === 4 && <p className="note">Schema 4 is local-only. Public listing stays disabled.</p>}
    {message && <p className="note" role="status">{message}</p>}
  </section>;
}

export function OrganizeEventButton({ s, eventId, onOrganize }: { s: Session; eventId: bigint; onOrganize?: (id: bigint) => void }) {
  return <button className="primary organize-event-button" onClick={() => {
    if (onOrganize) onOrganize(eventId);
    else location.assign(organizerEventHref({ search: location.search, eventId, contract: s.contract, networkId: s.networkId, schema: s.schema }));
  }}>Organize event</button>;
}

/** Organizer management is event-scoped, never the public buyer /e/:id page. */
export function OrganizerEvent({ s, st, run, eventId, onBack, onOrganize }: P & { eventId: bigint; onBack(): void; onOrganize?: (id: bigint) => void }) {
  if (st?.schemaVersion === 4 && st.staffOnly) return <GateV2 s={s} st={st} evName={evName} ttName={ttName} />;
  if (!st) return <><button onClick={onBack}>← Back to My events</button><p role="status">Loading organizer event…</p></>;
  const event = ownedOrganizerEvent(st, eventId);
  if (!event) return <><p className="note" role="status">Event not available for this organizer. Back to My events.</p><Organizer s={s} st={st} run={run} onOrganize={onOrganize} /></>;
  let savedPayout: string | undefined;
  try { savedPayout = s.contract ? loadOrganizerPayouts(s.networkId || NETWORK, s.contract, String(eventId))?.nightPayout.trim() : undefined; }
  catch { /* Unavailable private storage is a missing record, never a reason to infer chain bytes. */ }
  const info = meta.get(`${s.contract}:ev:${eventId}`);
  const stats = organizerEventStats(st, eventId);
  const used = (id: bigint) => st.schemaVersion === 1 ? [...st.checkIns.values()].filter(type => type === id).length : st.tickets.filter(ticket => ticket.typeId === id && ticket.status === 2).length;
  return <section className="organizer-event-page">
    <button className="nav-back" onClick={onBack}>← Back to My events</button>
    <p className="kicker">Organize event</p>
    <div className="door-heading"><h1>{evName(s, eventId)}</h1><span className={event.open ? 'tag ok' : 'tag'}>{event.open ? 'On sale' : 'Sales closed'}</span></div>
    {eventMetaLine(info) && <p className="muted">{eventMetaLine(info)}</p>}
    {info?.description && <p className="event-organizer-description">{info.description}</p>}
    <div className="row organizer-event-actions">
      {s.schema === 4 ? <button disabled title="Schema 4 is local-only">Edit details</button> : <EditDetails s={s} run={run} id={eventId} />}
      <WalletPendingButton disabled={s.schema === 4} run={run} label={event.open ? 'Close sales' : 'Open sales'} action={() => s.call('setSalesOpen', [eventId, !event.open])}>{event.open ? 'Close sales' : 'Open sales'}</WalletPendingButton>
      <CopyShare s={s} st={st} id={eventId} />
    </div>
    {s.schema === 4 && <p className="note">Schema 4 is a local implementation, not live. All on-chain submissions and deployment remain disabled.</p>}
    <section className="card organizer-payout" aria-labelledby="organizer-payout-heading">
      <h2 id="organizer-payout-heading">NIGHT payout</h2>
      {savedPayout ? <><code className="organizer-payout-address">{savedPayout}</code><p className="note" role="note">This address was set at creation. NIGHT payments for this event go here. It cannot be changed.</p></>
        : <p className="note" role="note">The NIGHT payout address was set at creation and cannot be changed. It is not saved on this device.</p>}
      <p className="small muted">Organizer-only private record. Never included in buyer pages, public metadata or share links.</p>
    </section>
    <PublicListingPanel s={s} st={st} run={run} eventId={eventId} />
    <details className="card"><summary>Buyer share link</summary><ShareLink s={s} st={st} id={eventId} /></details>
    <section className="card"><h2>Tickets &amp; capacity</h2><p className="organizer-summary-stats"><span>{String(stats.sold)} / {String(stats.capacity)} sold</span><span>{stats.admitted} admitted</span></p>
      {stats.types.length === 0 ? <p className="muted">No ticket types yet. Add one below for this event.</p> : <div className="organizer-table-scroll"><table className="stats"><thead><tr><th>Ticket type</th><th>Price</th><th>Sold / capacity</th><th>Admitted</th></tr></thead><tbody>{stats.types.map(type => <tr key={String(type.id)}><td>{ttName(s, type.id)}{type.adultOnly && <span className="tag age">18+</span>}</td><td><Price amount={s.schema === 3 || s.schema === 4 ? undefined : type.price} usdCents={s.schema === 3 || s.schema === 4 ? String(type.price) : undefined} /></td><td>{String(type.sold)} / {String(type.supply)}</td><td>{used(type.id)}</td></tr>)}</tbody></table></div>}
    </section>
    {collapseDuplicateTypes(stats.types, (id) => ttName(s, id)).some((g) => g.members.length > 1) && <p className="note" role="note">Some ticket types have the same name, price and rules. Buyers see them as one option, and sales fill the lowest-numbered type first. Existing tickets keep their type.</p>}
    <OrganizerTicketType key={String(eventId)} s={s} st={st} run={run} eventId={eventId} />
    {st.schemaVersion === 4 ? <div className="card"><DoorsStaff s={s} st={st} eventId={eventId} run={run} ttName={id => ttName(s, id)} /></div> : <p className="note">Doors &amp; staff requires a separate schema-4 contract. Current schema-{s.schema} events retain organizer-only Check-in.</p>}
  </section>;
}

function OrganizerTicketType({ s, st, run, eventId }: P & { eventId: bigint }) {
  const rates = useRates();
  const [tt, setTt] = useState({ name: 'General admission', price: '10', supply: '100', resale: '0', cap: '12', adult: false });
  const ttEvent = String(eventId);
  const priceInput = quoteUsd(tt.price || '0', rates);
  const capInput = quoteUsd(tt.cap || '0', rates);
  const [listingMessage, setListingMessage] = useState('');
  const [adding, setAdding] = useState(false);
  // CT-POLISH-3: one name per event. On-chain types cannot be removed, so a duplicate is blocked before signing.
  const dupName = duplicateTypeName(tt.name, eventId, st?.types ?? [], (id) => ttName(s, id));
  return <>      <div className="card"><h3>Add a ticket type</h3><p className="small muted">For {evName(s, eventId)} only.</p><fieldset className="event-type-fields" disabled={s.schema === 4}>
        <div className="row3">
          <label>Ticket name<input value={tt.name} onChange={(e) => setTt({ ...tt, name: e.target.value })} /></label>
          <label>Price (USD)<input value={tt.price} onChange={(e) => setTt({ ...tt, price: e.target.value })} /></label>
          <label>Quantity<input value={tt.supply} onChange={(e) => setTt({ ...tt, supply: e.target.value })} /></label>
          <label>Resale<select value={tt.resale} onChange={(e) => setTt({ ...tt, resale: e.target.value })}>
            <option value="0">Capped (max price)</option><option value="1">Unlimited (no cap)</option><option value="2">No resale</option></select></label>
          {tt.resale === '0' && <label>Max resale price (USD)<input value={tt.cap} onChange={(e) => setTt({ ...tt, cap: e.target.value })} /></label>}
          <label className="check"><input type="checkbox" checked={tt.adult} onChange={(e) => setTt({ ...tt, adult: e.target.checked })} /> 18+ (age-restricted)</label>
          {tt.adult && <p className="note">{AGE_NOTE}</p>}
        </div>
        {dupName && <p role="alert" className="warn">A ticket type named “{dupName}” already exists for this event. Ticket types cannot be deleted on Midnight, so use a different name.</p>}
        <PendingButton className="primary" pending={adding} pendingLabel={PENDING_WALLET} disabled={!tt.name.trim() || !!dupName || !ttEvent || priceInput.kind!=='ready' || (tt.resale==='0' && capInput.kind!=='ready') || adding} onClick={async () => {
          if (adding) return;
          setAdding(true);
          try {
          const r = await run('Add ticket type', async () => {
            if (duplicateTypeName(tt.name, eventId, st?.types ?? [], (id) => ttName(s, id))) throw new Error('A ticket type with this name already exists for this event.');
            const quote=quoteUsd(tt.price,rates),cap=quoteUsd(tt.cap,rates);
            if(quote.kind!=='ready')throw new Error(quote.message);
            if(tt.resale==='0' && cap.kind!=='ready')throw new Error(cap.message);
            const priceUnits = s.schema === 3 ? quote.cents : quote.atoms;
            const maxResaleUnits = tt.resale==='0' && cap.kind==='ready'
              ? (s.schema === 3 ? cap.cents : cap.atoms)
              : 0n;
            const response=await s.call('addTicketType', addTicketTypeArgs(s.schema, {
              eventId: BigInt(ttEvent),
              priceUnits,
              feeAtoms: s.schema === 3 ? 0n : sdkOrThrow().feeOf(quote.atoms),
              supply: BigInt(tt.supply),
              resale: Number(tt.resale),
              maxResaleUnits,
              adultOnly: tt.adult,
            }));
            return {...response,usdCents:quote.cents.toString(),maxResaleUsdCents:tt.resale==='0'&&cap.kind==='ready'?cap.cents.toString():undefined};
          });
          if (r) { const publishedType={name:tt.name,usdCents:r.usdCents,resaleSummary:tt.resale==='0'?(r.maxResaleUsdCents?`Capped resale, maximum ${formatPublishedUsd(r.maxResaleUsdCents)}`:'Capped resale, maximum confirmed after connection'):tt.resale==='1'?'Unlimited resale':'No resale'}; meta.set(`${s.contract}:tt:${r.result}`, publishedType); const write=await publishMetaResult(s, run, 'tt', r.result as bigint, publishedType); setListingMessage(write.ok?'Ticket options published. Live availability is confirmed after connection.':('Ticket type created on Midnight, but public ticket options could not be saved. '+listingSaveError(write)+' Do not add a duplicate type.')); }
          } finally { setAdding(false); }
        }}>Add ticket type</PendingButton></fieldset>
        {s.schema === 4 && <p className="note">Schema 4 is local-only. Ticket-type submission remains disabled until a separately authorized v4 deployment.</p>}
        {listingMessage && <p role="status" className="note">{listingMessage}</p>}
      </div>
      {priceInput.kind!=='ready' && <p role="alert" className="warn">{priceInput.message}</p>}
      {tt.resale==='0' && capInput.kind!=='ready' && <p role="alert" className="warn">{capInput.message}</p>}
      <p className="small muted">USD is converted once at listing. The contract settlement amount stays fixed; its USD estimate can change.</p>
  </>;
}

// Organizer edits the public labels later (signed; the server re-checks the on-chain organizer).
function EditDetails({ s, run, id }: { s: Session; run: Run; id: bigint }) {
  const k=`${s.contract}:ev:${id}`;const [editing,setEditing]=useState(false);
  if(!editing)return <button onClick={()=>setEditing(true)}>Edit details</button>;
  return <div className="editdet card"><EventEditForm initial={meta.get(k)??{}} onCancel={()=>setEditing(false)} onSubmit={async details=>{
    const evWrite=await publishMetaResult(s,run,'ev',id,details);if(!evWrite.ok)throw new Error(listingSaveError(evWrite));meta.set(k,details);
    // Resaving an existing event also publishes its existing ticket options; never create duplicates to fill the public catalog.
    const state=await s.state().catch(()=>null);if(!state)return 'options-pending';
    let allSaved=true;
    for(const type of state.types.filter(t=>t.eventId===id)){
      const values=ticketListingValues(s.schema,type,ttName(s,type.id),meta.get(`${s.contract}:tt:${type.id}`));
      const saved=await publishMeta(s,run,'tt',type.id,values);if(saved)meta.set(`${s.contract}:tt:${type.id}`,values);else allSaved=false;
    }
    if(!allSaved)return 'options-pending';setEditing(false);
  }}/></div>;
}

function Tickets({ s, st, run, owned, bump, passes, addPass, onBrowseEvents }: P & { owned: Record<string, number>; bump: (t: bigint, d: number) => void; passes: Pass[]; addPass: (p: Pass) => void; onBrowseEvents?: () => void }) {
  const rates=useRates();
  const [resale, setResale] = useState<Record<string, string>>({});
  const [ask, setAsk] = useState<bigint | null>(null); // confirm sheet before burning a ticket
  const [show, setShow] = useState<Pass | 'pending' | null>(null); // full-screen QR
  if (!s.contract || !st) return <NoContract s={s} />;
  const mine = Object.entries(owned).filter(([, n]) => n > 0);
  const entry = async (tid: bigint) => {
    setAsk(null); setShow('pending');
    const passId = sdkOrThrow().newPassId();
    const r = await run(`Check in ${ttName(s, tid)}`, () => s.call('checkIn', [tid, sdkOrThrow().passIdBytes(passId)]));
    if (!r) { setShow(null); return; }
    const p = { typeId: String(tid), passId, txId: r.txId, at: new Date().toISOString() };
    bump(tid, -1); addPass(p); setShow(p);
  };
  return <div className="tix-page">
    <header className="page-header"><h2>My tickets</h2></header>
    {mine.length === 0 && passes.length === 0 && <div className="card empty">
      <h3>No tickets yet</h3>
      <p className="muted">Buy from an event on sale, or open a share link from the organizer.</p>
      {onBrowseEvents && <button type="button" className="primary" onClick={onBrowseEvents}>Browse events</button>}
    </div>}
    {mine.map(([id, n]) => {
      const t = st.types.find((x) => String(x.id) === id); if (!t) return null; const tid = BigInt(id);
      const m = meta.get(`${s.contract}:ev:${t.eventId}`);
      const mode = Number(t.resale);
      const p = resale[id] ?? currentUsdInput(mode === CAPPED ? t.maxResale : t.price,rates);
      const parsedPrice = quoteUsd(p,rates);
      const over = parsedPrice.kind!=='ready' || (mode===CAPPED && parsedPrice.atoms>t.maxResale);
      return <div className="card tix" key={id}>
        <div className="tix-top"><img src="/brand/cloaktix_icon.svg" alt="" />{n > 1 && <span className="count">×{n}</span>}</div>
        <p className="kicker">{ttName(s, tid)}{t.adultOnly && <span className="tag age">18+</span>}</p>
        <h3 className="tix-ev">{evName(s, t.eventId)}</h3>
        <p className="muted">{m?.date ?? 'Date to be announced'} · {m?.venue ?? 'Venue to be announced'}</p>
        <div className="perf" />
        <button className="primary big wide" onClick={() => setAsk(tid)}>Show entry QR</button>
        <p className="muted small center">Use it at the door. The QR works once.</p>
        {mode === NO_RESALE ? <p className="muted small center">Resale not allowed for this ticket.</p> : <details className="resell"><summary>Resell this ticket</summary>
          <div className="row"><input aria-label="Resale price in USD" placeholder="USD" value={p} onChange={(e) => setResale({ ...resale, [id]: e.target.value })} /><button disabled={over} onClick={async () => {
            const r = await run(`List for resale ${ttName(s, tid)}`, () => {const quote=quoteUsd(p,rates);if(quote.kind!=='ready')throw new Error(quote.message);const priceUnits=s.schema===3?quote.cents:quote.atoms;return s.call('listForResale', listForResaleArgs(s.schema,{serialOrTypeId:tid,priceUnits,feeAtoms:s.schema===3?0n:sdkOrThrow().feeOf(quote.atoms),payout:s.userAddress()}));}); if (r) bump(tid, -1);
          }}>List</button></div>
          <p className={over ? 'warn small' : 'muted small'}>{mode === CAPPED ? <>Cap <Price amount={t.maxResale} /></> : 'No price cap'}{over ? ', price above the cap' : ''}</p></details>}
      </div>;
    })}
    {passes.length > 0 && <><h2>Entry passes</h2>{passes.map((ps) => <div className="card passrow" key={ps.passId}>
      <div><b>{ttName(s, BigInt(ps.typeId))}</b><p className="muted small">{evName(s, st.types.find((t) => String(t.id) === ps.typeId)?.eventId ?? 0n)} · ready since {new Date(ps.at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</p></div>
      <button className="primary" onClick={() => setShow(ps)}>Show QR</button></div>)}</>}

    {ask !== null && <div className="modal sheet" onClick={() => setAsk(null)}><div className="card" onClick={(e) => e.stopPropagation()}>
      <h3>At the door?</h3>
      <p>Showing your entry QR <b>uses this ticket</b>: it is burned on-chain and turned into a single-use pass. You can't resell it afterwards.</p>
      <p className="muted small">Your wallet will ask you to approve. Takes about a minute.</p>
      <button className="primary big wide" onClick={() => entry(ask)}>Yes, show my QR</button>
      <button className="wide ghost" onClick={() => setAsk(null)}>Not yet</button>
    </div></div>}
    {show !== null && <FullQr s={s} st={st} pass={show} onClose={() => setShow(null)} />}
  </div>;
}

function FullQr({ s, st, pass, onClose }: { s: Session; st: St; pass: Pass | 'pending'; onClose: () => void }) {
  useEffect(() => { // keep the screen on while the QR is shown (best effort)
    let lock: any; (navigator as any).wakeLock?.request('screen').then((l: any) => { lock = l; }).catch(() => {});
    return () => { lock?.release?.().catch?.(() => {}); };
  }, []);
  if (pass === 'pending') return <div className="fullqr"><div className="fq-card"><span className="spin big" /><h3>Preparing your entry pass…</h3><p className="muted">Approve in your wallet, then keep this page open. Your ticket is burned on-chain and a single-use QR appears here.</p></div></div>;
  const code = encodePassQr(s.contract!, pass.passId, pass.txId);
  const t = st?.types.find((x) => String(x.id) === pass.typeId);
  const size = Math.max(200, Math.min(window.innerWidth - 64, window.innerHeight - 300, 420));
  return <div className="fullqr" onClick={onClose}><div className="fq-card" onClick={(e) => e.stopPropagation()}>
    <p className="kicker">Entry pass · single use</p>
    <h3>{ttName(s, BigInt(pass.typeId))}</h3>
    <p className="muted">{t ? evName(s, t.eventId) : ''}</p>
    <div className="fq-qr"><Qr text={code} size={size} /></div>
    <p className="small muted">Show this to the gate staff. Turn your screen brightness up.</p>
    <button className="big wide" onClick={onClose}>Done</button>
    <button className="link" onClick={() => copy(code)}>Copy code</button>
  </div></div>;
}

function Gate({ s, st }: { s: Session; st: St }) {
  const [code, setCode] = useState(''); const [r, setR] = useState<Verdict | null>(null); const [b, setB] = useState(false);
  const [cam, setCam] = useState(false); const [camMsg, setCamMsg] = useState<string | null>(null);
  const types = st?.types ?? [];
  const [acc, setAcc] = useState('');
  const accept = acc || (types.length ? `t:${types[0].id}` : '');
  const accepted = accept.startsWith('e:') ? types.filter((t) => `e:${t.eventId}` === accept).map((t) => t.id) : types.filter((t) => `t:${t.id}` === accept).map((t) => t.id);
  const verify = async (c = code) => { setB(true); setR(null); try { setR(await sdkOrThrow().verifyPass(s, c, accepted)); } catch (e: any) { setR({ ok: false, reason: String(e?.message ?? e) }); } setB(false); };
  if (!s.contract || !st) return <NoContract s={s} />;
  const admitted = Object.keys(sdkOrThrow().gateUsed(s.contract)).length;
  return <>
    <h2>Check-in</h2>
    <div className="card gate">
      <label>Accepted ticket type<select value={accept} onChange={(e) => setAcc(e.target.value)}>
        {buyerVisibleEvents(st.events, types, KEY_EVENTS).map((e) => [<option key={'e' + e.id} value={`e:${e.id}`}>{evName(s, e.id)}: any ticket type</option>,
          ...types.filter((t) => t.eventId === e.id).map((t) => <option key={'t' + t.id} value={`t:${t.id}`}>{evName(s, e.id)}: {ttName(s, t.id)} only</option>)])}
      </select></label>
      <p className="muted">Scan or paste the pass. Checks: on-chain <code>checkIns[passId]</code> exists (ticket burned), its ticket type is accepted here, the <code>checkIn</code> tx succeeded on this contract, and this gate has not admitted the pass before.</p>
      <div className="row"><input placeholder="cloaktix:pass:v1?…" value={code} onChange={(e) => setCode(e.target.value)} />
        <PendingButton className="primary" pending={b} pendingLabel={PENDING_WALLET} disabled={b || !code} onClick={() => verify()}>Verify</PendingButton>
        <button onClick={() => { if (cameraScanSupported()) { setCam(true); setCamMsg(null); } else setCamMsg('Camera scanning is not available in this browser. Paste the code instead.'); }}>Scan with camera</button></div>
      {camMsg && <p className="warn small">{camMsg}</p>}
      {cam && <Scanner onClose={() => setCam(false)} onCode={(c) => { setCam(false); setCode(c); verify(c); }} />}
      {r && <div className={r.ok ? 'verdict ok' : 'verdict ko'}>{r.ok
        ? <>✓ Admitted: {ttName(s, r.typeId)}<small>block {r.block} · pass {short(sdkOrThrow().decodePass(code)?.passId ?? '')} now consumed</small></>
        : <>✕ Refused<small>{r.reason}</small></>}</div>}
      <p className="muted small">Passes admitted at this gate: {admitted}</p>
    </div>
  </>;
}

function Activity({ logs, s }: { logs: Log[]; s: Session }) {
  const proofs = useMemo(() => proofLog.slice(-4), [logs]);
  if (!logs.length) return null;
  return <details className="activity"><summary>Activity <span className="muted">· {logs.length} update{logs.length === 1 ? '' : 's'}</span></summary><div className="activity-body">
    {logs.slice(0, 8).map((l, i) => <div key={i} className={l.ok ? '' : 'warn'}><span className="muted">{l.at}</span> {l.label} {l.ok ? '✓' : '✕'} {l.txId && <code>{short(l.txId)}</code>} {l.ms && <span className="muted">{(l.ms / 1000).toFixed(1)} s</span>} {l.err && <span className="small">{l.err}</span>}</div>)}
    {proofs.length > 0 && <p className="muted small">Browser proofs: {proofs.map((p) => `${p.loc.split('/').pop()} ${(p.ms / 1000).toFixed(1)} s`).join(' · ')}</p>}
    <p className="muted small">Wallet: {s.walletName} · Connected</p>
  </div></details>;
}


function InstallHelp() {
  const [installStatus,setInstallStatus]=useState('');
  const [checking,setChecking]=useState(false);
  return (
    <details className="card devices install-help">
      <summary>Install CloakTix on your phone</summary>
      <p className="muted small">Add this site to your home screen for a standalone ticket wallet. Storage is per browser / install. iOS treats each home-screen install as its own storage. Open My tickets and use Send to phone to move a prepared ticket to another device.</p>
      <p className="muted small"><b>iPhone / iPad:</b> Safari Share → Add to Home Screen.</p>
      <p className="muted small"><b>Android:</b> Chrome menu → Install app / Add to Home screen.</p>
      <button type="button" disabled={checking} onClick={async()=>{setChecking(true);try{const result=await checkInstallAssets();setInstallStatus(result.message);}finally{setChecking(false);}}}>{checking?'Checking install files…':'Check install files'}</button>
      {installStatus&&<p className="small muted" role="status">{installStatus}</p>}
      <p className="small muted">Install this app from the same signed-in browser. iPhone camera QR scanning may be unavailable; paste the private ticket code when needed.</p>
      <p className="muted small">Buying, listing, and check-in still need a connected Midnight wallet and network access. A saved pass QR is stored on this device only and does not by itself prove current on-chain status.</p>
    </details>
  );
}

function SavedPassesOffline({
  passes,
  onConnect,
  onRefresh,
}: {
  passes: SavedPass[];
  onConnect: () => void;
  onRefresh: () => void;
}) {
  const [show, setShow] = useState<SavedPass | null>(null);
  return (
    <main className="tix-page offline-passes">
      <h2>Saved entry passes</h2>
      <p className="muted">These passes were prepared on this device. Showing a QR does not call the wallet or the chain. Online check-in validity still depends on the network when a gate scans.</p>
      {passes.length === 0 && (
        <div className="card empty">
          <h3>No saved passes here</h3>
          <p className="muted">Connect a wallet to buy a ticket and prepare an entry pass, or import a transfer code from another device after connecting.</p>
          <button className="primary" onClick={onConnect}>Connect wallet</button>
        </div>
      )}
      {passes.map((ps) => (
        <div className="card passrow" key={`${ps.contract}:${ps.passId}`}>
          <div>
            <b>{ps.ticketName ?? `Ticket #${ps.typeId}`}</b>
            <p className="muted small">{ps.eventName ?? 'Event'} · saved {new Date(ps.at).toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', month: 'short', day: 'numeric' })}</p>
            <p className="muted small">Stored offline · not a live chain status</p>
          </div>
          <button className="primary" onClick={() => setShow(ps)}>Show QR</button>
        </div>
      ))}
      <div className="card">
        <p className="muted small">Buy tickets, check in, or verify gate scans require Connect wallet.</p>
        <button className="wide" onClick={onConnect}>Connect wallet for chain actions</button>
        <button className="wide ghost" onClick={onRefresh}>Refresh saved list</button>
      </div>
      {show && <OfflineFullQr pass={show} onClose={() => setShow(null)} />}
    </main>
  );
}

function OfflineFullQr({ pass, onClose }: { pass: SavedPass; onClose: () => void }) {
  useEffect(() => {
    let lock: { release?: () => Promise<void> } | undefined;
    void (navigator as Navigator & { wakeLock?: { request: (t: string) => Promise<{ release: () => Promise<void> }> } }).wakeLock
      ?.request('screen')
      .then((l) => { lock = l; })
      .catch(() => {});
    return () => { void lock?.release?.().catch?.(() => {}); };
  }, []);
  const code = encodePassQr(pass.contract, pass.passId, pass.txId);
  const size = Math.max(200, Math.min(window.innerWidth - 64, window.innerHeight - 300, 420));
  return (
    <div className="fullqr" onClick={onClose}>
      <div className="fq-card" onClick={(e) => e.stopPropagation()}>
        <p className="kicker">Entry pass · saved on device</p>
        <h3>{pass.ticketName ?? `Ticket #${pass.typeId}`}</h3>
        <p className="muted">{pass.eventName ?? ''}</p>
        <Qr text={code} size={size} />
        <p className="muted small">Single-use at the gate when online. This screen did not open your wallet.</p>
        <button className="wide" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

export function HomeScreen({ connected, onBrowseEvents, onTickets, savedCount }: {
  connected: boolean; onBrowseEvents: () => void; onTickets: () => void; savedCount: number;
}) {
  return <main id="main" className="home-page">
    <section className="hero home" aria-labelledby="home-title">
      <div>
        <p className="kicker">Midnight · private tickets</p>
        <h1 id="home-title">Private tickets on <em>Midnight</em></h1>
        <p>Buy, resell under the organizer's rules and get in with a single-use pass, without exposing your wallet. Zero-knowledge proofs are generated in your browser.</p>
        <p className="home-payment">Pay with NIGHT on Midnight only. Browse Events for organizer-published listings; connect to confirm live availability.</p>
        <TicketTrust/>
        <div className="cta-row">
          <button className="primary big" onClick={onBrowseEvents}>Browse events</button>
          <button className="big" onClick={onTickets}>{connected ? 'My tickets' : savedCount > 0 ? 'View saved passes' : 'I already have a ticket'}</button>
        </div>
        <ul className="pills"><li>Resale policy set by the organizer</li><li>Wallet stays private</li><li>Single-use ZK entry pass</li></ul>
        <div className="trust">Midnight {NETWORK === 'undeployed' ? 'Local devnet' : NETWORK.charAt(0).toUpperCase() + NETWORK.slice(1)} <i /><span>1AM / Lace</span><i /><span>ZK in-browser</span></div>
      </div>
      <figure className="home-art" aria-label="Demo ticket artwork, not live event listings">
        <div className="home-gallery-label"><span>Artwork preview</span><span>Demo only</span></div>
        <div className="home-mosaic">
          <div className="hero-card mosaic-feature">
            <img className="art" src={DEMO_ART[0]} alt="Neon-lit venue, demo artwork" />
            <div className="shade" />
            <span className="badge">Demo artwork</span>
            <div className="htitle">Tickets on Midnight</div>
          </div>
          {DEMO_ART.slice(1).map((src) => <div key={src} className="mosaic-tile"><img src={src} alt="" loading="lazy" /></div>)}
        </div>
        <figcaption className="home-art-caption">Artwork preview · not events for sale</figcaption>
      </figure>
    </section>
    <section className="home-guide" aria-labelledby="how-it-works">
      <header className="page-header home-guide-header"><div><p className="kicker">From purchase to entry</p><h2 id="how-it-works">How CloakTix works</h2></div><p className="muted">One place to buy, keep and use your tickets.</p></header>
      <ol className="home-steps">
        <li className="home-step step-buy"><div className="step-art" aria-hidden="true"><img src={DEMO_ART[1]} alt="" loading="lazy" /></div><span className="step-number" aria-hidden="true">01</span><div className="step-content"><p className="step-label">Buy</p><h3>Find your event</h3><p>Open Events, connect your Midnight wallet and choose a ticket. Prices are shown in USD with a NIGHT estimate.</p><span className="step-destination">In Events</span></div></li>
        <li className="home-step step-keep"><div className="step-art" aria-hidden="true"><img src={DEMO_ART[3]} alt="" loading="lazy" /></div><span className="step-number" aria-hidden="true">02</span><div className="step-content"><p className="step-label">Keep or resell</p><h3>Your tickets, together</h3><p>Print, show a QR or send a prepared pass to your phone. Resale follows the organizer's policy.</p><span className="step-destination">In My tickets</span></div></li>
        <li className="home-step step-enter"><div className="step-art" aria-hidden="true"><img src={DEMO_ART[5]} alt="" loading="lazy" /></div><span className="step-number" aria-hidden="true">03</span><div className="step-content"><p className="step-label">Enter</p><h3>Show your single-use pass</h3><p>The gate verifies your ticket without seeing your wallet address. Keep your pass private.</p><span className="step-destination">At the entrance</span></div></li>
      </ol>
      <InstallHelp />
    </section>
  </main>;
}
