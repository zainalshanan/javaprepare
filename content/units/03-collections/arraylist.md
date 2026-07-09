`ArrayList` is Java's growable array — your default whenever the size isn't fixed up front, and the type of most LeetCode answers (`List<Integer>`, `List<List<Integer>>`).

## Core operations

```java
List<Integer> list = new ArrayList<>();   // declare as List, construct ArrayList
list.add(5);            // append — O(1)
list.get(i);            // read by index — O(1)
list.set(i, val);       // overwrite
list.size();            // element count (not length!)
list.isEmpty();
list.contains(5);       // O(n) — scans the whole list
list.remove(list.size() - 1);   // remove last — O(1)
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

## Practice

@exercise al-evens

@exercise al-drill-build

## Reference drills

Rapid recall of every core ArrayList operation. Fill the blank, then write it live — repeat until automatic.

@exercise al-ref-build-fill

@exercise al-ref-build-code

@exercise al-ref-modify-fill

@exercise al-ref-modify-code
