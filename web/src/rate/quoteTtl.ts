/**
 * Signed USD to NIGHT quote lifetimes.
 * The live rate-v3 contract (event 1) stays at 180 s.
 * EGG-40 is deployed with maxQuoteAge 300, and its signer must issue 300 s quotes in the same switch.
 * No secret rotation: the existing public rate signer key is reused.
 */
export const LIVE_V3_QUOTE_TTL_SEC = 180;
export const EGG40_QUOTE_TTL_SEC = 300;
