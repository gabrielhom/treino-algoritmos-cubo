import { describe, expect, it } from 'vitest';
import { apply, invert, parse, SOLVED } from '../../engine/cube';
import { CORNER_STICKERS } from '../ll';
import { validateSet } from '../validate';
import { pll2 } from './index';

const stateOf = (id: string) => apply(SOLVED, invert(parse(pll2.cases.find((c) => c.id === id)!.alg)));

describe('2-look PLL set', () => {
  it('has 6 cases', () => {
    expect(pll2.cases.map((c) => c.id)).toEqual(['Faróis', 'Diagonal', 'Ua', 'Ub', 'H', 'Z']);
  });

  it('every case and alternative passes validation', () => {
    expect(validateSet(pll2)).toEqual([]);
  });

  it('corner step shows corner stickers only', () => {
    for (const id of ['Faróis', 'Diagonal']) {
      const rel = pll2.relevantStickers(stateOf(id), { mirrored: false });
      expect([...rel].every((k) => CORNER_STICKERS.has(k)), id).toBe(true);
      expect(rel.size, id).toBe(12);
    }
  });

  it('edge step shows the whole top layer', () => {
    expect(pll2.relevantStickers(stateOf('Ua'), { mirrored: false }).size).toBe(21);
  });
});
