/** Local-only cover recovery and creation regressions. No wallet or network calls. */
import { it, after, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const require = createRequire(new URL('../package.json', import.meta.url));
const { build } = require('esbuild');
const React = require('react');
const { act, create } = require('react-test-renderer');
const { renderToStaticMarkup } = require('react-dom/server');
const root = new URL('../', import.meta.url).pathname;
const dir = mkdtempSync(root + '.create-cover-test-');
after(() => rmSync(dir, { recursive: true, force: true }));
await build({ stdin: { contents: `export {EventDetailsFields,EventCreateForm,EventEditForm} from './src/EventCreateForm';export * from './src/coverImage';export * from './src/catalog/model';`, resolveDir: root, loader: 'tsx' }, bundle: true, packages: 'external', platform: 'node', format: 'esm', jsx: 'automatic', outfile: dir + '/ui.mjs', logLevel: 'error' });
const ui = await import(pathToFileURL(dir + '/ui.mjs').href);
const details = { name: 'Cover regression', date: '2026-12-24', venue: 'Sample venue', description: 'Local illustrative event only.', cover: '', demoArt: 'false' };
const uploaded = 'data:image/jpeg;base64,AAAA';
const fakePayout = 'mn_addr_preview1' + 'q'.repeat(30);
Object.defineProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT', { configurable: true, value: true });
let mounted: ReturnType<typeof create>;
afterEach(async () => { if (mounted) await act(() => mounted.unmount()); });
async function fields(initial = details) {
  let value = { ...initial };
  const picker = { value: '', files: [] };
  const props = () => ({ value, onChange(next: typeof details) { value = next; mounted.update(React.createElement(ui.EventDetailsFields, props())); } });
  await act(() => { mounted = create(React.createElement(ui.EventDetailsFields, props()), { createNodeMock: (element: {type: string; props: {type?: string}}) => element.type === 'input' && element.props.type === 'file' ? picker : null }); });
  return {
    value: () => value, picker,
    async upload(file: File) { picker.value = 'test-photo.jpg'; await act(async () => { await mounted.root.findByProps({ type: 'file' }).props.onChange({ currentTarget: { ...picker, files: [file], get value() { return picker.value; }, set value(v) { picker.value = v; } } }); }); },
    async select(cover: string) { await act(() => mounted.root.findByType('select').props.onChange({ target: { value: cover } })); },
    async remove() { await act(() => mounted.root.findAllByType('button').find((b: {props: {children: string}}) => b.props.children === 'Remove photo').props.onClick()); },
    alerts: () => mounted.root.findAllByProps({ role: 'alert' }).map((p: {props: {children: string}}) => p.props.children).join(' '),
  };
}
function mockCanvas(t: Parameters<Parameters<typeof it>[1]>[0], { unreadable = false, encode = (_canvas: {width: number; height: number}, _quality: number) => uploaded } = {}) {
  const previousImage = Object.getOwnPropertyDescriptor(globalThis, 'Image');
  const previousDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
  class FakeImage {
    naturalWidth = 4000; naturalHeight = 3000;
    onload = () => {}; onerror = () => {};
    set src(_url: string) { queueMicrotask(() => unreadable ? this.onerror() : this.onload()); }
  }
  const attempts: {width: number; height: number; quality: number}[] = [];
  const canvas = { width: 0, height: 0, getContext: () => ({ fillStyle: '', fillRect() {}, drawImage() {} }), toDataURL(type: string, quality: number) { assert.equal(type, 'image/jpeg'); attempts.push({width: this.width, height: this.height, quality}); return encode(this, quality); } };
  Object.defineProperty(globalThis, 'Image', { configurable: true, value: FakeImage });
  Object.defineProperty(globalThis, 'document', { configurable: true, value: { createElement: () => canvas } });
  const revoked: string[] = [];
  t.mock.method(URL, 'createObjectURL', () => 'blob:local-cover-test');
  t.mock.method(URL, 'revokeObjectURL', (url: string) => { revoked.push(url); });
  t.after(() => { if (previousImage) Object.defineProperty(globalThis, 'Image', previousImage); else Reflect.deleteProperty(globalThis, 'Image'); if (previousDocument) Object.defineProperty(globalThis, 'document', previousDocument); else Reflect.deleteProperty(globalThis, 'document'); });
  return { attempts, revoked };
}
it('picker accepts reasonable phone originals over 200 KB but guards type, empty file and 12 MB limit', () => {
  assert.equal(ui.coverFileError({type: 'image/jpeg', size: 3 * 1024 * 1024}), null);
  assert.equal(ui.coverFileError({type: 'image/webp', size: 12 * 1024 * 1024}), null);
  assert.match(ui.coverFileError({type: 'image/png', size: 12 * 1024 * 1024 + 1}), /12 MB/);
  assert.match(ui.coverFileError({type: 'text/plain', size: 10}), /PNG, JPEG or WebP/);
  assert.match(ui.coverFileError({type: 'image/jpeg', size: 0}), /empty/);
});
it('rejected file shows an alert, clears the picker and demo artwork recovers parseable details', async () => {
  const form = await fields();
  await form.upload(new File(['no'], 'bad.txt', {type: 'text/plain'}));
  assert.match(form.alerts(), /Choose a PNG/); assert.equal(form.picker.value, '');
  await form.select(ui.DEMO_COVERS[1]);
  assert.equal(form.alerts(), ''); assert.equal(form.picker.value, '');
  assert.equal(form.value().demoArt, 'true'); assert.ok(ui.parseEventDetails(form.value()));
  await form.select(''); assert.equal(form.value().cover, ''); assert.equal(form.value().demoArt, 'false');
});
it('unreadable image clears the filename and offers an actionable error', async t => {
  const mock = mockCanvas(t, {unreadable: true});
  const form = await fields(); await form.upload(new File(['bad'], 'bad.jpg', {type: 'image/jpeg'}));
  assert.match(form.alerts(), /not a readable image/); assert.equal(form.picker.value, '');
  assert.deepEqual(mock.revoked, ['blob:local-cover-test']);
});
it('a phone upload follows the picker path, resizes to 1600 and reduces quality below the storage cap', async t => {
  const mock = mockCanvas(t, {encode: (_canvas, quality) => 'data:image/jpeg;base64,' + 'A'.repeat(quality > 0.6 ? 300000 : 270000)});
  const form = await fields(); await form.upload(new File([new Uint8Array(1024 * 1024)], 'phone.jpg', {type: 'image/jpeg'}));
  assert.equal(form.alerts(), ''); assert.equal(form.value().demoArt, 'false');
  assert.ok(form.value().cover.length <= ui.COVER_TARGET_LENGTH); assert.ok(ui.parseEventDetails(form.value()));
  assert.equal(mock.attempts[0].width, 1600); assert.equal(mock.attempts[0].height, 1200); assert.ok(mock.attempts.length > 1);
  assert.deepEqual(mock.revoked, ['blob:local-cover-test']);
  await form.remove(); assert.equal(form.value().cover, ''); assert.equal(form.value().demoArt, 'false'); assert.equal(form.picker.value, '');
});
it('Remove photo also clears a previously saved data-URL cover in Edit details', async () => {
  const form = await fields({...details, cover: uploaded}); await form.remove();
  assert.equal(form.value().cover, ''); assert.equal(form.value().demoArt, 'false'); assert.equal(form.alerts(), '');
  const html = renderToStaticMarkup(React.createElement(ui.EventEditForm, {initial: {...details, cover: uploaded}, onSubmit() {}, onCancel() {}}));
  assert.match(html, /Remove photo/); assert.match(html, /12 MB/); assert.doesNotMatch(html, /200 KB/);
});
it('oversized encoder output falls back to smaller dimensions; impossible output fails explicitly', async t => {
  const mock = mockCanvas(t, {encode: canvas => canvas.width > 800 ? 'data:image/jpeg;base64,' + 'A'.repeat(300000) : uploaded});
  assert.equal(await ui.prepareCoverImage(new File(['test'], 'test.jpg', {type: 'image/jpeg'})), uploaded);
  assert.ok(mock.attempts.some(c => c.width === 800));
});
it('uncompressible image cannot escape the storage budget and clears the file input', async t => {
  mockCanvas(t, {encode: () => 'data:image/jpeg;base64,' + 'A'.repeat(300000)});
  const form = await fields(); await form.upload(new File(['test'], 'test.jpg', {type: 'image/jpeg'}));
  assert.match(form.alerts(), /could not be resized/); assert.equal(form.picker.value, ''); assert.equal(form.value().cover, '');
});
it('a late upload cannot overwrite a subsequent demo selection', async t => {
  mockCanvas(t);
  const form = await fields(); let pending: Promise<void>;
  await act(async () => {
    pending = mounted.root.findByProps({type: 'file'}).props.onChange({currentTarget: {files: [new File(['photo'], 'photo.jpg', {type: 'image/jpeg'})], value: 'photo.jpg'}});
    mounted.root.findByType('select').props.onChange({target: {value: ui.DEMO_COVERS[0]}});
    await pending;
  });
  assert.equal(form.value().cover, ui.DEMO_COVERS[0]); assert.equal(form.value().demoArt, 'true'); assert.equal(form.alerts(), '');
});
it('incomplete creation is clickable and submit produces an alert instead of silently returning', async () => {
  let calls = 0;
  await act(() => { mounted = create(React.createElement(ui.EventCreateForm, {network: 'preview', onSubmit() { calls++; }})); });
  assert.equal(mounted.root.findByProps({type: 'submit'}).props.disabled, false);
  assert.equal(mounted.root.findByType('form').props.noValidate, true);
  await act(() => mounted.root.findByType('form').props.onSubmit({preventDefault() {}}));
  assert.equal(calls, 0); assert.match(mounted.root.findByProps({role: 'alert'}).props.children, /real event name/);
});
it('valid demo creation reaches callback; cancelled/failed callback becomes a form alert', async () => {
  let received;
  await act(() => { mounted = create(React.createElement(ui.EventCreateForm, {network: 'preview', initial: {...details, cover: ui.DEMO_COVERS[0], demoArt: 'true', nightPayout: fakePayout}, async onSubmit(value: unknown) {received = value; throw new Error('Synthetic cancelled wallet action');}})); });
  await act(() => mounted.root.findByType('form').props.onSubmit({preventDefault() {}}));
  assert.ok(ui.parseEventDetails(received));
  assert.match(mounted.root.findByProps({role: 'alert'}).props.children, /did not finish.*cancelled or failed/);
});
it('failed upload → demo → Create event reaches submission and scrolls blocked feedback into view', async () => {
  let calls = 0; let scrolled = 0; const picker = {value: 'bad.txt'};
  await act(() => {mounted = create(React.createElement(ui.EventCreateForm, {
    network: 'preview', initial: {...details, nightPayout: fakePayout},
    onSubmit(value: typeof details) { calls++; assert.equal(value.demoArt, 'true'); assert.equal(value.cover, ui.DEMO_COVERS[0]); }
  }), {createNodeMock: (element: {type: string; props: {type?: string}}) => element.type === 'p' ? {scrollIntoView() { scrolled++; }} : element.type === 'input' && element.props.type === 'file' ? picker : null});});
  await act(() => mounted.root.findByType('form').props.onSubmit({preventDefault() {}}));
  assert.ok(scrolled > 0); assert.equal(calls, 0);
  await act(async () => {await mounted.root.findByProps({type: 'file'}).props.onChange({currentTarget: {...picker, files: [new File(['bad'], 'bad.txt', {type: 'text/plain'})]}});});
  await act(() => mounted.root.findByType('select').props.onChange({target: {value: ui.DEMO_COVERS[0]}}));
  assert.equal(picker.value, '');
  await act(() => mounted.root.findByType('form').props.onSubmit({preventDefault() {}}));
  assert.equal(calls, 1); assert.equal(mounted.root.findAllByProps({role: 'alert'}).length, 0);
});
it('missing payout is explained on submit and no wallet callback fires', async () => {
  await act(() => {mounted = create(React.createElement(ui.EventCreateForm, {network: 'preview', initial: {...details, cover: uploaded}, onSubmit() {assert.fail('must not submit');}}));});
  await act(() => mounted.root.findByType('form').props.onSubmit({preventDefault() {}}));
  assert.match(mounted.root.findByProps({role: 'alert'}).props.children, /payout address is required/);
});
it('missing-year date is visibly warned beside the date field and above Create event', async () => {
  for (const date of ['', 'aaaa-12-24']) {
    const html = renderToStaticMarkup(React.createElement(ui.EventCreateForm, {network: 'preview', initial: {...details, date, cover: ui.DEMO_COVERS[5], demoArt: 'true', nightPayout: fakePayout}, onSubmit() {assert.fail('render must not submit');}}));
    assert.match(html, /type="date"[^>]*aria-invalid="true"[^>]*aria-describedby=/);
    assert.match(html, /role="alert" class="warn">Choose a valid event date\./);
    assert.ok(html.indexOf('role="alert"') < html.indexOf('>Create event</button>'));
    assert.equal(ui.parseEventDetails({...details, date, cover: ui.DEMO_COVERS[5], demoArt: 'true'}), null);
  }
  const valid = renderToStaticMarkup(React.createElement(ui.EventCreateForm, {network: 'preview', initial: {...details, cover: uploaded, nightPayout: fakePayout}, onSubmit() {}}));
  assert.match(valid, /type="date"[^>]*aria-invalid="false"/);
  assert.doesNotMatch(valid, /Choose a valid event date/);
});
it('calendar-only validation accepts December 24 and leap days, rejects rollover in every timezone', () => {
  const before = process.env.TZ;
  try { for (const tz of ['America/Toronto', 'Pacific/Kiritimati', 'Etc/GMT+12']) {
    process.env.TZ = tz;
    for (const date of ['2026-12-24', '2028-02-29', '2000-02-29', '0096-02-29']) assert.ok(ui.parseEventDetails({...details, cover: uploaded, date}));
    for (const date of ['2026-02-29', '2026-02-30', '1900-02-29', '2026-13-01', '2026-00-01', '2026-01-00', '2026-04-31']) assert.equal(ui.parseEventDetails({...details, cover: uploaded, date}), null);
  }} finally {if (before === undefined) delete process.env.TZ; else process.env.TZ = before;}
});
it('bounded cover and worst-case text still fit the unchanged worker envelope; App surfaces falsy create action', () => {
  const value = {...details, name: 'é'.repeat(80), venue: 'é'.repeat(120), description: '\\'.repeat(1200), cover: 'data:image/jpeg;base64,' + 'A'.repeat(279976)};
  assert.ok(ui.parseEventDetails(value));
  const bytes = Buffer.byteLength(JSON.stringify({c: 'a'.repeat(64), kind: 'ev', id: '1', v: value, ts: Date.now(), pk: 'b'.repeat(64), sig: 'c'.repeat(128)}));
  assert.ok(bytes < 400000);
  const route = readFileSync(new URL('../../preview-worker/catalog-route.js', import.meta.url), 'utf8'); assert.match(route, /size>400000/);
  const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8'); assert.match(app, /run\('Create event',[\s\S]*?if \(!r\) throw new Error\('Event creation did not finish/);
  const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8'); assert.match(css, /main:has\(\.event-create-form\)[\s\S]*padding-bottom: calc\(240px/);
});
