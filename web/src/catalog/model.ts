export const MAX_STORED_COVER_LENGTH = 300000;
export const DEMO_COVERS = ['/art/neon-nights.webp','/art/quantum-club.webp','/art/signal-room.webp','/art/glass-choir.webp','/art/dust-garden.webp','/art/redacted-live.webp'];
export type EventDetails = { name: string; date: string; venue: string; cover: string; description: string; demoArt: string };
export type ListingType = { id: string; name: string; usdCents?: string; resaleSummary: string };
export type PublicListing = EventDetails & { id: string; publishedAt: number; tickets: ListingType[] };
export type PublishedCatalog = { source: 'organizer-published'; contract: string; events: PublicListing[] };
export const isRecord = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const text = (v: unknown, min: number, max: number): v is string => typeof v === 'string' && v.trim().length >= min && v.length <= max;
export function isValidEventDate(value: unknown): boolean {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return month >= 1 && month <= 12 && day >= 1 && day <= days[month - 1];
}
export function eventDetailsError(v: unknown): string | null {
  if (!isRecord(v) || !text(v.name, 2, 80) || /^[-–—\s]+$/.test(v.name.trim()) || /^Event\s*#\d+$/i.test(v.name.trim())) return 'Enter a real event name (2–80 characters).';
  if (!isValidEventDate(v.date)) return 'Choose a valid event date.';
  if (!text(v.venue, 2, 120) || /^[-–—]+$/.test(v.venue.trim())) return 'Enter a real venue.';
  if (!text(v.description, 10, 1200)) return 'Add a short description (10–1200 characters).';
  if (!text(v.cover, 1, MAX_STORED_COVER_LENGTH)) return 'Upload a cover image or explicitly choose demo artwork.';
  if (DEMO_COVERS.includes(v.cover)) return v.demoArt === 'true' ? null : 'Demo artwork must be labeled as demo.';
  if (!/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+=*$/.test(v.cover)) return 'Use a PNG, JPEG or WebP image; phone photos are resized automatically.';
  return null;
}
export function parseEventDetails(v: unknown): EventDetails | null {
  if (eventDetailsError(v) || !isRecord(v)) return null;
  // Each claim is checked separately: external metadata is not trusted just because it has a name.
  if (typeof v.name !== 'string' || typeof v.date !== 'string' || typeof v.venue !== 'string' || typeof v.cover !== 'string' || typeof v.description !== 'string') return null;
  return {name:v.name.trim(),date:v.date,venue:v.venue.trim(),cover:v.cover,description:v.description.trim(),demoArt:DEMO_COVERS.includes(v.cover)?'true':'false'};
}
/** CT-UI-NITS: older published summaries used an em-dash ("Capped resale — maximum …"); show them with a comma. */
export function plainDashes(text: string): string { return text.replace(/\s*[—–]\s*/g, ', '); }
export function parseListingType(v: unknown): ListingType | null {
  if (!isRecord(v) || typeof v.id !== 'string' || !/^\d{1,19}$/.test(v.id) || !text(v.name,1,80) || !text(v.resaleSummary,1,180)) return null;
  if (v.usdCents !== undefined && (typeof v.usdCents !== 'string' || !/^\d{1,12}$/.test(v.usdCents))) return null;
  return {id:v.id,name:v.name.trim(),...(typeof v.usdCents==='string'?{usdCents:v.usdCents}:{}),resaleSummary:plainDashes(v.resaleSummary)};
}
export function parsePublishedCatalog(v: unknown): PublishedCatalog | null {
  if (!isRecord(v) || v.source !== 'organizer-published' || typeof v.contract !== 'string' || !/^[0-9a-f]{64}$/.test(v.contract) || !Array.isArray(v.events) || v.events.length>200) return null;
  const events: PublicListing[]=[];
  for (const row of v.events) {
    const details=parseEventDetails(row);
    if (!details || !isRecord(row) || typeof row.id!=='string' || !/^\d{1,19}$/.test(row.id) || typeof row.publishedAt!=='number' || !Number.isSafeInteger(row.publishedAt) || !Array.isArray(row.tickets)) return null;
    const tickets: ListingType[]=[];
    for (const raw of row.tickets) {const ticket=parseListingType(raw);if(!ticket)return null;tickets.push(ticket);}
    events.push({...details,id:row.id,publishedAt:row.publishedAt,tickets});
  }
  return {source:'organizer-published',contract:v.contract,events};
}
export function formatPublishedUsd(cents: string): string {
  const n=BigInt(cents);return `$${n/100n}.${String(n%100n).padStart(2,'0')} USD`;
}
