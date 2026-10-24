// Case detail sheet: the case on a 3D cube you can step through, move by move.
import { useEffect, useMemo, useRef, useState } from 'react';
import { Cube3D } from '../diagram/Cube3D';
import { usePlayer } from '../diagram/usePlayer';
import { parse, type State } from '../engine/cube';
import type { MarkStatus } from '../progress/model';
import type { AlgCase, AlgSet } from '../sets/types';
import { AlgChoice, AlgSteps, useAlgStepper } from './AlgSteps';

const MARK_LABEL: Record<MarkStatus, string> = { learning: 'aprendendo', known: 'sei' };

export function MarkSeg({ mark, onMark }: { mark: MarkStatus | null; onMark: (status: MarkStatus | null) => void }) {
  return (
    <div className="seg" role="group" aria-label="Marca">
      {(['learning', 'known'] as MarkStatus[]).map((s) => (
        <button key={s} className={mark === s ? 'on' : ''} aria-pressed={mark === s} onClick={() => onMark(mark === s ? null : s)}>{MARK_LABEL[s]}</button>
      ))}
    </div>
  );
}

export function CaseDetail({ set, c, start, mark, onMark, onTrain, onClose, beginner, onBeginner }: {
  set: AlgSet;
  c: AlgCase;
  start: State;
  mark: MarkStatus | null;
  onMark: (status: MarkStatus | null) => void;
  onTrain: () => void;
  onClose: () => void;
  beginner: boolean;
  onBeginner: (on: boolean) => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { ref.current?.showModal(); }, []);
  const algs = [c.alg, ...c.alts];
  const [pick, setPick] = useState(0);
  const alg = algs[pick];
  const moves = useMemo(() => parse(alg), [alg]);
  const player = usePlayer(start);
  const stepper = useAlgStepper(player, start, moves);
  const relevant = set.relevantStickers(player.state, { mirrored: false });

  return (
    <dialog ref={ref} className="sheet" aria-labelledby="case-title" onClose={onClose}
      onClick={(e) => { if (e.target === e.currentTarget) ref.current?.close(); }}>
      <div className="sheet-in">
        <div className="sheet-head">
          <div>
            <h2 id="case-title">Caso {c.id}</h2>
            <div className="mini">{set.name} · {set.groups[c.group]}</div>
          </div>
          <button className="chip" onClick={() => ref.current?.close()}>fechar</button>
        </div>
        <div className="sheet-cube">
          <Cube3D state={player.state} relevant={relevant} mirrored={false} anim={player.anim} size={200} label={`Caso ${c.id}`} />
        </div>
        <AlgSteps stepper={stepper} beginner={beginner} onBeginner={onBeginner} />
        <AlgChoice labels={algs} value={pick} onChange={setPick} />
        <div className="row sheet-foot">
          <MarkSeg mark={mark} onMark={onMark} />
          <button className="btn primary" onClick={onTrain}>treinar este caso</button>
        </div>
      </div>
    </dialog>
  );
}
