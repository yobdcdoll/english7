import type { AppState } from './types';

const STORAGE_KEY = 'english7.state.v1';

export function emptyState(): AppState {
  return {
    version: 1,
    childName: '',
    settings: { newPerWeek: 3, theme: 'default' },
    cards: {},
    sessions: [],
    baseline: null,
  };
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw) as Partial<AppState>;
    const base = emptyState();
    return {
      ...base,
      ...parsed,
      settings: { ...base.settings, ...(parsed.settings ?? {}) },
      cards: parsed.cards ?? {},
      sessions: parsed.sessions ?? [],
    };
  } catch {
    return emptyState();
  }
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage may be full or blocked; the session still works in memory.
  }
}
