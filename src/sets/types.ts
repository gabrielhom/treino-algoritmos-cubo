import type { State } from '../engine/cube';

export interface AlgCase {
  id: string | number;
  group: number;
  /** Main algorithm. Must keep U on top (no x/z rotations) so the scramble is applicable. */
  alg: string;
  alts: string[];
}

export interface StickerOpts {
  /** F2L only: case shown in the left slot. */
  mirrored: boolean;
}

export interface AlgSet {
  id: string;
  name: string;
  groups: string[];
  cases: AlgCase[];
  /** 'f2l': top view + front/side panel. 'll': top view with strips only. */
  view: 'f2l' | 'll';
  /** The set has a mirrored (left slot) variant. */
  mirrorable: boolean;
  /** Also apply a random U turn before the inverse alg (the case shows up rotated). */
  aufBefore: boolean;
  /** Positions whose real color is shown; other top-layer pieces are drawn gray. */
  relevantStickers(state: State, opts: StickerOpts): Set<number>;
  /** Solved criterion for this set (ignores whatever is out of scope). */
  isSolved(state: State): boolean;
  /** Positions the set's algs are allowed to disturb. Everything else must stay home. */
  inScope(position: number, opts: StickerOpts): boolean;
  /** Texts for the "Como usar" tab. Steps may contain <b> tags. */
  help: { steps: string[]; note: string; reading: string[] };
}
