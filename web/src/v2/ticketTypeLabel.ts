/** CT-TIX-TYPE-LABEL: the ticket type shown on a ticket ("General admission", "after party · 18+"). Pure. */
export const TICKET_TYPE_LABEL_MAX = 48;
const PLACEHOLDER = /^(Ticket( type)? #\d+|Admission)( · 18\+)?$/;

/** True for names that only repeat an id (old fallbacks "Ticket #N", "Ticket type #N") or are empty. */
export const isPlaceholderTypeName = (name?: string | null) => !name || !name.trim() || PLACEHOLDER.test(name.trim());

/**
 * Published type name, else "Ticket type #N" (typeId), else "Admission"; "· 18+" when the type is adult-only.
 * Capped so the phone link stays small. Duplicate types with the same published name read the same.
 */
export function ticketTypeLabel(name: string | null | undefined, typeId?: bigint | string | null, adult?: boolean): string {
  const id = typeId === null || typeId === undefined || typeId === '' ? null : String(typeId);
  let base = !isPlaceholderTypeName(name) ? name!.trim().replace(/\s+/g, ' ') : id ? `Ticket type #${id}` : 'Admission';
  const badge = adult && !/18\+/.test(base) ? ' · 18+' : '';
  if (base.length + badge.length > TICKET_TYPE_LABEL_MAX) base = base.slice(0, TICKET_TYPE_LABEL_MAX - badge.length - 1).trimEnd() + '…';
  return base + badge;
}
