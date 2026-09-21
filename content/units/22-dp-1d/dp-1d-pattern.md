Dynamic programming is recursion whose subproblems **repeat**, so you store each answer once instead of recomputing it. In 1-D DP the state is a single number: an index, a prefix length, or an amount. This lesson gives you a four-step recipe and the templates behind all twelve problems in this unit.

## The 4-step recipe

1. **State**: what does `dp[i]` *mean*? Say it as a full sentence.
2. **Recurrence**: how does `dp[i]` follow from smaller states? (Usually: "what was the last choice?")
3. **Base cases**: which states can you answer without the recurrence?
4. **Order**: fill states so everything `dp[i]` reads is already computed.

If you can't say step 1 precisely, the recurrence will come out wrong.

## Three ways to write it: Climbing Stairs

How many ways can you climb `n` steps, taking 1 or 2 at a time?

1. **State**: `ways(i)` = number of ways to reach step `i`.
2. **Recurrence**: the last move was either a 1-step (from `i-1`) or a 2-step (from `i-2`), so `ways(i) = ways(i-1) + ways(i-2)`.
3. **Base cases**: `ways(0) = 1` (standing at the bottom counts as one way) and `ways(1) = 1`.
4. **Order**: increasing `i`.

Plain recursion recomputes the same subtrees over and over, which is O(2ⁿ):

```text
ways(5)
├── ways(4)
│   ├── ways(3)
│   │   ├── ways(2)
│   │   └── ways(1)
│   └── ways(2)        ← computed again
└── ways(3)            ← the whole subtree again
```

**Top-down (memoization)** is the same recursion plus a cache:

```java
Integer[] memo = new Integer[n + 1];     // null = not computed yet
int ways(int i) {
    if (i <= 1) return 1;
    if (memo[i] != null) return memo[i];
    return memo[i] = ways(i - 1) + ways(i - 2);
}
```

**Bottom-up (table)** fills from the base cases upward, with no recursion:

```java
int[] dp = new int[n + 1];
dp[0] = 1; dp[1] = 1;
for (int i = 2; i <= n; i++) dp[i] = dp[i - 1] + dp[i - 2];
```

| `i` | 0 | 1 | 2 | 3 | 4 | 5 |
| --- | --- | --- | --- | --- | --- | --- |
| `dp[i]` | 1 | 1 | 2 | 3 | 5 | 8 |

**Rolling variables**: `dp[i]` only reads the two previous entries, so two variables are enough:

```java
int prev2 = 1, prev1 = 1;                 // dp[i-2], dp[i-1]
for (int i = 2; i <= n; i++) {
    int cur = prev1 + prev2;
    prev2 = prev1;                        // shift both left
    prev1 = cur;
}
return prev1;
```

All three are O(n) time. They use O(n), O(n), and O(1) space. Top-down is often easiest to *derive*, and bottom-up is easiest to optimize.

@exercise pat-dp1-mcq-state

@exercise pat-dp1-drill-fib

## Take or skip: House Robber

`dp[i]` = the most loot from houses `0..i`. At house `i`, either **skip** it (`dp[i-1]`) or **take** it, which rules out house `i-1` (`dp[i-2] + nums[i]`).

```java
int prev2 = 0, prev1 = 0;
for (int x : nums) {
    int cur = Math.max(prev1, prev2 + x);   // skip vs take
    prev2 = prev1;
    prev1 = cur;
}
return prev1;
```

`nums = [2, 7, 9, 3, 1]`:

| `i` | 0 | 1 | 2 | 3 | 4 |
| --- | --- | --- | --- | --- | --- |
| `nums[i]` | 2 | 7 | 9 | 3 | 1 |
| skip = `dp[i-1]` | 0 | 2 | 7 | 11 | 11 |
| take = `dp[i-2] + nums[i]` | 2 | 7 | 11 | 10 | **12** |
| `dp[i]` | 2 | 7 | 11 | 11 | **12** |

**House Robber II** (houses in a circle): the first and last houses are neighbors, so you can't take both. Run the linear version twice, once on `[0 .. n-2]` and once on `[1 .. n-1]`, and return the larger result. With a single house, just return it.

@exercise pat-dp1-drill-rob

## State = amount: Coin Change

The state doesn't have to be a position. `dp[a]` = the fewest coins that make amount `a`. The last coin used was some `c`, so:

```java
int[] dp = new int[amount + 1];
Arrays.fill(dp, amount + 1);            // "infinity": more coins than could ever be needed
dp[0] = 0;
for (int a = 1; a <= amount; a++) {
    for (int c : coins) {
        if (c <= a) dp[a] = Math.min(dp[a], dp[a - c] + 1);
    }
}
return dp[amount] > amount ? -1 : dp[amount];
```

`coins = [1, 2, 5]`:

| `a` | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `dp[a]` | 0 | 1 | 1 | 2 | 2 | 1 | 2 | 2 | 3 | 3 | 2 | **3** |

`dp[11] = min(dp[10] + 1, dp[9] + 1, dp[6] + 1) = min(3, 4, 3) = 3`.

Why `amount + 1` and not `Integer.MAX_VALUE`? Because `MAX_VALUE + 1` overflows to a negative number, which `min` would then pick. Also, greedy "take the biggest coin" fails: with `[1, 3, 4]` and amount 6, greedy gives 4+1+1 (3 coins), but 3+3 uses only 2.

@exercise pat-dp1-drill-squares

## Prefix states: Decode Ways and Word Break

**Decode Ways** (`'1'` = A … `"26"` = Z): `dp[i]` = the number of ways to decode the first `i` characters. The last piece is either one digit or two digits:

- **one digit** `s[i-1]`: valid unless it's `'0'`, so add `dp[i-1]`
- **two digits** `s[i-2..i-1]`: valid if it's between `10` and `26`, so add `dp[i-2]`

| `s = "226"` | `dp[0]` | `dp[1]` "2" | `dp[2]` "22" | `dp[3]` "226" |
| --- | --- | --- | --- | --- |
| one digit | — | '2' → +1 | '2' → +dp[1] = 1 | '6' → +dp[2] = 2 |
| two digits | — | — | "22" → +dp[0] = 1 | "26" → +dp[1] = 1 |
| `dp[i]` | 1 | 1 | 2 | **3** |

Watch the zeros. `"06"` gives 0 (a leading `0` can't be decoded). `"10"` gives 1 (the `0` can only pair with the `1`). `"30"` gives 0 (`0` can't stand alone and `30 > 26`).

**Word Break**: `dp[i]` = "the first `i` characters split into dictionary words". `dp[i]` is true if some earlier split `j` works *and* the rest is a word:

```java
Set<String> dict = new HashSet<>(wordDict);
boolean[] dp = new boolean[s.length() + 1];
dp[0] = true;                                   // empty prefix
for (int i = 1; i <= s.length(); i++) {
    for (int j = 0; j < i; j++) {
        if (dp[j] && dict.contains(s.substring(j, i))) { dp[i] = true; break; }
    }
}
```

`"leetcode"`: `dp[0]` is true, then `dp[4]` becomes true ("leet"), then `dp[8]` becomes true (j = 4, "code").

## Carry two extremes: Maximum Product Subarray

With sums, a subarray ending at `i` just extends the best one ending at `i-1`. With products, a **negative number turns the smallest product into the largest**. So track both the largest (`curMax`) and smallest (`curMin`) product ending here, and swap them when the new number is negative:

```java
int curMax = nums[0], curMin = nums[0], best = nums[0];
for (int i = 1; i < nums.length; i++) {
    int x = nums[i];
    if (x < 0) { int t = curMax; curMax = curMin; curMin = t; }
    curMax = Math.max(x, curMax * x);     // extend, or restart at x
    curMin = Math.min(x, curMin * x);
    best = Math.max(best, curMax);
}
```

| `x` | swap? | `curMax` | `curMin` | `best` |
| --- | --- | --- | --- | --- |
| -2 | (start) | -2 | -2 | -2 |
| 3 | no | max(3, -6) = 3 | min(3, -6) = -6 | 3 |
| -4 | yes → max=-6, min=3 | max(-4, 24) = **24** | min(-4, -12) = -12 | **24** |

## Best ending at i: Longest Increasing Subsequence

`dp[i]` = the length of the longest increasing subsequence that **ends at** `nums[i]`. Extend any earlier smaller element:

```java
int[] dp = new int[n];
Arrays.fill(dp, 1);                       // each element alone
int best = 1;
for (int i = 1; i < n; i++) {
    for (int j = 0; j < i; j++) {
        if (nums[j] < nums[i]) dp[i] = Math.max(dp[i], dp[j] + 1);
    }
    best = Math.max(best, dp[i]);
}
```

| `nums` | 10 | 9 | 2 | 5 | 3 | 7 | 101 | 18 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `dp` | 1 | 1 | 1 | 2 | 2 | 3 | **4** | **4** |

The answer is the **max over all `i`**, not `dp[n-1]`. This is O(n²). There's also an O(n log n) version, **patience sorting**: keep a sorted `tails` array where `tails[k]` is the smallest possible last element of an increasing subsequence of length k+1. For each number, binary-search it into place: replace the first tail `>=` it, or append. The length of `tails` is the answer.

## 0/1 subset sum: Partition Equal Subset Sum

Two equal halves means some subset sums to `total / 2` (an odd total means no). `dp[j]` = "some subset of the numbers so far sums to `j`":

```java
boolean[] dp = new boolean[target + 1];
dp[0] = true;
for (int x : nums) {
    for (int j = target; j >= x; j--) {     // BACKWARDS
        dp[j] = dp[j] || dp[j - x];
    }
}
```

**Why backwards?** Each number can be used only **once**. If you go forwards, `dp[j - x]` may already have been set *by this same `x`* earlier in the loop. Say `dp = {0}` and `x = 5`. Going forwards, `j = 5` sets `dp[5]`, and then `j = 10` reads that `dp[5]` and sets `dp[10]`, which uses the 5 twice. Going backwards, the larger `j` values are updated first, so every `dp[j - x]` still holds the value from before this number.

`nums = [1, 5, 11, 5]`, target 11:

| after number | reachable sums |
| --- | --- |
| (start) | {0} |
| 1 | {0, 1} |
| 5 | {0, 1, 5, 6} |
| 11 | {0, 1, 5, 6, **11**} |
| 5 | {0, 1, 5, 6, 10, **11**} |

@exercise pat-dp1-fill-subset

@exercise pat-dp1-mcq-backwards

## Palindromes: expand around the center

Every palindrome mirrors around a center. An **odd**-length palindrome is centered on a character (`"aba"`) and an **even**-length one on the gap between two characters (`"abba"`). There are `2n - 1` centers. Expand from each one while the ends match:

```java
int expand(String s, int l, int r) {      // returns the palindrome's length
    while (l >= 0 && r < s.length() && s.charAt(l) == s.charAt(r)) {
        l--;
        r++;
    }
    return r - l - 1;                      // loop overshot by one on each side
}

for (int i = 0; i < s.length(); i++) {
    int odd  = expand(s, i, i);            // center on s[i]
    int even = expand(s, i, i + 1);        // center between s[i] and s[i+1]
}
```

```text
"babad", center i = 2 ('b'):     l=2 r=2  b==b ✓
                                 l=1 r=3  a==a ✓
                                 l=0 r=4  b≠d  stop → length 4 - 0 - 1 = 3 ("aba")
```

- **Longest Palindromic Substring**: keep the longest. From center `i` and length `len`, `start = i - (len - 1) / 2`.
- **Palindromic Substrings**: every successful expansion step is one more palindrome, so count them.

Both are O(n²) time and O(1) space. A DP table `isPal[l][r]` also works, but uses O(n²) space.

@exercise pat-dp1-fill-expand

## Apply it

| Template | Problems |
| --- | --- |
| Fibonacci-style rolling variables | Climbing Stairs, Min Cost Climbing Stairs |
| Take / skip | House Robber, House Robber II |
| State = amount (min over last choice) | Coin Change |
| Prefix-length state | Decode Ways, Word Break |
| Carry max and min | Maximum Product Subarray |
| Best ending at `i` | Longest Increasing Subsequence |
| 0/1 subset sum (iterate backwards) | Partition Equal Subset Sum |
| Expand around center | Longest Palindromic Substring, Palindromic Substrings |

## Recap

- Recipe: state (a full sentence), recurrence (the last choice), base cases, order.
- Memo = recursion + cache. Table = loop from the bases. Rolling variables when only the last few states are read.
- `dp[a] = min(dp[a - c] + 1)` with sentinel `amount + 1`, never `MAX_VALUE + 1`.
- Negative numbers flip products: carry both `curMax` and `curMin`.
- 0/1 knapsack on a 1-D array: loop `j` **downwards** so each item is used once.
- Palindromes: `2n - 1` centers, odd `(i, i)` and even `(i, i + 1)`.
