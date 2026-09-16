// Local persistence. Attempts go to IndexedDB, with localStorage as fallback;
// settings always live in localStorage.
import type { Attempt, CaseMark } from './model';
import { DEFAULT_SETTINGS, type SetSettings } from '../trainer/trainer';

export interface AttemptStore {
  load(): Promise<Attempt[]>;
  add(a: Attempt): Promise<void>;
  addMany(list: Attempt[]): Promise<void>;
  clear(): Promise<void>;
  loadMarks(): Promise<CaseMark[]>;
  putMarks(list: CaseMark[]): Promise<void>;
}

const ATTEMPTS_KEY = 'cube-trainer:attempts';
const MARKS_KEY = 'cube-trainer:marks';

export const localAttemptStore: AttemptStore = {
  async load() {
    try {
      return JSON.parse(localStorage.getItem(ATTEMPTS_KEY) ?? '[]') as Attempt[];
    } catch {
      return [];
    }
  },
  async add(a) {
    await this.addMany([a]);
  },
  async addMany(list) {
    const all = await this.load();
    const byId = new Map(all.map((a) => [a.id, a]));
    for (const a of list) byId.set(a.id, a);
    localStorage.setItem(ATTEMPTS_KEY, JSON.stringify([...byId.values()]));
  },
  async clear() {
    localStorage.removeItem(ATTEMPTS_KEY);
  },
  async loadMarks() {
    try {
      return JSON.parse(localStorage.getItem(MARKS_KEY) ?? '[]') as CaseMark[];
    } catch {
      return [];
    }
  },
  async putMarks(list) {
    const byKey = new Map((await this.loadMarks()).map((m) => [m.key, m]));
    for (const m of list) byKey.set(m.key, m);
    localStorage.setItem(MARKS_KEY, JSON.stringify([...byKey.values()]));
  },
};

/** Picks IndexedDB when available and moves any localStorage attempts (phase 2 data) into it once. */
export async function openAttemptStore(): Promise<AttemptStore> {
  if (typeof indexedDB === 'undefined') return localAttemptStore;
  const { idbAttemptStore } = await import('./db');
  const legacy = await localAttemptStore.load();
  if (legacy.length) {
    await idbAttemptStore.addMany(legacy);
    await localAttemptStore.clear();
  }
  return idbAttemptStore;
}

export interface AppSettings {
  setId: string;
  sets: Record<string, SetSettings>;
}

const SETTINGS_KEY = 'cube-trainer:settings';

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return JSON.parse(raw) as AppSettings;
  } catch { /* ignore */ }
  return { setId: 'f2l', sets: {} };
}

export function saveSettings(s: AppSettings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  } catch { /* ignore */ }
}

export function settingsFor(app: AppSettings, setId: string): SetSettings {
  return app.sets[setId] ?? DEFAULT_SETTINGS;
}
