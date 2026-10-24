import { useEffect, useMemo, useRef } from 'react';
import { Diagram } from '../diagram/Diagram';
import { MoveIcon } from '../diagram/MoveIcon';
import { usePlayer } from '../diagram/usePlayer';
import { parse, SOLVED } from '../engine/cube';
import type { CaseState, Rating } from '../progress/model';
import { displaySolution, type ActiveCase, type SetSettings } from '../trainer/trainer';
import { AlgChoice, AlgSteps, useAlgStepper } from './AlgSteps';

const fmtS = (ms: number) => (ms / 1000).toFixed(1);

export function Train({ active, settings, caseState, onRate, fav, onFav, beginner, onBeginner }: {
  active: ActiveCase | null;
  settings: SetSettings;
  caseState: CaseState | undefined;
  onRate: (r: Rating) => void;
  fav: number;
  onFav: (i: number) => void;
  beginner: boolean;
  onBeginner: (on: boolean) => void;
}) {
  const solutionRef = useRef<HTMLDivElement>(null);
  const revealed = !!active?.revealed;
  useEffect(() => {
    if (revealed) setTimeout(() => solutionRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' }), 30);
  }, [revealed]);
  const player = usePlayer(active?.state ?? SOLVED);
  const options = useMemo(() => (active ? [active.solution, ...active.alts] : []), [active]);
  const pick = Math.min(fav, options.length - 1);
  const moves = useMemo(() => (active ? parse(displaySolution(active, options[pick])) : []), [active, options, pick]);
  const stepper = useAlgStepper(player, active?.state ?? SOLVED, moves);

  if (!active) {
    return (
      <section>
        <div className="card">
          <div className="caselabel"><span>Caso <b>–</b></span><span /></div>
          <div className="scramble">
            <span className="mini">Nenhum grupo selecionado. Escolha grupos em Ajustes.</span>
          </div>
        </div>
      </section>
    );
  }

  const { set } = active;
  const relevant = set.relevantStickers(player.state, { mirrored: active.mirrored });
  const label = settings.showNumber ? `${active.case.id}${active.mirrored ? ' (esq.)' : ''}` : '?';
  const avg = caseState && caseState.seen_count
    ? ` · sua média ${fmtS(caseState.total_ms / caseState.seen_count)} s em ${caseState.seen_count}x`
    : '';
  const isAuf = (i: number) => (active.postAuf && i === active.scramble.length - 1) || (active.preAuf && i === 0);

  return (
    <section>
      <div className="card train">
        <div className="train-case">
          <div className="caselabel">
            <span>Caso <b>{label}</b></span>
            <span>{settings.showNumber ? set.groups[active.case.group] : ''}</span>
          </div>
          <Diagram state={player.state} relevant={relevant} view={set.view} mirrored={active.mirrored} anim={player.anim} />
        </div>
        <div className="train-work">
          <div className="scramble">
            <div className="lbl">Aplique no cubo montado:</div>
            <div className="moves">
              {active.scramble.map((m, i) => <span key={i} className={`mv${isAuf(i) ? ' auf' : ''}${beginner ? ' drawn' : ''}`}>{beginner && <MoveIcon move={m} size={36} />}{m}</span>)}
            </div>
          </div>
          {active.revealed && (
            <div className="solution" ref={solutionRef}>
              <AlgSteps stepper={stepper} beginner={beginner} onBeginner={onBeginner} />
              <AlgChoice labels={options.map((a) => displaySolution(active, a))} value={pick} onChange={onFav} />
              <div className="meta">
                Reconhecimento: {fmtS(active.elapsedMs)} s{avg}
                {active.postAuf ? ' · a primeira letra desfaz o giro aleatório' : ''}
                {active.preAuf ? ' · a última letra é o giro final' : ''}
              </div>
              <div className="rate">
                <button className="easy" onClick={() => onRate('easy')}>Fácil</button>
                <button className="mid" onClick={() => onRate('ok')}>Ok</button>
                <button className="hard" onClick={() => onRate('hard')}>Difícil</button>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="card mini">
        {active.revealed
          ? 'Se a sua solução tinha 2 ou 3 movimentos a mais, tudo bem. Só aprenda o algoritmo quando a intuitiva ficar muito pior.'
          : 'Resolva no cubo antes de mostrar a solução. O tempo até "Mostrar solução" conta como reconhecimento.'}
      </div>
    </section>
  );
}
