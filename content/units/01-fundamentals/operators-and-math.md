## Arithmetic

```java
a + b;   a - b;   a * b;
a / b;   // integer division when both are ints: 7 / 2 == 3
a % b;   // remainder (modulo): 7 % 2 == 1
```

Two facts you will use in nearly every problem:

- **Integer division truncates.** `5 / 2` is `2`, not `2.5`. Cast if you need the real value: `(double) 5 / 2` is `2.5`.
- **`%` gets you digits and cycling.** `n % 10` is the last digit of `n`; `i % k` cycles `0,1,...,k-1` as `i` grows.

@exercise ops-mcq-intdiv

## Negative remainders and floorMod

In Java, `%` keeps the sign of the left operand — `-7 % 3 == -1`, not `2`. That breaks "wrap an index around a circle" code when the index goes negative. Two fixes:

```java
Math.floorMod(-7, 3);      // 2 — always in [0, 3) for a positive divisor
((-7 % 3) + 3) % 3;        // 2 — the same result, by hand
```

Reach for `Math.floorMod(i, n)` whenever `i` might be negative (circular arrays, moving left past index 0).

@exercise ops-predict-mod

@exercise ops-drill-wrap

## Compound assignment and increment

```java
x += 5;   // x = x + 5   (also -=, *=, /=, %=)
x++;      // x = x + 1
x--;      // x = x - 1
```

## Comparison and logic

```java
a == b;   a != b;   a < b;   a <= b;   a > b;   a >= b;

cond1 && cond2;   // AND (short-circuits)
cond1 || cond2;   // OR
!cond;            // NOT
```

`&&` short-circuits: in `d != 0 && n / d > 2`, if `d != 0` is false, `n / d` is never evaluated — so there's no division by zero. "Guard first, then use" is a standard idiom; you'll write it constantly as `i < n && ...` bounds checks once arrays arrive.

@exercise ops-mcq-shortcircuit

## The Math you'll actually use

```java
Math.max(a, b);     Math.min(a, b);
Math.abs(x);
Math.pow(2, 10);    // returns double! cast: (int) Math.pow(2, 10)
Math.sqrt(x);       // double
Math.floorMod(a, n);
```

And the overflow-related constants: `Integer.MAX_VALUE`, `Integer.MIN_VALUE`, `Long.MAX_VALUE`.

@exercise ops-fill-math

## Bit operators

Ints are 32 bits. A handful of bit tricks show up in NeetCode's Bit Manipulation section and as fast shortcuts elsewhere:

```java
x & 1       // 1 if x is odd, 0 if even (works for negatives too)
a ^ b       // XOR: 1 where bits differ.  a ^ a == 0,  a ^ 0 == a
x << k      // shift left: x * 2^k       (1 << 4 == 16)
x >> k      // shift right, keeps the sign: -8 >> 1 == -4
x >>> k     // shift right, fills with 0s: negatives become huge positives
```

`>>` vs `>>>` only differ on negative numbers:

```text
-8          = 11111111 11111111 11111111 11111000
-8 >> 1     = 11111111 11111111 11111111 11111100   = -4          (copies the sign bit)
-8 >>> 1    = 01111111 11111111 11111111 11111100   = 2147483644  (fills with 0)
```

XOR's "pairs cancel" property is the trick behind *Single Number*: `3 ^ 5 ^ 3 == 5`.

@exercise ops-predict-bits

@exercise ops-drill-xor

## Digits practice

The `% 10` / `/ 10` pair peels a number apart digit by digit — you'll use it in Reverse Integer and Palindrome Number:

```java
int n = 507;
n % 10;   // 7   (last digit)
n / 10;   // 50  (everything but the last digit)
```

Repeating that until nothing is left needs a `while` loop — the Loops lesson covers it fully, but the shape is simple: `while (n > 0) { ...use n % 10...; n /= 10; }`.

@exercise ops-lastdigit

@exercise ops-drill-minmax

## Reference drills

Rapid recall of the Math toolbox. Fill the blank, then write it live.

@exercise ops-ref-math-fill

@exercise ops-ref-math-code

## Recap

- `7 / 2 == 3`, `7 % 2 == 1`; `n % 10` = last digit, `n / 10` = drop it.
- `-7 % 3 == -1`; use `Math.floorMod(i, n)` for a non-negative wrap.
- Guard first: `d != 0 && n / d > 2` — `&&` stops at the first false.
- `Math.max/min/abs`; `Math.pow` returns `double` — cast it.
- Bits: `x & 1` odd test, `a ^ a == 0`, `1 << k` = 2^k, `>>` keeps sign, `>>>` fills 0.
