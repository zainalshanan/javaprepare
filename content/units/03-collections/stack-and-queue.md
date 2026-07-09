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

Mental model: a line at a counter. BFS — level-order tree traversal, shortest path in grids — is built on a queue.

@exercise sq-fill-both

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

## Reference drills

Rapid recall of the stack and queue operations. Fill the blank, then write it live.

@exercise sq-ref-stack-fill

@exercise sq-ref-stack-code

@exercise sq-ref-queue-fill

@exercise sq-ref-queue-code
