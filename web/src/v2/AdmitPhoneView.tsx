import { createTicketPng, ticketImageModel } from './ticketImage';
import { upsertSavedAdmit } from './admitStore';
/** Phone / zero-wallet view for a v2 admit capability (fragment or QR paste). Does not call the chain. */
import { useEffect, useState } from 'react';
import { Qr } from '../Qr';
import {
  encodeAdmitQr,
  type AdmitCapabilityV2,
} from './admitCodec';

export function AdmitPhoneView({ initial }: { initial: AdmitCapabilityV2 }) {
  const cap = initial;
  const code = encodeAdmitQr(cap);
  const [saveStatus, setSaveStatus] = useState('');
  useEffect(() => {
    setSaveStatus('');
    try { upsertSavedAdmit({ ...cap, at: new Date().toISOString() }); }
    catch { setSaveStatus('Browser storage is unavailable. Save the PNG or keep your private ticket link.'); }
  }, [cap]);
  const saveTicket = async () => {
    try {
      const blob = await createTicketPng(cap);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url; link.download = ticketImageModel(cap).filename;
      document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
      setSaveStatus('Open the saved PNG in Files / Downloads and keep it for the entrance.');
    } catch { setSaveStatus('Download failed. Keep the private ticket link and try another browser.'); }
  };
  const size = Math.max(200, Math.min(window.innerWidth - 64, window.innerHeight - 280, 420));

  useEffect(() => {
    let active = true;
    let lock: { release?: () => Promise<void> } | undefined;
    void (navigator as Navigator & { wakeLock?: { request: (t: string) => Promise<{ release: () => Promise<void> }> } }).wakeLock
      ?.request('screen')
      .then(async (l) => { if (active) lock = l; else await l.release(); })
      .catch(() => {});
    return () => { active = false; void lock?.release?.().catch?.(() => {}); };
  }, []);

  return (
    <div className="offline-passes" style={{ maxWidth: 520, margin: '24px auto', padding: 16 }}>
      <p className="kicker">Entrance QR · show to the organizer</p>
      <h2>{cap.eventName || `Ticket #${cap.serial}`}</h2>
      {cap.ticketName && <p>{cap.ticketName}</p>}
      <p className="muted">At the entrance, show this QR to the organizer’s ticket scanner. It is not a link for your phone camera.</p>
      <p className="muted">Ticket #{cap.serial}</p>
      <div style={{ display: 'flex', justifyContent: 'center', margin: '16px 0' }}>
        <Qr text={code} size={size} />
      </div>
      <button className="primary big wide" onClick={saveTicket}>Save ticket</button>
      <p role="status">{saveStatus}</p>
      <p className="muted small">Save the PNG to your phone. Open it from Files / Downloads later, offline, without this site or a wallet. Check that the file saved successfully.</p>
      <p className="muted small">Keep it private. Resale or link replacement invalidates this copy. The gate checks current validity; an offline image is not proof of admission. Browser storage alone can be cleared.</p>
    </div>
  );
}

