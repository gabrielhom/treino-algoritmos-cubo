import { describe, expect, it } from 'vitest';
import { apply, applyMove, faceOf, parse, SOLVED } from '../engine/cube';
import { layerStickers, moveAngle, moveArrow, renderCube, visibleFaces } from './cube3d';

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

describe('move icon geometry', () => {
  it('lights up exactly the stickers of the turning layer', () => {
    expect(layerStickers('R').size).toBe(21);
    expect(layerStickers('M').size).toBe(12);
    expect(layerStickers('r').size).toBe(33);
    expect(layerStickers('x').size).toBe(54);
    expect([...layerStickers('U')].filter((k) => k < 9)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
    expect(layerStickers('U').has(13)).toBe(false); // R center is not in U
  });

  it('arrows point the way the layer turns on screen', () => {
    const dir = (m: string) => {
      const { from, to } = moveArrow(m);
      const dx = to[0] - from[0], dy = to[1] - from[1];
      return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
    };
    expect(['R', 'L', 'M', 'r', 'x', 'U', 'D', 'E', 'y', 'F', 'B', 'S', 'z'].map(dir))
      .toEqual(['up', 'down', 'down', 'up', 'up', 'left', 'right', 'right', 'left', 'right', 'left', 'right', 'right']);
    expect(dir("R'")).toBe('down');
    expect(dir('R2')).toBe('up');
    const r = moveArrow('R'), rp = moveArrow("R'");
    expect(rp.from[0]).toBeCloseTo(r.to[0]);
    expect(rp.from[1]).toBeCloseTo(r.to[1]);
    expect(rp.to[1]).toBeCloseTo(r.from[1]);
  });

  it('every parsed token has an arrow', () => {
    for (const m of parse("R L U D F B M E S r l u d f b x y z R' M2 Rw Uw' x2")) {
      const { from, to } = moveArrow(m, 0.3);
      expect(Math.hypot(to[0] - from[0], to[1] - from[1]), m).toBeGreaterThan(1.5);
    }
  });
});
