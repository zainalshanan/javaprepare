import { useSyncExternalStore } from 'react';

export type Theme = 'dark' | 'light';

// Must match the key read by the inline script in index.html (which sets the theme before first paint).
const STORAGE_KEY = 'javaprepare-theme';
const listeners = new Set<() => void>();

export function getTheme(): Theme {
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
}

export function setTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  try { localStorage.setItem(STORAGE_KEY, theme); } catch { /* storage unavailable */ }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, getTheme);
}
