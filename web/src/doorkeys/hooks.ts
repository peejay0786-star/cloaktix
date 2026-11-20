import { useCallback, useEffect, useRef, useState } from 'react';
import { loadEgg40Api, type Egg40Api } from './api';
import { doorsOpen, type DoorSchedule } from './model';

/** undefined while loading, null when EGG-40 is not available in this build. */
export function useEgg40Api(): Egg40Api | null | undefined {
  const [api, setApi] = useState<Egg40Api | null | undefined>(undefined);
  useEffect(() => {
    let alive = true;
    loadEgg40Api().then(a => { if (alive) setApi(a); }, () => { if (alive) setApi(null); });
    return () => { alive = false; };
  }, []);
  return api;
}

/** Polls `read` every `ms` while mounted. A failed read keeps the last value and reports the error. */
export function usePolled<T>(read: (() => Promise<T>) | null, ms: number, deps: unknown[]): { value: T | undefined; error: boolean; reload(): void } {
  const [value, setValue] = useState<T | undefined>(undefined);
  const [error, setError] = useState(false);
  const readRef = useRef(read); readRef.current = read;
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let alive = true;
    const pull = () => { const r = readRef.current; if (!r) return; r().then(v => { if (alive) { setValue(v); setError(false); } }, () => { if (alive) setError(true); }); };
    pull();
    const timer = setInterval(pull, ms);
    return () => { alive = false; clearInterval(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ms, tick, ...deps]);
  return { value, error, reload: useCallback(() => setTick(n => n + 1), []) };
}

/**
 * Sell and resale are hidden for an event once its doors open (EGG40-FINAL 9.2: a holder could list a ticket
 * after entering, before settlement). Returns false for every event when EGG-40 is not available.
 */
export function useResaleLocked(eventIds: bigint[]): (eventId: bigint) => boolean {
  const api = useEgg40Api();
  const key = eventIds.map(String).sort().join(',');
  const [schedules, setSchedules] = useState<Record<string, DoorSchedule | null>>({});
  useEffect(() => {
    if (!api || !key) return;
    let alive = true;
    void Promise.all(key.split(',').map(async id => [id, await api.organizer.schedule(BigInt(id)).catch(() => null)] as const))
      .then(rows => { if (alive) setSchedules(Object.fromEntries(rows)); });
    return () => { alive = false; };
  }, [api, key]);
  // Fail closed: while EGG-40 or an event's schedule is still loading, resale stays hidden for that event.
  return useCallback((eventId: bigint) => {
    if (api === null) return false;
    const id = String(eventId);
    if (api === undefined || !(id in schedules)) return true;
    return doorsOpen(schedules[id], api.organizer.now());
  }, [api, schedules]);
}
