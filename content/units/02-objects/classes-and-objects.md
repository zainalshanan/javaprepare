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
    ListNode(int val) { this.val = val; }
}

public class TreeNode {
    int val;
    TreeNode left, right;
    TreeNode(int val) { this.val = val; }
}
```

A linked list is just node objects chained by `next`; `null` marks the end.

@exercise obj-fill-node

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

## Practice

@exercise obj-build-counter
