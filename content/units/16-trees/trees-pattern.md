Tree problems are recursion problems in disguise. Tree **DFS** means writing a method that calls itself on `node.left` and `node.right`, then combines the results. Five variations of that one method cover most of the category.

## Trust the recursion

Don't try to trace the whole tree in your head. Assume `dfs(node.left)` already returns the correct answer for the left subtree, then ask one question: **given my children's answers, what's my answer?**

```java
public int height(TreeNode node) {
    if (node == null) return 0;          // base case: an empty tree has height 0
    int left = height(node.left);        // trust: correct height of the left subtree
    int right = height(node.right);      // trust: correct height of the right subtree
    return 1 + Math.max(left, right);    // combine
}
```

Answers flow **bottom-up**. The null children return first and the root returns last:

```text
                3            ← 1 + max(1, 2) = 3      (returns last)
              /   \
             9     20        ← 9: 1 + max(0, 0) = 1
            / \   /  \          20: 1 + max(1, 1) = 2
           ∅   ∅ 15   7      ← 15, 7: 1 + max(0, 0) = 1
                / \  / \
               ∅  ∅ ∅   ∅    ← ∅ = null → returns 0   (returns first)
```

The base case `if (node == null)` decides what an empty tree is worth: `0` for counts and heights, `true` for "is this valid?" checks, and `null` when you're building or returning a node.

@exercise pat-tr-mcq-base

## (a) Return a value

Height is the example above. Same Tree and Invert use the same shape, with a different combine step:

```java
// Same Tree: walk two trees in lockstep
boolean same(TreeNode p, TreeNode q) {
    if (p == null && q == null) return true;
    if (p == null || q == null || p.val != q.val) return false;
    return same(p.left, q.left) && same(p.right, q.right);
}

// Invert: fix this node, recurse, hand the node back
TreeNode invert(TreeNode node) {
    if (node == null) return null;
    TreeNode tmp = node.left;
    node.left = invert(node.right);
    node.right = invert(tmp);
    return node;
}
```

@exercise pat-tr-drill-sum

@exercise pat-tr-drill-count

## (b) Return one thing, track the best in a field

Diameter is the longest path between any two nodes. That path **bends** at some node and uses both of its arms. A parent, though, can only extend **one** arm of its child. So the two numbers are different: the method **returns** height (what the parent needs) and **records** the bent path in a field.

```java
private int best = 0;                        // the real answer lives here

private int height(TreeNode node) {
    if (node == null) return 0;
    int l = height(node.left);
    int r = height(node.right);
    best = Math.max(best, l + r);            // path bending at this node (in edges)
    return 1 + Math.max(l, r);               // the one arm a parent can use
}
// diameter: height(root); return best;
```

Max Path Sum uses the same skeleton with values instead of edge counts. Drop arms that hurt: `int l = Math.max(0, gain(node.left))`. Record `node.val + l + r` in `best` and return `node.val + Math.max(l, r)`. Start `best` at `Integer.MIN_VALUE`, because every node in the tree might be negative.

@exercise pat-tr-fill-best

## (c) Return two facts at once

Balanced Binary Tree needs two facts from each subtree: its height, and whether it's balanced. You can pack both into one `int` by using a sentinel: `-1` means "unbalanced somewhere below."

```java
private int check(TreeNode node) {
    if (node == null) return 0;
    int l = check(node.left);
    if (l == -1) return -1;                  // failure below → pass it up
    int r = check(node.right);
    if (r == -1) return -1;
    if (Math.abs(l - r) > 1) return -1;      // failure here
    return 1 + Math.max(l, r);               // healthy → real height
}
// isBalanced: return check(root) != -1;
```

If the facts don't fit a sentinel, return a small array instead: `new int[]{height, balanced ? 1 : 0}`. Either way this is one O(n) pass. Calling a separate `height()` at every node would be O(n²).

## (d) Pass state DOWN as parameters

Some answers depend on the path **from the root** rather than on the subtrees. Pass that path information down as a parameter, and keep returning results up.

```java
// Count Good Nodes: a node is good if val >= everything above it
private int good(TreeNode node, int maxSoFar) {
    if (node == null) return 0;
    int self = node.val >= maxSoFar ? 1 : 0;
    int m = Math.max(maxSoFar, node.val);    // context for the children
    return self + good(node.left, m) + good(node.right, m);
}
// good(root, Integer.MIN_VALUE)
```

Each call gets its own copy of the parameters, so there's nothing to undo afterwards. Each child simply receives its own `m`.

## (e) Reuse one DFS inside another

Subtree of Another Tree: at every node of `root`, ask "is the tree starting here the same as `sub`?" Answer that with the Same Tree method from (a).

```java
boolean isSubtree(TreeNode root, TreeNode sub) {
    if (sub == null) return true;
    if (root == null) return false;
    return same(root, sub)
        || isSubtree(root.left, sub)
        || isSubtree(root.right, sub);
}
```

This runs a full comparison at up to m anchors, so it's O(m·n) in the worst case.

## Building a tree: preorder + inorder

Preorder lists a tree as `root, [left subtree], [right subtree]`. Inorder lists it as `[left subtree], root, [right subtree]`. So the next unused preorder value is always a root, and finding that value in inorder tells you which values belong to its left and right subtrees.

```text
preorder = [3, 9, 20, 15, 7]        inorder = [9, 3, 15, 20, 7]
            ^ next root = 3                        ^ 3 sits at index 1

inorder:  [ 9 | 3 | 15  20  7 ]
            ─┬─      ────┬────
          left of 3   right of 3
          range [0,0]  range [2,4]

build left  from range [0,0]: next preorder value 9  → root of left subtree
build right from range [2,4]: next preorder value 20 → splits [15 | 20 | 7]
```

```java
private int pre = 0;                                  // next root in preorder
private Map<Integer, Integer> pos = new HashMap<>();  // value → inorder index (fill first)

private TreeNode build(int[] preorder, int lo, int hi) {  // inorder range [lo, hi]
    if (lo > hi) return null;                         // empty range → no subtree
    TreeNode root = new TreeNode(preorder[pre++]);
    int mid = pos.get(root.val);
    root.left = build(preorder, lo, mid - 1);         // left FIRST, matching preorder
    root.right = build(preorder, mid + 1, hi);
    return root;
}
```

The map makes each split O(1), so the whole build is O(n).

## Apply it

Easy → hard: **Invert Binary Tree** (a), **Maximum Depth of Binary Tree** (a), **Same Tree** (a), **Subtree of Another Tree** (e), **Diameter of Binary Tree** (b), **Balanced Binary Tree** (c), **Count Good Nodes in Binary Tree** (d), **Construct Binary Tree from Preorder and Inorder Traversal**, **Binary Tree Maximum Path Sum** (b).

## Recap

- `if (node == null) return …;` decides what an empty tree is worth.
- Trust the recursion: take the children's answers and combine them into this node's answer.
- If the value a parent needs isn't the final answer, return what the parent needs and track the answer in a field (`best`).
- Two facts from one call: use a sentinel (`-1`) or return an `int[]`.
- Information about the path from the root (max so far, bounds) goes **down** as parameters. Results come **up** as return values.
- Preorder gives the next root; its index in inorder splits the left and right ranges.
