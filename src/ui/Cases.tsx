import type { AlgSet } from '../sets/types';
import type { CaseState } from '../progress/model';
import { selectedCases, weightOf, type SetSettings } from '../trainer/trainer';

export const fmtWeight = (w: number) => w.toFixed(w % 1 ? 1 : 0);

export function Cases({ set, settings, caseStates, onTrain }: {
  set: AlgSet;
  settings: SetSettings;
  caseStates: Map<string | number, CaseState>;
  onTrain: (id: string | number) => void;
}) {
  const selected = new Set(selectedCases(set, settings).map((c) => c.id));
  const seen = set.cases.filter((c) => (caseStates.get(c.id)?.seen_count ?? 0) > 0).length;
  return (
    <section>
      <div className="card">
        <h2>Seus casos</h2>
        <div className="mini">{seen} de {set.cases.length} casos já vistos.</div>
        <table>
          <thead><tr><th>#</th><th>Grupo</th><th>Vezes</th><th>Tempo</th><th>Peso</th><th></th></tr></thead>
          <tbody>
            {set.cases.map((c) => {
              const cs = caseStates.get(c.id);
              const w = weightOf(cs);
              return (
                <tr key={c.id} className={selected.has(c.id) ? '' : 'off'}>
                  <td><b>{c.id}</b></td>
                  <td className="mini">{set.groups[c.group]}</td>
                  <td>{cs?.seen_count ?? 0}</td>
                  <td>{cs?.seen_count ? `${(cs.total_ms / cs.seen_count / 1000).toFixed(1)} s` : '–'}</td>
                  <td><span className={`sc${w >= 5 ? ' h' : ''}`}>{fmtWeight(w)}</span></td>
                  <td><button onClick={() => onTrain(c.id)}>treinar</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="note">Peso alto = aparece mais no sorteio. "Fácil" baixa, "Difícil" sobe. Toque em "treinar" para forçar um caso específico.</div>
      </div>
    </section>
  );
}
