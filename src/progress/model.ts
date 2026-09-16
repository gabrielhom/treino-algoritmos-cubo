// Progress data model. Attempts are append-only; everything else is derived from them.

export type Rating = 'easy' | 'ok' | 'hard';

export interface Attempt {
  id: string;
  user_id: string | null;
  set_id: string;
  case_id: string;
  mirrored: boolean;
  auf: string | null;
  recognition_ms: number;
  rating: Rating;
  created_at: string; // ISO
}

export interface CaseState {
  set_id: string;
  case_id: string;
  weight: number;
  seen_count: number;
  total_ms: number;
  last_rating: Rating;
  last_seen_at: string;
}

// Same rule as the prototype: score starts at 0, weight = 1 + score.
const MAX_SCORE = 12;
export function nextScore(score: number, rating: Rating): number {
  if (rating === 'easy') return Math.max(0, score - 1);
  if (rating === 'hard') return Math.min(MAX_SCORE, score + 2);
  return Math.max(0, score - 0.25);
}

export const caseKey = (setId: string, caseId: string | number) => `${setId}/${caseId}`;

/** Folds attempts (any order) into one CaseState per case. */
export function foldCaseStates(attempts: Attempt[]): Map<string, CaseState> {
  const sorted = [...attempts].sort((a, b) => a.created_at.localeCompare(b.created_at));
  const out = new Map<string, CaseState>();
  for (const a of sorted) {
    const key = caseKey(a.set_id, a.case_id);
    const prev = out.get(key);
    const score = prev ? prev.weight - 1 : 0;
    out.set(key, {
      set_id: a.set_id,
      case_id: a.case_id,
      weight: 1 + nextScore(score, a.rating),
      seen_count: (prev?.seen_count ?? 0) + 1,
      total_ms: (prev?.total_ms ?? 0) + a.recognition_ms,
      last_rating: a.rating,
      last_seen_at: a.created_at,
    });
  }
  return out;
}

/** CaseStates of one set, keyed by case id. */
export function statesForSet(all: Map<string, CaseState>, setId: string): Map<string | number, CaseState> {
  const out = new Map<string | number, CaseState>();
  for (const cs of all.values()) {
    if (cs.set_id !== setId) continue;
    out.set(cs.case_id, cs);
    const n = Number(cs.case_id);
    if (!Number.isNaN(n) && String(n) === cs.case_id) out.set(n, cs);
  }
  return out;
}

export function newId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
