import { useMemo, useState, useRef, useEffect, useId } from 'react';
import { validateNightPayout, type NetworkKind } from './payoutAddresses';
import { DEMO_COVERS, eventDetailsError, isValidEventDate, parseEventDetails, type EventDetails } from './catalog/model';
import { prepareCoverImage } from './coverImage';
export type EventCreateValues = EventDetails & { nightPayout: string };
const emptyDetails: EventDetails = {name:'',date:'',venue:'',cover:'',description:'',demoArt:'false'};
export function EventDetailsFields({ value, onChange }: { value: EventDetails; onChange: (v: EventDetails) => void }) {
  const [imageError,setImageError]=useState('');const current=useRef(value);current.current=value;
  const input=useRef<HTMLInputElement>(null);const generation=useRef(0);
  const [processing,setProcessing]=useState(false);const [hasFile,setHasFile]=useState(false);
  const dateProblem=!isValidEventDate(value.date);const dateErrorId=useId();
  useEffect(()=>()=>{generation.current++;},[]);
  const resetUpload=()=>{generation.current++;if(input.current)input.current.value='';setHasFile(false);setImageError('');setProcessing(false);};
  return <>
    <div className="row3">
      <label>Name<input value={value.name} onChange={e=>onChange({...value,name:e.target.value})} required minLength={2} maxLength={80} /></label>
      <label>Date<input type="date" value={value.date} aria-invalid={dateProblem} aria-describedby={dateProblem?dateErrorId:undefined} onChange={e=>onChange({...value,date:e.target.value})} required />{dateProblem&&<span id={dateErrorId} className="warn">Choose a valid event date.</span>}</label>
      <label>Venue<input value={value.venue} onChange={e=>onChange({...value,venue:e.target.value})} required minLength={2} maxLength={120} /></label>
    </div>
    <label>Short description<textarea value={value.description} onChange={e=>onChange({...value,description:e.target.value})} required minLength={10} maxLength={1200} rows={3} /></label>
    <fieldset className="event-cover-fields"><legend>Cover image · required</legend>
      <label>Upload your cover (PNG, JPEG or WebP, originals up to 12 MB)<input ref={input} type="file" accept="image/png,image/jpeg,image/webp" onChange={async e=>{
        const picker=e.currentTarget;const file=picker.files?.[0];if(!file)return;
        const request=++generation.current;setHasFile(true);setImageError('');setProcessing(true);
        try {
          const cover=await prepareCoverImage(file);
          if(request===generation.current){onChange({...current.current,cover,demoArt:'false'});setImageError('');}
        } catch(error) {
          if(request===generation.current){picker.value='';setHasFile(false);setImageError(error instanceof Error?error.message:'Could not resize that photo. Choose another photo or demo artwork.');}
        } finally {if(request===generation.current)setProcessing(false);}
      }} /></label>
      <p className="small muted">Phone photos are resized automatically before saving.</p>
      {processing&&<p role="status">Resizing photo…</p>}
      {(hasFile||value.cover.startsWith('data:image/'))&&<button type="button" onClick={()=>{
        resetUpload();if(value.cover.startsWith('data:'))onChange({...value,cover:'',demoArt:'false'});
      }}>Remove photo</button>}
      <label>Or explicitly choose demo artwork<select value={DEMO_COVERS.includes(value.cover)?value.cover:''} onChange={e=>{
        resetUpload();onChange({...value,cover:e.target.value,demoArt:e.target.value?'true':'false'});
      }}><option value="">Use an uploaded cover</option>{DEMO_COVERS.map((src,i)=><option key={src} value={src}>Demo artwork {i+1} · labeled Demo art</option>)}</select></label>
      {value.cover&&<img className="event-cover-preview" src={value.cover} alt={value.demoArt==='true'?'Selected demo artwork':'Selected event cover'} />}
      {value.demoArt==='true'&&<p className="small muted">Demo art will be visibly labeled. Upload your own event cover when available.</p>}
      {imageError&&<p role="alert" className="warn">{imageError}</p>}
    </fieldset>
    <p className="small muted">Set resale rules when you add ticket types: capped resale, unlimited resale or no resale. Those rules appear on the event page.</p>
  </>;
}
export function EventCreateForm({ network, initial, onSubmit, busy=false }: { network:NetworkKind;initial?:Partial<EventCreateValues>;onSubmit:(v:EventCreateValues)=>void|Promise<void>;busy?:boolean }) {
  const [submitting,setSubmitting]=useState(false);const [submitError,setSubmitError]=useState('');const locked=busy||submitting;
  const [ev,setEv]=useState<EventCreateValues>({...emptyDetails,...initial,nightPayout:initial?.nightPayout??''});
  const night=useMemo(()=>validateNightPayout(ev.nightPayout,network),[ev.nightPayout,network]);
  const problem=eventDetailsError(ev);const errorRef=useRef<HTMLParagraphElement>(null);
  useEffect(()=>{if(submitError)errorRef.current?.scrollIntoView({block:'center',behavior:'smooth'});},[submitError]);
  return <form className="event-create-form" noValidate onSubmit={async e=>{
    e.preventDefault();const details=parseEventDetails(ev);
    const blocked=locked?'Event creation is already in progress. Check your wallet and Activity.':problem??(night.kind==='invalid'?night.message:null);
    if(blocked||!details||night.kind!=='valid'){setSubmitError(blocked??'Complete the event details before creating it.');errorRef.current?.scrollIntoView({block:'center'});return;}
    setSubmitting(true);setSubmitError('');
    try{await onSubmit({...details,nightPayout:night.normalized});}
    catch{setSubmitError('Event creation did not finish. The wallet request may have been cancelled or failed. Check My events and Activity before trying again.');}
    finally{setSubmitting(false);}
  }}>
    <EventDetailsFields value={ev} onChange={v=>{setSubmitError('');setEv({...v,nightPayout:ev.nightPayout});}} />
    <fieldset className="payout-fields"><legend>NIGHT payout address (organizer only)</legend>
      <p id="night-payout-permanent" className="note payout-permanent-note" role="note">This address will receive NIGHT payments for this event. <strong>It cannot be changed after the event is created.</strong> Check it carefully before creating the event.</p>
      <p className="small muted">Required for NIGHT settlement on Midnight. Stored privately — never shown to buyers.</p>
      <label>NIGHT payout address (Midnight network)<input aria-label="NIGHT payout address on Midnight" aria-invalid={night.kind==='invalid'&&!!ev.nightPayout} aria-describedby="night-payout-permanent night-payout-help night-payout-err" placeholder={network==='mainnet'?'mn_addr1…':`mn_addr_${network}1…`} value={ev.nightPayout} onChange={e=>{setSubmitError('');setEv({...ev,nightPayout:e.target.value});}} autoComplete="off" spellCheck={false} required /></label>
      <p id="night-payout-help" className="small muted">Must be a Midnight address (mn_addr…). NIGHT on Midnight is the only payment method.</p>
      {night.kind==='invalid'&&ev.nightPayout&&<p id="night-payout-err" role="alert" className="warn">{night.message}</p>}
    </fieldset>
    {(submitError||problem)&&<p ref={errorRef} role="alert" className="warn">{submitError||problem}</p>}
    <button className="primary" type="submit" disabled={locked}>{locked?'Creating…':'Create event'}</button>
  </form>;
}
export function EventEditForm({initial,onSubmit,onCancel}:{initial:Partial<EventDetails>;onSubmit:(v:EventDetails)=>Promise<void|'options-pending'>;onCancel:()=>void}){
  const [value,setValue]=useState<EventDetails>({...emptyDetails,...initial});const [busy,setBusy]=useState(false);const [error,setError]=useState('');
  return <form className="event-create-form" onSubmit={async e=>{e.preventDefault();const details=parseEventDetails(value);if(!details||busy)return;setBusy(true);setError('');try{const result=await onSubmit(details);if(result==='options-pending')setError('Event details saved, but some ticket options are not published yet. Retry Save details; do not recreate the event or ticket types.');}catch{setError('Not saved. Check the connection and organizer verification, then try again.');}finally{setBusy(false);}}}>
    <EventDetailsFields value={value} onChange={setValue}/><p className="small muted" role="status">{eventDetailsError(value)}</p>
    <div className="row"><button className="primary" disabled={!!eventDetailsError(value)||busy}>Save details</button><button type="button" onClick={onCancel} disabled={busy}>Cancel</button></div>{error&&<p className="warn" role="alert">{error}</p>}
  </form>;
}
