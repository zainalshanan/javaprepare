Two pointers turns "check all pairs" O(n²) into O(n) — when the data has **structure** (usually: it's sorted, or it's symmetric) that tells you which pointer to move.

## Template: converging pointers

```java
int l = 0, r = n - 1;
while (l < r) {
    int sum = nums[l] + nums[r];
    if (sum == target) return new int[]{l, r};
    else if (sum < target) l++;   // need bigger: only l++ can increase the sum
    else r--;                     // need smaller: only r-- can decrease it
}
```

### Why it's safe to discard

Sorted `nums = [1, 3, 4, 6, 8, 11]`, `target = 10`:

```text
 step 1:  [ 1   3   4   6   8  11 ]     1 + 11 = 12 > 10  → r--
            l                   r        11 is too big even with the smallest → discard 11

 step 2:  [ 1   3   4   6   8 | 11 ]    1 + 8 = 9 < 10    → l++
            l               r            1 is too small even with the largest left → discard 1

 step 3:    1 | 3   4   6   8 | 11      3 + 8 = 11 > 10   → r--
                l           r

 step 4:    1 | 3   4   6 | 8   11      3 + 6 = 9 < 10    → l++
                l       r

 step 5:    1   3 | 4   6 | 8   11      4 + 6 = 10  ✓  return [2, 3]
                    l   r
```

Everything outside the `|` bars has been **proven** useless: if `nums[l] + nums[r]` is too small, `r` was already the biggest partner `l` could get, so `l` pairs with nothing. Each step eliminates one index forever → O(n).

## The palindrome variant

```java
int l = 0, r = s.length() - 1;
while (l < r) {
    while (l < r && !Character.isLetterOrDigit(s.charAt(l))) l++;   // skip junk
    while (l < r && !Character.isLetterOrDigit(s.charAt(r))) r--;
    if (Character.toLowerCase(s.charAt(l)) != Character.toLowerCase(s.charAt(r))) return false;
    l++; r--;
}
return true;
```

@exercise pat-tp-mcq-why

@exercise pat-tp-fill-converge

## 3Sum: sort + fix one + two pointers + skip duplicates

Fix `nums[i]`, then run Two Sum II on the rest looking for `-nums[i]`. Sorting makes both the pointer moves and the duplicate-skipping possible.

```java
Arrays.sort(nums);
List<List<Integer>> res = new ArrayList<>();
for (int i = 0; i < nums.length - 2; i++) {
    if (i > 0 && nums[i] == nums[i - 1]) continue;       // same anchor as last time → same triples
    int l = i + 1, r = nums.length - 1;
    while (l < r) {
        int sum = nums[i] + nums[l] + nums[r];
        if (sum < 0) l++;
        else if (sum > 0) r--;
        else {
            res.add(List.of(nums[i], nums[l], nums[r]));
            l++; r--;
            while (l < r && nums[l] == nums[l - 1]) l++;  // skip repeated middles
            while (l < r && nums[r] == nums[r + 1]) r--;  // skip repeated ends
        }
    }
}
```

Three duplicate guards, three places: the anchor (`i`), and both pointers **after** a hit. O(n²) time — the sort's O(n log n) is dominated.

## Container With Most Water: move the shorter side

Area = `min(h[l], h[r]) * (r - l)`. Start with the widest container. Which pointer do you move?

```java
int l = 0, r = h.length - 1, best = 0;
while (l < r) {
    best = Math.max(best, Math.min(h[l], h[r]) * (r - l));
    if (h[l] < h[r]) l++;
    else r--;
}
```

The argument: suppose `h[l] < h[r]`. Every other container using `l` is **narrower**, and its height is still capped by `h[l]`. So none can beat the one we just measured — `l` is done, discard it. Moving the taller side instead can never help, because the short side still caps the height while width shrinks.

@exercise pat-tp-mcq-water

## Trapping Rain Water: leftMax / rightMax

Water above bar `i` = `min(maxLeft, maxRight) - h[i]`. With two pointers you only need the **smaller** side's max, because that side is the bottleneck:

```java
int l = 0, r = h.length - 1, leftMax = 0, rightMax = 0, water = 0;
while (l < r) {
    if (h[l] < h[r]) {
        leftMax = Math.max(leftMax, h[l]);
        water += leftMax - h[l];     // right side has a wall >= h[r] > h[l], so leftMax decides
        l++;
    } else {
        rightMax = Math.max(rightMax, h[r]);
        water += rightMax - h[r];
        r--;
    }
}
```

Trace `h = [3, 0, 2, 0, 4]`:

| `l` | `r` | `h[l]` vs `h[r]` | side | max after | water added | total |
| --- | --- | --- | --- | --- | --- | --- |
| 0 | 4 | 3 < 4 | left | leftMax=3 | 3-3 = 0 | 0 |
| 1 | 4 | 0 < 4 | left | leftMax=3 | 3-0 = 3 | 3 |
| 2 | 4 | 2 < 4 | left | leftMax=3 | 3-2 = 1 | 4 |
| 3 | 4 | 0 < 4 | left | leftMax=3 | 3-0 = 3 | 7 |
| 4 | 4 | — | stop | | | **7** |

## Same-direction variant (slow & fast)

Both pointers move rightward: `slow` marks where the next kept element goes, `fast` scans. That's in-place dedup/removal (Remove Duplicates, Move Zeroes):

```java
int slow = 0;
for (int fast = 0; fast < n; fast++) {
    if (/* keep nums[fast] */) {
        nums[slow++] = nums[fast];
    }
}
```

@exercise pat-tp-drill-pal

@exercise pat-tp-drill-dedup

## Apply it

| Technique | Problems (easy → hard) |
| --- | --- |
| Converging, symmetric check | Valid Palindrome |
| Converging on a sorted array | Two Sum II |
| Sort + fix one + converging + dedup | 3Sum |
| Converging, move the shorter side | Container With Most Water |
| Converging with leftMax / rightMax | Trapping Rain Water |

## Recap

- Sorted + pair condition → `l = 0, r = n-1`, move the pointer that can fix the sum.
- Every move must discard an index you can **prove** is useless.
- 3Sum: sort, `if (i > 0 && nums[i] == nums[i-1]) continue;`, skip dups after each hit.
- Max area: always move the shorter wall.
- Rain water: process the lower side; `water += sideMax - h[side]`.
