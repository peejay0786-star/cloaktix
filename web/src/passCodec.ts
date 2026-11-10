/** Pass QR encode/decode without the Midnight SDK (offline-safe). */

export type DecodedPass = { contract: string; passId: string; txId: string };

export function encodePassQr(contract: string, passId: string, txId: string): string {
  return `cloaktix:pass:v1?c=${contract}&p=${passId}&tx=${txId}`;
}

export function decodePassQr(text: string): DecodedPass | null {
  const t = text.trim();
  if (!t.startsWith('cloaktix:pass:v1?')) return null;
  const q = new URLSearchParams(t.slice('cloaktix:pass:v1?'.length));
  const c = q.get('c');
  const p = q.get('p');
  const tx = q.get('tx');
  if (!c || !p || !tx || !/^[0-9a-f]{64}$/i.test(p)) return null;
  return { contract: c, passId: p.toLowerCase(), txId: tx };
}
