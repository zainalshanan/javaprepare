Trees, backtracking, and graph DFS — some of the heaviest NeetCode categories — are all recursion underneath. Get comfortable with it now, on small problems, so it's familiar when the trees arrive.

## The shape

A recursive method calls itself on a *smaller* version of the problem, and has a **base case** where it stops:

```java
public int factorial(int n) {
    if (n <= 1) return 1;          // base case — no recursive call
    return n * factorial(n - 1);   // shrink the problem, trust the call
}
```

`factorial(4)` → `4 * factorial(3)` → `4 * 3 * factorial(2)` → `4 * 3 * 2 * factorial(1)` → `4 * 3 * 2 * 1`.

### Watch the call stack

Each call pauses, waiting on the one below it, then they finish in reverse. Reading top-to-bottom is the calls going *down*; bottom-to-top is the answers coming back *up*:

```
factorial(4)            → returns 4 * 6  = 24   ← last to finish
  factorial(3)          → returns 3 * 2  = 6
    factorial(2)        → returns 2 * 1  = 2
      factorial(1)      → returns 1           (base case — first to finish)
```

The indentation *is* the call stack: it grows until the base case stops the descent, then unwinds as each paused call multiplies its `n` by the answer handed back to it. This same "go all the way down, then combine on the way up" shape is exactly how tree DFS will feel later.

Two rules:

1. **Base case first.** Without it you recurse forever and get `StackOverflowError`.
2. **Trust the recursive call.** Assume `factorial(n - 1)` just works; your job is only to combine its answer with the current step. Trying to mentally trace every level is how people get lost.

@exercise rec-mcq-base

## The call stack

Each call gets its own copy of parameters and locals, stacked up until the base case, then unwound. That's why recursion depth ~10⁶ crashes (stack space), while depth ~10³–10⁴ (tree heights, typical inputs) is fine.

@exercise rec-fill-fib

## Recursion on structures

The pattern for sequences: handle one element, recurse on the rest.

```java
// sum of digits, recursively
public int digitSum(int n) {
    if (n == 0) return 0;              // base case
    return n % 10 + digitSum(n / 10);  // last digit + rest
}
```

When you meet trees, the exact same shape becomes `node.val + dfs(node.left) + dfs(node.right)`.

@exercise rec-power

@exercise rec-drill-countdown
