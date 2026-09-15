Sliding window handles "best contiguous run" problems — longest substring with property X, max sum of a window — in O(n) by never re-examining elements. Two edges, `l` and `r`, both only move right.

## Variable-size window (the big one)

Grow the right edge every step; while the window is *invalid*, shrink from the left:

```java
int l = 0, best = 0;
for (int r = 0; r < n; r++) {
    // 1. add s.charAt(r) to the window state
    while (/* window [l..r] violates the rule */) {
        // 2. remove s.charAt(l) from the state
        l++;
    }
    // 3. window is valid — record it
    best = Math.max(best, r - l + 1);
}
```

"Window state" is usually a HashSet, a HashMap of counts, or an `int[26]`/`int[128]`. The magic: `l` only moves forward, so the total work of the inner while across the whole run is O(n), not O(n²).

### Watch it slide: longest substring without repeats, `"abcabcbb"`

```text
 r=0   [a]b c a b c b b           window "a"     len 1
 r=1   [a b]c a b c b b           window "ab"    len 2
 r=2   [a b c]a b c b b           window "abc"   len 3  ← best
 r=3    a[b c a]b c b b           'a' repeated → drop 'a', l=1   "bca"  len 3
 r=4    a b[c a b]c b b           'b' repeated → drop 'b', l=2   "cab"  len 3
 r=5    a b c[a b c]b b           'c' repeated → drop 'c', l=3   "abc"  len 3
 r=6    a b c a b[c b]b           'b' repeated → drop 'a','b', l=5   "cb"  len 2
 r=7    a b c a b c b[b]          'b' repeated → drop 'c','b', l=7   "b"   len 1
```

```java
Set<Character> window = new HashSet<>();
int l = 0, best = 0;
for (int r = 0; r < s.length(); r++) {
    char c = s.charAt(r);
    while (window.contains(c)) window.remove(s.charAt(l++));   // shrink until c is unique
    window.add(c);
    best = Math.max(best, r - l + 1);
}
```

@exercise pat-sw-mcq-len

@exercise pat-sw-fill-variable

## Fixed-size window

Sum of every k-length window, updated in O(1) per step: add the entering element, subtract the leaving one.

```java
int windowSum = 0;
for (int i = 0; i < k; i++) windowSum += nums[i];   // first window
int best = windowSum;
for (int r = k; r < n; r++) {
    windowSum += nums[r] - nums[r - k];   // slide: enter r, leave r-k
    best = Math.max(best, windowSum);
}
```

### Fixed window of counts: Permutation in String

"Does `s2` contain a permutation of `s1`?" = is there a window of length `s1.length()` in `s2` with the same letter counts?

```java
if (s1.length() > s2.length()) return false;
int[] need = new int[26], win = new int[26];
int k = s1.length();
for (int i = 0; i < k; i++) {
    need[s1.charAt(i) - 'a']++;
    win[s2.charAt(i) - 'a']++;
}
if (Arrays.equals(need, win)) return true;
for (int r = k; r < s2.length(); r++) {
    win[s2.charAt(r) - 'a']++;          // enter
    win[s2.charAt(r - k) - 'a']--;      // leave
    if (Arrays.equals(need, win)) return true;
}
return false;
```

`Arrays.equals` on two `int[26]` is O(26) = O(1), so this is O(n). (A faster variant keeps a `matches` counter of how many of the 26 slots agree and updates it on each enter/leave.)

## Minimum window: `need` / `have` counting

Minimum Window Substring flips the loop: **expand until valid, then shrink while still valid**, recording the best inside the while.

```java
int[] need = new int[128];
for (char c : t.toCharArray()) need[c]++;
int required = t.length();         // chars of t still missing from the window
int l = 0, bestLen = Integer.MAX_VALUE, bestStart = 0;
for (int r = 0; r < s.length(); r++) {
    if (need[s.charAt(r)]-- > 0) required--;     // this char was actually needed
    while (required == 0) {                       // window covers t
        if (r - l + 1 < bestLen) { bestLen = r - l + 1; bestStart = l; }
        if (++need[s.charAt(l)] > 0) required++;  // removing it breaks coverage
        l++;
    }
}
return bestLen == Integer.MAX_VALUE ? "" : s.substring(bestStart, bestStart + bestLen);
```

`need[c]` goes negative for surplus characters; only when it climbs back above 0 did the window lose something it needed. (The "two maps, `have` vs `need` counts" version is the same idea spelled out.)

## The `maxFreq` trick: character replacement

Longest Repeating Character Replacement: a window is valid if `windowLen - (count of its most frequent char) <= k` — the other chars are the ones you'd replace.

```java
int[] count = new int[26];
int l = 0, maxFreq = 0, best = 0;
for (int r = 0; r < s.length(); r++) {
    maxFreq = Math.max(maxFreq, ++count[s.charAt(r) - 'A']);
    while ((r - l + 1) - maxFreq > k) {
        count[s.charAt(l) - 'A']--;
        l++;
    }
    best = Math.max(best, r - l + 1);
}
```

`maxFreq` is never decreased when shrinking. That's fine: a stale, too-high `maxFreq` can only keep the window at its previous size, never produce a longer-than-real answer — `best` only grows when a genuinely higher frequency appears.

## Monotonic deque: Sliding Window Maximum

Keep a deque of **indices** whose values are decreasing front → back. The front is always the window's max.

```java
Deque<Integer> dq = new ArrayDeque<>();
int[] res = new int[n - k + 1];
for (int r = 0; r < n; r++) {
    while (!dq.isEmpty() && nums[dq.peekLast()] < nums[r]) dq.pollLast();  // smaller ones can never be max
    dq.offerLast(r);
    if (dq.peekFirst() <= r - k) dq.pollFirst();                           // front slid out of window
    if (r >= k - 1) res[r - k + 1] = nums[dq.peekFirst()];
}
```

Trace `nums = [1, 3, -1, -3, 5, 3, 6, 7]`, `k = 3` (deque shows `index:value`):

| `r` | `nums[r]` | `pollLast` (smaller) | `pollFirst` (out of window) | deque after | window max |
| --- | --- | --- | --- | --- | --- |
| 0 | 1 | — | — | `0:1` | |
| 1 | 3 | `0:1` | — | `1:3` | |
| 2 | -1 | — | — | `1:3, 2:-1` | 3 |
| 3 | -3 | — | — | `1:3, 2:-1, 3:-3` | 3 |
| 4 | 5 | `3:-3, 2:-1, 1:3` | — | `4:5` | 5 |
| 5 | 3 | — | — | `4:5, 5:3` | 5 |
| 6 | 6 | `5:3, 4:5` | — | `6:6` | 6 |
| 7 | 7 | `6:6` | — | `7:7` | 7 |

Result `[3, 3, 5, 5, 6, 7]`. Each index enters and leaves the deque once: O(n).

@exercise pat-sw-mcq-deque

## Drill the shapes

@exercise pat-sw-drill-fixed

@exercise pat-sw-drill-minlen

## Apply it

| Technique | Problems (easy → hard) |
| --- | --- |
| Running min as the left edge | Best Time to Buy and Sell Stock |
| Variable window + set/counts | Longest Substring Without Repeating Characters |
| Variable window + `maxFreq` | Longest Repeating Character Replacement |
| Fixed window + `int[26]` | Permutation in String |
| Expand/shrink with `need` counts | Minimum Window Substring |
| Monotonic deque | Sliding Window Maximum |

## Recap

- Length of `[l..r]` is `r - l + 1`.
- Variable: add `r`; `while (invalid)` remove `l++`; record.
- Fixed k: add `nums[r]`, remove `nums[r - k]`; letter windows compare `int[26]`s.
- Minimum window: record the answer **inside** the shrink loop.
- Replacement: valid iff `len - maxFreq <= k`.
- Window max: deque of indices, `pollLast` smaller, `pollFirst` when `<= r - k`.
