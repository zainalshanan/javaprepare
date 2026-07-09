"Sort it first" is the opening move of Intervals, Greedy, and many array problems — and custom orders need **comparators**.

## Sorting basics

```java
Arrays.sort(nums);              // int[] ascending, in place
Collections.sort(list);         // List ascending
```

Descending `int[]` is awkward (primitives can't take comparators) — sort ascending and read backwards, or use boxed `Integer[]`.

## The comparator lambda

A comparator answers: *given a and b, who goes first?*

```java
// sort 2D intervals by start value
Arrays.sort(intervals, (a, b) -> Integer.compare(a[0], b[0]));

// strings by length
words.sort((a, b) -> Integer.compare(a.length(), b.length()));

// descending: swap the arguments
words.sort((a, b) -> Integer.compare(b.length(), a.length()));
```

Return **negative** → `a` first; **positive** → `b` first; **zero** → tie. `Integer.compare(x, y)` produces exactly that. You'll see `(a, b) -> a[0] - b[0]` in the wild — it works until the subtraction overflows; `Integer.compare` is the safe habit.

@exercise cmp-mcq-direction

## Tie-breakers

Chain conditions: primary key first, then secondary:

```java
// by length, then alphabetically
words.sort((a, b) -> a.length() != b.length()
        ? Integer.compare(a.length(), b.length())
        : a.compareTo(b));
```

`a.compareTo(b)` is the built-in String alphabetical comparison (also works for Integer, etc.).

@exercise cmp-fill-sort

## Comparator helpers

```java
list.sort(Comparator.comparingInt(String::length));            // same as above
list.sort(Comparator.comparingInt(String::length).reversed());
```

Know these exist; the lambda form is more flexible.

@exercise cmp-sort-strings

@exercise cmp-drill-intervals

## Reference drills

Rapid recall of the comparator forms. Fill the blank, then write it live.

@exercise cmp-ref-fill

@exercise cmp-ref-code
