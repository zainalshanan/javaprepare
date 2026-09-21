`ArrayList` is Java's growable array — your default whenever the size isn't fixed up front, and the type of most LeetCode answers (`List<Integer>`, `List<List<Integer>>`).

## Core operations

```java
List<Integer> list = new ArrayList<>();   // declare as List, construct ArrayList
list.add(5);            // append — O(1) amortized
list.get(i);            // read by index — O(1)
list.set(i, val);       // overwrite
list.size();            // element count (not length!)
list.isEmpty();
list.contains(5);       // O(n) — scans the whole list
list.remove(list.size() - 1);   // remove last — O(1)
list.remove(0);                 // remove first — O(n), shifts everything left
```

@exercise al-fill-basics

## The remove trap

```java
list.remove(5);                  // removes INDEX 5
list.remove(Integer.valueOf(5)); // removes the VALUE 5
```

For `List<Integer>` these are different methods — a legendary source of bugs.

@exercise al-mcq-remove

## Lists of lists — the results pattern

Problems like Group Anagrams and Subsets return `List<List<String>>` / `List<List<Integer>>`:

```java
List<List<Integer>> res = new ArrayList<>();
List<Integer> inner = new ArrayList<>();
inner.add(1);
res.add(inner);

res.add(new ArrayList<>(Arrays.asList(1, 2, 3)));  // build + add in one line
```

Also essential: `new ArrayList<>(otherList)` makes a **copy** — the key move in backtracking, where you snapshot the current path.

@exercise al-mcq-copy

## Converting between arrays and lists

```java
// List<Integer> -> int[]
int[] arr = new int[list.size()];
for (int i = 0; i < arr.length; i++) arr[i] = list.get(i);

// int[] -> List<Integer>
List<Integer> l = new ArrayList<>();
for (int x : arr) l.add(x);
```

(There are stream one-liners, but the loops are foolproof and interview-safe.)

## Quick lists: `List.of` and `Arrays.asList`

Both build a list inline, and neither gives you a normal `ArrayList`:

```java
List<Integer> a = List.of(1, 2, 3);        // immutable: add, remove AND set all throw
List<Integer> b = Arrays.asList(1, 2, 3);  // fixed-size: set works, add/remove throw

List<Integer> c = new ArrayList<>(List.of(1, 2, 3));   // copy → fully mutable
c.add(4);                                              // fine
```

Returning `List.of(...)` as an answer is fine. If you're going to modify it, wrap it in `new ArrayList<>(...)` first. Otherwise `add` throws `UnsupportedOperationException`.

@exercise al-mcq-aslist

## Reversing and sorting

```java
Collections.reverse(list);   // in place, O(n)
Collections.sort(list);      // ascending, in place
list.sort((a, b) -> Integer.compare(b, a));   // descending (a comparator lambda)
```

A common shape: build a path by walking backwards from the end (BFS parents, linked-list values), then `Collections.reverse` once at the end.

## Removing while iterating

Removing inside a for-each over the same list throws `ConcurrentModificationException`. Use one of these instead:

```java
list.removeIf(x -> x < 0);            // simplest: a Predicate lambda

Iterator<Integer> it = list.iterator();
while (it.hasNext()) {
    if (it.next() < 0) it.remove();   // removes the element next() just returned
}

for (int i = list.size() - 1; i >= 0; i--) {   // by index, backwards
    if (list.get(i) < 0) list.remove(i);
}
```

(Going backwards matters: removing index `i` shifts everything after it left, which would make a forward loop skip an element.)

@exercise al-fill-remove

## Practice

@exercise al-evens

@exercise al-drill-build

@exercise al-code-strip-reverse

## Reference drills

Rapid recall of every core ArrayList operation. Fill the blank, then write it live — repeat until automatic.

@exercise al-ref-build-fill

@exercise al-ref-build-code

@exercise al-ref-modify-fill

@exercise al-ref-modify-code

## Recap

- `List<Integer> list = new ArrayList<>();` then `add`, `get`, `set`, `size()`, `isEmpty()`.
- `remove(i)` removes an index; `remove(Integer.valueOf(v))` removes a value.
- Snapshot with `new ArrayList<>(path)`; make `List.of`/`Arrays.asList` mutable the same way.
- `Collections.reverse(list)`, `Collections.sort(list)`.
- Remove during a loop with `list.removeIf(x -> ...)` or `it.remove()`, never inside a for-each.
