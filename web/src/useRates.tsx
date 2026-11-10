import { createContext, useContext, useEffect, useSyncExternalStore } from 'react';
import { createRateClient, type RateState } from './rates';
export const RatesContext = createContext<RateState | null>(null);
const unavailable: RateState = { kind: 'unavailable' };
const client = createRateClient({ storage: {
  getItem: key => { try { return localStorage.getItem(key); } catch { return null; } },
  setItem: (key, value) => { localStorage.setItem(key, value); },
} });
export function useRates(): RateState {
  const override = useContext(RatesContext);
  const state = useSyncExternalStore(client.subscribe, client.getSnapshot, () => unavailable);
  useEffect(() => {
    if (override) return;
    void client.load();
    const timer = setInterval(() => { void client.load(); }, 180_000);
    return () => clearInterval(timer);
  }, [override]);
  const selected=override ?? state;
  return selected.kind==='ready' && Date.now()-selected.rates.asOf>600_000 ? unavailable : selected;
}
