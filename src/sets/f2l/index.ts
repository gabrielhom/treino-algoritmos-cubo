import { PIECE_KEY, inTopLayer } from '../../engine/cube';
import type { AlgSet, StickerOpts } from '../types';
import { CASES, GROUPS } from './cases';

// DFR corner + FR edge (right slot) and their mirror (left slot).
const PAIR_R = new Set(['1,-1,1', '1,0,1']);
const PAIR_L = new Set(['-1,-1,1', '-1,0,1']);
export const pairKeys = (mirrored: boolean) => (mirrored ? PAIR_L : PAIR_R);

const isPairPosition = (k: number, opts: StickerOpts) => pairKeys(opts.mirrored).has(PIECE_KEY[k]);

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
