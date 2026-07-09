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

## Drill it

Time to make this automatic. Write it from a blank editor — no peeking.

@exercise vars-drill-declare
