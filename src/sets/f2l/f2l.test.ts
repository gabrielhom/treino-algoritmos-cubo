import { describe, expect, it } from 'vitest';
import { apply, invert, parse, SOLVED } from '../../engine/cube';
import { validateSet } from '../validate';
import { f2l } from './index';

describe('f2l set', () => {
  it('has 41 cases in 9 groups', () => {
    expect(f2l.cases).toHaveLength(41);
    expect(f2l.groups).toHaveLength(9);
    expect(new Set(f2l.cases.map((c) => c.id)).size).toBe(41);
  });

  it('every case and alternative passes validation, on both slots', () => {
    expect(validateSet(f2l)).toEqual([]);
  });

  it('only colors the pair stickers', () => {
    const state = apply(SOLVED, invert(parse("U R U' R'")));
    const relevant = f2l.relevantStickers(state, { mirrored: false });
    expect(relevant.size).toBe(5); // 3 corner + 2 edge stickers
    expect(f2l.isSolved(state)).toBe(false);
    expect(f2l.isSolved(SOLVED)).toBe(true);
  });
});
