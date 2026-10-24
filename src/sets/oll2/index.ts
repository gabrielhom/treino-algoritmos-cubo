// 2-look OLL: first look makes the yellow cross, second look orients the corners.
// Main algs are the ones already validated in the full OLL set.
import { faceOf, inTopLayer } from '../../engine/cube';
import type { AlgCase, AlgSet } from '../types';
import { CORNER_STICKERS, LL_HELP_STEPS, allUYellow, inTopLayerScope, orientedCounts, randomSetup } from '../ll';
import { CASES as PLL_CASES } from '../pll';

export const GROUPS = ['1º olhar · arestas (cruz)', '2º olhar · cantos'];
const G = Object.fromEntries(GROUPS.map((g, i) => [g, i])) as Record<string, number>;
const c = (id: string, group: string, alg: string, alts: string[] = []): AlgCase => ({ id, group: G[group], alg, alts });

export const CASES: AlgCase[] = [
  c('Ponto', '1º olhar · arestas (cruz)', "F R U R' U' F' f R U R' U' f'"),
  c('L', '1º olhar · arestas (cruz)', "f R U R' U' f'"),
  c('Linha', '1º olhar · arestas (cruz)', "F R U R' U' F'"),
  c('Sune', '2º olhar · cantos', "R U R' U R U2 R'"),
  c('Antisune', '2º olhar · cantos', "R U2 R' U' R U' R'"),
  c('H', '2º olhar · cantos', "R U2 R' U' R U R' U' R U' R'"),
  c('Pi', '2º olhar · cantos', "R U2 R2 U' R2 U' R2 U2 R"),
  c('Faróis', '2º olhar · cantos', "R2 D' R U2 R' D R U2 R"),
  c('T', '2º olhar · cantos', "r U R' U' r' F R F'"),
  c('Gravata', '2º olhar · cantos', "F' r U R' U' r' F R"),
];

export const oll2: AlgSet = {
  id: 'oll2',
  name: '2-look OLL',
  groups: GROUPS,
  cases: CASES,
  view: 'll',
  mirrorable: false,
  aufBefore: true,
  // Edge step (cross incomplete): yellow edges and center only. Corner step: every yellow sticker.
  relevantStickers(state) {
    const edgeStep = orientedCounts(state).edges < 4;
    const out = new Set<number>();
    state.forEach((origin, k) => {
      if (inTopLayer(k) && faceOf(origin) === 'U' && !(edgeStep && CORNER_STICKERS.has(k))) out.add(k);
    });
    return out;
  },
  isSolved: allUYellow,
  inScope: inTopLayerScope,
  setupMoves: (rand) => randomSetup(PLL_CASES.map((c) => c.alg), rand),
  help: {
    steps: LL_HELP_STEPS,
    note: 'Dois olhares: o primeiro faz a cruz amarela, o segundo vira os cantos. Se você errou e desmontou mais que a camada de cima, refaça o F2L antes de continuar.',
    reading: [
      'No primeiro olhar só as arestas amarelas aparecem coloridas; os cantos ficam cinza. Reconheça ponto, L ou linha e faça a cruz. Com a cruz pronta, os cantos aparecem em amarelo para o segundo olhar.',
      'Segure o cubo exatamente como no desenho. O caso aparece em qualquer ângulo, e a solução mostrada começa desfazendo esse giro.',
    ],
  },
};
