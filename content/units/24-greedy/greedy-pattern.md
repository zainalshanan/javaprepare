Greedy means making the locally best choice at each step and never going back on it. There's no single template. There are a handful of recurring **moves** plus one obligation: showing that the greedy choice is safe.

## Is the greedy choice safe? (the exchange argument)

Before you trust a greedy, run this check in plain language: *"Take any optimal answer that does NOT make my greedy choice. Can I swap in my choice without making it worse?"* If the swap always works, some optimal answer makes the greedy choice, so committing to it early is safe. Example: in Hand of Straights, the smallest card has to start a group, because nothing smaller exists to come before it. Any valid grouping already puts it first, so there's nothing to swap.

If you find a case where the swap makes things worse, stop using greedy. The problem probably needs DP.

## Move 1: Kadane's running sum (Maximum Subarray)

At each element, either extend the current run or start fresh here:

```java
int best = nums[0], running = nums[0];          // seed with nums[0], NOT 0
for (int i = 1; i < nums.length; i++) {
    running = Math.max(nums[i], running + nums[i]);   // extend or restart
    best = Math.max(best, running);
}
return best;
```

Trace on `[-2, 1, -3, 4, -1, 2, 1, -5, 4]`:

| i | `nums[i]` | `running + nums[i]` | choice | `running` | `best` |
| --- | --- | --- | --- | --- | --- |
| 0 | -2 | — | seed | -2 | -2 |
| 1 | 1 | -1 | **restart** | 1 | 1 |
| 2 | -3 | -2 | extend | -2 | 1 |
| 3 | 4 | 2 | **restart** | 4 | 4 |
| 4 | -1 | 3 | extend | 3 | 4 |
| 5 | 2 | 5 | extend | 5 | 5 |
| 6 | 1 | 6 | extend | 6 | **6** |
| 7 | -5 | 1 | extend | 1 | 6 |
| 8 | 4 | 5 | extend | 5 | 6 |

**Why dropping is safe:** `running` is the best sum of a subarray *ending here*. If it's negative, adding it to any future subarray makes that subarray smaller. Cutting it off can only help. Restarts happen exactly when `running` was negative.

@exercise pat-gd-mcq-kadane

## Move 2: farthest reach (Jump Game I and II)

**Can you reach the end?** Keep track of the farthest index you can reach. If the scan ever moves past it, you're stuck:

```java
int reach = 0;
for (int i = 0; i < nums.length; i++) {
    if (i > reach) return false;             // can't even stand here
    reach = Math.max(reach, i + nums[i]);
}
return true;
```

**Fewest jumps?** Think of it as BFS by levels. Level *k* is the window of indices reachable in exactly *k* jumps. While you scan a window, record the `farthest` index it can reach. That becomes the end of the next window. Each time you finish a window, you've used one jump:

```text
index:   0    1    2    3    4
nums:    2    3    1    1    4
        [0]  [1 ------ 2]  [3 ------ 4]
level:   0        1              2          → 2 jumps

at i=0 (curEnd=0): farthest=2 → window done, jumps=1, curEnd=2
at i=2 (curEnd=2): farthest=max(1+3, 2+1)=4 → jumps=2, curEnd=4
```

```java
int jumps = 0, curEnd = 0, farthest = 0;
for (int i = 0; i < nums.length - 1; i++) {   // stop before last index
    farthest = Math.max(farthest, i + nums[i]);
    if (i == curEnd) {                          // finished this level
        jumps++;
        curEnd = farthest;
    }
}
return jumps;
```

@exercise pat-gd-fill-jump2

## Move 3: reset the start (Gas Station)

Two facts:

1. If `sum(gas) >= sum(cost)`, some start works. If not, return `-1`.
2. Scan with a running `tank += gas[i] - cost[i]`. If `tank < 0` at station `i`, set `start = i + 1` and `tank = 0`.

```java
int total = 0, tank = 0, start = 0;
for (int i = 0; i < gas.length; i++) {
    int diff = gas[i] - cost[i];
    total += diff;
    tank += diff;
    if (tank < 0) { start = i + 1; tank = 0; }
}
return total >= 0 ? start : -1;
```

**Why skipping everything from `start` to `i` is safe:** Suppose you started at `start` and ran dry at `i`. Any station `k` between them was reached with `tank >= 0`. Starting fresh at `k` means arriving with exactly 0 fuel, which is no better. So a start at `k` also runs dry by `i`, and none of those stations can be the answer.

@exercise pat-gd-mcq-gas

## Move 4: smallest first (Hand of Straights)

The smallest card left must *start* a group, so build that group right away. A `TreeMap` gives you counts in sorted order:

```java
TreeMap<Integer, Integer> count = new TreeMap<>();
for (int c : hand) count.merge(c, 1, Integer::sum);
while (!count.isEmpty()) {
    int first = count.firstKey();
    for (int v = first; v < first + groupSize; v++) {
        Integer cnt = count.get(v);
        if (cnt == null) return false;          // a gap in the run
        if (cnt == 1) count.remove(v); else count.put(v, cnt - 1);
    }
}
return true;
```

## Move 5: filter, then cover (Merge Triplets)

Taking a max never lowers a value. So any triplet with even one component **greater** than the target can never be used. Skip it. Merging all the remaining triplets is always safe. You only need each target coordinate to appear exactly in at least one of them:

```java
boolean[] hit = new boolean[3];
for (int[] t : triplets) {
    if (t[0] > target[0] || t[1] > target[1] || t[2] > target[2]) continue;
    for (int k = 0; k < 3; k++) if (t[k] == target[k]) hit[k] = true;
}
return hit[0] && hit[1] && hit[2];
```

## Move 6: extend the window end (Partition Labels)

A part has to reach the *last occurrence* of every letter inside it. Precompute those indices, then keep pushing the window end outward:

```text
s:     a b a b c b a c a | d e f e g d e | h i j h k l i j
last:  a=8  b=5  c=7     | d=14 e=15 ... | ...
end:   8 8 8 8 8 8 8 8 8 → i==end at 8, cut (size 9)
```

```java
int[] last = new int[26];
for (int i = 0; i < s.length(); i++) last[s.charAt(i) - 'a'] = i;
int start = 0, end = 0;
for (int i = 0; i < s.length(); i++) {
    end = Math.max(end, last[s.charAt(i) - 'a']);
    if (i == end) { sizes.add(end - start + 1); start = i + 1; }
}
```

## Move 7: track a range, not one value (Valid Parenthesis String)

Each `*` could be `(`, `)`, or nothing. Don't branch on it. Keep `[low, high]`, the fewest and most unmatched `(` that are possible so far:

| char | `low` | `high` |
| --- | --- | --- |
| `(` | +1 | +1 |
| `)` | −1 | −1 |
| `*` | −1 (acts as `)`) | +1 (acts as `(`) |

If `high < 0`, return false: there are too many `)` even in the best case. Clamp `low` at 0, since the open count can't go negative. At the end, the string is valid if `low == 0`.

@exercise pat-gd-fill-kadane

@exercise pat-gd-drill-kadane

@exercise pat-gd-drill-reach

## Apply it

- **Running sum:** Maximum Subarray
- **Farthest reach:** Jump Game → Jump Game II
- **Reset the start:** Gas Station
- **Smallest first / filter-cover:** Hand of Straights, Merge Triplets to Form Target Triplet
- **Window end:** Partition Labels
- **Range tracking:** Valid Parenthesis String

## Recap

- Greedy is only safe if you can argue that swapping your choice into any optimal answer doesn't make it worse. If you can't argue that, try DP.
- Kadane: `running = max(x, running + x)`. Seed with `nums[0]` so all-negative arrays work.
- Jump II = BFS levels: `farthest` grows, and `i == curEnd` means one more jump.
- Gas Station: `total >= 0` means an answer exists. If `tank < 0`, restart at `i + 1`.
- Partition Labels: `end = max(end, last[c])` and cut when `i == end`. Parens with `*`: track `[low, high]`.
