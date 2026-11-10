/**
 * Production-build smoke (no wallet): prove batched deploy reaches deployContract
 * without mutating read-only module exports.
 */
import { CompiledCloakTixV3 } from './midnight/contract-v3';
import {
  compiledContractForVkSubset,
  compactContextSymbol,
  planV3DeploySteps,
  deployV3Batched,
} from './midnight/deployV3Batched';

const out = document.getElementById('out')!;
const log = (s: string) => {
  out.textContent = (out.textContent === 'running…' ? '' : out.textContent + '\n') + s;
};

(async () => {
  try {
    // 1) Frozen module export regression
    const frozenMod = Object.freeze({
      getProvableCircuitIds: (c: { provableCircuits: Record<string, unknown> }) => Object.keys(c.provableCircuits),
    });
    let assignThrew = false;
    try {
      (frozenMod as { getProvableCircuitIds: unknown }).getProvableCircuitIds = () => [];
    } catch {
      assignThrew = true;
    }
    if (!assignThrew) throw new Error('expected assign to frozen module to throw');
    log('ok: frozen module assign throws');

    // 2) Wrapper on real CompiledCloakTixV3
    const plan = planV3DeploySteps();
    const wrapped = compiledContractForVkSubset(CompiledCloakTixV3, plan.deployCircuits);
    const ctxKey = compactContextSymbol(wrapped);
    const ctx = (wrapped as unknown as Record<symbol, { ctor: new (w: unknown) => { provableCircuits: Record<string, unknown> }; witnesses: unknown }>)[ctxKey];
    const instance = new ctx.ctor(ctx.witnesses);
    const keys = Object.keys(instance.provableCircuits);
    if (keys.length !== plan.deployCircuits.length) {
      throw new Error(`expected ${plan.deployCircuits.length} provableCircuits, got ${keys.length}: ${keys.join(',')}`);
    }
    for (const id of plan.deployCircuits) {
      if (!keys.includes(id)) throw new Error(`missing ${id} in filtered provableCircuits`);
    }
    log(`ok: wrapper filters to ${keys.length} circuits`);

    // 3) deployV3Batched up to wallet: mock deployFn inspects compiledContract then signals wallet
    const host = {
      schema: 3 as const,
      contract: null,
      networkId: 'preview',
      sk: new Uint8Array(32),
      P: {},
      userAddress: () => ({ bytes: new Uint8Array(32) }),
      age: null,
    };
    const mem = new Map<string, string>();
    const storage = {
      getItem: (k: string) => mem.get(k) ?? null,
      setItem: (k: string, v: string) => void mem.set(k, v),
      removeItem: (k: string) => void mem.delete(k),
    } as Storage;

    let sawPartial = false;
    try {
      await deployV3Batched(host, 'mn_addr_test', async () => ({ x: 1n, y: 1n }), {
        resume: false,
        storage,
        deployFn: async (_providers: unknown, options: { compiledContract: object }) => {
          const cc = options.compiledContract;
          const k = compactContextSymbol(cc);
          const cctx = (cc as unknown as Record<symbol, { ctor: new (w: unknown) => { provableCircuits: Record<string, unknown> }; witnesses: unknown }>)[k];
          const inst = new cctx.ctor(cctx.witnesses);
          const n = Object.keys(inst.provableCircuits).length;
          if (n !== plan.deployCircuits.length) {
            throw new Error(`deployFn saw ${n} circuits, expected ${plan.deployCircuits.length}`);
          }
          sawPartial = true;
          // Simulate wallet connector prompt boundary — stop before signing.
          throw new Error('WALLET_PROMPT_REACHED');
        },
      });
      throw new Error('expected WALLET_PROMPT_REACHED');
    } catch (e: any) {
      if (!String(e?.message ?? e).includes('WALLET_PROMPT_REACHED')) throw e;
    }
    if (!sawPartial) throw new Error('deployFn was not called');
    log('ok: deploy path reached wallet prompt without module mutation');
    log('SMOKE_PASS');
    (window as unknown as { __V3_BATCH_SMOKE__: string }).__V3_BATCH_SMOKE__ = 'PASS';
  } catch (e: any) {
    log('SMOKE_FAIL: ' + String(e?.stack || e?.message || e));
    (window as unknown as { __V3_BATCH_SMOKE__: string }).__V3_BATCH_SMOKE__ = 'FAIL:' + String(e?.message || e);
  }
})();
