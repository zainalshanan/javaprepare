Tree problems are recursion problems wearing a costume. Two traversal templates cover nearly the whole category.

## DFS recursion (the default)

```java
public int dfs(TreeNode node) {
    if (node == null) return 0;          // base case: empty tree
    int left = dfs(node.left);           // trust the recursion
    int right = dfs(node.right);
    return Math.max(left, right) + 1;    // combine (this one = height)
}
```

Swap the combine step and you get most tree problems:

- sum of tree: `left + right + node.val`
- count nodes: `left + right + 1`
- invert: swap children, recurse
- validate BST: pass down allowed (min, max) bounds

@exercise pat-tr-mcq-base

## BFS level-order (when the problem says "level")

```java
Queue<TreeNode> q = new LinkedList<>();
q.offer(root);                            // (null-check root first)
while (!q.isEmpty()) {
    int size = q.size();                  // freeze this level's size!
    for (int i = 0; i < size; i++) {
        TreeNode node = q.poll();
        // process node — same level as its loop-mates
        if (node.left != null) q.offer(node.left);
        if (node.right != null) q.offer(node.right);
    }
    // one level finished
}
```

The `int size = q.size()` snapshot is what separates levels — the queue grows while you loop, but you only consume this level's nodes.

@exercise pat-tr-drill-sum

@exercise pat-tr-drill-count

Apply it: Invert Binary Tree, Maximum Depth, Level Order Traversal, Validate BST.
