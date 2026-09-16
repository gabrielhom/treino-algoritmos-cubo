import { describe, expect, it } from 'vitest';
import { apply, invert, normalizeOrientation, parse, SOLVED } from '../../engine/cube';
import { homeCounts } from '../ll';
import { validateSet } from '../validate';
import { pll } from './index';

// Sanity net on naming: pieces left in place by each permutation, at the AUF that shows it.
const HOME: Record<string, [number, number]> = {
  Aa: [1, 4], Ab: [1, 4], E: [0, 4],
  H: [4, 0], Ua: [4, 1], Ub: [4, 1], Z: [4, 0],
  T: [2, 2], Ja: [2, 2], Jb: [2, 2], F: [2, 2], Ra: [2, 2], Rb: [2, 2],
  Y: [2, 2], V: [2, 2], Na: [2, 2], Nb: [2, 2],
  Ga: [1, 1], Gb: [1, 1], Gc: [1, 1], Gd: [1, 1],
};

describe('pll set', () => {
  it('has the 21 cases, each once', () => {
    expect(pll.cases).toHaveLength(21);
    expect(new Set(pll.cases.map((c) => c.id)).size).toBe(21);
    expect(Object.keys(HOME).sort()).toEqual(pll.cases.map((c) => String(c.id)).sort());
  });

  it('every case and alternative passes validation', () => {
    expect(validateSet(pll)).toEqual([]);
  });

  it('each case leaves the expected corners and edges in place', () => {
    for (const c of pll.cases) {
      const state = normalizeOrientation(apply(SOLVED, invert(parse(c.alg))));
      const counts = [[], ['U'], ['U2'], ["U'"]].map((auf) => {
        const { corners, edges } = homeCounts(apply(state, auf));
        return `${corners}/${edges}`;
      });
      expect(counts, `PLL ${c.id}`).toContain(HOME[String(c.id)].join('/'));
    }
  });

  it('solved-up-to-AUF is the solved criterion', () => {
    expect(pll.isSolved(apply(SOLVED, ['U2']))).toBe(true);
    expect(pll.isSolved(apply(SOLVED, parse("R U R' U' R' F R2 U' R' U' R U R' F'")))).toBe(false);
  });
});
