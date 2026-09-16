// SVG diagrams ported from the prototype: top view with side strips, plus a
// front/side panel for the F2L view.
import { FACES, PIECE, faceOf, findSticker, type Face, type State } from '../engine/cube';
import { Cube3D } from './Cube3D';
import type { Anim } from './cube3d';

const COLOR: Record<Face, string> = {
  U: 'var(--cU)', R: 'var(--cR)', F: 'var(--cF)', D: 'var(--cD)', L: 'var(--cL)', B: 'var(--cB)',
};

const isTopPiece = (k: number) => PIECE[k][1] === 1 && !(PIECE[k][0] === 0 && PIECE[k][2] === 0);

export function stickerFill(state: State, k: number, relevant: Set<number>): string {
  const origin = state[k];
  if (!relevant.has(k) && isTopPiece(origin)) return 'var(--cX)';
  return COLOR[faceOf(origin)];
}
const fill = stickerFill;

interface RectProps {
  x: number; y: number; w: number; h: number; k: number;
}

function Sticker({ x, y, w, h, k, state, relevant }: RectProps & { state: State; relevant: Set<number> }) {
  const strong = relevant.has(k);
  return (
    <rect
      x={x} y={y} width={w} height={h} rx={2.5}
      fill={fill(state, k, relevant)}
      stroke="var(--sticker-line)"
      strokeWidth={strong ? 2.2 : 1}
      strokeLinejoin={strong ? 'round' : undefined}
    />
  );
}

export function TopView({ state, relevant, size = 190 }: { state: State; relevant: Set<number>; size?: number }) {
  const S = 34, g = 3, o = 34;
  const rects: RectProps[] = [];
  for (let j = 0; j < 3; j++) {
    const x = (j - 1) * 2;
    rects.push({ k: findSticker('B', x, 2, -3), x: o + j * (S + g), y: o - 14 - g, w: S, h: 14 });
    rects.push({ k: findSticker('F', x, 2, 3), x: o + j * (S + g), y: o + 3 * (S + g), w: S, h: 14 });
  }
  for (let i = 0; i < 3; i++) {
    const z = (i - 1) * 2;
    rects.push({ k: findSticker('L', -3, 2, z), x: o - 14 - g, y: o + i * (S + g), w: 14, h: S });
    rects.push({ k: findSticker('R', 3, 2, z), x: o + 3 * (S + g), y: o + i * (S + g), w: 14, h: S });
  }
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 3; j++) rects.push({ k: i * 3 + j, x: o + j * (S + g), y: o + i * (S + g), w: S, h: S });
  return (
    <svg viewBox="0 0 170 170" width={size} height={size} aria-label="Vista de cima">
      {rects.map((r) => <Sticker key={r.k} {...r} state={state} relevant={relevant} />)}
    </svg>
  );
}

export function FrontView({ state, relevant, mirrored }: { state: State; relevant: Set<number>; mirrored: boolean }) {
  const S = 32, g = 2;
  const faces: Face[] = mirrored ? ['L', 'F'] : ['F', 'R'];
  const rects: RectProps[] = [];
  faces.forEach((f, fi) => {
    const base = FACES.indexOf(f) * 9;
    const ox = fi * (3 * (S + g) + 6);
    for (let i = 0; i < 3; i++)
      for (let j = 0; j < 3; j++) rects.push({ k: base + i * 3 + j, x: ox + j * (S + g), y: i * (S + g), w: S, h: S });
  });
  return (
    <svg viewBox="0 0 206 104" width="206" height="104" aria-label="Frente e lado">
      {rects.map((r) => <Sticker key={r.k} {...r} state={state} relevant={relevant} />)}
    </svg>
  );
}

/** 3D view (top, front and the slot side) plus the flat top view with side strips. */
export function Diagram({ state, relevant, mirrored, anim = null }: {
  state: State; relevant: Set<number>; view: 'f2l' | 'll'; mirrored: boolean; anim?: Anim | null;
}) {
  return (
    <div className="diagram">
      <div>
        <Cube3D state={state} relevant={relevant} mirrored={mirrored} anim={anim} size={230} />
        <div className="dgl">{mirrored ? 'cima · frente · esquerda' : 'cima · frente · direita'}</div>
      </div>
      <div>
        <TopView state={state} relevant={relevant} />
        <div className="dgl">visto de cima</div>
      </div>
    </div>
  );
}
