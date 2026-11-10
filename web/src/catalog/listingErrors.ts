/** User-facing messages for a failed public-catalog write. Never invent a new event or ticket type. */
export type ListingWriteFailure = { ok: false; status?: number; error?: string };

export function listingSaveError(result: ListingWriteFailure | null | undefined): string {
  const error = (result?.error ?? '').toLowerCase();
  const status = result?.status;
  if (!result || status == null) {
    return 'Not saved. Check the connection, then try again. Do not create the event or ticket types again.';
  }
  if (status === 400 && /oversized|too large/.test(error)) {
    return 'The cover image is too large for the public catalog. Choose Demo artwork 1 or a smaller photo, then retry Save details. Do not create the event or ticket types again.';
  }
  if (status === 400) {
    return 'The public details were not accepted. Check the name, date, venue, description and cover, then retry Save details. Do not create the event or ticket types again.';
  }
  if (status === 403 && /not registered/.test(error)) {
    return 'This browser is not yet registered as the organizer for public listings. If 1AM asks you to approve a one-time key registration, approve it, then retry Save details. That does not create a new event or ticket types.';
  }
  if (status === 403) {
    return 'Organizer verification failed. Retry Save details in this same browser, with the same wallet connected. Do not create the event or ticket types again.';
  }
  if (status === 404) {
    return 'The event is not visible to the catalog yet. Wait about a minute, then retry Save details. Do not create the event again.';
  }
  if (status === 503 && /not allowlisted/.test(error)) {
    return 'Catalog verification cannot use this wallet indexer yet. Retry after the catalog update is published. Do not create the event or ticket types again.';
  }
  if (status === 503) {
    return 'Catalog verification is unavailable right now. Check the connection, then retry Save details. Do not create the event or ticket types again.';
  }
  if (status === 507) {
    return 'The public catalog cannot accept another listing right now. Try again later. Do not create the event again.';
  }
  return 'Not saved. Check the connection and organizer verification, then try again. Do not create the event or ticket types again.';
}

export function parseListingErrorBody(text: string): string {
  try {
    const body = JSON.parse(text) as { error?: unknown };
    return typeof body.error === 'string' && body.error.trim() ? body.error : text;
  } catch {
    return text;
  }
}
