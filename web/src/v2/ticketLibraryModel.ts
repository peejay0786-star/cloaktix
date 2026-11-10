import { loadPurchase, type PurchaseReceipt } from '../purchaseReceipts.ts';
import type { AdmitCapabilityV2 } from './admitCodec.ts';
import { isPlaceholderTypeName, ticketTypeLabel } from './ticketTypeLabel.ts';
export type TicketListItem = {
  key: string; serial: string; eventName: string; ticketName: string; date?: string; venue?: string; cover?: string;
  purchase?: PurchaseReceipt; cap?: AdmitCapabilityV2; offline?: boolean;
};
export function savedTicketItems(caps: (AdmitCapabilityV2 & { at?: string; eventDate?: string; venue?: string; cover?: string; typeId?: string })[]): TicketListItem[] {
  return caps.map((cap)=>({key:`${cap.networkId}:${cap.contract}:${cap.serial}`,serial:cap.serial,
    eventName:cap.eventName || 'Saved ticket',ticketName:ticketTypeLabel(cap.ticketName, cap.typeId),date:cap.eventDate,venue:cap.venue,cover:cap.cover,cap,offline:true,purchase:loadPurchase(cap.networkId,cap.contract,cap.serial)}));
}

export type TicketMetadata = { eventName?: string; ticketName?: string; date?: string; venue?: string; cover?: string };
/** Empty ledger metadata must never erase the richer copy saved with a ticket. */
export function ticketMetadata(current: TicketMetadata, saved?: TicketMetadata): TicketMetadata {
  return {
    eventName: current.eventName && !/^Event #\d+$/.test(current.eventName) ? current.eventName : saved?.eventName || current.eventName,
    // A published name beats a saved one; a saved real name beats an id-only fallback ("Ticket type #N").
    ticketName: !isPlaceholderTypeName(current.ticketName) ? current.ticketName : (!isPlaceholderTypeName(saved?.ticketName) ? saved?.ticketName : current.ticketName || saved?.ticketName),
    date: current.date || saved?.date,
    venue: current.venue || saved?.venue,
    cover: current.cover || saved?.cover,
  };
}
