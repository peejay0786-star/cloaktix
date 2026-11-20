import { afterEach, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  cameraErrorMessage,
  cameraHardwareSupported,
  cameraScanSupported,
  ensureBarcodeDetector,
  nativeBarcodeDetectorAvailable,
  polyfillLoadErrorMessage,
  stopMediaStream,
  trackSupportsTorch,
} from '../src/cameraSupport.ts';
import { alreadyUsedReason, cleanVerdictMeta, doorVerdictCopy, firstAdmissionFromReason } from '../src/mapDoorVerdict.ts';


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

const src = (rel: string) => readFileSync(new URL(rel, import.meta.url), 'utf8');
const support = src('../src/cameraSupport.ts');
const scanner = src('../src/Scanner.tsx');
const css = src('../src/styles.css');
const app = src('../src/App.tsx');
const gateV2 = src('../src/v2/TicketsGateV2.tsx');
const gateV4 = src('../src/multigate/GateV4.tsx');
const notice = src('../../NOTICE');
const pkg = JSON.parse(src('../package.json'));

const hadWindow = 'window' in globalThis;
const originalWindow = (globalThis as { window?: unknown }).window;

afterEach(() => {
  if (!hadWindow) delete (globalThis as { window?: unknown }).window;
  else (globalThis as { window?: unknown }).window = originalWindow;
});

function installWindow(opts: { secure?: boolean; getUserMedia?: boolean; BarcodeDetector?: unknown }) {
  const mediaDevices = opts.getUserMedia === false ? undefined : { getUserMedia: async () => ({ getTracks() { return []; }, getVideoTracks() { return []; } }) };
  (globalThis as { window: unknown }).window = {
    isSecureContext: opts.secure !== false,
    BarcodeDetector: opts.BarcodeDetector,
    navigator: { mediaDevices },
  };
}

it('package pins barcode-detector 3.2.3 and NOTICE lists its licenses', () => {
  assert.equal(pkg.dependencies['barcode-detector'], '3.2.3');
  assert.match(notice, /barcode-detector 3\.2\.3/);
  assert.match(notice, /zxing-wasm/);
  assert.match(notice, /ZXing-C\+\+/);
  assert.match(notice, /Apache License 2\.0/);
  assert.match(notice, /MIT License/);
});

it('camera support no longer requires native BarcodeDetector', () => {
  const hw = support.slice(support.indexOf('export function cameraHardwareSupported'), support.indexOf('export function nativeBarcodeDetectorAvailable'));
  assert.equal(hw.includes('BarcodeDetector'), false);
  assert.match(hw, /isSecureContext/);
  assert.match(hw, /getUserMedia/);
  assert.match(support, /export const cameraScanSupported = \(\) => cameraHardwareSupported\(\);/);
  installWindow({ secure: true, getUserMedia: true });
  assert.equal(cameraHardwareSupported(), true);
  assert.equal(cameraScanSupported(), true);
  assert.equal(nativeBarcodeDetectorAvailable(), false);
  installWindow({ secure: true, getUserMedia: true, BarcodeDetector: class {} });
  assert.equal(cameraScanSupported(), true);
  assert.equal(nativeBarcodeDetectorAvailable(), true);
  installWindow({ secure: false, getUserMedia: true, BarcodeDetector: class {} });
  assert.equal(cameraScanSupported(), false);
  installWindow({ secure: true, getUserMedia: false });
  assert.equal(cameraScanSupported(), false);
});

it('ensureBarcodeDetector uses native when present and the ponyfill otherwise', async () => {
  class Native {
    detect() { return Promise.resolve([]); }
  }
  installWindow({ BarcodeDetector: Native });
  const native = await ensureBarcodeDetector(async () => {
    throw new Error('ponyfill must not load when native is present');
  });
  assert.equal(native.engine, 'native');
  assert.equal(native.Detector, Native);

  installWindow({});
  class Poly {
    detect() { return Promise.resolve([]); }
  }
  let loaded = 0;
  const poly = await ensureBarcodeDetector(async () => {
    loaded += 1;
    return Poly as never;
  });
  assert.equal(poly.engine, 'polyfill');
  assert.equal(poly.Detector, Poly);
  assert.equal(loaded, 1);
});

it('loads the ponyfill only through a dynamic import in cameraSupport', () => {
  assert.match(support, /await import\('barcode-detector\/ponyfill'\)|import\('barcode-detector\/ponyfill'\)/);
  assert.match(support, /zxing-wasm\/dist\/reader\/zxing_reader\.wasm/);
  assert.match(support, /new URL\(/);
  assert.match(support, /setZXingModuleOverrides/);
  assert.equal(support.includes('jsdelivr'), false);
  assert.equal(support.includes("from 'barcode-detector"), false);
  for (const [name, text] of [['App', app], ['TicketsGateV2', gateV2], ['GateV4', gateV4], ['Scanner', scanner]] as const) {
    assert.equal(text.includes('barcode-detector'), false, `${name} must not import the polyfill`);
  }
  assert.match(scanner, /ensureBarcodeDetector\(/);
  assert.match(scanner, /playsInline/);
  assert.match(scanner, /muted/);
  assert.match(scanner, /Torch/);
  assert.match(scanner, /Paste code/);
  assert.match(scanner, /stopMediaStream/);
  assert.match(scanner, /QR engine: ZXing \(wasm\)/);
  assert.match(scanner, /get\('debug'\) === '1'/);
  assert.match(scanner, /Align the QR inside the frame/);
  assert.equal(scanner.includes('Close camera'), false);
  assert.equal(scanner.includes('Torch unavailable'), false);
  assert.equal(scanner.includes('Point the camera at the ticket QR'), false);
  assert.match(scanner, /className="top"/);
  assert.match(scanner, /cloaktix_lockup_transparent_on-dark/);
  assert.equal(scanner.includes('scanner-icon-btn'), false);
  const verdict = src('../src/DoorVerdict.tsx');
  assert.match(verdict, /className="primary big wide"/);
  assert.match(verdict, /Tap to stay/);
  assert.equal(verdict.includes('door-verdict-next-btn'), false);
});

it('maps permission errors and already-used reasons for the door overlay', () => {
  assert.match(cameraErrorMessage({ name: 'NotAllowedError' }), /permission was denied/i);
  assert.match(cameraErrorMessage({ name: 'NotFoundError' }), /No camera was found/);
  assert.match(cameraErrorMessage({ name: 'NotReadableError' }), /busy or unavailable/);
  assert.match(cameraErrorMessage(new Error('boom')), /paste the ticket code/i);
  assert.match(polyfillLoadErrorMessage(), /could not load/i);
  assert.equal(alreadyUsedReason('Already used'), true);
  assert.equal(alreadyUsedReason('Ticket already consumed'), true);
  assert.equal(alreadyUsedReason('Already admitted at this gate'), true);
  assert.equal(alreadyUsedReason('Pass now consumed'), true);
  assert.equal(alreadyUsedReason('Wrong event'), false);
  const ok = doorVerdictCopy({ ok: true, typeName: 'GA', meta: 'serial 3 · tx abc' });
  assert.deepEqual({ title: ok.title, subtitle: ok.subtitle, ok: ok.ok }, { title: 'Valid', subtitle: 'Admit 1', ok: true });
  const used = doorVerdictCopy({ ok: false, reason: 'Already used' });
  assert.equal(used.title, 'Already used');
  assert.equal(used.subtitle, 'Do not admit');
  assert.equal(used.tone, 'used');
  const timed = doorVerdictCopy({ ok: false, reason: 'Already admitted at 7:12 PM (single-use pass)' });
  assert.equal(timed.tone, 'used');
  assert.equal(timed.firstAdmittedAt, '7:12 PM');
  assert.equal(firstAdmissionFromReason('Already admitted locally at 4:01:09 PM'), '4:01:09 PM');
  assert.equal(cleanVerdictMeta('serial 12 · fixture'), 'serial 12');
  assert.equal(cleanVerdictMeta('Confirmed on Midnight'), 'Confirmed on Midnight');
  const bad = doorVerdictCopy({ ok: false, reason: 'Wrong door' });
  assert.equal(bad.title, 'Not valid');
  assert.equal(bad.subtitle, 'Do not admit');
  assert.equal(bad.tone, 'invalid');
  const okCopy = doorVerdictCopy({ ok: true, typeName: 'GA', meta: 'serial 3 · fixture' });
  assert.equal(okCopy.tone, 'ok');
  assert.equal(okCopy.meta.includes('fixture'), false);
});

it('torch helper and stream stop do not throw', () => {
  assert.equal(trackSupportsTorch(undefined), false);
  const stopped: string[] = [];
  const track = { stop() { stopped.push('t'); }, getCapabilities() { return {}; } } as unknown as MediaStreamTrack;
  stopMediaStream({ getTracks() { return [track]; } } as unknown as MediaStream, { srcObject: {} } as unknown as HTMLVideoElement);
  assert.deepEqual(stopped, ['t']);
});

it('check-in screens use the fullscreen scanner and door verdict colors', () => {
  assert.match(css, /\.scanner-screen/);
  assert.match(css, /#047857/);
  assert.match(css, /#0f766e/);
  assert.match(css, /#083344/);
  assert.match(css, /#be123c/);
  assert.match(css, /#86198f/);
  assert.match(css, /#3b0764/);
  assert.match(css, /#c2410c/);
  assert.match(css, /#9a3412/);
  assert.match(css, /#9f1239/);
  assert.match(css, /#7C3AED/);
  assert.match(css, /#6D28D9/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(css, /\.door-verdict\.ok/);
  assert.match(css, /\.door-verdict\.used/);
  assert.match(css, /\.door-verdict\.invalid/);
  assert.match(css, /\.scanner-view-card/);
  assert.equal(css.includes('door-verdict-next-btn'), false);
  assert.ok(contrast('#FFFFFF', '#047857') >= 4.5);
  assert.ok(contrast('#FFFFFF', '#0f766e') >= 4.5);
  assert.ok(contrast('#FFFFFF', '#083344') >= 4.5);
  assert.ok(contrast('#FFFFFF', '#be123c') >= 4.5);
  assert.ok(contrast('#FFFFFF', '#86198f') >= 4.5);
  assert.ok(contrast('#FFFFFF', '#3b0764') >= 4.5);
  assert.ok(contrast('#FFFFFF', '#c2410c') >= 4.5);
  assert.ok(contrast('#FFFFFF', '#9a3412') >= 4.5);
  assert.ok(contrast('#FFFFFF', '#9f1239') >= 4.5);
  assert.ok(contrast('#F7F5FF', '#0C0C14') >= 4.5);
  assert.ok(contrast('#EDE9FE', '#0C0C14') >= 4.5);
  assert.ok(contrast('#FFFFFF', '#7C3AED') >= 4.5);
  assert.ok(contrast('#FFFFFF', '#6D28D9') >= 4.5);
  for (const [name, text] of [['App', app], ['TicketsGateV2', gateV2], ['GateV4', gateV4]] as const) {
    assert.match(text, /DoorVerdict/, name);
    assert.match(text, /onPaste/, name);
    assert.match(text, /cameraScanSupported\(\)/, name);
    assert.equal(/unavailable on iPhone/.test(text), false, name);
  }
  assert.match(app, /If the camera is unavailable at the door, paste the private ticket code/);
  assert.match(gateV4, /If the camera is unavailable, paste the ticket code/);
});

it('does not statically import barcode-detector from the home graph entry', () => {
  const home = src('../src/main.tsx');
  assert.equal(home.includes('barcode-detector'), false);
  assert.equal(home.includes('cameraSupport'), false);
  assert.equal(home.includes('Scanner'), false);
  const catalog = src('../src/catalog/PublicCatalog.tsx');
  assert.equal(catalog.includes('barcode-detector'), false);
  assert.equal(scanner.includes("from './cameraSupport'"), true);
});
