// Facelet cube engine, ported from the prototype. A state is an array of 54 sticker
// origins: state[k] = index of the sticker that currently sits at position k.
import { MOVES, POS } from './tables';

export type State = number[];
export type Face = 'U' | 'R' | 'F' | 'D' | 'L' | 'B';

export const FACES: Face[] = ['U', 'R', 'F', 'D', 'L', 'B'];
export const SOLVED: State = [...Array(54).keys()];

/** Face of the sticker with index k (its home face). */
export function faceOf(k: number): Face {
  return FACES[Math.floor(k / 9)];
}

/** Piece coordinates (-1, 0, 1 per axis) of the position k. */
export function pieceOf(k: number): [number, number, number] {
  const p = POS[k];
  return p.map((c) => (c > 1 ? 1 : c < -1 ? -1 : 0)) as [number, number, number];
}
export const PIECE = SOLVED.map(pieceOf);
export const PIECE_KEY = PIECE.map((p) => p.join(','));

/** Position index of the sticker on `face` centered at (x, y, z). */
export function findSticker(face: Face, x: number, y: number, z: number): number {
  const f = FACES.indexOf(face);
  for (let k = f * 9; k < f * 9 + 9; k++) {
    const p = POS[k];
    if (p[0] === x && p[1] === y && p[2] === z) return k;
  }
  return -1;
}

export function applyMove(state: State, move: string): State {
  const base = move[0];
  const suffix = move.slice(1);
  const n = suffix === '' ? 1 : suffix === '2' ? 2 : 3;
  const perm = MOVES[base];
  if (!perm) throw new Error(`Movimento desconhecido: ${move}`);
  let st = state;
  for (let i = 0; i < n; i++) st = SOLVED.map((k) => st[perm[k]]);
  return st;
}

export function apply(state: State, moves: string[]): State {
  for (const m of moves) state = applyMove(state, m);
  return state;
}

export function parse(alg: string): string[] {
  return alg
    .replace(/2'/g, '2')
    .replace(/([RLUDFB])w/g, (_, f: string) => f.toLowerCase())
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

export function invert(moves: string[]): string[] {
  return moves
    .slice()
    .reverse()
    .map((m) => {
      const b = m[0];
      const s = m.slice(1);
      return s === "'" ? b : s === '2' ? b + '2' : b + "'";
    });
}

const MIRROR: Record<string, string> = {
  R: "L'", L: "R'", U: "U'", D: "D'", F: "F'", B: "B'", M: "M'", E: "E'", S: "S'",
  x: "x'", y: "y'", z: "z'", r: "l'", l: "r'", u: "u'", d: "d'", f: "f'", b: "b'",
};

/** Mirror across the M slice (right slot -> left slot). */
export function mirror(moves: string[]): string[] {
  return moves.map((m) => {
    const b = m[0];
    const s = m.slice(1);
    const mb = MIRROR[b];
    const base = mb[0];
    const inv = mb.length > 1;
    if (s === '2') return base + '2';
    const prime = (s === "'") !== inv;
    return prime ? base + "'" : base;
  });
}

const U_CENTER = 4;
const F_CENTER = 22;
// All 24 cube orientations as move sequences.
const ORIENTATIONS: string[][] = (() => {
  const out: string[][] = [];
  for (const tilt of [[], ['x'], ['x2'], ["x'"], ['z'], ["z'"]])
    for (const turn of [[], ['y'], ['y2'], ["y'"]]) out.push([...tilt, ...turn]);
  return out;
})();

/** Rotates the whole cube so that the U and F centers are back home. */
export function normalizeOrientation(state: State): State {
  for (const rot of ORIENTATIONS) {
    const s = apply(state, rot);
    if (s[U_CENTER] === U_CENTER && s[F_CENTER] === F_CENTER) return s;
  }
  throw new Error('Estado sem orientação válida');
}

/** True when the alg leaves the U face on top (only y rotations, if any). */
export function keepsUOnTop(moves: string[]): boolean {
  return apply(SOLVED, moves)[U_CENTER] === U_CENTER;
}

/** True when the position k is in the top layer. */
export function inTopLayer(k: number): boolean {
  return PIECE[k][1] === 1;
}
