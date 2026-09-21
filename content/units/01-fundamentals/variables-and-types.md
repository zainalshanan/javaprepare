Java is **statically typed**: every variable declares its type up front, and the compiler holds you to it.

```java
int n = 10;                   // whole numbers
long big = 10_000_000_000L;   // big whole numbers — note the L suffix
double d = 3.14;              // decimals
char c = 'a';                 // ONE character, single quotes
boolean flag = true;          // true or false
String s = "abc";             // text, double quotes, capital S
```

The ones you'll use constantly on LeetCode: `int`, `long`, `double`, `char`, `boolean`, `String`.

Two details that matter in interviews:

- `int` maxes out at `Integer.MAX_VALUE` = 2,147,483,647 (about 2.1 billion). Sums of big arrays can **overflow** — switch to `long` when totals can get large.
- `char` uses single quotes (`'a'`), `String` uses double quotes (`"a"`). They are different types.

@exercise vars-mcq-types

## Printing

```java
System.out.println(x);   // print x, then a newline
System.out.print(x);     // print x, no newline
```

`println` can print anything: numbers, strings, booleans. You can glue values together with `+`:

```java
int count = 3;
System.out.println("count = " + count);   // count = 3
```

@exercise vars-print

## Declaring and reassigning

Declare once with the type, reassign without it:

```java
int score = 0;    // declaration + assignment
score = 5;        // reassignment (no type!)
score = score + 1; // now 6
score++;           // shorthand for score = score + 1
```

@exercise vars-fill-declare

## Casting

Java won't silently squeeze a bigger type into a smaller one. You cast explicitly with `(type)`:

```java
double d = 3.99;
int i = (int) d;        // 3 — truncates toward zero, no rounding
double half = 5 / 2;    // 2.0 (!) int division happened first
double real = (double) 5 / 2;  // 2.5
```

@exercise vars-mcq-cast

@exercise vars-predict-div

## Overflow: when int wraps around

Going past `Integer.MAX_VALUE` doesn't crash — it silently **wraps** to the most negative int:

```java
int big = Integer.MAX_VALUE;   //  2147483647
big + 1;                       // -2147483648  (that's Integer.MIN_VALUE)
```

The sneaky version is **multiplication**. Both operands are `int`, so the product is computed in `int` *before* it's stored:

```java
int a = 100_000, b = 100_000;
long wrong = a * b;           // 1410065408 — overflowed, THEN widened
long alsoWrong = (long) (a * b);  // same: the cast comes too late
long right = (long) a * b;    // 10000000000 — a is long, so the math is long
```

Rule: cast **one operand** before the operator, not the result after it.

@exercise vars-predict-overflow

@exercise vars-mcq-longcast

## Sentinels: MAX_VALUE and MIN_VALUE

When you track "the smallest so far" or "the largest so far", start from the extreme so the first real value always wins:

```java
int minSoFar = Integer.MAX_VALUE;   // anything real is smaller
int maxSoFar = Integer.MIN_VALUE;   // anything real is bigger
long bigMin  = Long.MAX_VALUE;      // same idea for long
```

You'll update these inside loops (a few lessons from now). A result still equal to `Integer.MAX_VALUE` at the end usually means "nothing found".

@exercise vars-fill-sentinels

## Drill it

Time to make this automatic. Write it from a blank editor — no peeking.

@exercise vars-drill-declare

@exercise vars-drill-longmul

## Recap

- Types: `int`, `long` (`5_000_000_000L`), `double`, `char` (`'a'`), `boolean`, `String` (`"a"`).
- `int / int` truncates: `7 / 2 == 3`; use `(double) a / b` for decimals.
- `(int) 3.9 == 3` — casts truncate toward zero.
- Overflow wraps silently; multiply as `(long) a * b`, never `(long) (a * b)`.
- Sentinels: `int min = Integer.MAX_VALUE; int max = Integer.MIN_VALUE;`
