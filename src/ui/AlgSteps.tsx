// Step through an algorithm on a usePlayer cube, one move at a time. The cube state is the
// only source of truth: the number of moves done is read back by matching it to the prefixes.
import { Fragment, useEffect, useMemo } from 'react';
import { applyMove, invert, parse, type State } from '../engine/cube';
import { segment, segmentText } from '../engine/triggers';
import { MoveIcon } from '../diagram/MoveIcon';
import type { usePlayer } from '../diagram/usePlayer';

export type Stepper = ReturnType<typeof useAlgStepper>;

/** `moves` must keep its identity while the alg is the same: a new array restarts from `start`. */
export function useAlgStepper(player: ReturnType<typeof usePlayer>, start: State, moves: string[]) {
  const { state, playing, play, reset, stop } = player;
  const prefixes = useMemo(() => {
    const out = [start];
    for (const m of moves) out.push(applyMove(out[out.length - 1], m));
    return out;
  }, [start, moves]);
  const keys = useMemo(() => prefixes.map((s) => s.join()), [prefixes]);
  // While a move animates, the state is still the one before it, so that move stays "next".
  const done = Math.max(0, keys.indexOf(state.join()));
  const n = moves.length;

  useEffect(() => reset(start), [start, moves, reset]);

  return {
    moves, done, playing,
    next: () => { if (!playing && done < n) play([moves[done]]); },
    prev: () => { if (!playing && done > 0) play(invert([moves[done - 1]])); },
    restart: () => reset(start),
    toggle: () => {
      if (playing) return stop();
      if (done === n) reset(start);
      play(moves.slice(done === n ? 0 : done));
    },
    jump: (i: number) => { reset(prefixes[i]); play([moves[i]]); },
  };
}

export function AlgSteps({ stepper, beginner, onBeginner }: {
  stepper: Stepper;
  beginner: boolean;
  onBeginner: (on: boolean) => void;
}) {
  const { moves, done, playing } = stepper;
  const step = (m: string, i: number) => (
    <li key={i}>
      <button className={`step${i < done ? ' done' : i === done ? ' next' : ''}`} aria-current={i === done ? 'step' : undefined}
        aria-label={`Movimento ${i + 1}: ${m}`} onClick={() => stepper.jump(i)}>
        {beginner && <MoveIcon move={m} />}
        <span className="mono">{m}</span>
      </button>
    </li>
  );
  return (
    <div className="algsteps">
      <div className="stephead">
        <span className="mini">{done} de {moves.length} movimentos</span>
        <button className={`chip${beginner ? ' on' : ''}`} aria-pressed={beginner} onClick={() => onBeginner(!beginner)}>
          desenhos: {beginner ? 'ligado' : 'desligado'}
        </button>
      </div>
      <ol className={`alg ${beginner ? 'tiles' : 'compact'}`} aria-label="Movimentos do algoritmo">
        {segment(moves).map((s) => {
          const steps = s.moves.map((m, k) => step(m, s.start + k));
          return s.trigger
            ? <li key={s.start} className="trig"><span className="trigname" aria-hidden>{s.trigger}</span><ol aria-label={s.trigger}>{steps}</ol></li>
            : steps;
        })}
      </ol>
      <div className="stepctl">
        <button className="ctl" aria-label="Voltar ao caso" onClick={stepper.restart}>⏮</button>
        <button className="ctl" aria-label="Movimento anterior" disabled={done === 0} onClick={stepper.prev}>◀</button>
        <button className="ctl" aria-label="Próximo movimento" disabled={done === moves.length} onClick={stepper.next}>▶</button>
        <button className="ctl wide" onClick={stepper.toggle}>{playing ? 'pausar' : 'tocar tudo'}</button>
      </div>
    </div>
  );
}

/** Picks the main algorithm or one of the alternatives. */
export function AlgChoice({ labels, value, onChange }: { labels: string[]; value: number; onChange: (i: number) => void }) {
  if (labels.length < 2) return null;
  return (
    <div className="algchoice">
      <span className="mini">Algoritmos para este caso:</span>
      <div className="chips">
        {labels.map((l, i) => (
          <button key={i} className={`chip mono${i === value ? ' on' : ''}`} aria-pressed={i === value} onClick={() => onChange(i)}><AlgText alg={l} /></button>
        ))}
      </div>
    </div>
  );
}

/** The alg as text with triggers in parentheses; a trigger never breaks across lines. */
export function AlgText({ alg }: { alg: string }) {
  return segment(parse(alg)).map((s, i) => (
    <Fragment key={s.start}>{i > 0 && ' '}{s.trigger ? <span className="trigtext">{segmentText(s)}</span> : segmentText(s)}</Fragment>
  ));
}
