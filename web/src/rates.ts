export type Rates = { nightUsd: number; adaUsd: number; asOf: number };
export type RateState = { kind: 'ready'; rates: Rates } | { kind: 'unavailable' };
export const RATE_URL = 'https://api.coingecko.com/api/v3/simple/price?ids=midnight-3,cardano&vs_currencies=usd&include_last_updated_at=true';
export const KRAKEN_URL = 'https://api.kraken.com/0/public/Ticker?pair=NIGHTUSD,ADAUSD';
const TTL = 180_000, MAX_AGE = 600_000, RETRY = 60_000;
const BOUNDS = { nightUsd: { min: 0.001, max: 5 }, adaUsd: { min: 0.01, max: 20 } };
function object(value: unknown): value is Record<string, unknown> { return !!value && typeof value === 'object'; }
function positive(value: unknown): value is number { return typeof value === 'number' && Number.isFinite(value) && value > 0; }
export function inBounds(asset: 'nightUsd' | 'adaUsd', usd: number): boolean {
  const b = BOUNDS[asset];
  return Number.isFinite(usd) && usd >= b.min && usd <= b.max;
}
function median(values: number[]): number | null {
  const xs = values.filter((v) => Number.isFinite(v)).sort((a, b) => a - b);
  if (!xs.length) return null;
  const mid = Math.floor(xs.length / 2);
  return xs.length % 2 ? xs[mid]! : (xs[mid - 1]! + xs[mid]!) / 2;
}
/** CoinGecko simple/price payload → Rates, or null. */
export function parseRates(value: unknown, now: number): Rates | null {
  if (!object(value)) return null;
  const night = value['midnight-3'], ada = value.cardano;
  if (!object(night) || !object(ada)) return null;
  if (!positive(night.usd) || !positive(ada.usd)) return null;
  if (!inBounds('nightUsd', night.usd) || !inBounds('adaUsd', ada.usd)) return null;
  const times = [night.last_updated_at, ada.last_updated_at];
  if (!times.every(positive)) return null;
  const asOf = Math.min(...times) * 1000;
  if (now - asOf > MAX_AGE || asOf > now + 60_000) return null;
  return { nightUsd: night.usd, adaUsd: ada.usd, asOf };
}
/** Kraken public ticker → Rates (asOf = fetch time; ticker has no last_updated_at). */
export function parseKraken(value: unknown, now: number): Rates | null {
  if (!object(value)) return null;
  const err = value.error;
  if (Array.isArray(err) && err.length) return null;
  const result = value.result;
  if (!object(result)) return null;
  const night = (result.NIGHTUSD ?? result.NIGHTZUSD) as unknown;
  const ada = (result.ADAUSD ?? result.ADAZUSD) as unknown;
  if (!object(night) || !object(ada)) return null;
  const nightUsd = Number(Array.isArray(night.c) ? night.c[0] : NaN);
  const adaUsd = Number(Array.isArray(ada.c) ? ada.c[0] : NaN);
  if (!inBounds('nightUsd', nightUsd) || !inBounds('adaUsd', adaUsd)) return null;
  return { nightUsd, adaUsd, asOf: now };
}
export function combineSamples(samples: Rates[]): Rates | null {
  const ok = samples.filter(Boolean);
  if (!ok.length) return null;
  const nightUsd = median(ok.map((s) => s.nightUsd));
  const adaUsd = median(ok.map((s) => s.adaUsd));
  if (nightUsd == null || adaUsd == null || !inBounds('nightUsd', nightUsd) || !inBounds('adaUsd', adaUsd)) return null;
  return { nightUsd, adaUsd, asOf: Math.min(...ok.map((s) => s.asOf)) };
}
function parseCached(value: unknown, now: number): Rates | null {
  if (!object(value)) return null;
  // Normalized cache written by this client.
  if (positive(value.nightUsd) && positive(value.adaUsd) && positive(value.asOf)) {
    if (!inBounds('nightUsd', value.nightUsd) || !inBounds('adaUsd', value.adaUsd)) return null;
    if (now - value.asOf > MAX_AGE || value.asOf > now + 60_000) return null;
    return { nightUsd: value.nightUsd, adaUsd: value.adaUsd, asOf: value.asOf };
  }
  return parseRates(value, now);
}
async function readJson(fetcher: typeof fetch, url: string, signal: AbortSignal): Promise<unknown | null> {
  try {
    const response = await fetcher(url, { credentials: 'omit', referrerPolicy: 'no-referrer', signal });
    if (!response.ok) return null;
    return await response.json();
  } catch { return null; }
}
export function createRateClient({ fetcher = fetch, now = Date.now, storage }: {
  fetcher?: typeof fetch; now?: () => number;
  storage?: Pick<Storage, 'getItem' | 'setItem'>;
} = {}) {
  let state: RateState = { kind: 'unavailable' };
  let fetchedAt = 0, attemptedAt = -Infinity;
  let pending: Promise<RateState> | null = null;
  const listeners = new Set<() => void>();
  const publish = (next: RateState) => { state = next; listeners.forEach(listener => listener()); return state; };
  function load(): Promise<RateState> {
    if (pending) return pending;
    if (state.kind === 'ready' && now() - fetchedAt < TTL && now() - state.rates.asOf < MAX_AGE) return Promise.resolve(state);
    if (now() - attemptedAt < RETRY) {
      if (state.kind === 'ready' && now() - state.rates.asOf >= MAX_AGE) publish({ kind: 'unavailable' });
      return Promise.resolve(state);
    }
    attemptedAt = now();
    try {
      const cached: unknown = JSON.parse(storage?.getItem('cloaktix:public-rates:v1') ?? 'null');
      const rates = parseCached(cached, now());
      if (rates && now() - rates.asOf < TTL) { fetchedAt = rates.asOf; return Promise.resolve(publish({ kind: 'ready', rates })); }
    } catch { /* Market data caching is optional; never read ticket/identity storage. */ }
    pending = Promise.resolve().then(async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4500);
      try {
        const t = now();
        const [geckoRaw, krakenRaw] = await Promise.all([
          readJson(fetcher, RATE_URL, controller.signal),
          readJson(fetcher, KRAKEN_URL, controller.signal),
        ]);
        const samples: Rates[] = [];
        const g = geckoRaw != null ? parseRates(geckoRaw, t) : null;
        const k = krakenRaw != null ? parseKraken(krakenRaw, t) : null;
        if (g) samples.push(g);
        if (k) samples.push(k);
        const rates = combineSamples(samples);
        if (!rates) return publish({ kind: 'unavailable' });
        try { storage?.setItem('cloaktix:public-rates:v1', JSON.stringify(rates)); } catch { /* Optional cache. */ }
        fetchedAt = now();
        return publish({ kind: 'ready', rates });
      } catch { return publish({ kind: 'unavailable' }); }
      finally { clearTimeout(timeout); pending = null; }
    });
    return pending;
  }
  return { getSnapshot: () => state, subscribe: (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; }, load };
}
export type UsdQuote = { kind: 'ready'; cents: bigint; atoms: bigint } | { kind: 'unavailable'; message: string };
export function quoteUsd(text: string, state: RateState): UsdQuote {
  if (!/^\d+(?:\.\d{0,2})?$/.test(text.trim())) return { kind: 'unavailable', message: 'Enter a USD price with at most 2 decimals.' };
  if (state.kind !== 'ready' || Date.now()-state.rates.asOf>MAX_AGE) return { kind: 'unavailable', message: 'Rate unavailable — USD listing cannot be converted yet.' };
  const [whole, fraction = ''] = text.trim().split('.');
  const cents = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'));
  const scaled = Math.round(state.rates.nightUsd * 100_000_000);
  if (!Number.isSafeInteger(scaled) || scaled <= 0) return { kind: 'unavailable', message: 'Rate unavailable.' };
  const scaledRate = BigInt(scaled);
  const atoms = (cents * 1_000_000_000_000n + scaledRate - 1n) / scaledRate;
  if (atoms > 18_446_744_073_709_551_615n) return { kind: 'unavailable', message: 'Price exceeds the supported range.' };
  return { kind: 'ready', cents, atoms };
}
export function currentUsdInput(atoms: bigint, state: RateState): string {
  return state.kind === 'ready' ? (Number(atoms) / 1_000_000 * state.rates.nightUsd).toFixed(2) : '';
}
