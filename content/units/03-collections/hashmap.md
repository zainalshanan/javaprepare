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

One line per element: read the current count (0 if new), add one, store back. Alternative spelling: `count.merge(c, 1, Integer::sum);`

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
```

@exercise hm-first-repeat

## Practice

@exercise hm-drill-count

@exercise hm-mode

## Reference drills

Rapid recall of every core HashMap operation. Fill the blank, then write it live.

@exercise hm-ref-put-fill

@exercise hm-ref-put-code

@exercise hm-ref-iter-fill

@exercise hm-ref-iter-code
