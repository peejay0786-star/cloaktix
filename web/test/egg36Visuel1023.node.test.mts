import { it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');

function contrast(fg: string, bg: string): number {
  const toLin = (hex: string) => {
    const n = hex.replace('#', '');
    const v = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16) / 255);
    return v.map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  };
  const lum = (hex: string) => {
    const [r, g, b] = toLin(hex);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const [a, b] = [lum(fg), lum(bg)].sort((x, y) => y - x);
  return (a + 0.05) / (b + 0.05);
}

it('primary buttons and skip-link use the AA gradient and states', () => {
  const primary = css.slice(css.indexOf('button.primary, a.primary'), css.indexOf('button.big'));
  assert.match(primary, /linear-gradient\(135deg, #7C3AED 0%, #6D28D9 100%\)/);
  assert.match(primary, /button\.primary:hover, a\.primary:hover/);
  assert.match(primary, /linear-gradient\(135deg, #6D28D9 0%, #5B21B6 100%\)/);
  assert.match(primary, /button\.primary:active, a\.primary:active/);
  assert.match(primary, /outline: 2px solid #C4B5FD/);
  assert.match(primary, /button\.primary:disabled:not\(\.is-pending\)/);
  assert.match(primary, /background: #1E1A2E; color: #A8A4BE;/);
  assert.equal(primary.includes('#A78BFA'), false);
  assert.match(css, /\.skip-link \{[\s\S]*?background: #7C3AED;/);
  assert.ok(contrast('#FFFFFF', '#7C3AED') >= 4.5);
  assert.ok(contrast('#FFFFFF', '#6D28D9') >= 4.5);
  assert.ok(contrast('#FFFFFF', '#5B21B6') >= 4.5);
  assert.ok(contrast('#A8A4BE', '#1E1A2E') >= 4.5);
  assert.ok(contrast('#C4B5FD', '#06060A') >= 3);
});

it('Connect dialog links to 1AM without loading the SDK when opened', () => {
  const picker = app.slice(app.indexOf('const openWalletPicker'), app.indexOf('const [, force]'));
  assert.match(picker, /discoverWallets\(\)/);
  assert.equal(picker.includes('loadSdk'), false);
  const dialog = app.slice(app.indexOf('{picker && <Dialog'), app.indexOf('{s && tab !== \'home\''));
  assert.match(dialog, /href="https:\/\/1am\.xyz\/"/);
  assert.match(dialog, /Get 1AM/);
  assert.match(dialog, /target="_blank" rel="noopener noreferrer"/);
  assert.match(dialog, /chromewebstore\.google\.com\/detail\/1am/);
  assert.match(dialog, /On your phone\?/);
  assert.match(dialog, /1am\.xyz\/mobile/);
  assert.match(dialog, /Discover tab/);
  assert.match(dialog, /never asks for a password, a recovery phrase or a key/);
  assert.equal(dialog.includes('loadSdk'), false);
});
