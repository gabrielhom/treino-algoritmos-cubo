import type { AlgSet } from './types';
import { f2l } from './f2l';

export const SETS: AlgSet[] = [f2l];

export function getSet(id: string): AlgSet {
  return SETS.find((s) => s.id === id) ?? SETS[0];
}
