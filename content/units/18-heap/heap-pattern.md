You met `PriorityQueue` in the Collections unit. At the pattern level, the skill is knowing **which heap** to use and **what goes in it**.

## The decision table

| Problem phrase | Heap setup |
|---|---|
| k-th largest / top k largest | **min**-heap capped at size k |
| k-th smallest / k closest | **max**-heap capped at size k |
| k most frequent | count map first, then a size-k heap ordered by count |
| repeatedly take the biggest | max-heap of everything, poll as needed |
| running median | **two** heaps: max-heap lower half, min-heap upper half |
| merge k sorted lists / feeds | heap holding each list's current head |

Java's `PriorityQueue` is a min-heap by default. For a max-heap, pass a comparator: `new PriorityQueue<>((a, b) -> Integer.compare(b, a))`. Don't write `b - a`, because the subtraction can overflow.

@exercise pat-hp-drill-stream

## Top-k with a size-k heap

To keep the k **largest** values, the top of the heap should be the weakest of the values you're keeping. That's the one to evict when a bigger value arrives. The weakest of the largest values is the smallest one, so you want a **min-heap**.

```java
PriorityQueue<Integer> heap = new PriorityQueue<>();   // min-heap
for (int x : nums) {
    heap.offer(x);
    if (heap.size() > k) heap.poll();                  // evict the smallest
}
// heap holds the k largest; heap.peek() is the k-th largest
```

Trace for `nums = [5, 1, 8, 3, 9]`, `k = 2`:

| x | heap after offer | size > 2? | heap after |
| --- | --- | --- | --- |
| 5 | {5} | no | {5} |
| 1 | {1, 5} | no | {1, 5} |
| 8 | {1, 5, 8} | yes → poll 1 | {5, 8} |
| 3 | {3, 5, 8} | yes → poll 3 | {5, 8} |
| 9 | {5, 8, 9} | yes → poll 5 | {8, 9} |

The top 2 are {8, 9}, and the 2nd largest is `peek()` = 8. This takes O(n log k) time and O(k) space. A max-heap would evict the *largest* value each time, which is the opposite of what you want.

@exercise pat-hp-fill-topk

@exercise pat-hp-drill-klargest

## Heaping structured data

**K Closest Points** keeps the k *smallest* distances, so it uses a max-heap ordered by distance. Compare squared distances. There's no need for `Math.sqrt`, and integers stay exact.

```java
PriorityQueue<int[]> maxHeap = new PriorityQueue<>(
    (a, b) -> Integer.compare(b[0]*b[0] + b[1]*b[1], a[0]*a[0] + a[1]*a[1]));
```

With coordinates up to 10⁴, `x² + y²` is at most 2·10⁸, which fits in an `int`. If coordinates could reach about 10⁵, the squares would overflow. In that case compute `(long) x * x + (long) y * y` and compare with `Long.compare`.

**Frequency → heap of entries.** Count first, then run the same size-k trick ordered by count:

```java
Map<Integer, Integer> count = new HashMap<>();
for (int x : nums) count.merge(x, 1, Integer::sum);

PriorityQueue<Map.Entry<Integer, Integer>> heap =
    new PriorityQueue<>((a, b) -> Integer.compare(a.getValue(), b.getValue()));  // min by count
for (Map.Entry<Integer, Integer> e : count.entrySet()) {
    heap.offer(e);
    if (heap.size() > k) heap.poll();       // drop the least frequent
}
```

@exercise pat-hp-mcq-which

## Always take the biggest: Task Scheduler

Some simulations repeatedly act on whatever is currently largest (Last Stone Weight, Task Scheduler). For Task Scheduler, each time step runs the task with the most copies left that isn't cooling down. A task that just ran waits in a FIFO queue until it's allowed to run again:

```java
PriorityQueue<Integer> ready = new PriorityQueue<>((a, b) -> Integer.compare(b, a)); // remaining counts
Deque<int[]> cooling = new ArrayDeque<>();                                           // {remaining, readyAt}
int time = 0;
while (!ready.isEmpty() || !cooling.isEmpty()) {
    time++;
    if (!ready.isEmpty()) {
        int left = ready.poll() - 1;                      // run the most frequent task
        if (left > 0) cooling.offer(new int[]{left, time + n});
    }                                                     // (empty ready heap = an idle slot)
    if (!cooling.isEmpty() && cooling.peek()[1] == time) {
        ready.offer(cooling.poll()[0]);                   // cooldown finished
    }
}
```

There's also an O(n) counting formula. The most frequent task (count `maxCount`) creates `maxCount - 1` blocks of length `n + 1`, plus one final slot for each task tied at `maxCount`. The answer is `max(tasks.length, (maxCount - 1) * (n + 1) + tiedCount)`.

## Two heaps: running median

The median sits on the boundary between the smaller half and the larger half. Keep each half in its own heap, arranged so both edge values are at the tops:

```text
       lower half                    upper half
   max-heap `small`               min-heap `large`
   [ 1  2  3  (5) ]      ≤       [ (6)  8  9 ]
               ^ top               ^ top

   invariant 1: every value in small ≤ every value in large
   invariant 2: small.size() == large.size()  or  small.size() == large.size() + 1

   median = small.peek()                             if the count is odd
          = (small.peek() + large.peek()) / 2.0      if the count is even
```

**Add rule:** offer the new value to `small`. Then move `small`'s top to `large`, which keeps invariant 1. Finally, if `large` now has more elements, move its top back to `small`, which keeps invariant 2.

| add | small (max-heap) | large (min-heap) | median |
| --- | --- | --- | --- |
| 5 | {5} | {} | 5 |
| 1 | {1} | {5} | 3.0 |
| 3 | {3, 1} | {5} | 3 |
| 8 | {3, 1} | {5, 8} | 4.0 |

Each add is O(log n), and reading the median is O(1).

@exercise pat-hp-mcq-median

@exercise pat-hp-fill-median

## Merging k sorted lists

Design Twitter's news feed merges several users' tweet lists, each already in time order, and keeps the 10 newest. The general tool is a **k-way merge**. Put the first element of each list in a heap. Poll the best element, then push the next element from that same list.

```java
// lists[i] is sorted ascending; heap entries are {value, listIndex, elementIndex}
PriorityQueue<int[]> heap = new PriorityQueue<>((a, b) -> Integer.compare(a[0], b[0]));
for (int i = 0; i < lists.length; i++)
    if (lists[i].length > 0) heap.offer(new int[]{lists[i][0], i, 0});
while (!heap.isEmpty()) {
    int[] top = heap.poll();
    out.add(top[0]);
    int li = top[1], next = top[2] + 1;
    if (next < lists[li].length) heap.offer(new int[]{lists[li][next], li, next});
}
```

The heap never holds more than k elements, so merging N total elements costs O(N log k). For a feed, order by timestamp with a max-heap and stop after 10 polls.

@exercise pat-hp-drill-merge

## Apply it

Easy → hard: **Kth Largest Element in a Stream**, **Last Stone Weight**, **Kth Largest Element in an Array**, **K Closest Points to Origin**, **Task Scheduler**, **Design Twitter**, **Find Median from Data Stream**.

## Recap

- Keep the k largest → min-heap of size k. Keep the k smallest or closest → max-heap of size k.
- Max-heap: `(a, b) -> Integer.compare(b, a)`. Never `b - a`.
- Structured data: the comparator reads a field, a squared distance, or a count from a map. Use `long` if values can overflow.
- Running median: max-heap for the lower half, min-heap for the upper half; `small` may hold one extra.
- k-way merge: the heap holds each list's current head; poll one, push that list's next element.
