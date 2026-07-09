Sliding window handles "best contiguous run" problems — longest substring with property X, max sum of a window — in O(n) by never re-examining elements.

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

## Variable-size window (the big one)

Grow the right edge every step; while the window is *invalid*, shrink from the left:

```java
int l = 0, best = 0;
for (int r = 0; r < n; r++) {
    // 1. add nums[r] / s.charAt(r) to the window state
    while (/* window [l..r] violates the rule */) {
        // 2. remove nums[l] from the state
        l++;
    }
    // 3. window is valid — record it
    best = Math.max(best, r - l + 1);
}
```

"Window state" is usually a HashMap of counts or a HashSet. The magic: `l` only moves forward, so the total work of the inner while across the whole run is O(n), not O(n²).

@exercise pat-sw-mcq-len

@exercise pat-sw-drill-fixed

@exercise pat-sw-drill-minlen

Apply it: Best Time to Buy and Sell Stock, Longest Substring Without Repeating Characters, Longest Repeating Character Replacement.
