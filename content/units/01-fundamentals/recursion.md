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

```text
factorial(4)            → returns 4 * 6  = 24   ← last to finish
  factorial(3)          → returns 3 * 2  = 6
    factorial(2)        → returns 2 * 1  = 2
      factorial(1)      → returns 1           (base case — first to finish)
```

The indentation *is* the call stack: each call gets its own copy of `n`, stacked until the base case stops the descent, then unwound as each paused call multiplies its `n` by the answer handed back. Stack space is limited — depth ~10⁶ crashes, while depth ~10³–10⁴ (tree heights, typical inputs) is fine.

Two rules:

1. **Base case first.** Without it you recurse forever and get `StackOverflowError`.
2. **Trust the recursive call.** Assume `factorial(n - 1)` just works; your job is only to combine its answer with the current step. Trying to mentally trace every level is how people get lost.

@exercise rec-mcq-base

## Two calls: the recursion tree

When a method calls itself **twice**, the calls form a tree instead of a line. Fibonacci is the classic:

@exercise rec-fill-fib

Here's every call `fib(4)` makes:

```text
                    fib(4)
                 /          \
            fib(3)          fib(2)      ← fib(2) computed here...
           /      \         /    \
       fib(2)    fib(1)  fib(1)  fib(0)
       /    \
   fib(1)  fib(0)                       ← ...and again here
```

9 calls to get one answer, and `fib(2)` is solved twice from scratch. Each extra level roughly doubles the work, so `fib(50)` makes billions of calls — O(2ⁿ).

@exercise rec-predict-calls

## Memoization: remember answers

The fix: store each answer the first time you compute it, and look it up after that. An array indexed by `n` works well (a `HashMap` does the same job when keys aren't small ints — Unit 3):

```java
public int fib(int n) {
    int[] memo = new int[n + 1];
    Arrays.fill(memo, -1);              // -1 means "not computed yet"
    return fibMemo(n, memo);
}

private int fibMemo(int n, int[] memo) {
    if (n <= 1) return n;
    if (memo[n] != -1) return memo[n];  // already solved — reuse it
    memo[n] = fibMemo(n - 1, memo) + fibMemo(n - 2, memo);
    return memo[n];
}
```

Now each `fib(k)` is computed once: O(n) calls. This is the doorway to dynamic programming.

@exercise rec-fib-memo

## Helper methods with extra parameters

Notice `fibMemo` takes an extra `memo` argument the public method doesn't have. That's the most common recursion pattern on LeetCode: the given signature is too small, so you write a **helper that carries extra state** — an index, bounds, a running total — and have the public method start it off:

```java
public int sumArray(int[] nums) {
    return sumFrom(nums, 0);            // kick off at index 0
}

private int sumFrom(int[] nums, int i) {
    if (i == nums.length) return 0;     // base case: past the end
    return nums[i] + sumFrom(nums, i + 1);
}
```

The same "handle one element, recurse on the rest" shape works on numbers too:

```java
public int digitSum(int n) {
    if (n == 0) return 0;              // base case
    return n % 10 + digitSum(n / 10);  // last digit + rest
}
```

When you meet trees, it becomes `node.val + dfs(node.left) + dfs(node.right)`, and backtracking helpers carry `(index, current path)` exactly like `sumFrom` carries `i`.

@exercise rec-helper-sum

@exercise rec-power

@exercise rec-drill-countdown

## Recap

- Base case first, then one smaller recursive call: `if (n <= 1) return 1; return n * f(n - 1);`
- Trust the recursive call — only combine its answer with the current step.
- Two recursive calls form a tree; repeated subcalls blow up to O(2ⁿ).
- Memoize: `if (memo[n] != -1) return memo[n];` before recursing, store before returning.
- Need more state? Public method calls `private helper(input, index, ...)`.
