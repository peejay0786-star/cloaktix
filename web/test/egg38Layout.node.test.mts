import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const css = readFileSync(join(root, 'src/styles.css'), 'utf8');
const scanner = readFileSync(join(root, 'src/Scanner.tsx'), 'utf8');
const verdict = readFileSync(join(root, 'src/DoorVerdict.tsx'), 'utf8');
const gates = {
  App: readFileSync(join(root, 'src/App.tsx'), 'utf8'),
  TicketsGateV2: readFileSync(join(root, 'src/v2/TicketsGateV2.tsx'), 'utf8'),
  GateV4: readFileSync(join(root, 'src/multigate/GateV4.tsx'), 'utf8'),
};

describe('EGG-38 check-in layout', () => {
  it('portals the scanner and verdicts to document.body', () => {
    assert.match(scanner, /createPortal/);
    assert.match(scanner, /createPortal\(node, document\.body\)/);
    assert.match(verdict, /createPortal/);
    assert.match(verdict, /createPortal\(node, document\.body\)/);
    assert.match(scanner, /door-overlay-open/);
    assert.match(verdict, /door-overlay-open/);
    assert.match(scanner, /if\(stopped\|\|!video\.current\)\{release\(\);return;\}/);
  });

  it('uses a fullscreen flex stack and a square camera, without overlapping footer placement', () => {
    assert.match(css, /\.scanner-screen\s*\{[^}]*z-index:\s*300/);
    assert.match(css, /\.door-verdict\s*\{[^}]*z-index:\s*310/s);
    assert.match(css, /\.scanner-viewport[^}]*aspect-ratio:\s*1\s*\/\s*1/);
    assert.match(css, /\.door-verdict-next\s*\{[^}]*position:\s*static/s);
    assert.equal(/\ .door-verdict-next[^}]*position:\s*absolute/.test(css), false);
    assert.match(css, /orientation:\s*landscape/);
    assert.match(css, /\.door-verdict\.warning/);
  });

  it('keeps the three gate mounts so the portal applies everywhere', () => {
    for (const [name, text] of Object.entries(gates)) {
      assert.match(text, /<Scanner/, name);
      assert.match(text, /<DoorVerdict/, name);
    }
  });
});
