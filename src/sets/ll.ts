// Shared pieces for last-layer sets (OLL, PLL).
import { PIECE, PIECE_KEY, SOLVED, apply, faceOf, inTopLayer, type State } from '../engine/cube';

/** Top-face positions (0..8). */
export const U_FACE = [0, 1, 2, 3, 4, 5, 6, 7, 8];

export const allUYellow = (state: State) => U_FACE.every((k) => faceOf(state[k]) === 'U');

/** Whole cube solved up to a U turn. */
export function solvedUpToAuf(state: State): boolean {
  for (const auf of [[], ['U'], ['U2'], ["U'"]]) {
    const s = apply(state, auf);
    if (s.every((o, k) => o === k)) return true;
  }
  return false;
}

/** Sticker positions grouped by top-layer piece (corners and edges, no center). */
const TOP_PIECES: number[][] = (() => {
  const groups = new Map<string, number[]>();
  SOLVED.forEach((k) => {
    const p = PIECE[k];
    if (p[1] !== 1 || (p[0] === 0 && p[2] === 0)) return;
    const list = groups.get(PIECE_KEY[k]) ?? [];
    list.push(k);
    groups.set(PIECE_KEY[k], list);
  });
  return [...groups.values()];
})();
const isCorner = (stickers: number[]) => stickers.length === 3;

/** Numbers of top-layer corners and edges whose U sticker points up. */
export function orientedCounts(state: State): { corners: number; edges: number } {
  let corners = 0, edges = 0;
  for (const st of TOP_PIECES) {
    const uPos = st.find((k) => k < 9)!;
    if (faceOf(state[uPos]) !== 'U') continue;
    if (isCorner(st)) corners++; else edges++;
  }
  return { corners, edges };
}

/** Numbers of top-layer corners and edges fully in place (no AUF applied). */
export function homeCounts(state: State): { corners: number; edges: number } {
  let corners = 0, edges = 0;
  for (const st of TOP_PIECES) {
    if (!st.every((k) => state[k] === k)) continue;
    if (isCorner(st)) corners++; else edges++;
  }
  return { corners, edges };
}

export const inTopLayerScope = (k: number) => inTopLayer(k);

export const LL_HELP_STEPS = [
  'Cubo montado na mão, amarelo em cima, verde na frente.',
  'Aplique a sequência mostrada. As duas primeiras camadas continuam prontas; só a de cima muda.',
  'Olhe o caso e reconheça. Não corra aqui: é o treino de reconhecimento.',
  'Resolva. Só então toque em <b>Mostrar solução</b> e compare.',
  'Avalie: <b>Fácil</b>, <b>Ok</b> ou <b>Difícil</b>. Os difíceis voltam mais vezes.',
  'O cubo voltou a estar montado (talvez com a camada de cima girada). <b>Próximo</b>.',
];
