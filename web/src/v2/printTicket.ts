import type { AdmitCapabilityV2 } from './admitCodec';
import { ticketImageModel } from './ticketImage';

export type PrintDetails = { date?: string; venue?: string };
const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c] || c));

/** Self-contained, network-free print document. Uses the same admission QR model as PNG. */
export function buildTicketPrintDocument(cap: AdmitCapabilityV2, details: PrintDetails = {}): string {
  const model = ticketImageModel(cap);
  const n = model.qr.getModuleCount();
  let path = '';
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    if (model.qr.isDark(y,x)) path += `M${x+4} ${y+4}h1v1h-1z`;
  }
  const metadata = [details.date, details.venue].filter((text): text is string => typeof text === 'string' && text.length > 0);
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'"><title>CloakTix ticket</title><style>
@page{margin:18mm}body{margin:0;background:#fff;color:#000;font:14pt Arial,sans-serif;text-align:center}main{max-width:170mm;margin:auto;break-inside:avoid}h1{font-size:24pt;overflow-wrap:anywhere}p{overflow-wrap:anywhere}.qr{width:100mm;max-width:100%;height:auto;display:block;margin:12mm auto}.small{font-size:10pt}.contract{font:8pt monospace;overflow-wrap:anywhere}
</style></head><body><main><h1>${escapeHtml(model.title)}</h1><p>${escapeHtml(model.subtitle)}</p>${metadata.map((text)=>`<p>${escapeHtml(text)}</p>`).join('')}<p>Ticket #${escapeHtml(model.serial)} · Epoch ${escapeHtml(model.epoch)} · ${escapeHtml(model.network)}</p><svg class="qr" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n+8} ${n+8}" shape-rendering="crispEdges" role="img" aria-label="Entrance ticket QR"><rect width="${n+8}" height="${n+8}" fill="white"/><path d="${path}" fill="black"/></svg><p>Show this ticket at the entrance.</p><p class="small">Keep it private. Resale or link replacement invalidates this copy.<br>The gate checks current validity.</p><p class="contract">${escapeHtml(model.contract)}</p></main></body></html>`;
}

/** Click-only native print, using a local iframe instead of a popup or a ticket URL. */
export function printTicket(cap: AdmitCapabilityV2, details: PrintDetails, report: (message: string) => void): void {
  const frame = document.createElement('iframe');
  frame.title = 'Ticket print document';
  frame.style.cssText = 'position:fixed;width:1px;height:1px;left:-10000px;border:0';
  const cleanup = () => frame.remove();
  frame.onload = () => {
    try {
      const target = frame.contentWindow;
      if (!target) throw new Error('Print window unavailable');
      target.addEventListener('afterprint', cleanup, { once:true });
      target.focus(); target.print();
      report('Print dialog requested. Choose your printer or Save as PDF. If no dialog opens, allow printing in this browser and try again.');
    } catch {
      cleanup(); report('Printing could not open. Allow printing in this browser and try again.');
    }
  };
  frame.srcdoc = buildTicketPrintDocument(cap, details);
  document.body.appendChild(frame);
}
