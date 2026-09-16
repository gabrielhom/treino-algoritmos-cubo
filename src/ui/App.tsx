import { useCallback, useEffect, useMemo, useState } from 'react';
import { getSet } from '../sets';
import { foldCaseStates, newId, statesForSet, type Attempt } from '../progress/model';
import { localAttemptStore, loadSettings, saveSettings, settingsFor, type AppSettings } from '../progress/store';
import { useTrainer, type AttemptInput } from '../trainer/useTrainer';
import { selectedCases, type SetSettings } from '../trainer/trainer';
import { Train } from './Train';
import { Cases } from './Cases';
import { Settings } from './Settings';
import { Help } from './Help';

type View = 'train' | 'cases' | 'settings' | 'help';
const VIEWS: { id: View; label: string }[] = [
  { id: 'train', label: 'Treinar' }, { id: 'cases', label: 'Casos' }, { id: 'settings', label: 'Ajustes' }, { id: 'help', label: 'Como usar' },
];

const store = localAttemptStore;

export function App() {
  const [view, setView] = useState<View>('train');
  const [app, setApp] = useState<AppSettings>(loadSettings);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  useEffect(() => { store.load().then(setAttempts); }, []);

  const set = getSet(app.setId);
  const settings = settingsFor(app, set.id);
  const updateSettings = (s: SetSettings) => {
    const nextApp = { ...app, sets: { ...app.sets, [set.id]: s } };
    setApp(nextApp);
    saveSettings(nextApp);
  };

  const allStates = useMemo(() => foldCaseStates(attempts), [attempts]);
  const caseStates = useMemo(() => statesForSet(allStates, set.id), [allStates, set.id]);

  const onAttempt = useCallback((a: AttemptInput) => {
    const attempt: Attempt = {
      id: newId(), user_id: null, set_id: a.set.id, case_id: String(a.case.id), mirrored: a.mirrored,
      auf: a.auf, recognition_ms: a.recognitionMs, rating: a.rating, created_at: new Date().toISOString(),
    };
    setAttempts((prev) => [...prev, attempt]);
    void store.add(attempt);
  }, []);

  const trainer = useTrainer(set, settings, caseStates, onAttempt);
  const { active, next, reveal, rate } = trainer;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.tagName === 'BUTTON' && e.key !== ' ') return;
      if (e.key === ' ') { e.preventDefault(); if (active && !active.revealed) reveal(); else next(); }
      if (e.key === '1') rate('easy');
      if (e.key === '2') rate('ok');
      if (e.key === '3') rate('hard');
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [active, next, reveal, rate]);

  const reset = () => {
    if (confirm('Zerar pesos e tempos?')) { setAttempts([]); void store.clear(); }
  };
  const trainCase = (id: string | number) => {
    const c = set.cases.find((x) => x.id === id);
    if (c) { trainer.start(c); setView('train'); }
  };

  return (
    <div className="app">
      <header>
        <h1>Treino {set.name}</h1>
        <span className="sub">{selectedCases(set, settings).length} de {set.cases.length} casos no sorteio</span>
      </header>
      <div className="tabs">
        {VIEWS.map((v) => (
          <button key={v.id} className={`tab${view === v.id ? ' on' : ''}`} onClick={() => setView(v.id)}>{v.label}</button>
        ))}
      </div>
      {view === 'train' && <Train active={active} settings={settings} caseState={active ? caseStates.get(active.case.id) : undefined} onRate={rate} />}
      {view === 'cases' && <Cases set={set} settings={settings} caseStates={caseStates} onTrain={trainCase} />}
      {view === 'settings' && <Settings set={set} settings={settings} onChange={updateSettings} onReset={reset} />}
      {view === 'help' && <Help set={set} />}
      {view === 'train' && (
        <div className="actions"><div className="in">
          <button className="btn" onClick={reveal} disabled={!active || active.revealed}>Mostrar solução</button>
          <button className="btn primary" onClick={next}>Próximo</button>
        </div></div>
      )}
    </div>
  );
}
