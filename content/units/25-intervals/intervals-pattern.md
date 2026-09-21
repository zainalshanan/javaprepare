Interval problems (meetings, bookings, merged ranges) almost all start the same way: **sort, then sweep**. The part that changes is *what you sort by* and *what you track* during the sweep.

Every problem here represents intervals as `int[][]`, where each `int[]` is `{start, end}`.

## Sorting: use `Integer.compare`

```java
Arrays.sort(intervals, (a, b) -> Integer.compare(a[0], b[0]));   // by start
```

Don't write `(a, b) -> a[0] - b[0]`. If `a[0] = -2_000_000_000` and `b[0] = 2_000_000_000`, the subtraction overflows to a positive number and the sort silently breaks. `Integer.compare` can't overflow.

## The overlap test

`[a0, a1]` and `[b0, b1]` overlap iff `a0 <= b1 && b0 <= a1`. Once the list is sorted by start, this simplifies: the current interval overlaps the last one you kept iff `cur[0] <= last[1]`.

## Merge Intervals

```text
    0    5    10   15
     |=|                 [1,3]
      |===|              [2,6]    2 <= 3  → overlap, end = max(3,6) = 6
            |=|          [8,10]   8 >  6  → new group
                   |==|  [15,18]  15 > 10 → new group
     |====| |=|    |==|  merged: [1,6] [8,10] [15,18]
```

```java
Arrays.sort(intervals, (a, b) -> Integer.compare(a[0], b[0]));
List<int[]> merged = new ArrayList<>();
for (int[] cur : intervals) {
    if (merged.isEmpty() || merged.get(merged.size() - 1)[1] < cur[0]) {
        merged.add(cur);                        // no overlap: start a new group
    } else {
        int[] last = merged.get(merged.size() - 1);
        last[1] = Math.max(last[1], cur[1]);    // overlap: extend the end
    }
}
return merged.toArray(new int[merged.size()][]);
```

The `Math.max` matters. `[1,10]` followed by `[2,3]` has to stay `[1,10]`, not shrink to `[1,3]`.

@exercise pat-iv-mcq-overlap

## Insert Interval: three phases

The input is already sorted and doesn't overlap, so you don't need to sort. Walk it once in three phases:

```text
existing:  [1,2]  [3,5]  [6,7]  [8,10]  [12,16]      new: [4,8]
           before |--- overlapping ----|  after
phase 1: end < new.start        → copy [1,2]
phase 2: start <= new.end       → absorb [3,5] [6,7] [8,10] → new = [3,10]
phase 3: the rest               → copy [12,16]
```

```java
int i = 0, n = intervals.length;
while (i < n && intervals[i][1] < newInterval[0]) res.add(intervals[i++]);
while (i < n && intervals[i][0] <= newInterval[1]) {
    newInterval[0] = Math.min(newInterval[0], intervals[i][0]);
    newInterval[1] = Math.max(newInterval[1], intervals[i][1]);
    i++;
}
res.add(newInterval);
while (i < n) res.add(intervals[i++]);
```

## Non-overlapping Intervals: sort by END

To keep the most intervals (and so remove the fewest), always keep the one that **finishes earliest**. It leaves the most room for everything after it. Sorting by start fails because one long early interval can block many short ones:

```text
[1,100]  |==========================|
[2,3]     |=|
[4,5]        |=|
by start: keep [1,100], remove 2.   by end: keep [2,3],[4,5], remove 1 ✓
```

```java
Arrays.sort(intervals, (a, b) -> Integer.compare(a[1], b[1]));
int removed = 0, prevEnd = Integer.MIN_VALUE;
for (int[] it : intervals) {
    if (it[0] >= prevEnd) prevEnd = it[1];   // compatible: keep it
    else removed++;                           // overlaps the kept one: drop it
}
```

Why it's safe (exchange argument): take any optimal set. Swap its first interval for the earliest-ending one. The replacement ends no later, so everything after it still fits.

@exercise pat-iv-mcq-sort-end

## Meeting Rooms: sort and check neighbors

Sort by start. After sorting, only adjacent meetings can conflict: `intervals[i][0] < intervals[i-1][1]`. Use a strict `<` because back-to-back meetings are allowed.

## Meeting Rooms II: a min-heap of end times

Go through meetings in start order. The heap holds the end time of every room in use. If the room that frees up soonest (`peek()`) is free by this meeting's start, reuse it:

```java
Arrays.sort(intervals, (a, b) -> Integer.compare(a[0], b[0]));
PriorityQueue<Integer> ends = new PriorityQueue<>();
for (int[] m : intervals) {
    if (!ends.isEmpty() && ends.peek() <= m[0]) ends.poll();   // reuse a room
    ends.offer(m[1]);
}
return ends.size();
```

Trace on `[[1,10],[2,7],[3,19],[8,12],[10,20],[11,30]]`:

| meeting | `peek() <= start`? | heap after | rooms |
| --- | --- | --- | --- |
| [1,10] | (empty) | {10} | 1 |
| [2,7] | 10 ≤ 2 no | {7, 10} | 2 |
| [3,19] | 7 ≤ 3 no | {7, 10, 19} | 3 |
| [8,12] | 7 ≤ 8 **yes**, poll | {10, 12, 19} | 3 |
| [10,20] | 10 ≤ 10 **yes**, poll | {12, 19, 20} | 3 |
| [11,30] | 12 ≤ 11 no | {12, 19, 20, 30} | **4** |

**Alternative, the two-array sweep:** sort all starts and all ends separately. Walk the starts. If `start < ends[e]`, you need a new room. Otherwise one meeting has ended, so advance `e`. Same O(n log n), no heap.

@exercise pat-iv-fill-rooms

## Minimum Interval to Include Each Query

This is the heap sweep again, with sorted *queries*:

1. Sort intervals by start. Sort the query **indices** by query value, so you can write answers back in the original order.
2. For each query `q` in increasing order, push every interval with `start <= q` onto a min-heap keyed by **size** (`end - start + 1`).
3. Pop from the top while its end is `< q`. Those intervals can't contain `q` or any later query. Whatever is left on top is the answer.

```java
Integer[] order = new Integer[queries.length];
for (int i = 0; i < order.length; i++) order[i] = i;
Arrays.sort(order, (a, b) -> Integer.compare(queries[a], queries[b]));
PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> Integer.compare(a[0], b[0])); // {size, end}
```

Each interval is pushed and popped at most once: O((n + q) log n).

@exercise pat-iv-drill-overlap

@exercise pat-iv-drill-merge

## Apply it

- **Sort by start + sweep:** Meeting Rooms (Easy) → Merge Intervals → Insert Interval (already sorted)
- **Sort by end, greedy keep:** Non-overlapping Intervals
- **Heap of end times:** Meeting Rooms II → Minimum Interval to Include Each Query (Hard)

## Recap

- Sort with `Integer.compare(a[0], b[0])`, never `a[0] - b[0]`, because the subtraction can overflow.
- When sorted by start, `cur[0] <= last[1]` means overlap. Extend with `max` of the ends.
- Insert: copy the intervals before, absorb the overlapping ones with min/max, copy the rest.
- To keep the most intervals, sort by **end** and keep the earliest finisher.
- Rooms: a min-heap of end times. Poll if `peek() <= start`. Heap size = rooms.
