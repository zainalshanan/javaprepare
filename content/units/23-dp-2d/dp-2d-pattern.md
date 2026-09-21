2-D DP uses a state with **two** numbers. Usually that's a cell in a grid, or "the first `i` characters of one string and the first `j` of another". Sometimes it's an interval `[l, r]`, or an index plus a running total. The 4-step recipe from 1-D DP still applies. What gets harder is choosing the state and the fill order.

## Grid DP: Unique Paths

A robot moves only right or down. `dp[i][j]` = the number of paths into cell `(i, j)`. The last move came from above or from the left:

```java
int[][] dp = new int[m][n];
for (int i = 0; i < m; i++) dp[i][0] = 1;       // left column: only straight down
for (int j = 0; j < n; j++) dp[0][j] = 1;       // top row: only straight right
for (int i = 1; i < m; i++)
    for (int j = 1; j < n; j++)
        dp[i][j] = dp[i - 1][j] + dp[i][j - 1];
```

`m = 3, n = 4`. Each cell is the sum of the cell above and the cell to the left:

```text
 1   1   1   1
 1   2   3   4
 1   3   6  10   ← answer
```

**Order**: row by row, left to right, so the cells above and to the left are always done. Each row only reads the previous row, so a single `int[] dp` updated in place (`dp[j] += dp[j-1]`) is enough.

@exercise pat-dp2-drill-paths

@exercise pat-dp2-drill-obstacles

@exercise pat-dp2-drill-minpath

## Two strings: Longest Common Subsequence

`dp[i][j]` = the LCS length of the first `i` characters of `a` and the first `j` characters of `b`. The table is `(m+1) × (n+1)`. Row 0 and column 0 stand for **empty prefixes**, which are all 0, so there are no special base cases.

```java
for (int i = 1; i <= m; i++) {
    for (int j = 1; j <= n; j++) {
        if (a.charAt(i - 1) == b.charAt(j - 1)) {
            dp[i][j] = dp[i - 1][j - 1] + 1;                   // match: diagonal + 1
        } else {
            dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);   // drop a char from one side
        }
    }
}
```

`a = "abcde"`, `b = "ace"`. `↖` marks a match (diagonal + 1), and `↑` / `←` show which neighbor supplied the max:

```text
         ""    a     c     e
   ""     0    0     0     0
   a      0   1↖    1←    1←
   b      0   1↑    1↑    1↑
   c      0   1↑    2↖    2←
   d      0   1↑    2↑    2↑
   e      0   1↑    2↑    3↖   ← LCS = 3 ("ace")
```

Following the `↖` arrows back from the bottom-right spells out the subsequence: e, c, a.

@exercise pat-dp2-mcq-offbyone

@exercise pat-dp2-fill-lcs

### Edit Distance: same table, three moves

`dp[i][j]` = the fewest edits to turn `word1[0..i)` into `word2[0..j)`. Row 0 is `j` (insert j characters) and column 0 is `i` (delete i characters). If the characters match, copy the diagonal. Otherwise take 1 + the minimum of three neighbors:

```text
   dp[i-1][j-1]   dp[i-1][j]
        ↘ replace    ↓ delete word1[i-1]
   dp[i][j-1]  →  dp[i][j]
     insert word2[j-1]
```

`"horse"` → `"ros"`:

```text
         ""   r   o   s
   ""     0   1   2   3
   h      1   1   2   3
   o      2   2   1   2
   r      3   2   2   2
   s      4   3   3   2
   e      5   4   4   3   ← 3 edits
```

### More prefix grids

- **Interleaving String**: `dp[i][j]` = "the first `i` characters of s1 and the first `j` of s2 can interleave into the first `i+j` of s3". The last character of s3 came from s1 (`dp[i-1][j] && s1[i-1] == s3[i+j-1]`) or from s2 (`dp[i][j-1] && s2[j-1] == s3[i+j-1]`). Check the lengths first. Picture it as a path through the grid: moving down takes a character from s1, moving right takes one from s2.
- **Distinct Subsequences**: `dp[i][j]` = the number of ways `s[0..i)` contains `t[0..j)` as a subsequence. Skipping `s[i-1]` is always allowed (`dp[i-1][j]`). If `s[i-1] == t[j-1]`, also add the ways that use it (`dp[i-1][j-1]`). Column 0 is all 1s, since the empty target matches exactly one way.

### Regular Expression Matching

`dp[i][j]` = "`s[0..i)` matches `p[0..j)`". A plain character or `.` matches the diagonal. `x*` has **two transitions**:

- **zero copies** of `x`: `dp[i][j-2]` (skip `x*` entirely)
- **one more copy**: if `x` matches `s[i-1]`, use `dp[i-1][j]`. This consumes a character of `s` but stays on the same `x*`, so it can keep matching.

```java
if (p.charAt(j - 1) == '*') {
    dp[i][j] = dp[i][j - 2]
            || (matches(s.charAt(i - 1), p.charAt(j - 2)) && dp[i - 1][j]);
} else if (matches(s.charAt(i - 1), p.charAt(j - 1))) {
    dp[i][j] = dp[i - 1][j - 1];
}
```

`s = "aab"`, `p = "c*a*b"`. Row 0 is seeded because `c*` and `c*a*` can match the empty string:

```text
         ""   c   *   a   *   b
   ""     T   F   T   F   T   F      * with zero copies: dp[0][j] = dp[0][j-2]
   a      F   F   F   T   T   F      dp[1][4]: a* takes one more 'a' → dp[0][4] = T
   a      F   F   F   F   T   F      dp[2][4]: one more 'a' → dp[1][4] = T
   b      F   F   F   F   F   T  ← match
```

## Unbounded knapsack counting: Coin Change II

`dp[a]` = the number of ways to make amount `a`, with `dp[0] = 1`. The **loop order** decides what you count:

```java
// coins OUTER → combinations (order doesn't matter)
for (int c : coins)
    for (int a = c; a <= amount; a++)
        dp[a] += dp[a - c];

// amounts OUTER → permutations (1+2 and 2+1 counted separately)
for (int a = 1; a <= amount; a++)
    for (int c : coins)
        if (c <= a) dp[a] += dp[a - c];
```

`coins = [1, 2]`, `amount = 3`:

| loop order | `dp[1]` | `dp[2]` | `dp[3]` | counts |
| --- | --- | --- | --- | --- |
| coins outer: after coin 1 | 1 | 1 | 1 | {1,1,1} |
| coins outer: after coin 2 | 1 | 2 | **2** | {1,1,1}, {1,2} |
| amounts outer | 1 | 2 | **3** | 1+1+1, 1+2, **2+1** |

With coins outer, by the time coin 2 is processed, coin 1 is never added *after* it, so every combination is built in one fixed coin order and counted once. With amounts outer, every coin can be the "last" coin at every amount, so each ordering is counted separately.

@exercise pat-dp2-mcq-looporder

### Target Sum: index and running sum

Each number gets `+` or `-`. The state is **(index, sum so far)**. The sum can be negative, so memoize with a `HashMap`, or shift sums by an offset of `total` to use an array:

```java
Map<String, Integer> memo = new HashMap<>();
int ways(int[] nums, int i, int sum, int target) {
    if (i == nums.length) return sum == target ? 1 : 0;
    String key = i + "," + sum;
    if (memo.containsKey(key)) return memo.get(key);
    int res = ways(nums, i + 1, sum + nums[i], target)
            + ways(nums, i + 1, sum - nums[i], target);
    memo.put(key, res);
    return res;
}
// array alternative: int[][] memo = new int[n][2 * total + 1], index sum + total
```

A faster version: if `P` is the sum of the `+` numbers, then `P - (total - P) = target`, so `P = (total + target) / 2`. Now you just count subsets that sum to `P`, a 0/1 knapsack with `j` going downwards.

## State machine: Stock with Cooldown

Each day you're in one of three states. Track the best profit for each and move between them:

```text
                 buy: rest - price
      ┌─────────────────────────────────┐
      │                                 ▼
  ┌────────┐                       ┌────────┐
  │  REST  │◄──┐                   │  HOLD  │◄──┐
  └────────┘   │ do nothing        └────────┘   │ keep holding
      ▲  └─────┘                       │  └─────┘
      │ cooldown over                  │ sell: hold + price
      │ (next day)                     ▼
      │                            ┌────────┐
      └────────────────────────────│  SOLD  │
                                   └────────┘
```

```java
int hold = Integer.MIN_VALUE, sold = 0, rest = 0;
for (int p : prices) {
    int prevSold = sold;
    sold = hold + p;                  // sell today
    hold = Math.max(hold, rest - p);  // keep holding, or buy (only from rest)
    rest = Math.max(rest, prevSold);  // idle, or yesterday's sale cools down
}
return Math.max(sold, rest);
```

You can't go from SOLD straight to HOLD. That missing edge *is* the cooldown.

## DFS + memo on cells: Longest Increasing Path in a Matrix

`best(r, c)` = the longest strictly increasing path **starting** at `(r, c)`, which is 1 + the best over neighbors with a larger value. It's hard to pick a fill order for a table here, so recurse and cache instead:

```java
int dfs(int[][] m, int r, int c) {
    if (memo[r][c] != 0) return memo[r][c];
    int best = 1;
    for (int[] d : dirs) {
        int nr = r + d[0], nc = c + d[1];
        if (inBounds(nr, nc) && m[nr][nc] > m[r][c]) best = Math.max(best, 1 + dfs(m, nr, nc));
    }
    return memo[r][c] = best;
}
```

You don't need a visited set. A strictly increasing path can't return to a cell it already used, so the moves form a DAG. Each cell is computed once, which makes it O(rows·cols).

## Interval DP: Burst Balloons

Choosing the *first* balloon to burst doesn't work, because bursting it changes its neighbors' neighbors. Instead, choose the balloon burst **last** in a range. When it goes, everything else in the range is already gone, so its neighbors are the fixed walls just outside the range.

Pad `nums` with a `1` on both ends. `dp[l][r]` = the most coins from bursting every balloon in `[l..r]`, with `pad[l-1]` and `pad[r+1]` still standing:

```text
index:     0   1   2   3   4   5
padded:  [ 1 | 3 | 1 | 5 | 8 | 1 ]
               l ─────────── r          range [1..4]; try k = 4 (the 8) burst LAST

   [1..3] burst first, with 8 still standing as their right wall → dp[1][3] = 159
   then the 8 bursts between the walls pad[0] = 1 and pad[5] = 1 → 1·8·1 = 8
   [5..4] is empty                                                → 0

   dp[1][4] = dp[1][3] + pad[0]·pad[4]·pad[5] + dp[5][4] = 167 ✓
```

```java
for (int len = 1; len <= n; len++) {                 // short intervals first
    for (int l = 1; l + len - 1 <= n; l++) {
        int r = l + len - 1;
        for (int k = l; k <= r; k++) {               // k = last balloon in [l..r]
            dp[l][r] = Math.max(dp[l][r],
                dp[l][k - 1] + pad[l - 1] * pad[k] * pad[r + 1] + dp[k + 1][r]);
        }
    }
}
return dp[1][n];
```

**Order by interval length.** `dp[l][r]` depends on strictly shorter intervals, so loop over lengths from short to long, not over `l` and `r` directly. That's O(n³).

@exercise pat-dp2-fill-interval

## Apply it

| Template | Problems |
| --- | --- |
| Grid paths | Unique Paths |
| Two-string prefix grid | Longest Common Subsequence, Edit Distance, Interleaving String, Distinct Subsequences, Regular Expression Matching |
| Knapsack counting (index/amount × sum) | Coin Change II, Target Sum |
| State machine | Best Time to Buy and Sell Stock with Cooldown |
| DFS + memo on cells | Longest Increasing Path in a Matrix |
| Interval DP (choose the last) | Burst Balloons |

## Recap

- Two-string DP: `(m+1) × (n+1)` table, row and column 0 are empty prefixes, compare `charAt(i-1)` and `charAt(j-1)`.
- LCS: a match takes the diagonal + 1, otherwise max(up, left). Edit distance: a match copies the diagonal, otherwise 1 + min(diagonal, up, left).
- Regex `x*`: zero copies uses `dp[i][j-2]`, one more copy uses `dp[i-1][j]` if `x` matches.
- Coin Change II: coins outer counts combinations, amounts outer counts permutations.
- Can't find a fill order? Use DFS + memo (`Integer[][]`, or a `HashMap` for negative or sparse keys).
- Interval DP: pick the element handled **last**, and loop over interval length from short to long.
