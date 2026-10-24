// 2-look PLL: first look places the corners, second look the edges.
import { inTopLayer } from '../../engine/cube';
import type { AlgCase, AlgSet } from '../types';
import { CORNER_STICKERS, LL_HELP_STEPS, cornersInPlaceUpToAuf, inTopLayerScope, solvedUpToAuf } from '../ll';

export const GROUPS = ['1º olhar · cantos', '2º olhar · arestas'];
const G = Object.fromEntries(GROUPS.map((g, i) => [g, i])) as Record<string, number>;
const c = (id: string, group: string, alg: string, alts: string[] = []): AlgCase => ({ id, group: G[group], alg, alts });

export const CASES: AlgCase[] = [
  c('Faróis', '1º olhar · cantos', "R U R' U' R' F R2 U' R' U' R U R' F'"),
  c('Diagonal', '1º olhar · cantos', "F R U' R' U' R U R' F' R U R' U' R' F R F'"),
  c('Ua', '2º olhar · arestas', "R U' R U R U R U' R' U' R2", ["M2 U M U2 M' U M2"]),
  c('Ub', '2º olhar · arestas', "R2 U R U R' U' R' U' R' U R'", ["M2 U' M U2 M' U' M2"]),
  c('H', '2º olhar · arestas', 'M2 U M2 U2 M2 U M2'),
  c('Z', '2º olhar · arestas', "M' U' M2 U' M2 U' M' U2 M2"),
];

export const pll2: AlgSet = {
  id: 'pll2',
  name: '2-look PLL',
  groups: GROUPS,
  cases: CASES,
  view: 'll',
  mirrorable: false,
  aufBefore: true,
  // Corner step (corners not placed): corners only, edges gray. Edge step: whole top layer.
  relevantStickers(state) {
    const cornerStep = !cornersInPlaceUpToAuf(state);
    const out = new Set<number>();
    state.forEach((_, k) => {
      if (inTopLayer(k) && (!cornerStep || CORNER_STICKERS.has(k))) out.add(k);
    });
    return out;
  },
  isSolved: solvedUpToAuf,
  inScope: inTopLayerScope,
  help: {
    steps: LL_HELP_STEPS,
    note: 'Dois olhares: o primeiro põe os cantos no lugar, o segundo as arestas. Se você errou e desmontou mais que a camada de cima, refaça o F2L e o OLL antes de continuar.',
    reading: [
      'No primeiro olhar só os cantos aparecem coloridos; as arestas ficam cinza. Procure faróis (dois cantos iguais do mesmo lado) e segure-os à esquerda, como no desenho. Sem faróis, é a diagonal.',
      'Com os cantos no lugar, as arestas aparecem para o segundo olhar. Segure o cubo exatamente como no desenho: o caso aparece em qualquer ângulo.',
    ],
  },
};
