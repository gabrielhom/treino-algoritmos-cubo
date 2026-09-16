import { useMemo, useState } from 'react';
import type { AlgSet } from '../sets/types';
import type { Attempt, CaseState } from '../progress/model';
import { caseRows, heaviest, sessions, setSummary, type CaseRow, type Window } from '../progress/stats';
import { selectedCases, type SetSettings } from '../trainer/trainer';

const fmtS = (ms: number | null) => (ms === null ? '–' : `${(ms / 1000).toFixed(1)} s`);
export const fmtWeight = (w: number) => w.toFixed(w % 1 ? 1 : 0);
const RATING_PT = { easy: 'Fácil', ok: 'Ok', hard: 'Difícil' } as const;
const fmtDate = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : '–');

function WindowLine({ label, w }: { label: string; w: Window }) {
  const delta = w.delta === null ? '' : ` · ${w.delta <= 0 ? '' : '+'}${Math.round(w.delta * 100)}% vs período anterior`;
  return (
    <div className="row">
      <div><div className="t">{label}</div><div className="d">{w.count} tentativas{delta}</div></div>
      <b>{fmtS(w.avg_ms)}</b>
    </div>
  );
}

/** Average recognition time per session, most recent sessions on the right. */
function SessionChart({ attempts }: { attempts: Attempt[] }) {
  const data = useMemo(() => sessions(attempts).slice(-20), [attempts]);
  if (data.length < 2) return <div className="empty mini">O gráfico aparece a partir da segunda sessão.</div>;
  const W = 320, H = 120, padL = 30, padB = 18, padT = 8;
  const max = Math.max(...data.map((d) => d.avg_ms)) / 1000;
  const top = Math.ceil(max);
  const x = (i: number) => padL + (i * (W - padL - 6)) / (data.length - 1);
  const y = (s: number) => padT + (H - padT - padB) * (1 - s / top);
  const points = data.map((d, i) => `${x(i).toFixed(1)},${y(d.avg_ms / 1000).toFixed(1)}`).join(' ');
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Tempo médio de reconhecimento por sessão">
      {[0, top / 2, top].map((v) => (
        <g key={v}>
          <line x1={padL} x2={W - 6} y1={y(v)} y2={y(v)} stroke="var(--line)" />
          <text x={padL - 4} y={y(v) + 3} fontSize="9" textAnchor="end" fill="var(--ink-2)">{v.toFixed(v % 1 ? 1 : 0)}s</text>
        </g>
      ))}
      <polyline points={points} fill="none" stroke="var(--ink)" strokeWidth="1.8" strokeLinejoin="round" />
      {data.map((d, i) => <circle key={i} cx={x(i)} cy={y(d.avg_ms / 1000)} r="2.4" fill="var(--ink)" />)}
      <text x={padL} y={H - 4} fontSize="9" fill="var(--ink-2)">{fmtDate(data[0].start)}</text>
      <text x={W - 6} y={H - 4} fontSize="9" textAnchor="end" fill="var(--ink-2)">{fmtDate(data[data.length - 1].start)}</text>
    </svg>
  );
}

type SortKey = 'id' | 'weight' | 'avg_ms' | 'attempts' | 'last_rating';
const RATING_ORDER = { hard: 0, ok: 1, easy: 2 };

export function Progress({ set, settings, attempts, caseStates, onTrain, onFocus }: {
  set: AlgSet;
  settings: SetSettings;
  attempts: Attempt[];
  caseStates: Map<string | number, CaseState>;
  onTrain: (id: string | number) => void;
  onFocus: (ids: (string | number)[]) => void;
}) {
  const [sort, setSort] = useState<{ key: SortKey; desc: boolean }>({ key: 'id', desc: false });
  const setAttempts = useMemo(() => attempts.filter((a) => a.set_id === set.id), [attempts, set.id]);
  const summary = useMemo(() => setSummary(set, setAttempts, caseStates), [set, setAttempts, caseStates]);
  const rows = useMemo(() => caseRows(set, caseStates), [set, caseStates]);
  const top = useMemo(() => heaviest(rows), [rows]);
  const selected = new Set(selectedCases(set, settings).map((c) => c.id));

  const sorted = useMemo(() => {
    const cmp = (a: CaseRow, b: CaseRow): number => {
      switch (sort.key) {
        case 'id': return String(a.id).localeCompare(String(b.id), undefined, { numeric: true });
        case 'weight': return a.weight - b.weight;
        case 'attempts': return a.attempts - b.attempts;
        case 'avg_ms': return (a.avg_ms ?? -1) - (b.avg_ms ?? -1);
        case 'last_rating': return (a.last_rating ? RATING_ORDER[a.last_rating] : 3) - (b.last_rating ? RATING_ORDER[b.last_rating] : 3);
      }
    };
    const out = [...rows].sort(cmp);
    return sort.desc ? out.reverse() : out;
  }, [rows, sort]);

  const th = (key: SortKey, label: string) => (
    <th className={`sortable${sort.key === key ? ' on' : ''}`} onClick={() => setSort((s) => ({ key, desc: s.key === key ? !s.desc : key !== 'id' }))}>
      {label}{sort.key === key ? (sort.desc ? ' ▾' : ' ▴') : ''}
    </th>
  );

  return (
    <section>
      <div className="card">
        <h2>{set.name}</h2>
        <div className="row">
          <div><div className="t">Casos vistos</div><div className="d">{summary.attempts} tentativas no total</div></div>
          <b>{summary.seen} de {summary.total}</b>
        </div>
        <div className="row">
          <div><div className="t">Reconhecimento médio</div><div className="d">desde o início</div></div>
          <b>{fmtS(summary.avg_ms)}</b>
        </div>
        <WindowLine label="Últimos 7 dias" w={summary.last7} />
        <WindowLine label="Últimos 30 dias" w={summary.last30} />
      </div>

      <div className="card">
        <h2>Tempo médio por sessão</h2>
        <SessionChart attempts={setAttempts} />
        <div className="note">Uma sessão termina depois de 10 minutos sem tentativas. Últimas 20 sessões.</div>
      </div>

      {top.length > 0 && (
        <div className="card">
          <h2>Pesando mais agora</h2>
          <div className="chips">
            {top.map((r) => (
              <button key={r.id} className="chip on" onClick={() => onTrain(r.id)}>
                {r.id} <span className="mini">peso {fmtWeight(r.weight)} · {fmtS(r.avg_ms)}</span>
              </button>
            ))}
          </div>
          <div className="row" style={{ marginTop: 10 }}>
            <span className="mini">Toque em um caso para treinar só ele uma vez.</span>
            <button className="chip" onClick={() => onFocus(top.map((r) => r.id))}>treinar só esses {top.length}</button>
          </div>
        </div>
      )}

      <div className="card">
        <h2>Por caso</h2>
        <table>
          <thead><tr>{th('id', '#')}<th>Grupo</th>{th('attempts', 'Vezes')}{th('avg_ms', 'Tempo')}{th('weight', 'Peso')}{th('last_rating', 'Último')}<th></th></tr></thead>
          <tbody>
            {sorted.map((r) => (
              <tr key={r.id} className={selected.has(r.id) ? '' : 'off'}>
                <td><b>{r.id}</b></td>
                <td className="mini">{r.group}</td>
                <td>{r.attempts}</td>
                <td>{fmtS(r.avg_ms)}</td>
                <td><span className={`sc${r.weight >= 5 ? ' h' : ''}`}>{fmtWeight(r.weight)}</span></td>
                <td className="mini">{r.last_rating ? RATING_PT[r.last_rating] : '–'}</td>
                <td><button onClick={() => onTrain(r.id)}>treinar</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="note">Peso alto = aparece mais no sorteio. "Fácil" baixa, "Difícil" sobe. Toque no cabeçalho para ordenar e em "treinar" para forçar um caso.</div>
      </div>
    </section>
  );
}
