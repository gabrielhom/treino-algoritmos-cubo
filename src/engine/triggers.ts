// Well-known short sequences ("triggers") marked inside algorithms to make them easier to read.
import { mirror } from './cube';

export interface Trigger { name: string; moves: string[] }

/** A run of moves: one trigger, or the plain moves between triggers. `start` indexes the whole alg. */
export interface Segment { trigger: string | null; moves: string[]; start: number }

// Each right-hand trigger and the name of its left-hand mirror, which the left F2L slot and some OLLs use.
const RIGHT: [name: string, alg: string, left: string][] = [
  ['Sune', "R U R' U R U2 R'", 'Sune esquerdo'],
  ['Antisune', "R U2 R' U' R U' R'", 'Antisune esquerdo'],
  ['sexy move', "R U R' U'", 'sexy esquerdo'],
  ['sexy invertido', "U R U' R'", 'sexy invertido esquerdo'],
  ['sledgehammer', "R' F R F'", 'sledgehammer esquerdo'],
  ['hedgeslammer', "F R' F' R", 'hedgeslammer esquerdo'],
  ['sexy largo', "r U R' U'", 'sexy largo esquerdo'],
];

// Longest first, so Sune wins over the sexy move it starts with.
export const TRIGGERS: Trigger[] = RIGHT.flatMap(([name, alg, left]) => {
  const moves = alg.split(' ');
  return [{ name, moves }, { name: left, moves: mirror(moves) }];
}).sort((a, b) => b.moves.length - a.moves.length);

const at = (moves: string[], i: number, tr: Trigger) => tr.moves.every((m, k) => moves[i + k] === m);

/** Greedy left to right. A trigger that is the whole alg is left plain: it reads as the alg's own name. */
export function segment(moves: string[]): Segment[] {
  const out: Segment[] = [];
  let i = 0;
  while (i < moves.length) {
    const tr = TRIGGERS.find((tr) => tr.moves.length < moves.length && at(moves, i, tr));
    if (tr) {
      out.push({ trigger: tr.name, moves: moves.slice(i, i + tr.moves.length), start: i });
      i += tr.moves.length;
      continue;
    }
    const last = out[out.length - 1];
    if (last && !last.trigger) last.moves.push(moves[i]);
    else out.push({ trigger: null, moves: [moves[i]], start: i });
    i++;
  }
  return out;
}

export const segmentText = (s: Segment) => (s.trigger ? `(${s.moves.join(' ')})` : s.moves.join(' '));

export function formatAlg(moves: string[]): string {
  return segment(moves).map(segmentText).join(' ');
}
