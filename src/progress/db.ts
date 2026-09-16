// IndexedDB store for attempts. One object store keyed by attempt id.
// ponytail: whole store is loaded into memory on start; add an index if attempts pass ~100k.
import type { Attempt } from './model';
import type { AttemptStore } from './store';

const DB_NAME = 'cube-trainer';
const STORE = 'attempts';

function req<T>(r: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}

function done(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

let dbPromise: Promise<IDBDatabase> | null = null;
function open(): Promise<IDBDatabase> {
  if (!dbPromise) {
    const r = indexedDB.open(DB_NAME, 1);
    r.onupgradeneeded = () => {
      if (!r.result.objectStoreNames.contains(STORE)) r.result.createObjectStore(STORE, { keyPath: 'id' });
    };
    dbPromise = req(r);
  }
  return dbPromise;
}

export const idbAttemptStore: AttemptStore & { addMany(list: Attempt[]): Promise<void>; update(a: Attempt): Promise<void> } = {
  async load() {
    const db = await open();
    return req(db.transaction(STORE, 'readonly').objectStore(STORE).getAll()) as Promise<Attempt[]>;
  },
  async add(a) {
    await this.addMany([a]);
  },
  async addMany(list) {
    if (!list.length) return;
    const db = await open();
    const tx = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    for (const a of list) store.put(a);
    await done(tx);
  },
  async update(a) {
    await this.addMany([a]);
  },
  async clear() {
    const db = await open();
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).clear();
    await done(tx);
  },
};

/** Resets the cached connection (tests). */
export function resetDbForTests() {
  dbPromise = null;
}
