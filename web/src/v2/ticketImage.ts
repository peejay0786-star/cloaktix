import { encodeAdmitQr, type AdmitCapabilityV2 } from './admitCodec';
import { QRCode, QRErrorCorrectLevel } from '../vendor/qrcode.js';

/** Shared export model: QR payload is admission, never the navigation URL or identity. */
export function ticketImageModel(cap: AdmitCapabilityV2) {
  const payload = encodeAdmitQr(cap);
  const qr = new QRCode(-1, QRErrorCorrectLevel.M);
  qr.addData(payload); qr.make();
  return {
    payload,
    title: cap.eventName || 'CloakTix ticket',
    subtitle: cap.ticketName || 'Admission',
    serial: cap.serial, epoch: cap.epoch, network: cap.networkId,
    contract: cap.contract,
    filename: `cloaktix-ticket-${cap.serial}.png`,
    qr,
  };
}

/** Local canvas only. Called solely by Save ticket; no server or wallet operations. */
export async function createTicketPng(cap: AdmitCapabilityV2): Promise<Blob> {
  const model = ticketImageModel(cap);
  const n = model.qr.getModuleCount();
  const scale = Math.max(5, Math.floor(880 / (n + 8)));
  const side = (n + 8) * scale;
  const canvas = document.createElement('canvas');
  canvas.width = 1000; canvas.height = side + 430;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Ticket image is unavailable in this browser.');
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#111'; ctx.font = 'bold 36px sans-serif';
  ctx.fillText(model.title, 50, 65, 900);
  ctx.font = '26px sans-serif'; ctx.fillText(model.subtitle, 50, 110, 900);
  ctx.fillText(`Ticket #${model.serial} · Epoch ${model.epoch} · ${model.network}`, 50, 155, 900);
  const x0 = Math.floor((1000 - side) / 2);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    if (model.qr.isDark(y, x)) ctx.fillRect(x0 + (x + 4) * scale, 185 + (y + 4) * scale, scale, scale);
  }
  ctx.font = '22px sans-serif';
  ctx.fillText('Show this QR at the entrance. Keep this ticket private.', 50, side + 235, 900);
  ctx.fillText('Resale or replacement invalidates it. Gate checks current validity.', 50, side + 275, 900);
  ctx.font = '18px monospace';ctx.fillText(model.contract, 50, side + 320, 900);
  return new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Could not save ticket image.')), 'image/png'));
}
