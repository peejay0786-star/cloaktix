/**
 * PC-side helpers to build a v2 admit capability after registerAdmit / buyTicket(commit).
 * Commit itself must be computed with the contract pure circuit `admitCommitOf`
 * (same hash as Compact). Do not reimplement the hash in ad-hoc JS for production.
 * This module only packages the phone-facing capability once serial/epoch/nonce are known.
 */
import {
  bytesToHex,
  encodeAdmitFragmentPath,
  encodeAdmitQr,
  randomNonce32,
  type AdmitCapabilityV2,
} from './admitCodec';
import { loadSavedAdmits, upsertSavedAdmit, type SavedAdmitV2 } from './admitStore';

export function newAdmitNonce(): { nonce: Uint8Array; nonceHex: string } {
  const nonce = randomNonce32();
  return { nonce, nonceHex: bytesToHex(nonce) };
}

export function packageAdmitCapability(args: {
  networkId: string;
  contract: string;
  serial: string; // decimal
  epoch: string;
  nonceHex: string;
  ticketName?: string;
  eventName?: string;
  typeId?: string;
  eventDate?: string;
  venue?: string;
  cover?: string;
}): { cap: AdmitCapabilityV2; qr: string; fragment: string; saved: SavedAdmitV2 } {
  const cap: AdmitCapabilityV2 = {
    v: 2,
    ...(args.ticketName ? { ticketName: args.ticketName } : {}),
    ...(args.eventName ? { eventName: args.eventName } : {}),
    ...(args.eventDate ? { eventDate: args.eventDate } : {}),
    ...(args.venue ? { venue: args.venue } : {}),
    ...(args.cover ? { cover: args.cover } : {}),
    networkId: args.networkId,
    contract: args.contract,
    serial: args.serial,
    epoch: args.epoch,
    nonceHex: args.nonceHex.toLowerCase(),
  };
  const saved: SavedAdmitV2 = {
    ...cap,
    at: new Date().toISOString(),
    ticketName: args.ticketName,
    eventName: args.eventName,
    typeId: args.typeId,
    eventDate: args.eventDate,
    venue: args.venue,
    cover: args.cover,
  };
  upsertSavedAdmit(saved);
  return { cap, qr: encodeAdmitQr(cap), fragment: encodeAdmitFragmentPath(cap), saved };
}

/** Enrich a confirmed capability without preparing it or touching the chain. */
export function saveAdmitDetails(cap: AdmitCapabilityV2, details: { date?: string; venue?: string; cover?: string }) {
  const saved = loadSavedAdmits().find((item) => item.networkId === cap.networkId && item.contract === cap.contract && item.serial === cap.serial);
  const enriched = { ...saved, ...cap, at: saved?.at ?? new Date().toISOString(),
    eventDate: details.date || cap.eventDate || saved?.eventDate, venue: details.venue || cap.venue || saved?.venue, cover: details.cover || cap.cover || saved?.cover };
  upsertSavedAdmit(enriched);
  return enriched;
}
