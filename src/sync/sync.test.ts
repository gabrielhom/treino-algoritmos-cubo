import { describe, expect, it } from 'vitest';
import type { Attempt } from '../progress/model';
import { localAttemptStore } from '../progress/store';
import { mergeRemote, pendingOf, syncOnce, toRow, type RemoteMark, type RemoteRow, type SyncClient } from './sync';
import type { CaseMark } from '../progress/model';

const at = (id: string, synced?: boolean): Attempt => ({
  id, user_id: null, set_id: 'f2l', case_id: '1', mirrored: false, auf: null,
  recognition_ms: 1000, rating: 'ok', created_at: `2026-09-1${id.length}T10:00:00.000Z`, synced,
});

// In-memory server: stores rows and stamps synced_at in insertion order.
function fakeServer(initial: RemoteRow[] = []) {
  const rows: RemoteRow[] = initial.map((r, i) => ({ ...r, synced_at: `s${String(i).padStart(4, '0')}` }));
  let n = rows.length;
  const marks: RemoteMark[] = [];
  const client: SyncClient = {
    async upsert(list) {
      for (const r of list) if (!rows.some((x) => x.id === r.id)) rows.push({ ...r, synced_at: `s${String(n++).padStart(4, '0')}` });
    },
    async fetchAfter(userId, cursor, limit) {
      return rows.filter((r) => r.user_id === userId && (!cursor || r.synced_at! > cursor)).slice(0, limit);
    },
    async upsertMarks(list) {
      for (const m of list) {
        const i = marks.findIndex((x) => x.user_id === m.user_id && x.set_id === m.set_id && x.case_id === m.case_id);
        if (i >= 0) marks[i] = m; else marks.push(m);
      }
    },
    async fetchMarks(userId) {
      return marks.filter((m) => m.user_id === userId);
    },
  };
  return { client, rows, marks };
}
const mark = (caseId: string, status: CaseMark['status'], updated: string, synced?: boolean): CaseMark => ({
  key: `f2l/${caseId}`, user_id: null, set_id: 'f2l', case_id: caseId, status, updated_at: updated, synced,
});

// localStorage stand-in for node.
const mem = new Map<string, string>();
globalThis.localStorage = {
  getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, v),
  removeItem: (k: string) => void mem.delete(k), clear: () => mem.clear(), key: () => null, length: 0,
} as Storage;

describe('helpers', () => {
  it('pendingOf keeps only unsynced attempts', () => {
    expect(pendingOf([at('a'), at('b', true), at('c', false)]).map((a) => a.id)).toEqual(['a', 'c']);
  });
  it('toRow drops the local flag and sets the user', () => {
    const row = toRow(at('a'), 'u1');
    expect(row).not.toHaveProperty('synced');
    expect(row.user_id).toBe('u1');
  });
  it('mergeRemote adds missing and marks known as synced, without duplicates', () => {
    const { merged, changed } = mergeRemote([at('a'), at('b', true)], [{ ...at('a'), user_id: 'u1', synced: true }, { ...at('c'), synced: true }]);
    expect(merged.map((a) => a.id).sort()).toEqual(['a', 'b', 'c']);
    expect(changed.map((a) => a.id).sort()).toEqual(['a', 'c']);
    expect(merged.find((a) => a.id === 'a')!.synced).toBe(true);
  });
});

describe('syncOnce', () => {
  it('pushes pending, pulls missing, and is idempotent', async () => {
    await localAttemptStore.clear();
    const local = [at('a'), at('bb', true)];
    await localAttemptStore.addMany(local);
    const { client, rows } = fakeServer([toRow(at('bb'), 'u1'), toRow(at('ccc'), 'u1'), toRow(at('dddd'), 'other')]);

    const r1 = await syncOnce(client, localAttemptStore, local, [], 'u1', null);
    expect(r1.pushed).toBe(1);
    expect(r1.pulled).toBe(1); // ccc; bb was already synced locally
    expect(r1.attempts.map((a) => a.id).sort()).toEqual(['a', 'bb', 'ccc']);
    expect(r1.attempts.every((a) => a.synced)).toBe(true);
    expect(rows.map((r) => r.id).sort()).toEqual(['a', 'bb', 'ccc', 'dddd']);
    expect((await localAttemptStore.load()).find((a) => a.id === 'a')!.user_id).toBe('u1');

    const r2 = await syncOnce(client, localAttemptStore, r1.attempts, r1.marks, 'u1', r1.cursor);
    expect(r2.pushed).toBe(0);
    expect(r2.pulled).toBe(0);
    expect(r2.attempts).toHaveLength(3);
  });

  it('marks: pushes local, pulls remote, newest wins', async () => {
    await localAttemptStore.clear();
    localStorage.removeItem('cube-trainer:marks');
    const { client, marks: server } = fakeServer();
    server.push({ user_id: 'u1', set_id: 'f2l', case_id: '2', status: 'known', updated_at: '2026-09-10T00:00:00.000Z' });
    server.push({ user_id: 'u1', set_id: 'f2l', case_id: '3', status: 'learning', updated_at: '2026-09-12T00:00:00.000Z' });
    const local = [mark('1', 'learning', '2026-09-11T00:00:00.000Z'), mark('3', 'known', '2026-09-11T00:00:00.000Z')];
    const r = await syncOnce(client, localAttemptStore, [], local, 'u1', null);
    const by = Object.fromEntries(r.marks.map((m) => [m.case_id, m.status]));
    expect(by).toEqual({ '1': 'learning', '2': 'known', '3': 'learning' }); // remote 3 is newer
    expect(r.marks.every((m) => m.synced)).toBe(true);
    expect(server.find((m) => m.case_id === '1')!.status).toBe('learning');
  });
});
