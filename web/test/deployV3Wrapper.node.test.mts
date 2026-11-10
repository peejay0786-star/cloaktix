import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  compactContextSymbol,
  compiledContractForVkSubset,
} from '../src/midnight/deployV3Plan.ts';

describe('compiledContractForVkSubset', () => {
  it('does not mutate frozen module-like object and filters provableCircuits', () => {
    const CTX = Symbol('test-compact-context');
    class FakeContract {
      provableCircuits = { a: 1, b: 2, c: 3, d: 4 };
      impureCircuits = this.provableCircuits;
      witnesses: unknown;
      constructor(witnesses: unknown) {
        this.witnesses = witnesses;
      }
    }
    const compiled = Object.freeze({
      tag: 'Fake',
      [CTX]: Object.freeze({ ctor: FakeContract, witnesses: {}, compiledAssetsPath: 'x' }),
    });

    const wrapped = compiledContractForVkSubset(compiled as object, ['a', 'b']);
    assert.notEqual(wrapped, compiled);
    assert.equal((compiled as any)[CTX].ctor, FakeContract);

    const Ctor = (wrapped as any)[compactContextSymbol(wrapped)].ctor;
    const instance = new Ctor({});
    assert.deepEqual(Object.keys(instance.provableCircuits).sort(), ['a', 'b']);
  });

  it('regression: frozen module export cannot be reassigned (old monkey-patch)', () => {
    const mod = Object.freeze({
      getProvableCircuitIds: (c: { provableCircuits: Record<string, unknown> }) =>
        Object.keys(c.provableCircuits),
    });
    assert.throws(() => {
      (mod as { getProvableCircuitIds: unknown }).getProvableCircuitIds = () => [];
    });
    assert.throws(() => {
      Object.defineProperty(mod, 'getProvableCircuitIds', { value: () => [] });
    });
  });
});
