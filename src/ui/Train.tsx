import { useEffect, useRef } from 'react';
import { Diagram } from '../diagram/Diagram';
import type { CaseState, Rating } from '../progress/model';
import { displaySolution, type ActiveCase, type SetSettings } from '../trainer/trainer';

const fmtS = (ms: number) => (ms / 1000).toFixed(1);

export function Train({ active, settings, caseState, onRate }: {
  active: ActiveCase | null;
  settings: SetSettings;
  caseState: CaseState | undefined;
  onRate: (r: Rating) => void;
}) {
  const solutionRef = useRef<HTMLDivElement>(null);
  const revealed = !!active?.revealed;
  useEffect(() => {
    if (revealed) setTimeout(() => solutionRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' }), 30);
  }, [revealed]);

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
  const relevant = set.relevantStickers(active.state, { mirrored: active.mirrored });
  const label = settings.showNumber ? `${active.case.id}${active.mirrored ? ' (esq.)' : ''}` : '?';
  const avg = caseState && caseState.seen_count
    ? ` · sua média ${fmtS(caseState.total_ms / caseState.seen_count)} s em ${caseState.seen_count}x`
    : '';
  const isAuf = (i: number) => (active.postAuf && i === active.scramble.length - 1) || (active.preAuf && i === 0);

  return (
    <section>
      <div className="card">
        <div className="caselabel">
          <span>Caso <b>{label}</b></span>
          <span>{settings.showNumber ? set.groups[active.case.group] : ''}</span>
        </div>
        <Diagram state={active.state} relevant={relevant} view={set.view} mirrored={active.mirrored} />
        <div className="scramble">
          <div className="lbl">Aplique no cubo montado:</div>
          <div className="moves">
            {active.scramble.map((m, i) => <span key={i} className={`mv${isAuf(i) ? ' auf' : ''}`}>{m}</span>)}
          </div>
        </div>
        {active.revealed && (
          <div className="solution" ref={solutionRef}>
            <div className="alg">{displaySolution(active, active.solution)}</div>
            <div className="alt">
              {active.alts.length > 0 && (
                <>Também: {active.alts.map((a, i) => (
                  <span key={i}>{i > 0 && <> &nbsp;|&nbsp; </>}<code>{displaySolution(active, a)}</code></span>
                ))}</>
              )}
            </div>
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
      <div className="card mini">
        {active.revealed
          ? 'Se a sua solução tinha 2 ou 3 movimentos a mais, tudo bem. Só aprenda o algoritmo quando a intuitiva ficar muito pior.'
          : 'Resolva no cubo antes de mostrar a solução. O tempo até "Mostrar solução" conta como reconhecimento.'}
      </div>
    </section>
  );
}
