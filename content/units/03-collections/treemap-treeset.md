`TreeMap` and `TreeSet` keep their keys **sorted** at all times, with O(log n) operations. You need them far less often than HashMap — but when a problem asks for "the closest key ≤ x" or "smallest element ≥ x", nothing else does it cleanly.

## TreeSet

```java
TreeSet<Integer> ts = new TreeSet<>();
ts.add(5);  ts.add(1);  ts.add(9);

ts.first();        // 1  — smallest
ts.last();         // 9  — largest
ts.floor(6);       // 5  — largest element <= 6
ts.ceiling(6);     // 9  — smallest element >= 6
ts.floor(5);       // 5  — floor/ceiling are inclusive
ts.higher(5);      // 9  — strictly greater
ts.lower(5);       // 1  — strictly less
ts.pollFirst();    // 1  — removes and returns the smallest
```

`floor`/`ceiling`/`higher`/`lower` return `null` when nothing qualifies — store the result in an `Integer` and check before unboxing! (`first()`/`last()` throw on an empty set instead.)

## TreeMap

Same navigation, but with values attached. The key-returning methods end in `Key`; the ones ending in `Entry` return a `Map.Entry` with both key and value:

```java
TreeMap<Integer, String> tm = new TreeMap<>();
tm.put(3, "c");  tm.put(1, "a");  tm.put(7, "g");

tm.firstKey();         // 1
tm.lastKey();          // 7
tm.floorKey(2);        // 1    — largest key <= 2
tm.ceilingKey(2);      // 3    — smallest key >= 2
tm.firstEntry();       // 1=a  — smallest entry, stays in the map
tm.pollFirstEntry();   // 1=a  — smallest entry, REMOVED
tm.pollLastEntry();    // 7=g  — largest entry, REMOVED
```

Iterating a TreeMap visits keys in ascending order — handy when output must be sorted:

```java
for (Map.Entry<Integer, String> e : tm.entrySet()) { }   // ascending by key
```

`pollFirstEntry` makes a TreeMap work like a priority queue you can also look up by key, which is useful when you need "smallest" and "remove this specific key" in the same problem.

@exercise tm-mcq-floor

@exercise tm-fill-nav

@exercise tm-fill-poll

## When to reach for it

- "Snapshot at timestamp" / "most recent event ≤ t" → `TreeMap.floorKey`
- Calendar booking (no overlaps) → `floor`/`ceiling` of the new interval
- Need the min/max *and* arbitrary removals → `TreeMap` with `pollFirstEntry` / `remove(key)`
- Otherwise, if you only need lookups — plain HashMap is faster

@exercise tm-closest

## Reference drills

Rapid recall of the TreeSet / TreeMap navigation operations. Fill the blank, then write it live.

@exercise tm-ref-set-fill

@exercise tm-ref-set-code

@exercise tm-ref-map-fill

@exercise tm-ref-map-code

## Recap

- Sorted, O(log n): `TreeSet` `first/last/floor/ceiling/higher/lower/pollFirst`.
- `TreeMap`: `firstKey/lastKey/floorKey/ceilingKey`, and `firstEntry/pollFirstEntry/pollLastEntry`.
- floor/ceiling = inclusive; lower/higher = strict; all return `null` when nothing qualifies.
- `Integer k = tm.floorKey(t); if (k != null) ...` is Time Based Key-Value Store.
