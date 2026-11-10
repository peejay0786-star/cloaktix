/**
 * Server-side ADA fee split (97% organizer / 3% platform).
 * PLATFORM_ADA_FEE_ADDRESS must come from Worker secret/env — never ship in the web bundle.
 */
import { readPlatformFees } from './platformFees.mjs';

export const ADA_PLATFORM_FEE_BPS = 300n; // 3%
export const ADA_BPS_DENOM = 10000n;

export function splitAdaLovelace(totalLovelace) {
  const total = typeof totalLovelace === 'bigint' ? totalLovelace : BigInt(totalLovelace);
  if (total <= 0n) throw new Error('ADA amount must be positive');
  const fee = (total * ADA_PLATFORM_FEE_BPS) / ADA_BPS_DENOM;
  const organizer = total - fee;
  if (organizer <= 0n || fee < 0n) throw new Error('ADA split produced an empty organizer output');
  return { total, organizer, fee, feeBps: Number(ADA_PLATFORM_FEE_BPS) };
}

/**
 * Build a payment plan. Fee address stays server-side until this response
 * (needed as a tx output; will be public on-chain once submitted).
 */
export function buildAdaFeePlan({ totalLovelace, organizerAddress, env = process.env }) {
  const fees = readPlatformFees(env);
  if (!fees.adaFeeConfigured || !fees.adaFeeAddress) {
    return {
      ok: false,
      configured: false,
      reason: 'PLATFORM_ADA_FEE_ADDRESS not configured on the server',
    };
  }
  const org = String(organizerAddress || '').trim();
  if (!org.startsWith('addr_test1') && !org.startsWith('addr1')) {
    return { ok: false, configured: true, reason: 'Organizer Cardano address is missing or invalid' };
  }
  const split = splitAdaLovelace(totalLovelace);
  if (org === fees.adaFeeAddress) {
    // Organizer is also the platform (Preview self-test). One 100% output; the
    // attestation verifier accepts this when both addresses match and the total covers.
    return {
      ok: true,
      configured: true,
      network: 'preview',
      feeBps: split.feeBps,
      sameAddress: true,
      outputs: [{ role: 'combined', address: org, lovelace: split.total.toString() }],
      totalLovelace: split.total.toString(),
      note: 'Organizer payout equals platform fee address; single combined output.',
    };
  }
  return {
    ok: true,
    configured: true,
    network: 'preview',
    feeBps: split.feeBps,
    outputs: [
      { role: 'organizer', address: org, lovelace: split.organizer.toString() },
      { role: 'platform', address: fees.adaFeeAddress, lovelace: split.fee.toString() },
    ],
    totalLovelace: split.total.toString(),
    note: 'Fee address is returned only for tx construction; do not display it in event pages.',
  };
}

export function adaFeeStatus(env = process.env) {
  const fees = readPlatformFees(env);
  return {
    ok: true,
    configured: fees.adaFeeConfigured,
    network: 'preview',
    feeBps: Number(ADA_PLATFORM_FEE_BPS),
    // Never include the address here.
  };
}
