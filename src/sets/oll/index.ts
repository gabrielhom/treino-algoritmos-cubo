// OLL: 57 cases, standard numbering. Algorithms from J Perm / SpeedCubeDB (most common
// choices, no x/y rotations in the main alg). Every entry is validated in oll.test.ts.
// Alternatives that assume another angle carry their AUF explicitly (found by simulation).
import { faceOf, inTopLayer } from '../../engine/cube';
import type { AlgCase, AlgSet } from '../types';
import { LL_HELP_STEPS, allUYellow, inTopLayerScope } from '../ll';

export const GROUPS = [
  'T', 'P', 'Quadrado', 'C', 'W', 'Cruz', 'Cantos ok', 'Peixe', 'Raio', 'Cavalo', 'Sem forma', 'L pequeno', 'Linha', 'Raio pequeno', 'Ponto',
];
const G = Object.fromEntries(GROUPS.map((g, i) => [g, i])) as Record<string, number>;

const c = (id: number, group: string, alg: string, alts: string[] = []): AlgCase => ({ id, group: G[group], alg, alts });

export const CASES: AlgCase[] = [
  // T
  c(33, 'T', "R U R' U' R' F R F'"),
  c(45, 'T', "F R U R' U' F'"),
  // P
  c(31, 'P', "R' U' F U R U' R' F' R"),
  c(32, 'P', "L U F' U' L' U L F L'", ["U2 S R U R' U' R' F R f'"]),
  c(43, 'P', "F' U' L' U L F", ["U' R' U' F' U F R"]),
  c(44, 'P', "F U R U' R' F'"),
  // Quadrado
  c(5, 'Quadrado', "r' U2 R U R' U r", ["U2 l' U2 L U L' U l"]),
  c(6, 'Quadrado', "r U2 R' U' R U' r'"),
  // C
  c(34, 'C', "R U R2 U' R' F R U R U' F'", ["R U R' U' B' R' F R F' B"]),
  c(46, 'C', "R' U' R' F R F' U R"),
  // W
  c(36, 'W', "L' U' L U' L' U L U L F' L' F"),
  c(38, 'W', "R U R' U R U' R' U' R' F R F'"),
  // Cruz (todas as arestas orientadas)
  c(21, 'Cruz', "R U2 R' U' R U R' U' R U' R'", ["U R U R' U R U' R' U R U2 R'", "F R U R' U' R U R' U' R U R' U' F'"]),
  c(22, 'Cruz', "R U2 R2 U' R2 U' R2 U2 R"),
  c(23, 'Cruz', "R2 D' R U2 R' D R U2 R", ["U2 R2 D R' U2 R D' R' U2 R'"]),
  c(24, 'Cruz', "r U R' U' r' F R F'"),
  c(25, 'Cruz', "F' r U R' U' r' F R"),
  c(26, 'Cruz', "R U2 R' U' R U' R'"),
  c(27, 'Cruz', "R U R' U R U2 R'"),
  // Cantos ok (só arestas para orientar)
  c(28, 'Cantos ok', "r U R' U' r' R U R U' R'", ["r U R' U' M U R U' R'"]),
  c(57, 'Cantos ok', "R U R' U' M' U R U' r'"),
  // Peixe
  c(9, 'Peixe', "R U R' U' R' F R2 U R' U' F'"),
  c(10, 'Peixe', "R U R' U R' F R F' R U2 R'"),
  c(35, 'Peixe', "R U2 R2 F R F' R U2 R'"),
  c(37, 'Peixe', "F R' F' R U R U' R'", ["F R U' R' U' R U R' F'"]),
  // Raio
  c(7, 'Raio', "r U R' U R U2 r'"),
  c(8, 'Raio', "r' U' R U' R' U2 r", ["U2 l' U' L U' L' U2 l"]),
  c(11, 'Raio', "r U R' U R' F R F' R U2 r'", ["U2 r' R2 U R' U R U2 R' U M'"]),
  c(12, 'Raio', "M' R' U' R U' R' U2 R U' M", ["U F R U R' U' F' U F R U R' U' F'"]),
  // Cavalo
  c(13, 'Cavalo', "F U R U' R2 F' R U R U' R'", ["r U' r' U' r U r' F' U F"]),
  c(14, 'Cavalo', "R' F R U R' F' R F U' F'"),
  c(15, 'Cavalo', "r' U' r R' U' R U r' U r", ["U2 l' U' l L' U' L U l' U l"]),
  c(16, 'Cavalo', "r U r' R U R' U' r U' r'"),
  // Sem forma
  c(29, 'Sem forma', "R U R' U' R U' R' F' U' F R U R'", ["U' M U R U R' U' R' F R F' M'"]),
  c(30, 'Sem forma', "F R' F R2 U' R' U' R U R' F2", ["F U R U2 R' U' R U2 R' U' F'"]),
  c(41, 'Sem forma', "R U R' U R U2 R' F R U R' U' F'"),
  c(42, 'Sem forma', "R' U' R U' R' U2 R F R U R' U' F'"),
  // L pequeno
  c(47, 'L pequeno', "F' L' U' L U L' U' L U F", ["R' U' R' F R F' R' F R F' U R"]),
  c(48, 'L pequeno', "F R U R' U' R U R' U' F'"),
  c(49, 'L pequeno', "r U' r2 U r2 U r2 U' r"),
  c(50, 'L pequeno', "r' U r2 U' r2 U' r2 U r'"),
  c(53, 'L pequeno', "r' U' R U' R' U R U' R' U2 r", ["U2 l' U' L U' L' U L U' L' U2 l"]),
  c(54, 'L pequeno', "r U R' U R U' R' U R U2 r'"),
  // Linha
  c(51, 'Linha', "f R U R' U' R U R' U' f'", ["U2 F U R U' R' U R U' R' F'"]),
  c(52, 'Linha', "R' F' U' F U' R U R' U R", ["U2 R U R' U R U' B U' B' R'"]),
  c(55, 'Linha', "R' F R U R U' R2 F' R2 U' R' U R U R'", ["U R U2 R2 U' R U' R' U2 F R F'"]),
  c(56, 'Linha', "r' U' r U' R' U R U' R' U R r' U r", ["r U r' U R U' R' U R U' R' r U' r'"]),
  // Raio pequeno
  c(39, 'Raio pequeno', "L F' L' U' L U F U' L'"),
  c(40, 'Raio pequeno', "R' F R U R' U' F' U R"),
  // Ponto
  c(1, 'Ponto', "R U2 R2 F R F' U2 R' F R F'"),
  c(2, 'Ponto', "F R U R' U' F' f R U R' U' f'", ["U r U r' U2 r U2 R' U2 R U' r'"]),
  c(3, 'Ponto', "f R U R' U' f' U' F R U R' U' F'", ["U r' R2 U R' U r U2 r' U M'"]),
  c(4, 'Ponto', "f R U R' U' f' U F R U R' U' F'", ["U M U' r U2 r' U' R U' R' M'"]),
  c(17, 'Ponto', "R U R' U R' F R F' U2 R' F R F'"),
  c(18, 'Ponto', "r U R' U R U2 r2 U' R U' R' U2 r"),
  c(19, 'Ponto', "r' R U R U R' U' M' R' F R F'"),
  c(20, 'Ponto', "r U R' U' M2 U R U' R' U' M'"),
];

export const oll: AlgSet = {
  id: 'oll',
  name: 'OLL',
  groups: GROUPS,
  cases: CASES,
  view: 'll',
  mirrorable: false,
  aufBefore: true,
  // Only the yellow stickers of the top layer; everything else up there is gray.
  relevantStickers(state) {
    const out = new Set<number>();
    state.forEach((origin, k) => {
      if (inTopLayer(k) && faceOf(origin) === 'U') out.add(k);
    });
    return out;
  },
  isSolved: allUYellow,
  inScope: inTopLayerScope,
  help: {
    steps: LL_HELP_STEPS,
    note: 'Se você errou e desmontou mais que a camada de cima, refaça o F2L antes de continuar.',
    reading: [
      'Só o amarelo importa. Adesivos amarelos aparecem em amarelo, o resto da camada de cima fica cinza. As tiras dos lados mostram amarelos apontando para o lado.',
      'Com o giro aleatório ligado, o caso aparece em qualquer ângulo. A solução mostrada começa desfazendo esse giro.',
    ],
  },
};
