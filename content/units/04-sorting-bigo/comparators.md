"Sort it first" is the opening move of Intervals, Greedy, and many array problems. Custom orders need **comparators**. You already know the syntax from the Lambdas lesson: a comparator is just a `(a, b) -> ...` lambda. This lesson is about writing the *right* one.

## Sorting basics

```java
Arrays.sort(nums);                   // int[] ascending, in place
Arrays.sort(words);                  // String[] alphabetical
Collections.sort(list);              // List ascending
list.sort(comparator);               // List with a custom order
Arrays.sort(objects, comparator);    // object array with a custom order
```

## `int[]` can't take a comparator

`Arrays.sort(int[], comparator)` does not exist. Comparators work on **objects**, and `int` is a primitive. So this doesn't compile:

```java
int[] nums = {3, 1, 2};
Arrays.sort(nums, (a, b) -> Integer.compare(b, a));   // compile error
```

Your options for a descending `int[]`:

```java
// 1. sort ascending, then read (or reverse) from the back
Arrays.sort(nums);

// 2. box to Integer[], which does accept a comparator
Integer[] boxed = new Integer[nums.length];
for (int i = 0; i < nums.length; i++) boxed[i] = nums[i];
Arrays.sort(boxed, Collections.reverseOrder());
```

`int[][]` is different: each row is an `int[]` **object**, so `Arrays.sort(intervals, (a, b) -> ...)` works directly.

@exercise cmp-mcq-primitive

## What the comparator returns

A comparator answers "given `a` and `b`, who goes first?":

- **negative** → `a` first
- **positive** → `b` first
- **zero** → tie (Java's object sort is stable, so ties keep their input order)

```java
Arrays.sort(intervals, (a, b) -> Integer.compare(a[0], b[0]));    // by start, ascending
words.sort((a, b) -> Integer.compare(b.length(), a.length()));   // by length, descending
```

Swapping the arguments, `(b, a)` instead of `(a, b)`, flips ascending to descending.

@exercise cmp-mcq-direction

## `Integer.compare`, not `a - b`

You'll see `(a, b) -> a[0] - b[0]` all over the internet. It returns the right sign until the subtraction overflows:

```java
int a = Integer.MIN_VALUE, b = 1;
a - b;                    // 2147483647 — positive! claims a > b
Integer.compare(a, b);    // -1 — correct
```

LeetCode inputs often include values near ±2³¹ (like `[-2147483648, 2147483647]` intervals). `Integer.compare` costs nothing and never overflows, so make it the habit.

## Tie-breakers

Primary key first; only on a tie fall through to the secondary key:

```java
// by length, then alphabetically
words.sort((a, b) -> a.length() != b.length()
        ? Integer.compare(a.length(), b.length())
        : a.compareTo(b));
```

`a.compareTo(b)` is the built-in alphabetical comparison for Strings (it also works on `Integer`, `Long`, etc.).

@exercise cmp-fill-sort

## Comparator builders

`Comparator` has static helpers that build the same lambdas for you and chain nicely:

```java
words.sort(Comparator.comparingInt(String::length));                    // by length
words.sort(Comparator.comparingInt(String::length).reversed());         // longest first
words.sort(Comparator.comparingInt(String::length)
        .thenComparing(Comparator.naturalOrder()));                     // length, then A–Z

Arrays.sort(people, Comparator.comparingInt((int[] p) -> p[1])           // by p[1]...
        .thenComparingInt(p -> p[0]));                                  // ...then p[0]

list.sort(Collections.reverseOrder());   // descending natural order
```

| Builder | Meaning |
| --- | --- |
| `Comparator.comparingInt(keyFn)` | ascending by an `int` key |
| `.thenComparingInt(keyFn)` / `.thenComparing(cmp)` | tie-breaker |
| `.reversed()` | flip the whole chain built so far |
| `Collections.reverseOrder()` / `Comparator.reverseOrder()` | descending natural order |

One quirk: when you chain `.reversed()` or `.thenComparing...` onto a lambda key, Java can no longer infer its type. Write the parameter type (`(int[] p) -> p[1]`) or use a method reference like `String::length`. When in doubt, the plain lambda with a `? :` tie-breaker always works.

@exercise cmp-fill-chain

## Practice

@exercise cmp-sort-strings

@exercise cmp-drill-intervals

@exercise cmp-code-sort-desc

## Aside: `Comparable`, a class's natural order

A comparator is an *external* rule you hand to `sort`. A class can also define its *own* default order by implementing `Comparable<T>`. Then `Collections.sort(list)`, `TreeSet` and `PriorityQueue` use it with no comparator at all:

```java
class Person implements Comparable<Person> {
    int id, age;
    Person(int id, int age) { this.id = id; this.age = age; }

    @Override
    public int compareTo(Person other) {
        return Integer.compare(this.age, other.age);   // negative: this first
    }
}

Collections.sort(people);   // by age, no comparator needed
```

`compareTo` uses the same sign convention as `compare`. `String` and `Integer` implement `Comparable`, which is why `Collections.sort` works on them. NeetCode solutions almost never need you to implement it yourself — a comparator lambda at the call site is shorter and more flexible — but you should recognize it when you read it.

@exercise comp-mcq-vs

@exercise comp-fill-skeleton

## Reference drills

Rapid recall of the comparator forms. Fill the blank, then write it live.

@exercise cmp-ref-fill

@exercise cmp-ref-code

## Recap

- `Arrays.sort(rows, (a, b) -> Integer.compare(a[0], b[0]))`; swap to `(b, a)` for descending.
- `Integer.compare(x, y)`, never `x - y` (overflow).
- `int[]` takes no comparator: sort then reverse, or box to `Integer[]` with `Collections.reverseOrder()`.
- `Comparator.comparingInt(String::length).thenComparing(Comparator.naturalOrder())`, `.reversed()`.
- Tie-break inline: `a[0] != b[0] ? Integer.compare(a[0], b[0]) : Integer.compare(a[1], b[1])`.
