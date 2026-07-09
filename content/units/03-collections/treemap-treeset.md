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
```

`floor`/`ceiling` return `null` when nothing qualifies — check before unboxing!

## TreeMap

Same navigation, but with values attached:

```java
TreeMap<Integer, String> tm = new TreeMap<>();
tm.put(3, "c");  tm.put(1, "a");
tm.firstKey();       // 1
tm.floorKey(2);      // 1
tm.ceilingKey(2);    // 3
```

Iterating a TreeMap visits keys in ascending order — handy when output must be sorted.

@exercise tm-mcq-floor

@exercise tm-fill-nav

## When to reach for it

- "Snapshot at timestamp" / "most recent event ≤ t" → `TreeMap.floorKey`
- Calendar booking (no overlaps) → `floor`/`ceiling` of the new interval
- Otherwise, if you only need lookups — plain HashMap is faster

@exercise tm-closest

## Reference drills

Rapid recall of the TreeSet / TreeMap navigation operations. Fill the blank, then write it live.

@exercise tm-ref-set-fill

@exercise tm-ref-set-code

@exercise tm-ref-map-fill

@exercise tm-ref-map-code
