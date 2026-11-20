// Renders a QR code as SVG (vendored MIT encoder, ECC level M). Dark modules on white for reliable scanning.
import { useMemo } from 'react';
import { QRCode, QRErrorCorrectLevel } from './vendor/qrcode.js';

/** Returns null instead of throwing when the text cannot fit in a QR code (vendored encoder throws "code length overflow"). */
export function qrModules(text: string): { n: number; d: string } | null {
  try {
    const q = new QRCode(-1, QRErrorCorrectLevel.M); q.addData(text); q.make();
    const n = q.getModuleCount(); let d = '';
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (q.isDark(y, x)) d += `M${x + 4} ${y + 4}h1v1h-1z`;
    return { n, d };
  } catch (e) {
    console.error('[CloakTix] QR could not be drawn', text.length, 'chars', e);
    return null;
  }
}

/** PNG data URL of the same QR (4-module white quiet zone, dark on white). Null when it cannot be drawn. */
export function qrPngDataUrl(text: string, px = 660): string | null {
  const qr = qrModules(text); if (!qr) return null;
  const q = new QRCode(-1, QRErrorCorrectLevel.M); q.addData(text); q.make();
  const n = q.getModuleCount(), total = n + 8, scale = Math.max(1, Math.floor(px / total));
  const c = document.createElement('canvas'); c.width = c.height = total * scale;
  const g = c.getContext('2d'); if (!g) return null;
  g.fillStyle = '#FFFFFF'; g.fillRect(0, 0, c.width, c.height); g.fillStyle = '#0A0A0A';
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (q.isDark(y, x)) g.fillRect((x + 4) * scale, (y + 4) * scale, scale, scale);
  return c.toDataURL('image/png');
}

export function Qr({ text, size = 240, label = 'Entry pass QR code' }: { text: string; size?: number; label?: string }) {
  const qr = useMemo(() => qrModules(text), [text]);
  if (!qr) return <p className="note" role="alert">This QR code is too large to display. Use the link instead.</p>;
  const { n, d } = qr;
  return <svg className="qr" width={size} height={size} viewBox={`0 0 ${n + 8} ${n + 8}`} shapeRendering="crispEdges" role="img" aria-label={label}>
    <rect width={n + 8} height={n + 8} fill="#FFFFFF" /><path d={d} fill="#0A0A0A" /></svg>;
}
