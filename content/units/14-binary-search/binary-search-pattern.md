Binary search halves the search space each step: O(log n). It applies far beyond "find x in a sorted array" — the killer form is **binary search on the answer**.

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

## Form 2: binary search on the answer

When the question is "the smallest value that works" and *works* is monotonic (if x works, so does x+1), search the **answer space**:

```java
int lo = minPossibleAnswer, hi = maxPossibleAnswer;
while (lo < hi) {                    // note: < , and no -1 on hi
    int mid = lo + (hi - lo) / 2;
    if (isFeasible(mid)) hi = mid;   // mid works — maybe smaller works too
    else lo = mid + 1;               // mid fails — need bigger
}
return lo;                            // lo == hi == smallest feasible
```

Koko Eating Bananas: "slowest eating speed that finishes in time" — feasibility check is a simple simulation, and speed is monotonic. Recognize the phrase *minimize the maximum / maximize the minimum* → this form.

@exercise pat-bs-mcq-form2

@exercise pat-bs-drill-classic

@exercise pat-bs-drill-sqrt

Apply it: Binary Search, Koko Eating Bananas.
