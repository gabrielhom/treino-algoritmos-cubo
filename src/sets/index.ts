import type { AlgSet } from './types';
import { f2l } from './f2l';
import { oll2 } from './oll2';
import { pll2 } from './pll2';
import { oll } from './oll';
import { pll } from './pll';

export const SETS: AlgSet[] = [f2l, oll2, pll2, oll, pll];

export function getSet(id: string): AlgSet {
  return SETS.find((s) => s.id === id) ?? SETS[0];
}
