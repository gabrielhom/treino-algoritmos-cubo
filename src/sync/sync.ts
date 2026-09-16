// Sync of attempts with Supabase. Attempts are append-only, so there are no conflicts:
// push what the server has not seen, pull what this device has not seen.
import { mergeMarks, type Attempt, type CaseMark } from '../progress/model';
import type { AttemptStore } from '../progress/store';

export type RemoteRow = Omit<Attempt, 'synced' | 'user_id'> & { user_id: string; synced_at?: string };
export type RemoteMark = Omit<CaseMark, 'synced' | 'user_id' | 'key'> & { user_id: string };

/** Minimal slice of the Supabase client the sync needs (keeps tests free of network). */
export interface SyncClient {
  upsert(rows: RemoteRow[]): Promise<void>;
  /** Rows stored on the server after `cursor` (server-side synced_at), oldest first, at most `limit`. */
  fetchAfter(userId: string, cursor: string | null, limit: number): Promise<RemoteRow[]>;
  upsertMarks(rows: RemoteMark[]): Promise<void>;
  fetchMarks(userId: string): Promise<RemoteMark[]>;
}

export const BATCH = 500;

export const pendingOf = (attempts: Attempt[]) => attempts.filter((a) => !a.synced);

export function toRow(a: Attempt, userId: string): RemoteRow {
  const { synced: _synced, user_id: _uid, ...rest } = a;
  return { ...rest, user_id: userId };
}

export function fromRow(r: RemoteRow): Attempt {
  const { synced_at: _s, ...rest } = r;
  return { ...rest, synced: true };
}

export function markToRow(m: CaseMark, userId: string): RemoteMark {
  return { user_id: userId, set_id: m.set_id, case_id: m.case_id, status: m.status, updated_at: m.updated_at };
}
export function markFromRow(r: RemoteMark): CaseMark {
  return { key: `${r.set_id}/${r.case_id}`, user_id: r.user_id, set_id: r.set_id, case_id: r.case_id, status: r.status, updated_at: r.updated_at, synced: true };
}

/** Adds remote attempts missing locally and marks local copies of known ones as synced. */
export function mergeRemote(local: Attempt[], remote: Attempt[]): { merged: Attempt[]; changed: Attempt[] } {
  const byId = new Map(local.map((a) => [a.id, a]));
  const changed: Attempt[] = [];
  for (const r of remote) {
    const cur = byId.get(r.id);
    if (!cur) { byId.set(r.id, r); changed.push(r); }
    else if (!cur.synced) { const upd = { ...cur, user_id: r.user_id, synced: true }; byId.set(r.id, upd); changed.push(upd); }
  }
  return { merged: [...byId.values()], changed };
}

export interface SyncResult {
  attempts: Attempt[];
  marks: CaseMark[];
  cursor: string | null;
  pushed: number;
  pulled: number;
}

/** Marks are few (one per case): pull all, newest wins, then push the local ones that survived. */
export async function syncMarks(client: SyncClient, store: AttemptStore, marks: CaseMark[], userId: string): Promise<CaseMark[]> {
  const remote = (await client.fetchMarks(userId)).map(markFromRow);
  const { merged, changed } = mergeMarks(marks, remote);
  await store.putMarks(changed);
  const pending = merged.filter((m) => !m.synced);
  if (!pending.length) return merged;
  await client.upsertMarks(pending.map((m) => markToRow(m, userId)));
  const marked = pending.map((m) => ({ ...m, user_id: userId, synced: true }));
  await store.putMarks(marked);
  const byKey = new Map(marked.map((m) => [m.key, m]));
  return merged.map((m) => byKey.get(m.key) ?? m);
}

export async function syncOnce(
  client: SyncClient,
  store: AttemptStore,
  attempts: Attempt[],
  marks: CaseMark[],
  userId: string,
  cursor: string | null,
): Promise<SyncResult> {
  // Push
  const pending = pendingOf(attempts);
  let current = attempts;
  for (let i = 0; i < pending.length; i += BATCH) {
    const batch = pending.slice(i, i + BATCH);
    await client.upsert(batch.map((a) => toRow(a, userId)));
    const marked = batch.map((a) => ({ ...a, user_id: userId, synced: true }));
    await store.addMany(marked);
    const ids = new Set(batch.map((a) => a.id));
    current = current.map((a) => (ids.has(a.id) ? marked.find((m) => m.id === a.id)! : a));
  }
  // Pull
  let pulled = 0;
  let next = cursor;
  for (;;) {
    const rows = await client.fetchAfter(userId, next, BATCH);
    if (!rows.length) break;
    const { merged, changed } = mergeRemote(current, rows.map(fromRow));
    await store.addMany(changed);
    current = merged;
    pulled += changed.length;
    next = rows[rows.length - 1].synced_at ?? next;
    if (rows.length < BATCH) break;
  }
  const mergedMarks = await syncMarks(client, store, marks, userId);
  return { attempts: current, marks: mergedMarks, cursor: next, pushed: pending.length, pulled };
}
