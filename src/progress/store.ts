// Local persistence. Attempts live in localStorage for now; settings always do.
// ponytail: localStorage store, swap for IndexedDB in phase 3 (same interface).
import type { Attempt } from './model';
import { DEFAULT_SETTINGS, type SetSettings } from '../trainer/trainer';

export interface AttemptStore {
  load(): Promise<Attempt[]>;
  add(a: Attempt): Promise<void>;
  clear(): Promise<void>;
}

const ATTEMPTS_KEY = 'cube-trainer:attempts';

export const localAttemptStore: AttemptStore = {
  async load() {
    try {
      return JSON.parse(localStorage.getItem(ATTEMPTS_KEY) ?? '[]') as Attempt[];
    } catch {
      return [];
    }
  },
  async add(a) {
    const all = await this.load();
    all.push(a);
    localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(all));
  },
  async clear() {
    localStorage.removeItem(ATTEMPTS_KEY);
  },
};

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
