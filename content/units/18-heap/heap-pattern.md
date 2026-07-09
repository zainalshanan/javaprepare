You met PriorityQueue in Collections. The pattern layer: recognizing **which heap** and **what goes in it**.

## The decision table

| Problem phrase | Heap setup |
|---|---|
| k-th largest / top k largest | **min**-heap capped at size k |
| k-th smallest / top k smallest | **max**-heap capped at size k |
| k most frequent | count map first, heap ordered by count |
| repeatedly take the best/closest | heap of everything, poll as needed |
| merge k sorted lists | heap of the k current heads |

The size-k heap trick from Collections is the workhorse — O(n log k) beats sorting's O(n log n) when k is small.

## Heaping structured data

```java
// K Closest Points: points as int[]{x, y}, ordered by distance
PriorityQueue<int[]> maxHeap = new PriorityQueue<>(
    (a, b) -> Integer.compare(b[0]*b[0] + b[1]*b[1], a[0]*a[0] + a[1]*a[1]));

// K most frequent: keys ordered by their count in the map
PriorityQueue<Integer> pq = new PriorityQueue<>(
    (a, b) -> Integer.compare(count.get(a), count.get(b)));
```

The comparator closes over outside data (the count map) — very common, slightly magical the first time you see it.

@exercise pat-hp-mcq-which

@exercise pat-hp-drill-stream

@exercise pat-hp-drill-klargest

Apply it: Kth Largest Element in a Stream, K Closest Points to Origin.
