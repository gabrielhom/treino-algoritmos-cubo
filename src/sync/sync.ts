// Sync of attempts with Supabase. Attempts are append-only, so there are no conflicts:
// push what the server has not seen, pull what this device has not seen.
import type { Attempt } from '../progress/model';
import type { AttemptStore } from '../progress/store';

export type RemoteRow = Omit<Attempt, 'synced' | 'user_id'> & { user_id: string; synced_at?: string };

/** Minimal slice of the Supabase client the sync needs (keeps tests free of network). */
export interface SyncClient {
  upsert(rows: RemoteRow[]): Promise<void>;
  /** Rows stored on the server after `cursor` (server-side synced_at), oldest first, at most `limit`. */
  fetchAfter(userId: string, cursor: string | null, limit: number): Promise<RemoteRow[]>;
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
  cursor: string | null;
  pushed: number;
  pulled: number;
}

export async function syncOnce(
  client: SyncClient,
  store: AttemptStore,
  attempts: Attempt[],
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
  return { attempts: current, cursor: next, pushed: pending.length, pulled };
}
