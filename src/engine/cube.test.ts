import { describe, expect, it } from 'vitest';
import { MOVES } from './tables';
import {
  apply, invert, mirror, normalizeOrientation, parse, SOLVED, findSticker, pieceOf, keepsUOnTop,
} from './cube';

const seq = (alg: string) => apply(SOLVED, parse(alg));

describe('tables', () => {
  it('every move is a permutation of 54 stickers', () => {
    for (const [name, perm] of Object.entries(MOVES)) {
      expect(perm, name).toHaveLength(54);
      expect(new Set(perm).size, name).toBe(54);
    }
  });
  it('quarter turns have order 4', () => {
    for (const m of Object.keys(MOVES)) expect(seq(`${m} ${m} ${m} ${m}`), m).toEqual(SOLVED);
  });
});

describe('apply', () => {
  it('sexy move has order 6', () => {
    expect(seq("R U R' U' ".repeat(6))).toEqual(SOLVED);
  });
  it('slice and wide moves match their face-move definitions', () => {
    expect(seq("R L' x'")).toEqual(seq('M'));
    expect(seq('x L')).toEqual(seq('r'));
    expect(seq("y' U")).toEqual(seq('d'));
    expect(seq("U D' y'")).toEqual(seq('E'));
    expect(seq("F' B z")).toEqual(seq('S'));
  });
  it('T-perm is an involution', () => {
    const t = "R U R' U' R' F R2 U' R' U' R U R' F'";
    expect(seq(`${t} ${t}`)).toEqual(SOLVED);
  });
});

describe('parse / invert / mirror', () => {
  it('parses wide notation variants', () => {
    expect(parse("R U2' Rw Dw'")).toEqual(['R', 'U2', 'r', "d'"]);
  });
  it('alg followed by its inverse is identity', () => {
    const a = parse("R U' R' U R U2 R' U R U' R'");
    expect(apply(seq(a.join(' ')), invert(a))).toEqual(SOLVED);
  });
  it('mirror of the right-slot insertion is the left-slot insertion', () => {
    expect(mirror(parse("U R U' R'"))).toEqual(["U'", "L'", 'U', 'L']);
    expect(mirror(parse("r U2 M E S x y z"))).toEqual(["l'", 'U2', 'M', "E'", "S'", 'x', "y'", "z'"]);
  });
  it('mirroring a slice identity keeps it an identity', () => {
    expect(apply(SOLVED, mirror(parse("R L' x'")))).toEqual(seq('M'));
    expect(apply(SOLVED, mirror(parse("U D' y'")))).toEqual(apply(SOLVED, mirror(['E'])));
  });
});

describe('geometry', () => {
  it('finds stickers by position', () => {
    expect(findSticker('U', 0, 3, 0)).toBe(4);
    expect(findSticker('F', 0, 0, 3)).toBe(22);
    expect(pieceOf(findSticker('R', 3, -2, 2))).toEqual([1, -1, 1]);
  });
  it('normalizes whole-cube rotations away', () => {
    expect(normalizeOrientation(seq("x y z'"))).toEqual(SOLVED);
    const rotatedT = seq("R U R' U' R' F R2 U' R' U' R U R' F' y");
    expect(normalizeOrientation(rotatedT)).toEqual(seq("R U R' U' R' F R2 U' R' U' R U R' F'"));
  });
  it('detects algs that tilt the cube', () => {
    expect(keepsUOnTop(parse("y R U R'"))).toBe(true);
    expect(keepsUOnTop(parse("x R U R'"))).toBe(false);
  });
});
