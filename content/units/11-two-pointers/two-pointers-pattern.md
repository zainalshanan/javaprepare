Two pointers turns "check all pairs" O(n²) into O(n) — when the data has **structure** (usually: it's sorted, or it's a palindrome check) that tells you which pointer to move.

## The template

```java
int l = 0, r = n - 1;
while (l < r) {
    if (/* current pair is the answer */) return ...;
    else if (/* need a bigger sum/value */) l++;   // sorted: left++ increases
    else r--;                                       // sorted: right-- decreases
}
```

The insight for sorted arrays: if `nums[l] + nums[r]` is too small, **no** pair using `l` can work (r was already the biggest) — so `l++` safely discards it. Each step eliminates one index forever: O(n).

## The palindrome variant

```java
int l = 0, r = s.length() - 1;
while (l < r) {
    if (s.charAt(l) != s.charAt(r)) return false;
    l++; r--;
}
return true;
```

@exercise pat-tp-mcq-why

## Same-direction variant (slow & fast)

Both pointers move rightward: `slow` marks where the next kept element goes, `fast` scans. That's in-place dedup/removal (Remove Duplicates, Move Zeroes):

```java
int slow = 0;
for (int fast = 0; fast < n; fast++) {
    if (/* keep nums[fast] */) {
        nums[slow++] = nums[fast];
    }
}
```

@exercise pat-tp-drill-pal

@exercise pat-tp-drill-dedup

Apply it: Valid Palindrome, Two Sum II, 3Sum.
