// Pure training logic: weights, weighted pick, case construction. Ported from the prototype.
import { apply, invert, mirror, normalizeOrientation, parse, SOLVED, type State } from '../engine/cube';
import type { AlgCase, AlgSet } from '../sets/types';
import type { CaseState } from '../progress/model';

export type Slot = 'R' | 'L' | 'X';

export interface SetSettings {
  groups: number[];
  slot: Slot;
  auf: boolean;
  showNumber: boolean;
}

// Shared frozen default: a stable identity keeps effects keyed on settings from re-firing.
export const DEFAULT_SETTINGS: SetSettings = Object.freeze({ groups: [0], slot: 'R', auf: false, showNumber: true }) as SetSettings;

export interface ActiveCase {
  set: AlgSet;
  case: AlgCase;
  mirrored: boolean;
  solution: string[];
  alts: string[][];
  scramble: string[];
  preAuf: string | null;
  postAuf: string | null;
  state: State;
  startedAt: number;
  revealed: boolean;
  elapsedMs: number;
}

export const UNSEEN_WEIGHT = 3;
export const weightOf = (cs: CaseState | undefined) => (cs ? cs.weight : UNSEEN_WEIGHT);

export function selectedCases(set: AlgSet, settings: SetSettings): AlgCase[] {
  return set.cases.filter((c) => settings.groups.includes(c.group));
}

export function pickCase(
  pool: AlgCase[],
  states: Map<string | number, CaseState>,
  lastId: string | number | null,
  rand = Math.random,
): AlgCase | null {
  if (!pool.length) return null;
  const cands = pool.length > 1 ? pool.filter((c) => c.id !== lastId) : pool;
  const total = cands.reduce((a, c) => a + weightOf(states.get(c.id)), 0);
  let r = rand() * total;
  for (const c of cands) {
    r -= weightOf(states.get(c.id));
    if (r <= 0) return c;
  }
  return cands[cands.length - 1];
}

const AUFS = ['U', 'U2', "U'"];
const randomAuf = (rand: () => number) => AUFS[Math.floor(rand() * 3)];

export function buildCase(set: AlgSet, c: AlgCase, settings: SetSettings, forceSlot?: Slot, rand = Math.random): ActiveCase {
  let slot = forceSlot ?? settings.slot;
  if (!set.mirrorable) slot = 'R';
  if (slot === 'X') slot = rand() < 0.5 ? 'R' : 'L';
  const mirrored = slot === 'L';
  let solution = parse(c.alg);
  let alts = c.alts.map(parse);
  if (mirrored) {
    solution = mirror(solution);
    alts = alts.map(mirror);
  }
  let scramble = invert(solution);
  let preAuf: string | null = null;
  let postAuf: string | null = null;
  if (settings.auf) {
    postAuf = randomAuf(rand);
    scramble = [...scramble, postAuf];
    if (set.aufBefore) {
      preAuf = randomAuf(rand);
      scramble = [preAuf, ...scramble];
    }
  }
  const state = normalizeOrientation(apply(SOLVED, scramble));
  return {
    set, case: c, mirrored, solution, alts, scramble, preAuf, postAuf, state,
    startedAt: performance.now(), revealed: false, elapsedMs: 0,
  };
}

/** Full solution as shown to the user: undo post-AUF, alg, then undo pre-AUF. */
export function displaySolution(active: ActiveCase, moves: string[]): string {
  const pre = active.postAuf ? [invert([active.postAuf])[0]] : [];
  const post = active.preAuf ? [invert([active.preAuf])[0]] : [];
  return [...pre, ...moves, ...post].join(' ');
}
