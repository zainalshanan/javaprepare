## if / else if / else

```java
if (a > b) {
    // runs when a > b
} else if (a == b) {
    // runs when a == b
} else {
    // otherwise
}
```

Conditions must be `boolean` — Java has no "truthy" numbers. `if (x)` where `x` is an `int` doesn't compile.

Only the **first** matching branch runs. With `score = 82`:

| branch | test | result |
| --- | --- | --- |
| `if (score >= 90)` | 82 >= 90 → false | skip |
| `else if (score >= 80)` | 82 >= 80 → **true** | **run this → "B"** |
| `else if (score >= 70)` | — | never checked |
| `else` | — | never checked |

Once a branch is taken the chain stops, so order your conditions from most specific / highest down to least — otherwise a looser condition earlier grabs the case first.

@exercise cond-fizzbuzz-order

## The ternary operator

A one-line if/else that produces a value:

```java
int max = a > b ? a : b;         // if a > b then a else b
String label = n % 2 == 0 ? "even" : "odd";
```

Read it as: *condition* `?` *value-if-true* `:` *value-if-false*.

@exercise cond-fill-ternary

## switch

Useful when matching one value against several constants:

```java
switch (op) {
    case '+': result = a + b; break;
    case '-': result = a - b; break;
    default:  result = 0;
}
```

Forgetting `break` makes execution *fall through* into the next case — a classic bug. On LeetCode you'll write `if/else` far more often than `switch`; know it, don't overuse it.

@exercise cond-mcq-fallthrough

## Practice

FizzBuzz logic hinges on **check the most specific condition first** — a pattern that shows up whenever conditions overlap.

@exercise cond-fizzbuzz

@exercise cond-drill-grade
