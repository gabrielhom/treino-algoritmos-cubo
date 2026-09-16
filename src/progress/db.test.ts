import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { idbAttemptStore, resetDbForTests } from './db';
import type { Attempt } from './model';

const at = (id: string): Attempt => ({
  id, user_id: null, set_id: 'f2l', case_id: '1', mirrored: false, auf: null,
  recognition_ms: 1200, rating: 'ok', created_at: '2026-09-16T10:00:00.000Z',
});

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory();
  resetDbForTests();
});

describe('idbAttemptStore', () => {
  it('starts empty, adds, updates in place and clears', async () => {
    expect(await idbAttemptStore.load()).toEqual([]);
    await idbAttemptStore.add(at('a'));
    await idbAttemptStore.addMany([at('b'), at('c')]);
    expect((await idbAttemptStore.load()).map((a) => a.id).sort()).toEqual(['a', 'b', 'c']);
    await idbAttemptStore.update({ ...at('b'), rating: 'hard' });
    const all = await idbAttemptStore.load();
    expect(all).toHaveLength(3);
    expect(all.find((a) => a.id === 'b')!.rating).toBe('hard');
    await idbAttemptStore.clear();
    expect(await idbAttemptStore.load()).toEqual([]);
  });
  it('stores marks by key, upserting', async () => {
    const mark = { key: 'f2l/1', user_id: null, set_id: 'f2l', case_id: '1', status: 'learning' as const, updated_at: '2026-09-16T10:00:00.000Z' };
    await idbAttemptStore.putMarks([mark]);
    await idbAttemptStore.putMarks([{ ...mark, status: 'known' }]);
    const all = await idbAttemptStore.loadMarks();
    expect(all).toHaveLength(1);
    expect(all[0].status).toBe('known');
  });
});
