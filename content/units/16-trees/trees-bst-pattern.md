A **binary search tree** (BST) is a binary tree with one extra rule. For every node, **everything** in its left subtree is smaller than it, and **everything** in its right subtree is larger. Because of that rule you can steer (go left *or* right, never both), and an inorder traversal comes out sorted.

```text
            8
          /   \
         3     10
        / \      \
       1   6      14
          / \
         4   7

inorder (left, node, right):  1  3  4  6  7  8  10  14   ← sorted
```

## Validate: pass bounds down

It's tempting to check only `left.val < node.val < right.val`. That compares parents with their direct children and misses violations deeper down:

```text
        5
       / \
      4   6
         / \
        3   7       3 < 6 looks fine locally, but 3 is in 5's RIGHT subtree → invalid
```

Every node inherits an allowed open range `(low, high)` from all of its ancestors. Going left lowers `high` to the current value. Going right raises `low` to the current value. This is template (d) from the DFS lesson: state passed down as parameters.

```java
boolean valid(TreeNode node, long low, long high) {
    if (node == null) return true;
    if (node.val <= low || node.val >= high) return false;
    return valid(node.left, low, node.val)       // left subtree: stay below node
        && valid(node.right, node.val, high);    // right subtree: stay above node
}
// valid(root, Long.MIN_VALUE, Long.MAX_VALUE)
```

**Why not `int` bounds with `Integer.MIN_VALUE` / `Integer.MAX_VALUE` meaning "no limit"?** Because those are legal node values. The one-node tree `[2147483647]` checks `2147483647 >= Integer.MAX_VALUE`, which is `true`, so a valid tree gets rejected. `long` bounds lie strictly outside the `int` range, so no node value can equal them. Another option is `Integer low, Integer high`, with `null` meaning unbounded: `if (low != null && node.val <= low) return false;`.

@exercise pat-tr-mcq-bst-bounds

## Inorder = sorted order

The recursive version visits the node between its two recursive calls:

```java
void inorder(TreeNode node, List<Integer> out) {
    if (node == null) return;
    inorder(node.left, out);
    out.add(node.val);           // visit between the calls
    inorder(node.right, out);
}
```

For **Kth Smallest** you want to stop as soon as you reach the k-th value. That's much easier with an explicit stack than with recursion. The loop has three steps: slide left, pushing every node you pass; pop the top node, which is the next smallest value; then move to that node's right child.

```java
Deque<TreeNode> stack = new ArrayDeque<>();
TreeNode curr = root;
while (curr != null || !stack.isEmpty()) {
    while (curr != null) {       // 1. slide left, pushing the path
        stack.push(curr);
        curr = curr.left;
    }
    curr = stack.pop();          // 2. visit: the next smallest value
    // use curr.val here; return early when done
    curr = curr.right;           // 3. then handle the right subtree
}
```

Trace on `[5,3,6,2,4]`, looking for the 3rd smallest:

```text
        5
       / \
      3   6
     / \
    2   4
```

| step | action | stack (top on the right) | visited |
| --- | --- | --- | --- |
| 1 | slide left from 5: push 5, 3, 2 | 5 3 2 | — |
| 2 | pop 2, visit; `2.right` is null | 5 3 | 2 |
| 3 | pop 3, visit; `curr = 4` | 5 | 2 3 |
| 4 | slide left from 4: push 4 | 5 4 | 2 3 |
| 5 | pop 4, visit (3rd visit) → **return 4** | 5 | 2 3 4 |

Node 6 is never touched. The cost is O(h + k) instead of O(n).

@exercise pat-tr-fill-inorder

@exercise pat-tr-drill-inorder-iter

## LCA in a BST: walk down

The lowest common ancestor of `p` and `q` is the first node where they stop being on the same side. Start at the root. While both values are smaller than the node, go left. While both are larger, go right. Otherwise you're standing at the split, and that node is the answer.

```java
TreeNode node = root;
while (node != null) {
    if (p < node.val && q < node.val) node = node.left;
    else if (p > node.val && q > node.val) node = node.right;
    else return node;            // they split here (or node is p or q)
}
```

```text
p = 3, q = 5

          6          3 and 5 are both < 6  → go left
        /   \
       2     8       3 and 5 are both > 2  → go right
      / \   / \
     0   4 7   9     3 < 4 < 5             → split: LCA is 4
        / \
       3   5
```

That's O(h) time and O(1) space. A general binary tree would force you to search both subtrees; the BST ordering tells you which way to go at every step.

## Apply it

Easy → hard: **Validate Binary Search Tree**, **Lowest Common Ancestor of a Binary Search Tree**, **Kth Smallest Element in a BST**.

## Recap

- BST rule: left subtree < node < right subtree, for the **whole** subtree, not just the direct children.
- Validate by passing `(low, high)` down. Use `long` or nullable `Integer` bounds, never `int` sentinels.
- Inorder traversal of a BST visits values in sorted order.
- Iterative inorder: slide left pushing, pop = visit, go right. It can stop early.
- LCA in a BST: walk down from the root until `p` and `q` fall on different sides.
