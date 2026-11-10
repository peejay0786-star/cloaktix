// CT-CREATE-CRASH: share-link metadata must stay small and encodable at any size.
// An uploaded cover is a data: URL of up to 300,000 characters; spreading its bytes into
// String.fromCharCode(...) overflowed the call stack (RangeError) while rendering the share link.

/** UTF-8 safe base64url, chunked so large inputs never hit argument-count limits. */
export function b64u(x: string): string {
  const bytes = new TextEncoder().encode(x);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000) as unknown as number[]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

const MAX_LINK_META = 2000;

/** Event fields carried in a share link: text only. Uploaded covers (data: URLs) stay in the signed public catalog. */
export function shareLinkEventMeta(e: unknown): Record<string, string> | undefined {
  if (!e || typeof e !== 'object') return undefined;
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(e as Record<string, unknown>)) {
    if (typeof v !== 'string') continue;
    if (k === 'cover' && !v.startsWith('/')) continue;
    out[k] = v;
  }
  if (JSON.stringify(out).length > MAX_LINK_META) delete out.description;
  if (JSON.stringify(out).length > MAX_LINK_META) return out.name ? { name: out.name.slice(0, 80) } : undefined;
  return out;
}
