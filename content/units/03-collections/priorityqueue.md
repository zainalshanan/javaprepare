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

## How it works: a tree stored in an array

A heap is a binary tree where every parent is ≤ its children, so the minimum is always at the root. It isn't stored with node objects: it's packed level by level into an array, and the links are just index arithmetic.

```text
index:   0    1    2    3    4    5
array: [ 1 ,  3 ,  2 ,  7 ,  4 ,  5 ]

                 1  (i=0)
               /         \
         3  (i=1)       2  (i=2)
         /     \          /
   7 (i=3)   4 (i=4)   5 (i=5)

children of i:  2i + 1 and 2i + 2     (i=1 → 3 and 4)
parent of i:    (i - 1) / 2           (i=5 → 2)
```

Only parent ≤ child is guaranteed, not a full sort. The array `[1, 3, 2, 7, 4, 5]` isn't in order (3 comes before 2), yet every parent is ≤ its children. That weaker rule is what makes it cheap:

- **`peek()` is O(1)**: the minimum is always `array[0]`.
- **`offer(x)` is O(log n)**: append `x` at the end, then swap it up with its parent while it's smaller. A tree of n nodes is only log₂ n levels tall.
- **`poll()` is O(log n)**: take the root, move the last element to index 0, then swap it down with its smaller child until it fits.
- `contains(x)` and `remove(x)` are O(n): the heap has no idea where an arbitrary value lives.

@exercise pq-fill-heap-index

## Max-heap — flip the comparator

`PriorityQueue` accepts a comparator lambda (from the Lambdas lesson) that decides which element counts as "smallest". Reverse it and the largest comes out first:

```java
PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Collections.reverseOrder());
PriorityQueue<Integer> maxHeap2 = new PriorityQueue<>((a, b) -> Integer.compare(b, a));
```

`Integer.compare(a, b)` = ascending = min-heap; swap to `(b, a)` for descending = max-heap.

You'll often see `(a, b) -> b - a`. Don't copy it. Subtraction overflows for large values of opposite sign: with `b = 2_000_000_000` and `a = -2_000_000_000`, `b - a` wraps negative and the heap silently mis-orders. `Collections.reverseOrder()` and `Integer.compare(b, a)` never overflow.

@exercise pq-mcq-poll

## Heaps of pairs

Real problems put arrays or objects in the heap and order them by one field. An `int[]` is the usual lightweight pair:

```java
// {distance, node} pairs, smallest distance first — the Dijkstra heap
PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> Integer.compare(a[0], b[0]));
pq.offer(new int[]{dist, node});

int[] top = pq.poll();
int d = top[0], u = top[1];
```

`PriorityQueue<int[]>` **requires** a comparator: arrays have no natural order, so without one the very first `offer` throws `ClassCastException`.

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

Counter-intuitive but crucial: finding the k *largest* uses a *min*-heap. The heap never grows past k, so this is O(n log k).

@exercise pq-kth-largest

@exercise pq-drill-topk

## Reference drills

Rapid recall of the heap operations and the max-heap comparator. Fill the blank, then write it live.

@exercise pq-ref-min-fill

@exercise pq-ref-min-code

@exercise pq-ref-max-fill

@exercise pq-ref-max-code

## Recap

- `new PriorityQueue<>()` is a min-heap: `offer`/`poll` O(log n), `peek` O(1).
- Array layout: children of `i` at `2i + 1`, `2i + 2`; parent at `(i - 1) / 2`.
- Max-heap: `new PriorityQueue<>(Collections.reverseOrder())` or `(a, b) -> Integer.compare(b, a)`, never `b - a`.
- Pairs: `new PriorityQueue<int[]>((a, b) -> Integer.compare(a[0], b[0]))`.
- K largest → min-heap capped at size k.
