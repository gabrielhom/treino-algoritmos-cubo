import { describe, expect, it } from 'vitest';
import { apply, applyMove, faceOf, parse, SOLVED } from '../engine/cube';
import { moveAngle, renderCube, visibleFaces } from './cube3d';

const fill = (state: number[]) => (k: number) => faceOf(state[k]);

describe('renderCube', () => {
  it('shows exactly three faces (27 stickers) of a still cube', () => {
    for (const mirrored of [false, true]) {
      const quads = renderCube(fill(SOLVED), mirrored);
      const stickers = quads.filter((q) => q.sticker !== null);
      expect(stickers).toHaveLength(27);
      const faces = new Set(stickers.map((q) => faceOf(q.sticker!)));
      expect([...faces].sort()).toEqual([...visibleFaces(mirrored)].sort());
      expect(quads.filter((q) => q.fill === null).length).toBeGreaterThan(0); // some plastic visible
    }
  });

  it('is drawn far to near', () => {
    const quads = renderCube(fill(SOLVED), false);
    for (let i = 1; i < quads.length; i++) expect(quads[i].depth).toBeGreaterThanOrEqual(quads[i - 1].depth);
  });

  it('a full turn animation ends exactly where the permutation says', () => {
    const state = apply(SOLVED, parse("R U R' U' F2 D L'"));
    for (const move of ['R', "U'", 'F2', 'M', "r'", 'x', 'y2', 'd']) {
      const animated = renderCube(fill(state), false, { move, t: 1 });
      const after = applyMove(state, move);
      const still = renderCube(fill(after), false);
      // Same polygons and colors; vertex order may differ after a rotation.
      const key = (qs: typeof still) => qs.filter((q) => q.fill).map((q) => `${q.points.split(' ').sort().join(' ')}:${q.fill}`).sort();
      expect(key(animated), move).toEqual(key(still));
    }
  });

  it('primes turn the short way and doubles turn twice as far', () => {
    expect(moveAngle('R')).toBeCloseTo(-Math.PI / 2);
    expect(moveAngle("R'")).toBeCloseTo(Math.PI / 2);
    expect(moveAngle('R2')).toBeCloseTo(-Math.PI);
    expect(moveAngle('L')).toBeCloseTo(Math.PI / 2);
  });
});
