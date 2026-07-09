Interval problems (meetings, bookings, merged ranges) nearly all start the same way: **sort by start, then sweep** while tracking the last interval kept.

## The overlap test

Two intervals `[a0, a1]` and `[b0, b1]` overlap iff `a0 <= b1 && b0 <= a1`. After sorting by start, it simplifies: the current interval overlaps the previous one iff `cur[0] <= prev[1]`.

## The merge template

```java
Arrays.sort(intervals, (a, b) -> Integer.compare(a[0], b[0]));
List<int[]> merged = new ArrayList<>();
for (int[] cur : intervals) {
    if (merged.isEmpty() || merged.get(merged.size() - 1)[1] < cur[0]) {
        merged.add(cur);                        // no overlap — start a new group
    } else {
        int[] last = merged.get(merged.size() - 1);
        last[1] = Math.max(last[1], cur[1]);    // overlap — extend the end
    }
}
return merged.toArray(new int[merged.size()][]);
```

The `Math.max` on the end matters: `[1,10]` followed by `[2,3]` must stay `[1,10]`, not shrink to `[1,3]`.

@exercise pat-iv-mcq-overlap

@exercise pat-iv-drill-overlap

@exercise pat-iv-drill-merge

Apply it: Insert Interval, Merge Intervals.
