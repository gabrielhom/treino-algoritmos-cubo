import { useCallback, useEffect, useRef, useState } from 'react';
import type { AlgCase, AlgSet } from '../sets/types';
import type { CaseState, Rating } from '../progress/model';
import { buildCase, pickCase, selectedCases, type ActiveCase, type SetSettings, type Slot } from './trainer';

export interface AttemptInput {
  set: AlgSet;
  case: AlgCase;
  mirrored: boolean;
  auf: string | null;
  recognitionMs: number;
  rating: Rating;
}

export function useTrainer(
  set: AlgSet,
  settings: SetSettings,
  caseStates: Map<string | number, CaseState>,
  onAttempt: (a: AttemptInput) => void,
) {
  const [active, setActive] = useState<ActiveCase | null>(null);
  const lastId = useRef<string | number | null>(null);
  const statesRef = useRef(caseStates);
  statesRef.current = caseStates;

  const start = useCallback((c: AlgCase, forceSlot?: Slot) => {
    lastId.current = c.id;
    setActive(buildCase(set, c, settings, forceSlot));
  }, [set, settings]);

  const next = useCallback(() => {
    const c = pickCase(selectedCases(set, settings), statesRef.current, lastId.current);
    if (!c) { setActive(null); return; }
    start(c);
  }, [set, settings, start]);

  const reveal = useCallback(() => {
    setActive((a) => (!a || a.revealed ? a : { ...a, revealed: true, elapsedMs: performance.now() - a.startedAt }));
  }, []);

  const rate = useCallback((rating: Rating) => {
    if (!active || !active.revealed) return;
    onAttempt({
      set: active.set, case: active.case, mirrored: active.mirrored, auf: active.postAuf,
      recognitionMs: Math.round(active.elapsedMs), rating,
    });
    next();
  }, [active, next, onAttempt]);

  // Re-pick when the set or the selected groups no longer include the current case.
  useEffect(() => {
    const pool = selectedCases(set, settings);
    if (!active || active.set.id !== set.id || !pool.some((c) => c.id === active.case.id)) next();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [set, settings.groups]);

  return { active, next, reveal, rate, start };
}
