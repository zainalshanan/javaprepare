On LeetCode you implement one given method, but real solutions constantly add **helper methods** — for DFS, for validation checks, for anything reused. Writing them must be second nature.

## Anatomy

```java
public int maxOf(int a, int b) {
    if (a > b) return a;
    return b;
}
```

- `int` — return type. Use `void` when the method returns nothing.
- Every path through a non-void method must hit a `return`.
- Parameters are local copies: reassigning `a` inside doesn't change the caller's variable. (But **object contents** — like array elements — *are* shared. More on that in Arrays.)

@exercise methods-mcq-return

## Calling helpers

Inside a `Solution` class, methods call each other directly by name:

```java
class Solution {
    public boolean isNarcissistic(int n) {
        return digitCount(n) == 3;
    }

    private int digitCount(int n) {   // helper: private by convention
        int c = 0;
        while (n > 0) { c++; n /= 10; }
        return c;
    }
}
```

@exercise methods-fill-helper

## Early return

Returning as soon as the answer is known keeps code flat and fast — the standard style for validation:

```java
public boolean allPositive(int[] arr) {
    for (int x : arr) {
        if (x <= 0) return false;   // found a counterexample — done
    }
    return true;                     // survived the loop
}
```

This "return false on violation / return true after the loop" shape appears in dozens of NeetCode problems.

@exercise methods-isprime

@exercise methods-drill-helper
