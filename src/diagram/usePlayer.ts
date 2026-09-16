// Plays a sequence of moves on a cube state, one animated layer turn at a time.
import { useCallback, useEffect, useRef, useState } from 'react';
import { applyMove, type State } from '../engine/cube';
import type { Anim } from './cube3d';

const QUARTER_MS = 420;

export function usePlayer(initial: State) {
  const [state, setState] = useState<State>(initial);
  const [anim, setAnim] = useState<Anim | null>(null);
  const [playing, setPlaying] = useState(false);
  const queue = useRef<string[]>([]);
  const frame = useRef<number | null>(null);
  const stateRef = useRef(initial);

  const stop = useCallback(() => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = null;
    queue.current = [];
    setAnim(null);
    setPlaying(false);
  }, []);

  const reset = useCallback((s: State) => {
    stop();
    stateRef.current = s;
    setState(s);
  }, [stop]);

  const step = useCallback(() => {
    const move = queue.current.shift();
    if (!move) { setPlaying(false); setAnim(null); return; }
    const duration = move.endsWith('2') ? QUARTER_MS * 1.5 : QUARTER_MS;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setAnim({ move, t });
      if (t < 1) { frame.current = requestAnimationFrame(tick); return; }
      stateRef.current = applyMove(stateRef.current, move);
      setState(stateRef.current);
      setAnim(null);
      frame.current = requestAnimationFrame(() => step());
    };
    frame.current = requestAnimationFrame(tick);
  }, []);

  const play = useCallback((moves: string[]) => {
    queue.current.push(...moves);
    if (frame.current === null) { setPlaying(true); step(); }
  }, [step]);

  useEffect(() => () => { if (frame.current !== null) cancelAnimationFrame(frame.current); }, []);

  return { state, anim, playing, play, reset, stop };
}
