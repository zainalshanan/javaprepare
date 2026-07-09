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

Indices run `0` to `a.length - 1`. Anything outside throws `ArrayIndexOutOfBoundsException` — the most common beginner crash.

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

@exercise arr-mcq-reference

## The java.util.Arrays toolbox

```java
import java.util.Arrays;   // LeetCode imports this for you

Arrays.sort(a);                     // ascending, in place
Arrays.fill(a, -1);                 // set every slot
Arrays.toString(a);                 // "[1, 2, 3]" — for debugging
int[] sub = Arrays.copyOfRange(a, from, to);  // [from, to)
```

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

## Drills

@exercise arr-drill-sum

@exercise arr-drill-reverse

## Reference drills

Rapid recall of the core array operations. Fill the blank first, then write it live — repeat until it's automatic.

@exercise arr-ref-create-fill

@exercise arr-ref-create-code

@exercise arr-ref-sort-fill

@exercise arr-ref-sort-code
