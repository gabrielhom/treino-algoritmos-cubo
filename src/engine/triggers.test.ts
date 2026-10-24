import { describe, expect, it } from 'vitest';
import { SETS } from '../sets';
import { mirror, parse } from './cube';
import { formatAlg, segment } from './triggers';

const fmt = (alg: string) => formatAlg(parse(alg));

describe('formatAlg', () => {
  it('groups back-to-back triggers', () => {
    expect(fmt("R U R' U' R' F R F'")).toBe("(R U R' U') (R' F R F')");
  });

  it('groups triggers between plain moves', () => {
    expect(fmt("F R U R' U' R U R' U' F'")).toBe("F (R U R' U') (R U R' U') F'");
  });

  it('prefers the longest trigger', () => {
    expect(fmt("R U R' U R U2 R' F R U R' U' F'")).toBe("(R U R' U R U2 R') F (R U R' U') F'");
  });

  it('leaves a trigger that is the whole alg plain', () => {
    expect(fmt("R U R' U R U2 R'")).toBe("R U R' U R U2 R'");
    expect(fmt("R' F R F'")).toBe("R' F R F'");
  });

  it('leaves an alg without triggers unchanged', () => {
    expect(fmt("M2 U M2 U2 M2 U M2")).toBe("M2 U M2 U2 M2 U M2");
  });

  it('groups the left-hand mirror the same way', () => {
    expect(formatAlg(mirror(parse("U R U' R' U' R U R' U' R U R'"))))
      .toBe("(U' L' U L) U (L' U' L U) L' U' L");
  });
});

describe('segment', () => {
  it('splits into plain runs and triggers with their index in the alg', () => {
    expect(segment(parse("R' U' F U R U' R' F' R"))).toEqual([
      { trigger: null, moves: ["R'", "U'", 'F'], start: 0 },
      { trigger: 'sexy invertido', moves: ['U', 'R', "U'", "R'"], start: 3 },
      { trigger: null, moves: ["F'", 'R'], start: 7 },
    ]);
  });

  it('covers every move of every alg in order, exactly once', () => {
    for (const set of SETS) {
      for (const c of set.cases) {
        for (const alg of [c.alg, ...c.alts]) {
          const moves = parse(alg);
          const segs = segment(moves);
          expect(segs.flatMap((s) => s.moves), `${set.id} ${c.id}: ${alg}`).toEqual(moves);
          expect(segs.flatMap((s) => s.moves.map((_, k) => s.start + k))).toEqual(moves.map((_, i) => i));
        }
      }
    }
  });
});
