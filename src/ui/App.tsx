import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getSet } from '../sets';
import { foldCaseStates, newId, statesForSet, type Attempt } from '../progress/model';
import { loadSettings, openAttemptStore, saveSettings, settingsFor, type AppSettings, type AttemptStore } from '../progress/store';
import { useTrainer, type AttemptInput } from '../trainer/useTrainer';
import { selectedCases, type SetSettings } from '../trainer/trainer';
import { pendingOf } from '../sync/sync';
import { useSync } from '../sync/useSync';
import { Train } from './Train';
import { Progress } from './Progress';
import { Settings } from './Settings';
import { Account } from './Account';
import { Help } from './Help';

type View = 'train' | 'progress' | 'settings' | 'help';
const VIEWS: { id: View; label: string }[] = [
  { id: 'train', label: 'Treinar' }, { id: 'progress', label: 'Progresso' }, { id: 'settings', label: 'Ajustes' }, { id: 'help', label: 'Como usar' },
];

export function App() {
  const [view, setView] = useState<View>('train');
  const [app, setApp] = useState<AppSettings>(loadSettings);
  const [attempts, setAttemptsState] = useState<Attempt[]>([]);
  const attemptsRef = useRef<Attempt[]>([]);
  const setAttempts = useCallback((list: Attempt[]) => { attemptsRef.current = list; setAttemptsState(list); }, []);
  const [focus, setFocus] = useState<Set<string | number> | null>(null);
  const storeRef = useRef<AttemptStore | null>(null);
  useEffect(() => {
    openAttemptStore().then(async (s) => { storeRef.current = s; setAttempts(await s.load()); });
  }, [setAttempts]);

  const { status: syncStatus, sync, signIn, signOut } = useSync(storeRef, attemptsRef, setAttempts);

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
      id: newId(), user_id: syncStatus.session?.user.id ?? null, set_id: a.set.id, case_id: String(a.case.id), mirrored: a.mirrored,
      auf: a.auf, recognition_ms: a.recognitionMs, rating: a.rating, created_at: new Date().toISOString(),
    };
    setAttempts([...attemptsRef.current, attempt]);
    void storeRef.current?.add(attempt).then(() => { if (syncStatus.session) void sync(); });
  }, [setAttempts, sync, syncStatus.session]);

  const trainer = useTrainer(set, settings, caseStates, onAttempt, focus);
  const { active, next, reveal, rate } = trainer;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.tagName === 'INPUT') return;
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
    if (confirm('Zerar pesos e tempos deste navegador?')) { setAttempts([]); void storeRef.current?.clear(); }
  };
  const trainCase = (id: string | number) => {
    const c = set.cases.find((x) => x.id === id);
    if (c) { trainer.start(c); setView('train'); }
  };
  const focusOn = (ids: (string | number)[]) => { setFocus(new Set(ids)); setView('train'); };

  return (
    <div className="app">
      <header>
        <h1>Treino {set.name}</h1>
        <span className="sub">
          {focus ? `só ${focus.size} casos` : `${selectedCases(set, settings).length} de ${set.cases.length} casos no sorteio`}
        </span>
      </header>
      <div className="tabs">
        {VIEWS.map((v) => (
          <button key={v.id} className={`tab${view === v.id ? ' on' : ''}`} onClick={() => setView(v.id)}>{v.label}</button>
        ))}
      </div>
      {view === 'train' && (
        <>
          {focus && (
            <div className="row focus">
              <span className="mini">Treinando só os casos {[...focus].join(', ')}.</span>
              <button className="chip" onClick={() => setFocus(null)}>voltar ao sorteio normal</button>
            </div>
          )}
          <Train active={active} settings={settings} caseState={active ? caseStates.get(active.case.id) : undefined} onRate={rate} />
        </>
      )}
      {view === 'progress' && (
        <Progress set={set} settings={settings} attempts={attempts} caseStates={caseStates} onTrain={trainCase} onFocus={focusOn} />
      )}
      {view === 'settings' && (
        <Settings set={set} settings={settings} onChange={updateSettings} onReset={reset}
          account={<Account status={syncStatus} pending={pendingOf(attempts).length} onSignIn={signIn} onSignOut={signOut} onSync={sync} />} />
      )}
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
