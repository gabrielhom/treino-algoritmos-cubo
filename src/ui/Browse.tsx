// "Casos": browse every case of the set with diagram, algorithm, filters and a manual mark.
import { useMemo, useState } from 'react';
import { apply, invert, normalizeOrientation, parse, SOLVED, type State } from '../engine/cube';
import { Cube3D } from '../diagram/Cube3D';
import { TopView } from '../diagram/Diagram';
import type { CaseMark, CaseState, MarkStatus } from '../progress/model';
import type { AlgCase, AlgSet } from '../sets/types';
import { weightOf } from '../trainer/trainer';

export const MARK_LABEL: Record<MarkStatus, string> = { learning: 'aprendendo', known: 'sei' };

export function caseStatesOf(set: AlgSet): Map<string | number, State> {
  const out = new Map<string | number, State>();
  for (const c of set.cases) out.set(c.id, normalizeOrientation(apply(SOLVED, invert(parse(c.alg)))));
  return out;
}

export function Browse({ set, marks, progress, onTrain, onFocus, onMark }: {
  set: AlgSet;
  marks: Map<string, CaseMark>;
  progress: Map<string | number, CaseState>;
  onTrain: (id: string | number) => void;
  onFocus: (ids: (string | number)[]) => void;
  onMark: (id: string | number, status: MarkStatus | null) => void;
}) {
  const [group, setGroup] = useState<number | null>(null);
  const [status, setStatus] = useState<'all' | MarkStatus | 'none'>('all');
  const [picks, setPicks] = useState<Record<string, string | null>>({});
  const states = useMemo(() => caseStatesOf(set), [set]);
  const markOf = (c: AlgCase) => marks.get(`${set.id}/${c.id}`)?.status ?? null;

  const shown = set.cases.filter((c) => {
    if (group !== null && c.group !== group) return false;
    const m = markOf(c);
    if (status === 'none' ? m !== null : status !== 'all' && m !== status) return false;
    for (const f of set.filters ?? []) {
      const pick = picks[f.id];
      if (pick && f.classify(states.get(c.id)!) !== pick) return false;
    }
    return true;
  });
  const learning = set.cases.filter((c) => markOf(c) === 'learning');
  const counts = { learning: learning.length, known: set.cases.filter((c) => markOf(c) === 'known').length };

  const chip = (on: boolean, label: string, onClick: () => void) => (
    <button key={label} className={`chip${on ? ' on' : ''}`} onClick={onClick}>{label}</button>
  );

  return (
    <section>
      <div className="card">
        <div className="row" style={{ borderTop: 0, paddingTop: 0 }}>
          <div>
            <div className="t">{set.cases.length} casos · {counts.known} sei · {counts.learning} aprendendo</div>
            <div className="d">Marque o que já sabe e o que está aprendendo. As marcas sincronizam com a conta.</div>
          </div>
          {learning.length > 0 && (
            <button className="chip on" onClick={() => onFocus(learning.map((c) => c.id))}>treinar os que estou aprendendo</button>
          )}
        </div>
        <div className="filters">
          <div className="filter"><span className="mini">Grupo</span>
            <div className="chips">
              {chip(group === null, 'todos', () => setGroup(null))}
              {set.groups.map((g, i) => chip(group === i, g, () => setGroup(group === i ? null : i)))}
            </div>
          </div>
          {(set.filters ?? []).map((f) => (
            <div key={f.id} className="filter"><span className="mini">{f.label}</span>
              <div className="chips">
                {chip(!picks[f.id], 'qualquer', () => setPicks({ ...picks, [f.id]: null }))}
                {f.options.map((o) => chip(picks[f.id] === o.id, o.label, () => setPicks({ ...picks, [f.id]: picks[f.id] === o.id ? null : o.id })))}
              </div>
            </div>
          ))}
          <div className="filter"><span className="mini">Marca</span>
            <div className="chips">
              {chip(status === 'all', 'todas', () => setStatus('all'))}
              {chip(status === 'none', 'sem marca', () => setStatus('none'))}
              {chip(status === 'learning', 'aprendendo', () => setStatus('learning'))}
              {chip(status === 'known', 'sei', () => setStatus('known'))}
            </div>
          </div>
        </div>
        <div className="row" style={{ paddingBottom: 0 }}>
          <span className="mini">{shown.length} de {set.cases.length} casos</span>
          {shown.length > 0 && shown.length < set.cases.length && (
            <button className="chip" onClick={() => onFocus(shown.map((c) => c.id))}>treinar só estes {shown.length}</button>
          )}
        </div>
      </div>

      <div className="grid">
        {shown.map((c) => {
          const st = states.get(c.id)!;
          const relevant = set.relevantStickers(st, { mirrored: false });
          const m = markOf(c);
          const p = progress.get(c.id);
          return (
            <div key={c.id} className={`card casecard${m ? ` ${m}` : ''}`}>
              <div className="caselabel"><span>Caso <b>{c.id}</b></span><span>{set.groups[c.group]}</span></div>
              <div className="thumb">
                {set.view === 'f2l'
                  ? <Cube3D state={st} relevant={relevant} mirrored={false} size={150} label={`Caso ${c.id}`} />
                  : <TopView state={st} relevant={relevant} size={140} />}
              </div>
              <div className="mono alg">{c.alg}</div>
              {c.alts.length > 0 && <div className="mini">+{c.alts.length} alternativa{c.alts.length > 1 ? 's' : ''}</div>}
              <div className="mini">{p?.seen_count ? `${p.seen_count}x · ${(p.total_ms / p.seen_count / 1000).toFixed(1)} s · peso ${weightOf(p)}` : 'nunca treinado'}</div>
              <div className="row" style={{ borderTop: 0, paddingBottom: 0 }}>
                <div className="seg">
                  {(['learning', 'known'] as MarkStatus[]).map((s) => (
                    <button key={s} className={m === s ? 'on' : ''} onClick={() => onMark(c.id, m === s ? null : s)}>{MARK_LABEL[s]}</button>
                  ))}
                </div>
                <button className="chip" onClick={() => onTrain(c.id)}>treinar</button>
              </div>
            </div>
          );
        })}
        {shown.length === 0 && <div className="empty">Nenhum caso com esses filtros.</div>}
      </div>
      <div className="note">Os diagramas mostram o caso no slot direito, sem giro. Só o canto e a aresta coloridos importam; o resto da camada de cima fica cinza.</div>
    </section>
  );
}
