Here's an interview trap that catches people constantly: you put your own objects into a `HashSet` expecting duplicates to collapse — and they don't. Understanding why (and the fix) is essential the moment a problem involves custom objects as keys or set members.

## The default is identity

By default, `equals` compares **references** — "are these the exact same object in memory?" — and `hashCode` is derived from the object's address. So two *different* `Point` objects with the same coordinates are considered unequal:

```java
class Point { int x, y; Point(int x, int y) { this.x = x; this.y = y; } }

Point a = new Point(1, 2);
Point b = new Point(1, 2);
a.equals(b);                 // false! different objects
Set<Point> set = new HashSet<>();
set.add(a); set.add(b);
set.size();                  // 2 — no dedup, because they're "different"
```

@exercise eq-mcq-why

## Override both — always together

To make value-equal objects behave as equal, override `equals` **and** `hashCode`. They're a pair: a `HashSet`/`HashMap` first buckets by `hashCode`, then confirms with `equals`.

```java
class Point {
    int x, y;
    Point(int x, int y) { this.x = x; this.y = y; }

    @Override
    public boolean equals(Object o) {
        if (!(o instanceof Point)) return false;
        Point p = (Point) o;
        return x == p.x && y == p.y;
    }

    @Override
    public int hashCode() {
        return Objects.hash(x, y);   // combines the fields; needs java.util.Objects
    }
}
```

`Objects.hash(...)` is the easy, correct way to build a hash from your fields — no need to hand-roll the classic `31 * result + field` formula (though you'll see it in older code).

Or skip the boilerplate entirely: `record Point(int x, int y) {}` generates exactly these two methods for you.

@exercise eq-fill-skeleton

## The contract (interviewers love this)

The rule that makes hash-based collections work: **if `a.equals(b)`, then `a.hashCode() == b.hashCode()`.** Equal objects *must* share a hash. (The reverse isn't required — unequal objects may collide, which is fine.) Override only one and you break `HashSet`/`HashMap` in subtle, maddening ways.

@exercise eq-mcq-contract

## Prove it

@exercise eq-code-distinct

## The array-key trap

Arrays never override `equals` or `hashCode`. So an `int[]` key has the exact same identity problem as the un-overridden `Point`, and you can't fix it by editing the class:

```java
Set<int[]> seen = new HashSet<>();
seen.add(new int[]{1, 2});
seen.contains(new int[]{1, 2});   // false — a different array object
```

This bites constantly in grid problems ("have I visited cell `(r, c)`?"). The code compiles and runs. It just never finds anything. Pick a key type that compares by **value** instead:

| Key | Example | Notes |
| --- | --- | --- |
| encoded int | `r * cols + c` | fastest; needs the column count |
| String | `r + "," + c` | always works; slower; the separator matters (`"1" + "11"` vs `"11" + "1"`) |
| `Arrays.toString` | `Arrays.toString(arr)` → `"[1, 2]"` | handy for whole arrays, e.g. a count signature |
| `List` | `List.of(r, c)` | `List` implements value `equals`/`hashCode` |
| record | `record Cell(int r, int c) {}` | named fields, free `equals`/`hashCode` |

```java
Set<String> visited = new HashSet<>();
visited.add(r + "," + c);
visited.contains(r + "," + c);    // true
```

@exercise eq-fill-array-key

@exercise eq-code-path-crossing

## Recap

- Default `equals`/`hashCode` = identity; two value-equal objects are different keys.
- Override both: `instanceof` + field compare, and `Objects.hash(x, y)`. Or use a `record`.
- Contract: equal ⇒ same hash; same hash ⇏ equal.
- `int[]` keys never match by value. Use `r * cols + c`, `r + "," + c`, `Arrays.toString(a)`, `List.of(r, c)`, or a record.
