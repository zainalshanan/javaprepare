Dynamic programming = recursion where subproblems repeat, so you **store answers instead of recomputing**. 1-D DP: the state is a single index.

## Bottom-up template

```java
int[] dp = new int[n + 1];
dp[0] = /* base */;
dp[1] = /* base */;
for (int i = 2; i <= n; i++) {
    dp[i] = /* recurrence using dp[i-1], dp[i-2], ... */;
}
return dp[n];
```

Climbing Stairs: `dp[i] = dp[i-1] + dp[i-2]` (last step was 1 or 2). House Robber: `dp[i] = max(dp[i-1], dp[i-2] + nums[i])` (skip house i, or rob it).

## The three questions

Every DP solution answers:

1. **State** — what does `dp[i]` *mean*? (Say it in a full sentence!)
2. **Recurrence** — how does `dp[i]` follow from smaller states?
3. **Base cases** — what seeds the table?

If you can't state #1 precisely, the recurrence will be wrong.

@exercise pat-dp1-mcq-state

## Space optimization

When `dp[i]` only reads `dp[i-1]` and `dp[i-2]`, the array collapses to two variables:

```java
int prev2 = base0, prev1 = base1;
for (int i = 2; i <= n; i++) {
    int cur = /* recurrence on prev1, prev2 */;
    prev2 = prev1;
    prev1 = cur;
}
return prev1;
```

@exercise pat-dp1-drill-fib

@exercise pat-dp1-drill-rob

Apply it: Climbing Stairs, House Robber, Coin Change (where dp is indexed by *amount*, not position — the state question in action).
