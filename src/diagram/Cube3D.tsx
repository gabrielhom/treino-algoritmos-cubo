import { useMemo } from 'react';
import type { State } from '../engine/cube';
import { renderCube, type Anim } from './cube3d';
import { stickerFill } from './Diagram';

export function Cube3D({ state, relevant, mirrored, anim = null, size = 220, label }: {
  state: State;
  relevant: Set<number>;
  mirrored: boolean;
  anim?: Anim | null;
  size?: number;
  label?: string;
}) {
  const quads = useMemo(
    () => renderCube((k) => stickerFill(state, k, relevant), mirrored, anim),
    [state, relevant, mirrored, anim],
  );
  return (
    <svg className="cube3d" viewBox="-5 -5 10 10" width={size} height={size} aria-label={label ?? 'Cubo em 3D'}>
      {quads.map((q, i) => (
        <polygon
          key={i}
          points={q.points}
          fill={q.fill ?? 'var(--plastic)'}
          stroke={q.fill ? 'var(--sticker-line)' : 'var(--plastic)'}
          strokeWidth={q.fill ? 0.14 : 0.02}
          strokeLinejoin="round"
        />
      ))}
    </svg>
  );
}
