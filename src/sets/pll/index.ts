// PLL: 21 cases. Algorithms from J Perm / SpeedCubeDB. Every entry is validated in pll.test.ts.
import { inTopLayer } from '../../engine/cube';
import type { AlgCase, AlgSet } from '../types';
import { LL_HELP_STEPS, inTopLayerScope, solvedUpToAuf } from '../ll';

export const GROUPS = ['Só cantos', 'Só arestas', 'Cantos adjacentes', 'Cantos diagonais', 'G'];
const G = Object.fromEntries(GROUPS.map((g, i) => [g, i])) as Record<string, number>;
const c = (id: string, group: string, alg: string, alts: string[] = []): AlgCase => ({ id, group: G[group], alg, alts });

export const CASES: AlgCase[] = [
  // Só cantos
  c('Aa', 'Só cantos', "x R' U R' D2 R U' R' D2 R2 x'"),
  c('Ab', 'Só cantos', "x R2 D2 R U R' D2 R U' R x'"),
  c('E', 'Só cantos', "x' R U' R' D R U R' D' R U R' D R U' R' D' x"),
  // Só arestas
  c('H', 'Só arestas', 'M2 U M2 U2 M2 U M2'),
  c('Ua', 'Só arestas', "M2 U M U2 M' U M2", ["R U' R U R U R U' R' U' R2"]),
  c('Ub', 'Só arestas', "M2 U' M U2 M' U' M2", ["R2 U R U R' U' R' U' R' U R'"]),
  c('Z', 'Só arestas', "M' U' M2 U' M2 U' M' U2 M2", ["M2 U M2 U M' U2 M2 U2 M'"]),
  // Cantos adjacentes
  c('T', 'Cantos adjacentes', "R U R' U' R' F R2 U' R' U' R U R' F'"),
  c('Ja', 'Cantos adjacentes', "x R2 F R F' R U2 r' U r U2 x'", ["U2 L' U' L F L' U' L U L F' L2 U L"]),
  c('Jb', 'Cantos adjacentes', "R U R' F' R U R' U' R' F R2 U' R'"),
  c('F', 'Cantos adjacentes', "R' U' F' R U R' U' R' F R2 U' R' U' R U R' U R"),
  c('Ra', 'Cantos adjacentes', "R U' R' U' R U R D R' U' R D' R' U2 R'"),
  c('Rb', 'Cantos adjacentes', "R2 F R U R U' R' F' R U2 R' U2 R"),
  // Cantos diagonais
  c('Y', 'Cantos diagonais', "F R U' R' U' R U R' F' R U R' U' R' F R F'"),
  c('V', 'Cantos diagonais', "R' U R' U' R D' R' D R' U D' R2 U' R2 D R2", ["R' U R' U' y R' F' R2 U' R' U R' F R F"]),
  c('Na', 'Cantos diagonais', "R U R' U R U R' F' R U R' U' R' F R2 U' R' U2 R U' R'"),
  c('Nb', 'Cantos diagonais', "R' U R U' R' F' U' F R U R' F R' F' R U' R"),
  // G
  c('Ga', 'G', "R2 U R' U R' U' R U' R2 U' D R' U R D'"),
  c('Gb', 'G', "R' U' R U D' R2 U R' U R U' R U' R2 D"),
  c('Gc', 'G', "R2 U' R U' R U R' U R2 U D' R U' R' D"),
  c('Gd', 'G', "R U R' U' D R2 U' R U' R' U R' U R2 D'"),
];

export const pll: AlgSet = {
  id: 'pll',
  name: 'PLL',
  groups: GROUPS,
  cases: CASES,
  view: 'll',
  mirrorable: false,
  aufBefore: true,
  // Whole top layer in real colors.
  relevantStickers(state) {
    const out = new Set<number>();
    state.forEach((_, k) => { if (inTopLayer(k)) out.add(k); });
    return out;
  },
  isSolved: solvedUpToAuf,
  inScope: inTopLayerScope,
  help: {
    steps: LL_HELP_STEPS,
    note: 'Se você errou e desmontou mais que a camada de cima, refaça o F2L e o OLL antes de continuar.',
    reading: [
      'As tiras dos lados mostram as cores reais da camada de cima. Procure blocos, faróis (dois cantos iguais com aresta diferente) e barras.',
      'Com o giro aleatório ligado, o caso aparece em qualquer ângulo e com cores diferentes. A solução mostrada começa desfazendo esse giro e termina com o giro final.',
    ],
  },
};
