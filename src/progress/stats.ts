// Derived statistics for the Progress screen. Pure functions over attempts.
import type { Attempt, CaseState, Rating } from './model';
import type { AlgSet } from '../sets/types';
import { weightOf } from '../trainer/trainer';

export const SESSION_GAP_MS = 10 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export interface Session {
  start: string;
  end: string;
  count: number;
  avg_ms: number;
}

/** Groups attempts (sorted by time) into sessions split by gaps longer than 10 minutes. */
export function sessions(attempts: Attempt[]): Session[] {
  const sorted = [...attempts].sort((a, b) => a.created_at.localeCompare(b.created_at));
  const out: Session[] = [];
  let cur: Attempt[] = [];
  const flush = () => {
    if (!cur.length) return;
    out.push({
      start: cur[0].created_at,
      end: cur[cur.length - 1].created_at,
      count: cur.length,
      avg_ms: cur.reduce((s, a) => s + a.recognition_ms, 0) / cur.length,
    });
    cur = [];
  };
  for (const a of sorted) {
    if (cur.length && Date.parse(a.created_at) - Date.parse(cur[cur.length - 1].created_at) > SESSION_GAP_MS) flush();
    cur.push(a);
  }
  flush();
  return out;
}

export interface Window {
  count: number;
  avg_ms: number | null;
  /** Relative change of avg_ms against the preceding window of the same length; null when either is empty. */
  delta: number | null;
}

export function windowStats(attempts: Attempt[], days: number, now = Date.now()): Window {
  const from = now - days * DAY_MS;
  const prevFrom = from - days * DAY_MS;
  const inWin = (a: Attempt, lo: number, hi: number) => {
    const t = Date.parse(a.created_at);
    return t >= lo && t < hi;
  };
  const avg = (list: Attempt[]) => (list.length ? list.reduce((s, a) => s + a.recognition_ms, 0) / list.length : null);
  const cur = attempts.filter((a) => inWin(a, from, now + 1));
  const prev = attempts.filter((a) => inWin(a, prevFrom, from));
  const curAvg = avg(cur);
  const prevAvg = avg(prev);
  return { count: cur.length, avg_ms: curAvg, delta: curAvg !== null && prevAvg ? (curAvg - prevAvg) / prevAvg : null };
}

export interface SetSummary {
  seen: number;
  total: number;
  attempts: number;
  avg_ms: number | null;
  last7: Window;
  last30: Window;
}

export function setSummary(set: AlgSet, attempts: Attempt[], states: Map<string | number, CaseState>, now = Date.now()): SetSummary {
  const seen = set.cases.filter((c) => (states.get(c.id)?.seen_count ?? 0) > 0).length;
  const avg = attempts.length ? attempts.reduce((s, a) => s + a.recognition_ms, 0) / attempts.length : null;
  return { seen, total: set.cases.length, attempts: attempts.length, avg_ms: avg, last7: windowStats(attempts, 7, now), last30: windowStats(attempts, 30, now) };
}

export interface CaseRow {
  id: string | number;
  group: string;
  weight: number;
  attempts: number;
  avg_ms: number | null;
  last_rating: Rating | null;
  last_seen_at: string | null;
}

export function caseRows(set: AlgSet, states: Map<string | number, CaseState>): CaseRow[] {
  return set.cases.map((c) => {
    const cs = states.get(c.id);
    return {
      id: c.id,
      group: set.groups[c.group],
      weight: weightOf(cs),
      attempts: cs?.seen_count ?? 0,
      avg_ms: cs?.seen_count ? cs.total_ms / cs.seen_count : null,
      last_rating: cs?.last_rating ?? null,
      last_seen_at: cs?.last_seen_at ?? null,
    };
  });
}

/** The cases weighing most right now: heaviest first, then slowest. Only cases already seen. */
export function heaviest(rows: CaseRow[], n = 5): CaseRow[] {
  return rows
    .filter((r) => r.attempts > 0)
    .sort((a, b) => b.weight - a.weight || (b.avg_ms ?? 0) - (a.avg_ms ?? 0))
    .slice(0, n);
}
