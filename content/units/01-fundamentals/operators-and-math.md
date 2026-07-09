## Arithmetic

```java
a + b;   a - b;   a * b;
a / b;   // integer division when both are ints: 7 / 2 == 3
a % b;   // remainder (modulo): 7 % 2 == 1
```

Two facts you will use in nearly every problem:

- **Integer division truncates.** `5 / 2` is `2`, not `2.5`. Cast if you need the real value: `(double) 5 / 2` is `2.5`.
- **`%` gets you digits and cycling.** `n % 10` is the last digit of `n`; `i % k` cycles `0,1,...,k-1` as `i` grows.

Careful: in Java, `%` of a negative is negative — `-7 % 3 == -1`, not `2`. The safe non-negative form is `((a % b) + b) % b`.

@exercise ops-mcq-intdiv

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

`&&` short-circuits: in `i < n && arr[i] > 0`, if `i < n` is false, `arr[i]` is never evaluated — that ordering prevents out-of-bounds crashes and is a standard idiom.

@exercise ops-mcq-shortcircuit

## The Math you'll actually use

```java
Math.max(a, b);     Math.min(a, b);
Math.abs(x);
Math.pow(2, 10);    // returns double! cast: (int) Math.pow(2, 10)
Math.sqrt(x);       // double
```

And the overflow-related constants: `Integer.MAX_VALUE`, `Integer.MIN_VALUE`, `Long.MAX_VALUE`.

@exercise ops-fill-math

## Digits practice

The `% 10` / `/ 10` pair peels a number apart digit by digit — you'll use it in Reverse Integer and Palindrome Number:

```java
int n = 507;
n % 10;   // 7   (last digit)
n / 10;   // 50  (everything but the last digit)
```

@exercise ops-lastdigit

@exercise ops-drill-minmax

## Reference drills

Rapid recall of the Math toolbox. Fill the blank, then write it live.

@exercise ops-ref-math-fill

@exercise ops-ref-math-code
