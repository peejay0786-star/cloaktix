/** Local store for v2 admit capabilities prepared on a PC wallet session. */

import { isAdmitCapabilityV2, type AdmitCapabilityV2 } from './admitCodec';

export type SavedAdmitV2 = AdmitCapabilityV2 & {
  at: string;
  ticketName?: string;
  eventName?: string;
  typeId?: string;
  eventDate?: string;
  venue?: string;
  cover?: string;
};

const KEY = 'cloaktix.v2.admits.v1';

function isSaved(x: unknown): x is SavedAdmitV2 {
  if (!isAdmitCapabilityV2(x)) return false;
  const o = x as SavedAdmitV2;
  return typeof o.at === 'string';
}

export function loadSavedAdmits(): SavedAdmitV2[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isSaved);
  } catch {
    return [];
  }
}

export function saveSavedAdmits(list: SavedAdmitV2[]): void {
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function upsertSavedAdmit(item: SavedAdmitV2): void {
  const list = loadSavedAdmits().filter(
    (a) => !(a.contract === item.contract && a.serial === item.serial && a.networkId === item.networkId),
  );
  list.unshift(item);
  saveSavedAdmits(list);
}
