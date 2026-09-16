import { describe, expect, it } from 'vitest';
import { apply, invert, parse, SOLVED } from '../../engine/cube';
import { orientedCounts } from '../ll';
import { validateSet } from '../validate';
import { oll } from './index';

// Sanity net on numbering: oriented corners per case (standard OLL shapes) and
// oriented edges per group (dot = 0, cross = 4, everything else = 2).
const CORNERS: Record<number, number> = {
  1: 0, 2: 0, 3: 1, 4: 1, 17: 2, 18: 2, 19: 2, 20: 4,
  21: 0, 22: 0, 23: 2, 24: 2, 25: 2, 26: 1, 27: 1,
  28: 4, 57: 4, 33: 2, 45: 2, 31: 2, 32: 2, 43: 2, 44: 2, 36: 2, 38: 2,
  5: 1, 6: 1, 34: 2, 46: 2, 7: 1, 8: 1, 11: 1, 12: 1, 9: 1, 10: 1, 35: 2, 37: 2,
  13: 1, 14: 1, 15: 1, 16: 1, 29: 2, 30: 2, 41: 2, 42: 2,
  47: 0, 48: 0, 49: 0, 50: 0, 53: 0, 54: 0, 51: 0, 52: 0, 55: 0, 56: 0, 39: 2, 40: 2,
};
const EDGES_BY_GROUP: Record<string, number> = { Ponto: 0, Cruz: 4 };

describe('oll set', () => {
  it('has the 57 standard cases, each once', () => {
    const ids = oll.cases.map((c) => Number(c.id)).sort((a, b) => a - b);
    expect(ids).toEqual([...Array(57).keys()].map((i) => i + 1));
  });

  it('every case and alternative passes validation', () => {
    expect(validateSet(oll)).toEqual([]);
  });

  it('each case has the expected shape (oriented corners and edges)', () => {
    for (const c of oll.cases) {
      const state = apply(SOLVED, invert(parse(c.alg)));
      const { corners, edges } = orientedCounts(state);
      expect(corners, `OLL ${c.id} cantos`).toBe(CORNERS[Number(c.id)]);
      expect(edges, `OLL ${c.id} arestas`).toBe(EDGES_BY_GROUP[oll.groups[c.group]] ?? 2);
    }
  });

  it('colors only yellow stickers', () => {
    const state = apply(SOLVED, invert(parse("F R U R' U' F'"))); // OLL 45
    const rel = oll.relevantStickers(state, { mirrored: false });
    expect(rel.size).toBe(9); // 4 corners + 4 edges + center, one yellow sticker each
    expect(oll.isSolved(state)).toBe(false);
  });
});
