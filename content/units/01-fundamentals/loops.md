Loops are the single most-typed construct in interviews. By the end of this lesson the classic `for` loop should flow out of your fingers.

## The classic for loop

```java
for (int i = 0; i < n; i++) {
    // runs with i = 0, 1, 2, ..., n-1
}
```

Three parts: *initialize* `int i = 0`; *condition* `i < n` (checked before every iteration); *step* `i++` (after every iteration). This exact shape — start at 0, go while `< n` — visits `n` items with indices `0..n-1`, which is precisely how arrays are laid out.

Variants you must also know cold:

```java
for (int i = n - 1; i >= 0; i--) { }      // reverse
for (int i = 0; i < n; i += 2) { }         // step by 2
for (int l = 0, r = n - 1; l < r; l++, r--) { }  // two pointers, both ends
```

### Trace it by hand

The fastest way to *see* what a loop does is a **trace table** — write down every variable after each iteration. Here `sum` accumulates over `nums = {4, 8, 15}`:

```java
int sum = 0;
for (int i = 0; i < 3; i++) {
    sum = sum + nums[i];
}
// sum is now 27
```

| iteration | `i` | `i < 3` ? | `nums[i]` | `sum` after body |
| --- | --- | --- | --- | --- |
| 1st | 0 | true | 4 | 4 |
| 2nd | 1 | true | 8 | 12 |
| 3rd | 2 | true | 15 | 27 |
| (stop) | 3 | **false** | — | 27 |

The body runs **3 times** (i = 0, 1, 2), and it's the *fourth* check — `3 < 3` is false — that ends the loop. That "run for indices 0..n-1, stop at n" rhythm is exactly why the condition is `i < n`. When a loop confuses you, trace three rows of it on paper; the bug almost always jumps out.

@exercise loops-fill-for

## while and do-while

```java
while (condition) { }      // 0 or more times
do { } while (condition);  // at least once (rare in interviews)
```

Use `while` when the number of iterations isn't known up front — e.g. peeling digits, moving pointers until they meet.

## break and continue

```java
break;      // exit the loop entirely
continue;   // skip to the next iteration
```

@exercise loops-mcq-trace

## Nested loops

A loop in a loop — the shape of grid problems and O(n²) pair-checking:

```java
for (int i = 0; i < rows; i++) {
    for (int j = 0; j < cols; j++) {
        // visits every (i, j) cell
    }
}
```

@exercise loops-countdown

@exercise loops-sum-evens

## Drills

These two shapes are the backbone of hundreds of problems. From a blank editor, until they're automatic:

@exercise loops-drill-basic

@exercise loops-drill-reverse
