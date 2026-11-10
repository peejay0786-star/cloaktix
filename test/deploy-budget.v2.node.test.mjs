/**
 * Regression: schema-v2 one-shot deploy must fit Preview/mainnet block bytesWritten headroom.
 * Uses Midnight servicedesk measure-deploy-cost.mjs (ledger SyntheticCost) — no wallet/node.
 * Fail = exit 3 from measurer (over --headroom 0.6 of bytesWritten 50000).
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const measure = path.join(root, 'audit/deploy-budget/measure-deploy-cost.mjs');
const managed = path.join(root, 'contract/managed/cloaktix-v2');

describe('CloakTix v2 deploy budget (Preview/mainnet ledger limits)', () => {
  it('one-shot deploy with all verifier keys fits ≤60% bytesWritten (avoids 1010)', () => {
    const r = spawnSync(process.execPath, [measure, managed, '--headroom', '0.6'], {
      encoding: 'utf8',
      cwd: path.dirname(measure),
      env: { ...process.env },
    });
    const out = `${r.stdout ?? ''}\n${r.stderr ?? ''}`;
    assert.match(out, /bytesWritten\s+(\d+)/);
    const m = out.match(/bytesWritten\s+(\d+)/);
    const bw = Number(m[1]);
    // Keep the measured number in the assertion message (explain-the-number).
    assert.equal(
      r.status,
      0,
      `deploy budget failed (exit ${r.status}). bytesWritten=${bw} limit=50000 headroom=0.6. Output:\n${out}`,
    );
    assert.ok(bw <= 30000, `bytesWritten ${bw} should stay near v1 (~28814), got ${bw}`);
    assert.match(out, /RESULT: fits in one block/);
  });
});
