import { describe, expect, it } from 'vitest';
import { f2l } from '../sets/f2l';
import { foldCaseStates, statesForSet, type Attempt } from './model';
import { caseRows, heaviest, sessions, setSummary, windowStats } from './stats';

const T0 = Date.parse('2026-09-16T12:00:00.000Z');
const at = (offsetMin: number, ms: number, caseId = '1', rating: Attempt['rating'] = 'ok'): Attempt => ({
  id: `${offsetMin}-${caseId}`, user_id: null, set_id: 'f2l', case_id: caseId, mirrored: false, auf: null,
  recognition_ms: ms, rating, created_at: new Date(T0 + offsetMin * 60_000).toISOString(),
});

describe('sessions', () => {
  it('splits on gaps longer than 10 minutes', () => {
    const s = sessions([at(0, 1000), at(5, 3000), at(16, 2000), at(20, 2000), at(200, 5000)]);
    expect(s.map((x) => x.count)).toEqual([2, 2, 1]);
    expect(s[0].avg_ms).toBe(2000);
    expect(s[2].avg_ms).toBe(5000);
  });
  it('is empty for no attempts', () => {
    expect(sessions([])).toEqual([]);
  });
});

describe('windowStats', () => {
  it('compares the last N days with the N days before', () => {
    const now = T0 + 60_000;
    const day = 24 * 60;
    const attempts = [at(-1 * day, 2000), at(-2 * day, 2000), at(-9 * day, 4000), at(-40 * day, 9000)];
    const w7 = windowStats(attempts, 7, now);
    expect(w7.count).toBe(2);
    expect(w7.avg_ms).toBe(2000);
    expect(w7.delta).toBeCloseTo(-0.5);
    const w30 = windowStats(attempts, 30, now);
    expect(w30.count).toBe(3);
    expect(w30.delta).toBeCloseTo((8000 / 3 - 9000) / 9000);
  });
  it('has no delta without a previous window', () => {
    expect(windowStats([at(0, 1000)], 7, T0 + 1).delta).toBeNull();
  });
});

describe('set summary and case rows', () => {
  const attempts = [at(0, 1000, '1', 'hard'), at(1, 3000, '1', 'hard'), at(2, 2000, '7', 'easy'), at(3, 8000, '12', 'hard')];
  const states = statesForSet(foldCaseStates(attempts), 'f2l');
  it('counts seen cases and averages', () => {
    const s = setSummary(f2l, attempts, states, T0 + 60_000 * 5);
    expect(s.seen).toBe(3);
    expect(s.total).toBe(41);
    expect(s.avg_ms).toBe(3500);
    expect(s.last7.count).toBe(4);
  });
  it('ranks the heaviest seen cases first', () => {
    const rows = caseRows(f2l, states);
    expect(rows).toHaveLength(41);
    const top = heaviest(rows, 5);
    expect(top.map((r) => r.id)).toEqual([1, 12, 7]); // 5, 3, 1
    expect(top[0].avg_ms).toBe(2000);
    expect(top[0].last_rating).toBe('hard');
  });
});
