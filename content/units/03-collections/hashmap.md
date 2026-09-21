`HashMap` is the single most useful structure on LeetCode. Key → value with O(1) put/get. If a problem says *count*, *lookup*, *seen before*, or *group by* — it's a HashMap.

## Core operations

```java
Map<Integer, Integer> map = new HashMap<>();
map.put(key, val);              // insert or overwrite
map.get(key);                   // value, or null if absent
map.getOrDefault(key, 0);       // value, or fallback — null-safe
map.containsKey(key);
map.remove(key);
map.size();
```

@exercise hm-mcq-get

## The counting idiom — memorize this cold

```java
Map<Character, Integer> count = new HashMap<>();
for (char c : s.toCharArray()) {
    count.put(c, count.getOrDefault(c, 0) + 1);
}
```

One line per element: read the current count (0 if new), add one, store back. Alternative spelling: `count.merge(c, 1, Integer::sum);` (the `Integer::sum` method reference from the Lambdas lesson combines the old count with the 1).

Trace it on `"aab"`:

| char `c` | `getOrDefault(c, 0)` | new value | map afterward |
| --- | --- | --- | --- |
| `a` | 0 | 1 | `{a=1}` |
| `a` | 1 | 2 | `{a=2}` |
| `b` | 0 | 1 | `{a=2, b=1}` |

The `getOrDefault(c, 0)` is doing the quiet heavy lifting: the *first* time a character appears there's no entry yet, and defaulting to 0 lets the very same line handle both "new" and "seen before" without an `if`.

@exercise hm-fill-count

## The grouping idiom

Append to a list stored at a key, creating the list on first touch:

```java
Map<String, List<String>> groups = new HashMap<>();
groups.computeIfAbsent(key, k -> new ArrayList<>()).add(word);
```

`computeIfAbsent` returns the existing list, or runs the lambda to create one. This single line is the heart of Group Anagrams.

## Iterating

```java
for (Map.Entry<String, Integer> e : map.entrySet()) {
    String k = e.getKey();
    int v = e.getValue();
}
for (String k : map.keySet()) { }     // keys only
for (int v : map.values()) { }        // values only
map.forEach((k, v) -> System.out.println(k + "=" + v));   // lambda form
```

A `HashMap` has **no order**. Never rely on the iteration order matching insertion or key order. If you need sorted keys, use a `TreeMap`; if you need entries ranked by value, sort them (next section).

@exercise hm-first-repeat

## Sorting entries by value

A map can't be sorted, but its entries can be copied into a list and sorted there:

```java
List<Map.Entry<Integer, Integer>> entries = new ArrayList<>(count.entrySet());
entries.sort((a, b) -> Integer.compare(b.getValue(), a.getValue()));   // highest count first

for (Map.Entry<Integer, Integer> e : entries) {
    int value = e.getKey(), freq = e.getValue();
}
```

This is the O(n log n) way to answer "the k most frequent" (Top K Frequent Elements has an O(n) bucket trick too).

@exercise hm-fill-sort-entries

## Removing while iterating

Same rule as lists: don't call `map.remove` inside a loop over the map. Use `removeIf` on one of its views:

```java
count.values().removeIf(v -> v == 0);              // drop zero counts
count.entrySet().removeIf(e -> e.getKey() < 0);   // drop negative keys
```

(In sliding-window problems the usual move is simpler: when a count drops to 0, `map.remove(key)` right there, outside any iteration over the map.)

## Practice

@exercise hm-drill-count

@exercise hm-mode

@exercise hm-code-sort-by-freq

## Reference drills

Rapid recall of every core HashMap operation. Fill the blank, then write it live.

@exercise hm-ref-put-fill

@exercise hm-ref-put-code

@exercise hm-ref-iter-fill

@exercise hm-ref-iter-code

## Recap

- Count: `map.put(k, map.getOrDefault(k, 0) + 1)` or `map.merge(k, 1, Integer::sum)`.
- Group: `map.computeIfAbsent(k, x -> new ArrayList<>()).add(v)`.
- Iterate: `for (Map.Entry<K, V> e : map.entrySet())` with `e.getKey()` / `e.getValue()`.
- Rank: `new ArrayList<>(map.entrySet())`, then `sort((a, b) -> Integer.compare(b.getValue(), a.getValue()))`.
- No order in a HashMap; remove during iteration with `map.values().removeIf(...)`.
