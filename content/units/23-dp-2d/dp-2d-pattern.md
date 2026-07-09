2-D DP: the state needs **two** indices — usually positions in two strings (edit distance, LCS) or coordinates in a grid (unique paths).

## The grid template

```java
int[][] dp = new int[m + 1][n + 1];
// row 0 and column 0 are base cases (often 0 or i)
for (int i = 1; i <= m; i++) {
    for (int j = 1; j <= n; j++) {
        if (/* items i-1 and j-1 match */) {
            dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
            dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
    }
}
return dp[m][n];
```

That exact code is Longest Common Subsequence. `dp[i][j]` = "LCS length of the first i chars of s1 and first j chars of s2." The +1 sizing with a zero row/column means base cases come for free — `dp[0][j] = 0` (empty string matches nothing) is already there.

The off-by-one to internalize: `dp[i][j]` describes **prefixes of length i and j**, so the characters compared are `s1.charAt(i-1)` and `s2.charAt(j-1)`.

@exercise pat-dp2-mcq-offbyone

## Top-down (memoized recursion) alternative

Same recurrence, written as recursion + cache. Often easier to derive:

```java
Integer[][] memo = new Integer[m][n];
private int solve(int i, int j) {
    if (/* base */) return baseValue;
    if (memo[i][j] != null) return memo[i][j];
    int ans = /* recurrence using solve(...) */;
    return memo[i][j] = ans;
}
```

`Integer[][]` (not `int[][]`) so `null` means "not computed yet" — 0 might be a real answer.

@exercise pat-dp2-drill-paths

@exercise pat-dp2-drill-minpath

Apply it: Unique Paths, Longest Common Subsequence.
