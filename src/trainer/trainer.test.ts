import { describe, expect, it } from 'vitest';
import { SETS } from '../sets';
import { diagramKey } from '../sets/validate';
import { buildCase, DEFAULT_SETTINGS } from './trainer';

// Deterministic PRNG for the tests.
function lcg(seed: number) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);
}

describe('realistic scrambles', () => {
  for (const set of SETS.filter((s) => s.setupMoves)) {
    it(`${set.id}: the setup changes only what the set ignores`, () => {
      const rand = lcg(7);
      for (const c of set.cases) {
        for (const mirrored of set.mirrorable ? [false, true] : [false]) {
          const slot = mirrored ? 'L' : 'R';
          const plain = buildCase(set, c, { ...DEFAULT_SETTINGS, realistic: false, slot }, undefined, rand);
          const real = buildCase(set, c, { ...DEFAULT_SETTINGS, realistic: true, slot }, undefined, rand);
          expect(real.setupLength).toBeGreaterThan(0);
          expect(real.scramble.slice(real.setupLength)).toEqual(plain.scramble);
          expect(diagramKey(set, real.state, { mirrored }), `${set.id} ${c.id}`).toBe(diagramKey(set, plain.state, { mirrored }));
          real.state.forEach((origin, k) => {
            if (!set.inScope(k, { mirrored })) expect(origin, `${set.id} ${c.id} pos ${k}`).toBe(k);
          });
        }
      }
    });
  }
  it('pll has no setup: any permutation would change the case', () => {
    const pll = SETS.find((s) => s.id === 'pll')!;
    const real = buildCase(pll, pll.cases[0], DEFAULT_SETTINGS);
    expect(real.setupLength).toBe(0);
  });
});
