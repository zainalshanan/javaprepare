Greedy means making the locally best choice at each step and never revisiting it. Unlike other categories there's no single template — there are two recurring **shapes**, plus a proof obligation.

## Shape 1: the running-best scan (Kadane's)

Max-sum contiguous subarray in one pass. At each element: either extend the previous run, or start fresh here — whichever is bigger:

```java
int best = nums[0], running = nums[0];
for (int i = 1; i < nums.length; i++) {
    running = Math.max(nums[i], running + nums[i]);   // extend or restart
    best = Math.max(best, running);
}
return best;
```

The greedy insight: a negative running sum can never help what follows — drop it.

## Shape 2: reachability / sort-then-take

Jump Game: track the farthest index reachable so far; if the scan ever passes it, you're stuck:

```java
int reach = 0;
for (int i = 0; i < nums.length; i++) {
    if (i > reach) return false;             // can't even stand here
    reach = Math.max(reach, i + nums[i]);
}
return true;
```

Many other greedy problems begin `Arrays.sort(...)` — commit to the cheapest/earliest option first (intervals unit runs on this).

@exercise pat-gd-mcq-kadane

## The proof obligation

Greedy is only correct when local choices can't hurt the global outcome. In interviews, say *why*: "dropping a negative prefix can only increase any future sum." If you can't sketch that argument, suspect DP instead.

@exercise pat-gd-drill-kadane

@exercise pat-gd-drill-reach

Apply it: Maximum Subarray, Jump Game.
