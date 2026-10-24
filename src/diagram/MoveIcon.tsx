// Small drawing of one move: the turning layer in color, caught a bit into the turn,
// with an arrow showing which way it goes. A double arrowhead marks the 180° moves.
import { useMemo } from 'react';
import { SOLVED } from '../engine/cube';
import { layerStickers, moveArrow, renderCube } from './cube3d';
import { stickerFill } from './Diagram';

// Far enough into the turn that the gap shows which layer moves.
const T = 0.35;

type P = [number, number];

function arrowPath(from: P, to: P, double: boolean): string {
  const dx = to[0] - from[0], dy = to[1] - from[1];
  const len = Math.hypot(dx, dy);
  const ux = dx / len, uy = dy / len;
  const head = (back: number) => {
    const tip: P = [to[0] - ux * back, to[1] - uy * back];
    const w = (s: number) => `${tip[0] - ux * 1.3 + s * uy * 1.1},${tip[1] - uy * 1.3 - s * ux * 1.1}`;
    return `M${w(1)} L${tip[0]},${tip[1]} L${w(-1)}`;
  };
  return `M${from[0]},${from[1]} L${to[0]},${to[1]} ${head(0)}${double ? ` ${head(1.1)}` : ''}`;
}

export function MoveIcon({ move, size = 44 }: { move: string; size?: number }) {
  const { quads, d } = useMemo(() => {
    const layer = layerStickers(move);
    const { from, to } = moveArrow(move, T);
    return {
      quads: renderCube((k) => (layer.has(k) ? stickerFill(SOLVED, k, layer) : 'var(--cX)'), false, { move, t: T }),
      d: arrowPath(from, to, move.endsWith('2')),
    };
  }, [move]);
  return (
    <svg className="moveicon" viewBox="-4.9 -4.9 9.8 9.8" width={size} height={size} aria-hidden="true">
      {quads.map((q, i) => (
        <polygon key={i} points={q.points} fill={q.fill ?? 'var(--plastic)'}
          stroke={q.fill ? 'var(--sticker-line)' : 'var(--plastic)'} strokeWidth={q.fill ? 0.12 : 0.02} strokeLinejoin="round" />
      ))}
      <path className="halo" d={d} />
      <path className="ink" d={d} />
    </svg>
  );
}
