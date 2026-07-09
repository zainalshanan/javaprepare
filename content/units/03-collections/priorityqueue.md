A `PriorityQueue` (heap) always hands you the **smallest** element first, with O(log n) insert/remove. It powers "top K", "k-th largest", merging sorted streams, and Dijkstra.

## Min-heap (the default)

```java
PriorityQueue<Integer> minHeap = new PriorityQueue<>();
minHeap.offer(5);
minHeap.offer(1);
minHeap.offer(3);
minHeap.poll();    // 1 — always the smallest
minHeap.peek();    // 3 — look without removing
minHeap.size();
```

## Max-heap — flip the comparator

```java
PriorityQueue<Integer> maxHeap = new PriorityQueue<>((a, b) -> Integer.compare(b, a));
// or: new PriorityQueue<>(Collections.reverseOrder());
```

The `(a, b) -> ...` lambda is a comparator — fully covered next unit. For now: `Integer.compare(a, b)` = ascending = min-heap; swap to `(b, a)` for descending = max-heap.

@exercise pq-mcq-poll

## Heaps of pairs

Real problems heap arrays or objects with a custom key:

```java
// {value, index} pairs, ordered by value
PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> Integer.compare(a[0], b[0]));
pq.offer(new int[]{dist, node});
```

@exercise pq-fill-maxheap

## The "top K" pattern — keep the heap small

K-th largest without sorting everything: a **min**-heap capped at size k. Anything smaller than the heap's minimum can never be in the top k, so evict it:

```java
PriorityQueue<Integer> heap = new PriorityQueue<>();  // MIN-heap
for (int x : nums) {
    heap.offer(x);
    if (heap.size() > k) heap.poll();   // evict the smallest
}
// heap.peek() is the k-th largest
```

Counter-intuitive but crucial: finding the k *largest* uses a *min*-heap.

@exercise pq-kth-largest

@exercise pq-drill-topk

## Reference drills

Rapid recall of the heap operations and the max-heap comparator. Fill the blank, then write it live.

@exercise pq-ref-min-fill

@exercise pq-ref-min-code

@exercise pq-ref-max-fill

@exercise pq-ref-max-code
