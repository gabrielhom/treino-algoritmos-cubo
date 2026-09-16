// Tiny 3D renderer for the cube: 26 cubies drawn as boxes, orthographic camera from
// front-right-top (or front-left-top), painter's algorithm. Also animates one layer turn.
import { POS } from '../engine/tables';
import { faceOf, type Face } from '../engine/cube';

type V = [number, number, number];
type Axis = 0 | 1 | 2;

const FACE_OF_NORMAL: Record<string, Face> = { '0,1,0': 'U', '1,0,0': 'R', '0,0,1': 'F', '0,-1,0': 'D', '-1,0,0': 'L', '0,0,-1': 'B' };
const NORMALS: V[] = [[0, 1, 0], [1, 0, 0], [0, 0, 1], [0, -1, 0], [-1, 0, 0], [0, 0, -1]];

/** Sticker index for (cubie center, outward normal), from the geometry tables. */
const STICKER_AT = new Map<string, number>();
POS.forEach((p, k) => {
  const axis = p.findIndex((c) => Math.abs(c) === 3);
  const center = [...p] as V;
  center[axis] = Math.sign(p[axis]) * 2;
  const n = [0, 0, 0] as V;
  n[axis] = Math.sign(p[axis]);
  STICKER_AT.set(`${center.join(',')}|${n.join(',')}`, k);
});

const CUBIES: V[] = [];
for (const x of [-2, 0, 2]) for (const y of [-2, 0, 2]) for (const z of [-2, 0, 2]) if (x || y || z) CUBIES.push([x, y, z]);

// Same conventions as validate_algs.py: axis, sign of a clockwise quarter turn, layer selector.
const MOVE_DEF: Record<string, { axis: Axis; sign: number; sel: (c: number) => boolean }> = {
  R: { axis: 0, sign: -1, sel: (c) => c > 1 }, L: { axis: 0, sign: 1, sel: (c) => c < -1 },
  U: { axis: 1, sign: -1, sel: (c) => c > 1 }, D: { axis: 1, sign: 1, sel: (c) => c < -1 },
  F: { axis: 2, sign: -1, sel: (c) => c > 1 }, B: { axis: 2, sign: 1, sel: (c) => c < -1 },
  M: { axis: 0, sign: 1, sel: (c) => Math.abs(c) <= 1 }, E: { axis: 1, sign: 1, sel: (c) => Math.abs(c) <= 1 }, S: { axis: 2, sign: -1, sel: (c) => Math.abs(c) <= 1 },
  x: { axis: 0, sign: -1, sel: () => true }, y: { axis: 1, sign: -1, sel: () => true }, z: { axis: 2, sign: -1, sel: () => true },
  r: { axis: 0, sign: -1, sel: (c) => c > -2 }, l: { axis: 0, sign: 1, sel: (c) => c < 2 },
  u: { axis: 1, sign: -1, sel: (c) => c > -2 }, d: { axis: 1, sign: 1, sel: (c) => c < 2 },
  f: { axis: 2, sign: -1, sel: (c) => c > -2 }, b: { axis: 2, sign: 1, sel: (c) => c < 2 },
};

/** Signed angle (radians) of a complete move. Primes turn the short way. */
export function moveAngle(move: string): number {
  const def = MOVE_DEF[move[0]];
  const s = move.slice(1);
  const n = s === '2' ? 2 : s === "'" ? -1 : 1;
  return def.sign * n * (Math.PI / 2);
}

function rotate(v: V, axis: Axis, t: number): V {
  const c = Math.cos(t), s = Math.sin(t);
  const [x, y, z] = v;
  if (axis === 0) return [x, y * c - z * s, y * s + z * c];
  if (axis === 1) return [x * c + z * s, y, -x * s + z * c];
  return [x * c - y * s, x * s + y * c, z];
}

const YAW = (35 * Math.PI) / 180;
const PITCH = (27 * Math.PI) / 180;
/** Camera: yaw about y (sign picks the visible side), then pitch about x. Returns [X, Y, depth]. */
function project(v: V, mirrored: boolean): V {
  const a = rotate(v, 1, mirrored ? YAW : -YAW);
  const b = rotate(a, 0, PITCH);
  return [b[0], -b[1], b[2]];
}

export interface Quad {
  points: string;
  fill: string | null; // null = plastic
  depth: number;
  sticker: number | null;
}

export interface Anim {
  move: string;
  /** 0..1 progress of the turn. */
  t: number;
}

// Rounded, and never "-0".
const fmt = (v: number) => String(Math.round(v * 1000) / 1000 + 0);
const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

export function renderCube(fill: (k: number) => string, mirrored: boolean, anim: Anim | null = null): Quad[] {
  const def = anim ? MOVE_DEF[anim.move[0]] : null;
  const angle = anim && def ? moveAngle(anim.move) * ease(anim.t) : 0;
  const quads: Quad[] = [];
  for (const center of CUBIES) {
    const turning = !!def && def.sel(center[def.axis]);
    const xf = (v: V) => project(turning && def ? rotate(v, def.axis, angle) : v, mirrored);
    for (const n of NORMALS) {
      const axis = n.findIndex((c) => c !== 0) as Axis;
      const exterior = center[axis] === 2 * n[axis];
      const k = exterior ? STICKER_AT.get(`${center.join(',')}|${n.join(',')}`) ?? null : null;
      // Back-face culling on the transformed normal.
      const nw = turning && def ? rotate(n, def.axis, angle) : n;
      const nv = project(nw, mirrored);
      const nv0 = project([0, 0, 0], mirrored);
      if (nv[2] - nv0[2] <= 0.001) continue;
      const t1: V = axis === 0 ? [0, 1, 0] : [1, 0, 0];
      const t2: V = axis === 2 ? [0, 1, 0] : [0, 0, 1];
      const base: V = [center[0] + n[0], center[1] + n[1], center[2] + n[2]];
      const corner = (s1: number, s2: number): V => [
        base[0] + s1 * t1[0] + s2 * t2[0], base[1] + s1 * t1[1] + s2 * t2[1], base[2] + s1 * t1[2] + s2 * t2[2],
      ];
      const pts = [corner(-1, -1), corner(1, -1), corner(1, 1), corner(-1, 1)].map(xf);
      const depth = pts.reduce((s, p) => s + p[2], 0) / 4;
      quads.push({
        points: pts.map((p) => `${fmt(p[0])},${fmt(p[1])}`).join(' '),
        fill: k === null ? null : fill(k),
        depth,
        sticker: k,
      });
    }
  }
  return quads.sort((a, b) => a.depth - b.depth);
}

/** Faces of the solved cube visible from the camera. */
export const visibleFaces = (mirrored: boolean): Face[] => (mirrored ? ['U', 'F', 'L'] : ['U', 'F', 'R']);

export { faceOf, FACE_OF_NORMAL };
