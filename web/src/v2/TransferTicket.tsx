import { printTicket, type PrintDetails } from './printTicket';
import { useState } from 'react';
import { Qr } from '../Qr';
import type { AdmitCapabilityV2 } from './admitCodec';
import { buildPhoneTransferUrl } from './phoneTransfer';

/** Display only: rendering and copying never submit a transaction. */
export function TransferTicket({ cap, details = {}, showPrint = true, title = 'Your ticket is ready' }: { cap: AdmitCapabilityV2; details?: PrintDetails; showPrint?: boolean; title?: string }) {
  const [status, setStatus] = useState('');
  const url = buildPhoneTransferUrl({ origin: location.origin, cap });
  const copy = async () => {
    try { await navigator.clipboard.writeText(url); setStatus('Link copied.'); }
    catch { setStatus('Select and copy the link below.'); }
  };
  return <div className="center">
    <h3>{title}</h3>
    <Qr text={url} size={Math.min(300, window.innerWidth - 64)} />
    <p>Scan with your phone’s Camera and tap the link. Open your ticket, then tap Save ticket to keep a PNG on your phone. No wallet needed.</p>
    {showPrint && <button onClick={() => printTicket(cap, details, setStatus)}>Print ticket</button>}
    <button onClick={copy}>Copy ticket link</button>
    <details><summary>Ticket link</summary><input aria-label="Private ticket link" readOnly value={url} onFocus={(e) => e.target.select()} /></details>
    <p role="status">{status}</p>
    <p className="small muted">Keep this ticket private. The private site may ask you to sign in; scan again after sign-in if needed.</p>
  </div>;
}
