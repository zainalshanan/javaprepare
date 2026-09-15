import { useSyncExternalStore } from 'react';

/** Single shared source for the header "reviews due" badge. */
let count = 0;
let version = 0;
const listeners = new Set<() => void>();

function apply(n: number) {
  if (n === count) return;
  count = n;
  listeners.forEach((l) => l());
}

/** Push a known-fresh value (e.g. from a submit response); supersedes any in-flight refresh. */
export function setDueCount(n: number) {
  version++;
  apply(n);
}

/** Runs a fetch and applies its result only if nothing newer arrived meanwhile. */
export async function refreshDueCountWith(fetchCount: () => Promise<number>) {
  const mine = ++version;
  try {
    const n = await fetchCount();
    if (mine === version) apply(n);
  } catch { /* server unreachable: keep last value */ }
}

export function useDueCount(): number {
  return useSyncExternalStore(
    (l) => { listeners.add(l); return () => { listeners.delete(l); }; },
    () => count,
  );
}
