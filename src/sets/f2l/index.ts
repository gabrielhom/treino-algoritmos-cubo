import { PIECE_KEY, faceOf, findSticker, inTopLayer, type State } from '../../engine/cube';
import type { AlgSet, CaseFilter, StickerOpts } from '../types';
import { randomSetup } from '../ll';
import { CASES as OLL_CASES } from '../oll';
import { CASES as PLL_CASES } from '../pll';
import { CASES, GROUPS } from './cases';

// DFR corner + FR edge (right slot) and their mirror (left slot).
const PAIR_R = new Set(['1,-1,1', '1,0,1']);
const PAIR_L = new Set(['-1,-1,1', '-1,0,1']);
export const pairKeys = (mirrored: boolean) => (mirrored ? PAIR_L : PAIR_R);

const isPairPosition = (k: number, opts: StickerOpts) => pairKeys(opts.mirrored).has(PIECE_KEY[k]);

// Where is the white sticker of the DFR corner, and where is the FR edge? (right slot, no AUF)
const CORNER_WHITE = findSticker('D', 2, -3, 2);
const EDGE_F = findSticker('F', 2, 0, 3);
function locate(state: State, sticker: number): number {
  return state.indexOf(sticker);
}
const cornerFilter: CaseFilter = {
  id: 'corner',
  label: 'Canto',
  options: [
    { id: 'up-white-up', label: 'em cima, branco para cima' },
    { id: 'up-white-side', label: 'em cima, branco de lado' },
    { id: 'slot', label: 'no slot' },
  ],
  classify(state) {
    const k = locate(state, CORNER_WHITE);
    if (!inTopLayer(k)) return 'slot';
    return faceOf(k) === 'U' ? 'up-white-up' : 'up-white-side';
  },
};
const edgeFilter: CaseFilter = {
  id: 'edge',
  label: 'Aresta',
  options: [
    { id: 'up', label: 'em cima' },
    { id: 'slot', label: 'no slot' },
  ],
  classify(state) {
    return inTopLayer(locate(state, EDGE_F)) ? 'up' : 'slot';
  },
};

export const f2l: AlgSet = {
  id: 'f2l',
  name: 'F2L',
  groups: GROUPS,
  cases: CASES.map((c) => ({ id: c.id, group: c.g, alg: c.alg, alts: c.alts })),
  view: 'f2l',
  mirrorable: true,
  aufBefore: false,
  relevantStickers(state, opts) {
    const keys = pairKeys(opts.mirrored);
    const out = new Set<number>();
    state.forEach((origin, k) => {
      if (keys.has(PIECE_KEY[origin])) out.add(k);
    });
    return out;
  },
  // Both slots must be solved: the set is validated on the right slot and its mirror.
  isSolved(state) {
    return state.every((origin, k) => !(PAIR_R.has(PIECE_KEY[k]) || PAIR_L.has(PIECE_KEY[k])) || origin === k);
  },
  inScope(k, opts) {
    return inTopLayer(k) || isPairPosition(k, opts);
  },
  // Any last-layer alg leaves the cross and the four slots alone.
  setupMoves: (rand) => randomSetup([...OLL_CASES, ...PLL_CASES].map((c) => c.alg), rand),
  filters: [cornerFilter, edgeFilter],
  help: {
    steps: [
      'Cubo montado na mão, cruz branca embaixo, verde na frente.',
      'Aplique a sequência mostrada. O cubo fica com a cruz e três slots prontos e um par de F2L desmontado.',
      'Olhe o caso. Onde está o canto, onde está a aresta, para onde aponta o branco. Não corra aqui: é o treino de reconhecimento.',
      'Resolva o par do seu jeito. Só então toque em <b>Mostrar solução</b> e compare.',
      'Avalie: <b>Fácil</b>, <b>Ok</b> ou <b>Difícil</b>. Os difíceis voltam mais vezes.',
      'O cubo voltou a estar montado. <b>Próximo</b>.',
    ],
    note: 'Se você errou e desmontou mais que o slot, refaça a cruz e os três slots antes de continuar. Não tente corrigir o scramble.',
    reading: [
      'Peças cinzas são as outras peças da camada de cima: a posição delas não importa. Só o canto e a aresta coloridos fazem parte do caso.',
      'Se o seu cubo tem outro esquema de cores, segure com o branco embaixo e ignore os nomes das cores: o que importa é a posição de cada peça e para onde o branco aponta.',
    ],
  },
};
