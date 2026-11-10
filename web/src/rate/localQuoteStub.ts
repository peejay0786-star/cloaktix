import { atomsPerUsdCentFromNightUsd } from './quoteMath';
export type UnsignedQuote = { atomsPerUsdCent: string; issuedAt: number; expiresAt: number; nightUsd: number; source: 'coingecko-stub' };
/** Browser-side unsigned quote for UI. Real Worker would sign with rateSigner secret. */
export async function fetchUnsignedQuote(_usdCents: bigint, ttlSec = 180, fetcher: typeof fetch = fetch): Promise<UnsignedQuote | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const response = await fetcher(
      'https://api.coingecko.com/api/v3/simple/price?ids=midnight-3&vs_currencies=usd&include_last_updated_at=true',
      { credentials: 'omit', referrerPolicy: 'no-referrer', signal: controller.signal },
    );
    clearTimeout(timeout);
    if (!response.ok) return null;
    const raw: unknown = await response.json();
    if (!raw || typeof raw !== 'object' || !('midnight-3' in raw)) return null;
    const night = (raw as Record<string, unknown>)['midnight-3'];
    if (!night || typeof night !== 'object' || !('usd' in night)) return null;
    const nightUsd = Number((night as { usd: unknown }).usd);
    if (!(nightUsd > 0)) return null;
    const issuedAt = Math.floor(Date.now() / 1000);
    return {
      atomsPerUsdCent: atomsPerUsdCentFromNightUsd(nightUsd).toString(),
      issuedAt, expiresAt: issuedAt + ttlSec, nightUsd, source: 'coingecko-stub',
    };
  } catch { return null; }
}
