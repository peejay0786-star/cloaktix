/** Actual GateV4 render/selection regression. No wallet or admission capability is used. */
import { it, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdtempSync, rmSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { isValidElement, type ReactElement } from 'react';
const require = createRequire(new URL('../package.json', import.meta.url));
const { build } = require('esbuild');
const root = new URL('../', import.meta.url).pathname;
const dir = mkdtempSync(root + '.door-picker-test-');
after(() => rmSync(dir, { recursive: true, force: true }));
// Control mounted hook state to reproduce a selection surviving a chain refresh.
// Keep actual GateV4 JSX, permission filtering, handlers and JSX runtime.
await build({ stdin: { contents: `
import {GateV4} from './src/multigate/GateV4';
import {reset,begin,getSelected,runSelectionEffect} from 'react';
export {reset,getSelected,runSelectionEffect};
export const render=props=>{begin();return GateV4(props)};
`, resolveDir: root, loader: 'tsx' }, outfile: dir + '/probe.mjs', bundle: true,
  platform: 'node', format: 'esm', jsx: 'automatic', packages: 'external', logLevel: 'error',
  plugins: [{ name: 'mounted-door-selection', setup(builder: {
    onResolve(options: {filter: RegExp}, cb: (args: {path: string}) => object): void;
    onLoad(options: {filter: RegExp; namespace: string}, cb: (args: {path: string}) => object): void;
  }) {
    builder.onResolve({filter: /^react$/}, () => ({path: 'hooks', namespace: 'door-probe'}));
    builder.onResolve({filter: /^\.\/DoorsStaff$/}, () => ({path: 'labels', namespace: 'door-probe'}));
    builder.onResolve({filter: /^\.\.\/Scanner$/}, () => ({path: 'scanner', namespace: 'door-probe'}));
    builder.onLoad({filter: /.*/, namespace: 'door-probe'}, ({path}) => ({ loader: 'js', contents:
      path === 'hooks' ? `let slots=[],cursor=0,effects=[];
export const reset=(state,selected)=>{slots=[state,selected,'',null,false,false,true,0]};
export const begin=()=>{cursor=0;effects=[]};
export const useState=initial=>{const n=cursor++;if(!(n in slots))slots[n]=initial;return [slots[n],value=>{slots[n]=typeof value==='function'?value(slots[n]):value}]};
export const useRef=current=>({current});
export const useEffect=effect=>{effects.push(effect)};
export const getSelected=()=>slots[1];
export const runSelectionEffect=()=>effects[1]();`
      : path === 'labels' ? `export const StaffIdentity=()=>null;export const DoorLabels=()=>null;export const useDoorNames=()=>id=>'Door '+id;`
      : `export const Scanner=()=>null;export const cameraScanSupported=()=>false;`
    }));
  } }] });
const ui = await import(pathToFileURL(dir + '/probe.mjs').href);
const gate = (id: bigint, assigned = true) => ({id, eventId: 1n, active: true, mine: false, assigned, typeCount: 0n, acceptedTypeIds: [], admittedCount: 0, metadataKeys: []});
const state = (gates: ReturnType<typeof gate>[]) => ({schemaVersion: 4, gates, events: [{id: 1n, mine: false}], staffOnly: true});
function render(st: ReturnType<typeof state>) {
  return ui.render({st, s: {state: async () => st, admitAtDoor: () => {throw new Error('Picker interaction must not submit')}}, evName: () => 'Illustrative event', ttName: () => 'Sample type'});
}
function nodes(tree: unknown): ReactElement<Record<string, unknown>>[] {
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  if (!isValidElement<Record<string, unknown>>(tree)) return [];
  return [tree, ...nodes(tree.props.children)];
}
const select = (tree: unknown) => nodes(tree).find(node => node.type === 'select');
const scan = (tree: unknown) => nodes(tree).find(node => node.type === 'button' && node.props.children === 'Scan');
it('revoked selection with one remaining door exposes picker without silently switching; explicit choice unlocks that door', () => {
  const st = state([gate(1n, false), gate(2n)]);
  ui.reset(st, '1');
  const before = render(st), picker = select(before);
  assert.ok(picker, 'Remaining authorized door must be selectable');
  assert.equal(picker.props.value, '1');
  assert.equal(ui.getSelected(), '1');
  assert.equal(scan(before)?.props.disabled, true, 'Revoked door must not authorize scans');
  const options = nodes(picker).filter(node => node.type === 'option');
  assert.deepEqual(options.map(node => node.props.value), ['1', '2']);
  assert.equal(options[0].props.children, 'Selected door no longer authorized');
  ui.runSelectionEffect();
  assert.equal(ui.getSelected(), '1', 'Refresh effect must not auto-switch');
  const change = picker.props.onChange;
  assert.equal(typeof change, 'function');
  if (typeof change !== 'function') throw new Error('Missing door selection handler');
  change({target: {value: '2'}});
  const after = render(st);
  assert.equal(ui.getSelected(), '2');
  assert.equal(select(after), undefined, 'Valid single-door choice returns to locked display');
  assert.ok(nodes(after).some(node => node.props.className === 'door-locked'));
  assert.equal(scan(after)?.props.disabled, false, 'Explicitly chosen authorized door permits scanning');
});
it('a valid single assigned door stays locked, while multiple authorized doors retain their selector', () => {
  const single = state([gate(2n)]); ui.reset(single, '2');
  assert.equal(select(render(single)), undefined);
  const multiple = state([gate(2n), gate(3n)]); ui.reset(multiple, '2');
  assert.equal(select(render(multiple))?.props.value, '2');
});
it('no authorized alternative exposes no picker and cannot authorize scans', () => {
  const st = state([gate(1n, false)]); ui.reset(st, '1');
  const tree = render(st);
  assert.equal(select(tree), undefined); assert.equal(scan(tree)?.props.disabled, true);
  ui.runSelectionEffect(); assert.equal(ui.getSelected(), '1');
});
