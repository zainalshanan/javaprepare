Stacks (last-in-first-out) and queues (first-in-first-out) power an entire NeetCode category each. In modern Java, **both** are best served by `ArrayDeque`.

## Stack — LIFO

```java
Deque<Integer> stack = new ArrayDeque<>();
stack.push(x);      // add to top
stack.pop();        // remove + return top (throws if empty)
stack.peek();       // look at top without removing (null if empty)
stack.isEmpty();
```

> Java has a legacy `Stack` class — don't use it. `ArrayDeque` is faster and is what fluent Java looks like.

Mental model: a stack of plates. Valid Parentheses, undo history, DFS, monotonic stacks — all this shape.

@exercise sq-mcq-stack-trace

## Queue — FIFO

```java
Queue<Integer> queue = new ArrayDeque<>();
queue.offer(x);     // add to back
queue.poll();       // remove + return front (null if empty)
queue.peek();       // front without removing
queue.isEmpty();
```

Mental model: a line at a counter. BFS — level-order tree traversal, shortest path in grids — is built on a queue. (You'll also see `new LinkedList<>()` used as a queue in older solutions. It works, but `ArrayDeque` is faster.)

@exercise sq-fill-both

## One class, two ends: the Deque API

`ArrayDeque` is a **double-ended queue**: you can add, remove and peek at *both* ends in O(1). The stack and queue methods are just shorthand for particular ends:

| | Front (head) | Back (tail) |
| --- | --- | --- |
| add | `offerFirst(x)` | `offerLast(x)` |
| remove + return | `pollFirst()` | `pollLast()` |
| look | `peekFirst()` | `peekLast()` |

```text
            pollFirst ◄──┐                  ┌──► pollLast
                         │                  │
offerFirst ──►  front [  a  ,  b  ,  c  ,  d  ] back  ◄── offerLast
```

| Shorthand | Same as | Used as |
| --- | --- | --- |
| `push(x)` | `offerFirst(x)`* | stack |
| `pop()` | `pollFirst()`* | stack |
| `offer(x)` | `offerLast(x)` | queue |
| `poll()` | `pollFirst()` | queue |
| `peek()` | `peekFirst()` | both |

*`push`/`pop` are the throwing versions (`addFirst`/`removeFirst`): `pop()` on an empty deque throws instead of returning `null`.

So a stack's "top" is the deque's **front**. Declare the variable as `Deque<...>` when you need the both-ends methods, and use `First`/`Last` names whenever you touch both ends in one algorithm, so it's clear which end you mean.

@exercise sq-fill-deque-api

## ArrayDeque rejects null

`offer(null)` and `push(null)` throw `NullPointerException`, because `poll` and `peek` already use `null` to mean "empty". This bites in tree BFS when you enqueue children without checking:

```java
Deque<TreeNode> queue = new ArrayDeque<>();
queue.offer(root);                 // guard root == null before this too
while (!queue.isEmpty()) {
    TreeNode node = queue.poll();
    if (node.left != null) queue.offer(node.left);     // required
    if (node.right != null) queue.offer(node.right);
}
```

## The standard while-drain loop

Nearly every stack/queue algorithm ends up in this shape:

```java
while (!queue.isEmpty()) {
    int cur = queue.poll();
    // process cur, possibly offering new items
}
```

@exercise sq-reverse-with-stack

@exercise sq-drill-stack

## Preview: the monotonic deque

Using both ends at once gives one of the neatest tricks in the course. For **Sliding Window Maximum**, keep a deque of indices whose values *decrease* from front to back:

- **back:** before adding `i`, pop smaller-or-equal values off the back. They can never be the max again, because `nums[i]` is bigger and stays in the window longer.
- **front:** if the front index has slid out of the window, poll it.
- The front is always the current window's maximum.

```java
Deque<Integer> dq = new ArrayDeque<>();   // indices
for (int i = 0; i < nums.length; i++) {
    if (!dq.isEmpty() && dq.peekFirst() <= i - k) dq.pollFirst();          // out of window
    while (!dq.isEmpty() && nums[dq.peekLast()] <= nums[i]) dq.pollLast(); // useless now
    dq.offerLast(i);
    if (i >= k - 1) res[i - k + 1] = nums[dq.peekFirst()];                 // front = max
}
```

Trace with `nums = [1, 3, -1, -3, 5, 3]`, `k = 3` (showing the values at the deque's indices):

| `i` | `nums[i]` | poll front? | poll back | deque after (values) | window max |
| --- | --- | --- | --- | --- | --- |
| 0 | 1 | — | — | `[1]` | (window not full) |
| 1 | 3 | — | 1 | `[3]` | (window not full) |
| 2 | -1 | — | — | `[3, -1]` | **3** |
| 3 | -3 | — | — | `[3, -1, -3]` | **3** |
| 4 | 5 | 3 (index 1 left) | -3, -1 | `[5]` | **5** |
| 5 | 3 | — | — | `[5, 3]` | **5** |

Each index enters and leaves the deque at most once, so the whole scan is O(n). You'll build this for real in the Sliding Window unit.

## Reference drills

Rapid recall of the stack and queue operations. Fill the blank, then write it live.

@exercise sq-ref-stack-fill

@exercise sq-ref-stack-code

@exercise sq-ref-queue-fill

@exercise sq-ref-queue-code

## Recap

- Stack: `Deque<Integer> st = new ArrayDeque<>();` with `push`, `pop`, `peek`, `isEmpty()`.
- Queue: `Queue<Integer> q = new ArrayDeque<>();` with `offer`, `poll`, `peek`.
- Both ends: `offerFirst/offerLast`, `pollFirst/pollLast`, `peekFirst/peekLast`.
- `push` = `addFirst`, `poll` = `pollFirst`, `offer` = `offerLast`.
- No nulls in an `ArrayDeque`: `if (node.left != null) queue.offer(node.left);`.
