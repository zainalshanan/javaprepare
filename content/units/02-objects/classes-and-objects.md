You don't need deep OOP for interviews — but you *do* need to read and write small classes fluently: `ListNode`, `TreeNode`, `Trie`, and design problems like `MinStack` are all classes.

## A class is a bundle of data + methods

```java
class Point {
    int x;            // fields — the data each object carries
    int y;

    Point(int x, int y) {   // constructor — runs at `new Point(...)`
        this.x = x;         // `this.x` = the field; `x` = the parameter
        this.y = y;
    }

    int manhattan() {        // method — can use the fields directly
        return Math.abs(x) + Math.abs(y);
    }
}
```

Using it:

```java
Point p = new Point(3, -4);
p.x;             // 3
p.manhattan();   // 7
```

`new` allocates an object; the variable `p` holds a *reference* to it (same semantics as arrays).

@exercise obj-mcq-this

## The node classes you'll see constantly

LeetCode hands you these — be able to read them instantly:

```java
public class ListNode {
    int val;
    ListNode next;              // reference to another ListNode (or null)
    ListNode() {}
    ListNode(int val) { this.val = val; }
    ListNode(int val, ListNode next) { this.val = val; this.next = next; }
}

public class TreeNode {
    int val;
    TreeNode left, right;
    TreeNode() {}
    TreeNode(int val) { this.val = val; }
    TreeNode(int val, TreeNode left, TreeNode right) {
        this.val = val; this.left = left; this.right = right;
    }
}
```

A class can have several constructors as long as their parameter lists differ. The multi-argument ones let you build a structure in a single expression:

```java
ListNode head = new ListNode(1, new ListNode(2, new ListNode(3)));   // 1 -> 2 -> 3

TreeNode root = new TreeNode(2, new TreeNode(1), new TreeNode(3));
//     2
//    / \
//   1   3
```

A linked list is just node objects chained by `next`; `null` marks the end:

```text
head
 │
 ▼
[1|•]──►[2|•]──►[3|null]
```

@exercise obj-fill-node

The 2-arg constructor also makes *prepending* a one-liner, since the new node points at the old head: `head = new ListNode(0, head);`.

@exercise obj-code-copy-reversed

## static vs instance

```java
class Counter {
    static int created = 0;   // ONE shared copy for the whole class
    int id;                   // one copy PER object

    Counter() {
        created++;
        id = created;
    }
}
```

`static` methods (like `Math.max`) belong to the class and can't touch instance fields. Your LeetCode `Solution` methods are instance methods — helpers you add should usually just be `private` (not static) and it all works.

@exercise obj-mcq-static

## Helper classes inside `Solution`

On LeetCode you only get one file, so small helper types go **inside** `class Solution`:

```java
class Solution {
    static class Pair {          // static nested class: no link to a Solution object
        int row, col;
        Pair(int row, int col) { this.row = row; this.col = col; }
    }

    private class Node {         // inner class: tied to the Solution instance
        int key;
        Node prev, next;
        Node(int key) { this.key = key; }
    }

    public int solve(int[][] grid) {
        Pair p = new Pair(0, 0);
        Node n = new Node(5);
        ...
    }
}
```

Default to `static class`. A non-static inner class quietly holds a reference to the enclosing `Solution`, which is only useful if the helper needs the outer object's fields. It also means you can't create one from a `static` method. `static` is the safe choice.

@exercise obj-mcq-nested-static

## Lightweight tuples: `int[]` and records

Often you don't need a class at all. An `int[]` is the quickest tuple, and it's what most NeetCode solutions put in queues and heaps:

```java
Deque<int[]> queue = new ArrayDeque<>();
queue.offer(new int[]{row, col});
int[] cell = queue.poll();
int r = cell[0], c = cell[1];
```

When you want names instead of `[0]` and `[1]`, a **record** (Java 16+) declares a small immutable class in one line:

```java
record Pair(int r, int c) {}

Pair p = new Pair(2, 3);
p.r();                                  // 2 — accessors are methods, note the ()
new Pair(2, 3).equals(new Pair(2, 3));  // true
```

A record automatically gets its constructor, accessors, `equals`, `hashCode` and `toString`, all based on its fields. That makes it a correct `HashSet`/`HashMap` key for free (see the equals & hashCode lesson). LeetCode's Java runtime supports records, but some older judges don't. If one fails to compile, fall back to an `int[]` or a `static class`.

## Practice

@exercise obj-build-counter

## Recap

- Fields + constructor + methods; `this.x = x` when a parameter shadows a field.
- Build chains inline: `new ListNode(1, new ListNode(2))`, `new TreeNode(v, left, right)`; prepend with `head = new ListNode(v, head)`.
- Helpers go inside `Solution` as `static class Pair { ... }`.
- `new int[]{r, c}` is the quick tuple; `record Pair(int r, int c) {}` adds names plus free `equals`/`hashCode`.
- `static` = one copy for the whole class; instance fields = one per object.
