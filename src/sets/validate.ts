// Shared validation for algorithm sets. Used by each set's test file.
import {
  apply, invert, mirror, normalizeOrientation, parse, keepsUOnTop, SOLVED, faceOf, PIECE, type State,
} from '../engine/cube';
import type { AlgCase, AlgSet, StickerOpts } from './types';

export interface Problem {
  caseId: string | number;
  message: string;
}

const isTopPiece = (k: number) => PIECE[k][1] === 1 && !(PIECE[k][0] === 0 && PIECE[k][2] === 0);

/** What the diagram shows: color per top-layer position, gray when not relevant. */
export function diagramKey(set: AlgSet, state: State, opts: StickerOpts): string {
  const relevant = set.relevantStickers(state, opts);
  return state
    .map((origin, k) => {
      if (relevant.has(k)) return faceOf(origin);
      if (isTopPiece(origin)) return 'x';
      return faceOf(origin);
    })
    .join('');
}

/** Diagram key minimized over pre- and post-AUF, so rotated views collapse together. */
export function canonicalKey(set: AlgSet, scramble: string[], opts: StickerOpts): string {
  let best = '';
  for (const pre of [[], ['U'], ['U2'], ["U'"]])
    for (const post of [[], ['U'], ['U2'], ["U'"]]) {
      const st = normalizeOrientation(apply(SOLVED, [...pre, ...scramble, ...post]));
      const key = diagramKey(set, st, opts);
      if (!best || key < best) best = key;
    }
  return best;
}

function checkAlg(set: AlgSet, c: AlgCase, alg: string, opts: StickerOpts, caseState: State, label: string): Problem[] {
  const problems: Problem[] = [];
  const moves = parse(alg);
  const after = normalizeOrientation(apply(caseState, moves));
  if (!set.isSolved(after)) problems.push({ caseId: c.id, message: `${label} não resolve o caso: ${alg}` });
  after.forEach((origin, k) => {
    if (!set.inScope(k, opts) && origin !== k)
      problems.push({ caseId: c.id, message: `${label} mexe fora do escopo (posição ${k}): ${alg}` });
  });
  return problems;
}

export function validateSet(set: AlgSet): Problem[] {
  const problems: Problem[] = [];
  const variants: StickerOpts[] = set.mirrorable ? [{ mirrored: false }, { mirrored: true }] : [{ mirrored: false }];
  for (const opts of variants) {
    const seen = new Map<string, string | number>();
    for (const c of set.cases) {
      const main = opts.mirrored ? mirror(parse(c.alg)) : parse(c.alg);
      if (!keepsUOnTop(main)) problems.push({ caseId: c.id, message: `algoritmo principal tira o U de cima: ${c.alg}` });
      const scramble = invert(main);
      const caseState = normalizeOrientation(apply(SOLVED, scramble));
      if (set.isSolved(caseState)) problems.push({ caseId: c.id, message: `scramble deixa o caso resolvido: ${c.alg}` });
      caseState.forEach((origin, k) => {
        if (!set.inScope(k, opts) && origin !== k)
          problems.push({ caseId: c.id, message: `scramble mexe fora do escopo (posição ${k}): ${c.alg}` });
      });
      problems.push(...checkAlg(set, c, main.join(' '), opts, caseState, 'algoritmo'));
      for (const alt of c.alts) {
        const altMoves = opts.mirrored ? mirror(parse(alt)) : parse(alt);
        problems.push(...checkAlg(set, c, altMoves.join(' '), opts, caseState, 'alternativa'));
      }
      const key = canonicalKey(set, scramble, opts);
      const dup = seen.get(key);
      if (dup !== undefined) problems.push({ caseId: c.id, message: `mesmo estado que o caso ${dup} (a menos de AUF)` });
      seen.set(key, c.id);
    }
  }
  return problems;
}
