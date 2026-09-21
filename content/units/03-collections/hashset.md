`HashSet` = HashMap without the values: a bag of **unique** elements with O(1) `contains`. Reach for it whenever the question is just "have I seen this?"

```java
Set<Integer> set = new HashSet<>();
set.add(x);          // returns false if x was already there — useful!
set.contains(x);     // O(1)
set.remove(x);
set.size();
```

Build one from an array:

```java
Set<Integer> seen = new HashSet<>();
for (int x : nums) seen.add(x);
```

@exercise hs-mcq-addreturn

## Set vs Map vs count array

- Need *existence only* → `HashSet`
- Need *counts or associated data* → `HashMap`
- Keys are lowercase letters / digits → a plain `int[26]` count array beats both

@exercise hs-mcq-choose

## What can go in a set

Anything whose `equals`/`hashCode` compare by value: `Integer`, `String`, `Character`, `List<Integer>`, records. **Not** `int[]`: arrays compare by identity, so `set.contains(new int[]{r, c})` is always false. For grid cells, store `r + "," + c`, `r * cols + c`, or `List.of(r, c)` (see the equals & hashCode lesson).

## Practice

@exercise hs-has-duplicate

@exercise hs-drill-missing

## Reference drills

Rapid recall of every core HashSet operation. Fill the blank, then write it live.

@exercise hs-ref-fill

@exercise hs-ref-code

## Recap

- `Set<Integer> seen = new HashSet<>();` then `add`, `contains`, `remove`, `size()`, all O(1).
- `if (!seen.add(x))` means x is a duplicate.
- Existence → set; counts → map; letters a–z → `int[26]`.
- Never `int[]` elements. Use `r + "," + c` or `List.of(r, c)`.
