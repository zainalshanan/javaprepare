/**
 * Deterministic per-exercise option shuffle.
 *
 * All MCQs are authored with the correct answer at index 0. To avoid the
 * "the answer is always A" pattern, options are shuffled by a hash of the
 * exercise id — random-looking, but stable across requests (so a reload keeps
 * the same order and grading stays a pure function of the id). The permutation
 * is applied when sending options to the client and reversed when grading.
 */

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Returns a permutation `order` where `order[displayIndex] = originalIndex`. */
export function optionOrder(id: string, n: number): number[] {
  const rng = mulberry32(hashString(id));
  const arr = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
