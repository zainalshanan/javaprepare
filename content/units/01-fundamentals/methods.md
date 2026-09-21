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
- Parameters are local copies: reassigning `a` inside doesn't change the caller's variable. (Arrays behave differently — their *contents* are shared. More on that in Arrays.)

@exercise methods-mcq-return

@exercise methods-predict-copy

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
public boolean allDigitsOdd(int n) {
    while (n > 0) {
        if (n % 10 % 2 == 0) return false;   // found an even digit — done
        n /= 10;
    }
    return true;                              // survived the loop
}
```

This "return false on violation / return true after the loop" shape appears in dozens of NeetCode problems.

@exercise methods-isprime

@exercise methods-drill-helper

## Recap

- `<returnType> name(<type> param, ...) { ... }`; `void` returns nothing.
- Every path of a non-void method must `return`.
- Primitive parameters are copies — reassigning them never affects the caller.
- Helpers live in the same class, are called by bare name, and are `private` by convention.
- Validation shape: `return false` inside the loop on a violation, `return true` after it.
