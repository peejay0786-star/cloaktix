#!/usr/bin/env node
/**
 * CT-RATE v3 — Preview contract deploy PREP ONLY.
 * Does NOT submit a transaction. Prints constructor args checklist and budget.
 *
 * Usage (local):
 *   node scripts/prepare-rate-v3-preview-deploy.mjs
 *
 * To actually deploy later (REQUIRES P-Jay approval + wallet):
 *   Organizer opens /organizer?schema=3&network=preview after Worker ships v3 keys,
 *   connects 1AM, clicks Deploy. Or use midnight-js deployContract with the managed
 *   package at contract/managed/cloaktix-rate-v3 — never run that from this script.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const managed = path.join(root, 'contract/managed/cloaktix-rate-v3');
const idx = path.join(managed, 'contract/index.js');
if (!fs.existsSync(idx)) {
  console.error('Missing managed rate-v3. Run: compact compile contract/cloaktix-rate-v3.compact contract/managed/cloaktix-rate-v3');
  process.exit(1);
}
const measure = spawnSync(process.execPath, [
  path.join(root, 'audit/deploy-budget/measure-deploy-cost.mjs'), managed, '--headroom', '0.6',
], { encoding: 'utf8' });
process.stdout.write(measure.stdout || '');
process.stderr.write(measure.stderr || '');
console.log(`
=== CT-RATE v3 Preview deploy checklist (NOT executed) ===
Managed package: ${managed}
Live v2 address MUST stay untouched: 7fd12c111c2d1aff5731774402d30e75ec92f343caff9b46934656a905aae421
Constructor needs:
  feeBps (e.g. 300), feeAddress, admin H(sk), ageIssuer Jubjub pk,
  rateSigner Jubjub pk (from rate-signer Worker secret — generate only with approval),
  networkTag (preview), maxQuoteAge (e.g. 180), slippageBps (e.g. 100)
Next human approvals required before any chain action — see audit/CT-RATE-V3-PREVIEW-PREP-2026-11-05.md
`);
console.log(`
=== Exact steps for P-Jay (1AM wallet — YOU sign, agent does not) ===
Rate signer public key (constructor rateSigner_):
  x = 0x6c6f6bdd5693bfbf50e134c283f6fc33fd87ee828e23a800c62b77227b71dd97
  y = 0x25473d932086847fcac8c163d4c693fdbf209f29115b2726c9a482b63ef35f3e

Constructor defaults the app will pass:
  feeBps=300, feeAddress=your Midnight payout (1AM address),
  admin=H(your CloakSK), ageIssuer=Passport stub issuer,
  rateSigner=pk above, networkTag=pad("preview"),
  maxQuoteAge=180, slippageBps=100, maxAdaAttestAge=300

Browser steps:
  1. Open https://app.cloaktix.com/?schema=3&network=preview (Access as usual).
  2. Connect Lace / 1AM Midnight Preview wallet (same as v2).
  3. On Organizer "Deploy schema v3 (Preview)", confirm the 1AM prompt — wait for inclusion.
  4. Copy the new contract address (64-hex). Keep v2 7fd12c11… for existing tickets (?schema=2).
  5. Smoke: createEvent → addTicketType → optional ADA path after fee plan.
  6. Tell the agent the v3 address so VITE_RATE_V3_CONTRACT can be set (feature gate).

DO NOT paste RATE_SIGNER_SK or PLATFORM_ADA_FEE_ADDRESS anywhere in chat.
`);

if (measure.status) process.exit(measure.status);
