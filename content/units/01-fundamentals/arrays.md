Arrays are the bread and butter of LeetCode — roughly half of NeetCode 150 takes an `int[]` as input.

## Creating and accessing

```java
int[] a = new int[5];        // [0, 0, 0, 0, 0] — zero-filled
int[] b = {1, 2, 3};         // literal
boolean[] seen = new boolean[n];   // false-filled

a[0] = 42;       // write
int x = a[0];    // read
a.length;        // size — a FIELD, no parentheses!
```

Indices run `0` to `a.length - 1`. Anything outside throws `ArrayIndexOutOfBoundsException` — the most common beginner crash. (That's why `i < a.length && a[i] > 0` puts the bounds check first.)

@exercise arr-mcq-length

## Iterating

```java
// index loop — when you need i
for (int i = 0; i < a.length; i++) {
    // a[i]
}

// enhanced for — when you only need the values
for (int x : a) {
    // x is each element in order
}
```

The enhanced for is read-only iteration: assigning to `x` doesn't change the array. To modify elements, use the index loop.

@exercise arr-max

## Arrays are references

An array variable holds a *reference* (pointer). Passing an array to a method shares the same underlying data:

```java
void fill7(int[] arr) { arr[0] = 7; }   // caller sees this change!
int[] copy = Arrays.copyOf(a, a.length); // real copy when you need one
```

This is why LeetCode problems can say "modify in place."

It also means `==` on arrays compares *references* ("same array object?"), not contents. Compare contents with `Arrays.equals`, and print them with `Arrays.toString` — printing an array directly gives gibberish like `[I@1b6d3586`:

```java
int[] p = {1, 2, 3};
int[] q = {1, 2, 3};
p == q;                    // false — two different arrays
Arrays.equals(p, q);       // true  — same length, same elements in order
Arrays.toString(p);        // "[1, 2, 3]" — use this in debug prints
```

@exercise arr-mcq-reference

@exercise arr-predict-equals

## The java.util.Arrays toolbox

```java
import java.util.Arrays;   // LeetCode imports this for you

Arrays.sort(a);                     // ascending, in place — O(n log n)
Arrays.fill(a, -1);                 // set every slot
Arrays.equals(a, b);                // same contents?
Arrays.toString(a);                 // "[1, 2, 3]" — for debugging
int[] sub = Arrays.copyOfRange(a, from, to);  // [from, to)
```

`Arrays.sort` on a primitive array (`int[]`, `char[]`, …) is **ascending only** — there's no comparator version for primitives. For descending order, sort and then reverse with two pointers (custom orderings on `Integer[]` and objects come in Unit 2).

@exercise arr-mcq-sortdesc

@exercise arr-same-sorted

## 2D arrays

```java
int[][] grid = new int[rows][cols];
grid.length;      // rows
grid[0].length;   // cols
grid[r][c];       // row r, column c

for (int r = 0; r < grid.length; r++)
    for (int c = 0; c < grid[0].length; c++)
        ; // visit every cell
```

@exercise arr-count-2d

## Grid neighbors: the dirs idiom

Grid problems (Number of Islands, Rotting Oranges, Word Search) constantly ask "look at the 4 cells around `(r, c)`". Don't write four copies of the code — loop over a direction table and bounds-check once:

```java
int[][] dirs = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};   // down, up, right, left

for (int[] d : dirs) {
    int nr = r + d[0], nc = c + d[1];
    if (nr < 0 || nr >= grid.length || nc < 0 || nc >= grid[0].length) continue;  // off the grid
    // grid[nr][nc] is safe to read here
}
```

```text
            (r-1, c)
               ↑
 (r, c-1)  ←  (r, c)  →  (r, c+1)
               ↓
            (r+1, c)
```

At a corner, two of the four neighbors fail the bounds check and are skipped — the `||` chain short-circuits before any out-of-range index is touched.

@exercise arr-fill-dirs

@exercise arr-drill-neighbors

## Drills

@exercise arr-drill-sum

@exercise arr-drill-reverse

## Reference drills

Rapid recall of the core array operations. Fill the blank first, then write it live — repeat until it's automatic.

@exercise arr-ref-create-fill

@exercise arr-ref-create-code

@exercise arr-ref-sort-fill

@exercise arr-ref-sort-code

## Recap

- `int[] a = new int[n];` (zeros) or `int[] a = {1, 2, 3};` — size is `a.length` (no parentheses).
- `for (int i = 0; i < a.length; i++)` to index; `for (int x : a)` to read values.
- Arrays are references: `==` compares identity; use `Arrays.equals(a, b)` and `Arrays.toString(a)`.
- `Arrays.sort(a)` is ascending only for primitives — reverse afterward for descending.
- Grids: `grid.length` rows, `grid[0].length` cols; `int[][] dirs = {{1,0},{-1,0},{0,1},{0,-1}};` plus one bounds check.
