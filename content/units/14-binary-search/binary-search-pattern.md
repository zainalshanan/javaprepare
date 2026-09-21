Binary search halves the search space each step: O(log n). It applies far beyond "find x in a sorted array" — all it needs is a question whose answer flips **once** across the range (no, no, no, yes, yes).

## Form 1: find a target

```java
int l = 0, r = nums.length - 1;
while (l <= r) {                        // <= : the space can shrink to one element
    int mid = l + (r - l) / 2;          // overflow-safe midpoint
    if (nums[mid] == target) return mid;
    else if (nums[mid] < target) l = mid + 1;
    else r = mid - 1;
}
return -1;
```

Memorize the trio: `l <= r`, `mid + 1`, `mid - 1`. Off-by-ones here cause infinite loops.

Trace `target = 7` in `nums = {1, 3, 5, 7, 9, 11}`:

| step | `l` | `r` | `mid` | `nums[mid]` | action |
| --- | --- | --- | --- | --- | --- |
| 1 | 0 | 5 | 2 | 5 | 5 < 7 → `l = mid + 1 = 3` |
| 2 | 3 | 5 | 4 | 9 | 9 > 7 → `r = mid - 1 = 3` |
| 3 | 3 | 3 | 3 | 7 | match → return 3 |

Each step discards half of what remains, so six elements collapse to the answer in three probes — that halving is exactly where the O(log n) comes from.

### A 2D matrix is a 1D array in disguise

When each row is sorted and each row starts after the previous row ends, the matrix *is* one sorted array of `rows * cols` cells. Search indices `0..rows*cols-1` and convert:

```java
int rows = matrix.length, cols = matrix[0].length;
int l = 0, r = rows * cols - 1;
while (l <= r) {
    int mid = l + (r - l) / 2;
    int val = matrix[mid / cols][mid % cols];   // row = mid / cols, col = mid % cols
    if (val == target) return true;
    else if (val < target) l = mid + 1;
    else r = mid - 1;
}
return false;
```

With 4 columns, index 6 → row `6 / 4 = 1`, col `6 % 4 = 2`.

## Form 2: binary search on the answer

When the question is "the smallest value that works" and *works* is monotonic (if x works, so does x+1), search the **answer space** with a feasibility function:

```java
int lo = minPossibleAnswer, hi = maxPossibleAnswer;
while (lo < hi) {                    // note: < , and no -1 on hi
    int mid = lo + (hi - lo) / 2;
    if (isFeasible(mid)) hi = mid;   // mid works — maybe smaller works too
    else lo = mid + 1;               // mid fails — need bigger
}
return lo;                            // lo == hi == smallest feasible
```

Koko Eating Bananas: "slowest speed `k` that finishes all piles in `h` hours". Speed 1 is the slowest possible; `max(piles)` always works (one pile per hour).

```java
int lo = 1, hi = Arrays.stream(piles).max().getAsInt();
while (lo < hi) {
    int k = lo + (hi - lo) / 2;
    if (hoursAt(piles, k) <= h) hi = k;
    else lo = k + 1;
}
return lo;

long hoursAt(int[] piles, int k) {          // the feasibility function
    long hours = 0;
    for (int p : piles) hours += (p + k - 1) / k;   // ceil(p / k) without doubles
    return hours;
}
```

```text
 speed k:   1   2   3   4   5   6   7   8  ...
 feasible:  no  no  no  yes yes yes yes yes      ← one flip; find the first yes
```

Recognize the phrases *minimum speed / capacity that works*, *minimize the maximum*, *maximize the minimum* → this form.

@exercise pat-bs-mcq-form2

@exercise pat-bs-fill-answer

## Rotated sorted arrays

`[4, 5, 6, 7, 0, 1, 2]` is a sorted array rotated at some pivot. Split it at any `mid` and **at least one half is fully sorted**:

```text
 [ 4   5   6   7   0   1   2 ]
   l           mid         r
   └─ sorted ──┘                 nums[l] <= nums[mid]  → left half is sorted
```

### Search in Rotated Sorted Array

Find the sorted half, ask "is the target inside its range?", and keep or discard it:

```java
int l = 0, r = nums.length - 1;
while (l <= r) {
    int mid = l + (r - l) / 2;
    if (nums[mid] == target) return mid;
    if (nums[l] <= nums[mid]) {                                   // left half sorted
        if (nums[l] <= target && target < nums[mid]) r = mid - 1; // target in it
        else l = mid + 1;
    } else {                                                      // right half sorted
        if (nums[mid] < target && target <= nums[r]) l = mid + 1;
        else r = mid - 1;
    }
}
return -1;
```

You can only trust a range check on the **sorted** half — the other half wraps around.

### Find Minimum in Rotated Sorted Array

Compare `mid` with the right end. If `nums[mid] > nums[r]`, the drop (the minimum) is to the right of `mid`; otherwise `mid` itself might be the minimum, so keep it:

```java
int l = 0, r = nums.length - 1;
while (l < r) {
    int mid = l + (r - l) / 2;
    if (nums[mid] > nums[r]) l = mid + 1;   // min is strictly right of mid
    else r = mid;                            // min is mid or left of it
}
return nums[l];
```

This is Form 2 again: the predicate `nums[i] <= nums[last]` is false, false, ..., true, true — and the first true is the minimum.

@exercise pat-bs-mcq-rotated

## Time-based lookups: "latest value at or before t"

Time Based Key-Value Store needs, per key, the value with the greatest timestamp `<= t`. Two options:

```java
// Option A: TreeMap does the binary search for you
Map<String, TreeMap<Integer, String>> store = new HashMap<>();
store.computeIfAbsent(key, k -> new TreeMap<>()).put(timestamp, value);

TreeMap<Integer, String> times = store.get(key);
if (times == null) return "";
Map.Entry<Integer, String> e = times.floorEntry(t);   // greatest key <= t, or null
return e == null ? "" : e.getValue();
```

```java
// Option B: timestamps arrive increasing, so a List per key is already sorted
int l = 0, r = list.size() - 1, ans = -1;
while (l <= r) {
    int mid = l + (r - l) / 2;
    if (list.get(mid).time <= t) { ans = mid; l = mid + 1; }   // candidate; look right for later
    else r = mid - 1;
}
return ans == -1 ? "" : list.get(ans).value;
```

Option B is "last index with `time <= t`" — the mirror image of lower bound.

## Median of Two Sorted Arrays: binary search a partition

Cut `A` after `i` elements and `B` after `j = (m + n + 1) / 2 - i` elements, so the left side holds half of all elements:

```text
        A:  a0  a1  a2 | a3  a4           i = 3
        B:  b0  b1  b2 | b3  b4  b5       j = (5 + 6 + 1) / 2 - 3 = 3
            ─── left half ───  ─── right half ───
```

The **invariant** for a correct cut: `A[i-1] <= B[j]` and `B[j-1] <= A[i]` (everything left ≤ everything right). Binary search `i` over `0..m` on the **shorter** array: if `A[i-1] > B[j]`, `i` is too big (`hi = i - 1`); if `B[j-1] > A[i]`, `i` is too small (`lo = i + 1`). Treat out-of-range neighbours as `±infinity`. Once the cut is valid, the median is `max(left side)` for odd totals, or the average of `max(left)` and `min(right)` for even. O(log(min(m, n))).

## Drill the shapes

@exercise pat-bs-drill-classic

@exercise pat-bs-drill-sqrt

@exercise pat-bs-drill-floor

## Apply it

| Technique | Problems (easy → hard) |
| --- | --- |
| Form 1: find a target | Binary Search |
| Form 1 on a flattened index | Search a 2D Matrix |
| Form 2: search on the answer | Koko Eating Bananas |
| Rotated array: compare with the right end | Find Minimum in Rotated Sorted Array |
| Rotated array: pick the sorted half | Search in Rotated Sorted Array |
| Last value `<= t` (TreeMap / floor search) | Time Based Key-Value Store |
| Binary search a partition | Median of Two Sorted Arrays |

## Recap

- `mid = l + (r - l) / 2`; find-target uses `l <= r`, `mid ± 1`.
- Smallest feasible: `while (lo < hi) { feasible(mid) ? hi = mid : lo = mid + 1; }`.
- 2D sorted matrix: `matrix[mid / cols][mid % cols]`.
- Rotated: `nums[l] <= nums[mid]` → left half sorted; range-check only the sorted half.
- Min in rotated: `nums[mid] > nums[r]` → `l = mid + 1`, else `r = mid`.
- Floor lookups: `TreeMap.floorEntry(t)` or "last index with value <= t".
