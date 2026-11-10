/** Hosts the same-origin indexer proxy may forward to. Not an open proxy. */
export const INDEXER_ALLOW = new Set([
  'indexer.preprod.midnight.network',
  'midnight-preprod.blockfrost.io',
  'indexer.preview.midnight.network',
  'api-preview.1am.xyz',
]);

export function allowedIndexerUrl(raw) {
  if (typeof raw !== 'string' || !raw) return false;
  try {
    const u = new URL(raw);
    return INDEXER_ALLOW.has(u.hostname) && (u.protocol === 'https:' || u.protocol === 'wss:');
  } catch {
    return false;
  }
}
