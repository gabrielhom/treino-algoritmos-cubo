import { describe, expect, it } from 'vitest';
import { foldCaseStates, nextScore, type Attempt } from './model';

const at = (n: number, rating: Attempt['rating'], caseId = '1'): Attempt => ({
  id: String(n), user_id: null, set_id: 'f2l', case_id: caseId, mirrored: false, auf: null,
  recognition_ms: 1000 * n, rating, created_at: new Date(2026, 0, 1, 0, n).toISOString(),
});

describe('nextScore', () => {
  it('follows the prototype rule', () => {
    expect(nextScore(0, 'easy')).toBe(0);
    expect(nextScore(0, 'hard')).toBe(2);
    expect(nextScore(12, 'hard')).toBe(12);
    expect(nextScore(1, 'ok')).toBe(0.75);
    expect(nextScore(0, 'ok')).toBe(0);
  });
});

describe('foldCaseStates', () => {
  it('derives weight, count and time, independent of input order', () => {
    const attempts = [at(3, 'easy'), at(1, 'hard'), at(2, 'hard')];
    const cs = foldCaseStates(attempts).get('f2l/1')!;
    expect(cs.seen_count).toBe(3);
    expect(cs.total_ms).toBe(6000);
    expect(cs.weight).toBe(1 + 3); // 0 -> 2 -> 4 -> 3
    expect(cs.last_rating).toBe('easy');
  });
  it('keeps cases apart', () => {
    const m = foldCaseStates([at(1, 'ok'), at(2, 'ok', '7')]);
    expect(m.size).toBe(2);
  });
});
