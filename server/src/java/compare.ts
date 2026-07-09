import type { CompareMode, Json } from '../types.ts';

const EPS = 1e-5;

function isNum(v: Json): v is number { return typeof v === 'number'; }

function canonical(v: Json): string {
  if (Array.isArray(v)) return '[' + v.map(canonical).join(',') + ']';
  if (isNum(v)) return Number.isInteger(v) ? String(v) : v.toFixed(9);
  return JSON.stringify(v);
}

function deepEqual(a: Json, b: Json, epsilon: boolean): boolean {
  // LeetCode notation: an empty list/tree is written [] but a null reference
  // serializes to null — treat them as equal.
  if (a === null && Array.isArray(b) && b.length === 0) return true;
  if (b === null && Array.isArray(a) && a.length === 0) return true;
  if (a === null || b === null) return a === b;
  if (isNum(a) && isNum(b)) {
    if (epsilon) return Math.abs(a - b) <= EPS * Math.max(1, Math.abs(a), Math.abs(b));
    return a === b;
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((x, i) => deepEqual(x, b[i], epsilon));
  }
  return a === b;
}

/** Recursively sort nested arrays into a canonical order. */
function deepSort(v: Json): Json {
  if (!Array.isArray(v)) return v;
  const sorted = v.map(deepSort);
  sorted.sort((a, b) => (canonical(a) < canonical(b) ? -1 : canonical(a) > canonical(b) ? 1 : 0));
  return sorted;
}

/** Sort only the top-level array (elements canonicalized for ordering, not modified). */
function shallowSort(v: Json): Json {
  if (!Array.isArray(v)) return v;
  return [...v].sort((a, b) => (canonical(a) < canonical(b) ? -1 : canonical(a) > canonical(b) ? 1 : 0));
}

export function compareValues(expected: Json, actual: Json, mode: CompareMode = 'exact'): boolean {
  switch (mode) {
    case 'exact':
      return deepEqual(expected, actual, false);
    case 'epsilon':
      return deepEqual(expected, actual, true);
    case 'unordered':
      return deepEqual(shallowSort(expected), shallowSort(actual), false);
    case 'unordered-deep':
      return deepEqual(deepSort(expected), deepSort(actual), false);
    case 'set': {
      if (!Array.isArray(expected) || !Array.isArray(actual)) return false;
      const e = new Set(expected.map(canonical));
      const a = new Set(actual.map(canonical));
      return e.size === a.size && [...e].every((x) => a.has(x));
    }
  }
}

/** Whitespace-tolerant comparison for code-output exercises. */
export function normalizeOutput(s: string): string {
  return s
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.replace(/[ \t]+$/g, ''))
    .join('\n')
    .replace(/\n+$/g, '');
}

export function outputsMatch(expected: string, actual: string): boolean {
  return normalizeOutput(expected) === normalizeOutput(actual);
}
