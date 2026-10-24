import { describe, expect, it } from 'vitest';
import { apply, invert, parse, SOLVED } from '../../engine/cube';
import { orientedCounts } from '../ll';
import { validateSet } from '../validate';
import { oll2 } from './index';

// [oriented edges, oriented corners] per case. Edge-step cases show their raw alg state, corners included.
const SHAPE: Record<string, [number, number]> = {
  Ponto: [0, 0], L: [2, 2], Linha: [2, 2],
  Sune: [4, 1], Antisune: [4, 1], H: [4, 0], Pi: [4, 0], Faróis: [4, 2], T: [4, 2], Gravata: [4, 2],
};
const stateOf = (id: string) => apply(SOLVED, invert(parse(oll2.cases.find((c) => c.id === id)!.alg)));

describe('2-look OLL set', () => {
  it('has 10 cases', () => {
    expect(oll2.cases.map((c) => c.id)).toEqual(Object.keys(SHAPE));
  });

  it('every case and alternative passes validation', () => {
    expect(validateSet(oll2)).toEqual([]);
  });

  it('edge-step and corner-step cases have the expected oriented pieces', () => {
    for (const [id, [edges, corners]] of Object.entries(SHAPE))
      expect(orientedCounts(stateOf(id)), id).toEqual({ edges, corners });
  });

  it('edge step shows yellow edge stickers and the center, no corners', () => {
    expect(oll2.relevantStickers(stateOf('L'), { mirrored: false }).size).toBe(5);
  });

  it('corner step shows every yellow sticker (4 corners, 4 edges, center)', () => {
    expect(oll2.relevantStickers(stateOf('Sune'), { mirrored: false }).size).toBe(9);
  });
});
