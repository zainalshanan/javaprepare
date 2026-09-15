DFS dives down one branch at a time. **BFS** sweeps the tree one level at a time, using a queue. Reach for it when a problem mentions levels, rows, depth order, or "what you see from the side."

## The level-order template

```java
List<List<Integer>> res = new ArrayList<>();
if (root == null) return res;                 // ArrayDeque rejects null
Deque<TreeNode> q = new ArrayDeque<>();
q.offer(root);
while (!q.isEmpty()) {
    int size = q.size();                      // freeze: how many nodes are on THIS level
    List<Integer> level = new ArrayList<>();
    for (int i = 0; i < size; i++) {
        TreeNode node = q.poll();
        level.add(node.val);
        if (node.left != null) q.offer(node.left);    // next level joins at the back
        if (node.right != null) q.offer(node.right);
    }
    res.add(level);                           // one full level done
}
```

`ArrayDeque` is faster than `LinkedList`, but it throws a `NullPointerException` on `offer(null)`. That's why the code null-checks the root and each child before offering.

## Why `size` must be frozen

Here is the queue for `[3,9,20,null,null,15,7]`, with the front of the queue on the left:

```text
        3
       / \
      9   20
         /  \
        15   7

            size   queue at start   work                        queue after
level 0     1      [3]              poll 3, offer 9 and 20      [9, 20]
level 1     2      [9, 20]          poll 9  (no children)       [20]
                                    poll 20, offer 15 and 7     [15, 7]
level 2     2      [15, 7]          poll 15                     [7]
                                    poll 7                      []
```

During level 1, the queue holds level-1 nodes at the front while level-2 nodes arrive at the back. Capturing `size` **before** the loop fixes the count: exactly 2 of these nodes belong to this level. If you wrote `i < q.size()` instead, the limit would change as nodes are polled and children are offered, and nodes from different levels would end up mixed together.

@exercise pat-tr-mcq-size

@exercise pat-tr-fill-bfs

## Per-level answers

The template hands you one level at a time, so most level questions are a one-line change:

```java
// Right Side View: the last node polled on each level is the visible one
if (i == size - 1) res.add(node.val);

// level sum / average / max: accumulate inside the for loop, record after it
```

Right Side View is **not** "keep following right children." In `[1,2,3,4]`, node `4` hangs off the *left* subtree, but it's the only node on its level, so it's the one you see.

@exercise pat-tr-drill-levelsums

## Serialize and deserialize

Serializing means turning a tree into a string that you can rebuild the exact tree from. A plain list of values isn't enough, because `[1,2]` and `[1,null,2]` would both print `1,2`. The fix is to write a **null marker** wherever a child is missing. Here is preorder DFS with `N` for null:

```text
      1
     / \
    2   3
       / \
      4   5

"1,2,N,N,3,4,N,N,5,N,N"
     └─┬┘    └─┬┘ └─┬┘
  2's kids  4's kids 5's kids
```

```java
void ser(TreeNode node, StringBuilder sb) {
    if (node == null) { sb.append("N,"); return; }
    sb.append(node.val).append(',');
    ser(node.left, sb);
    ser(node.right, sb);
}
```

Reading the string back follows the same preorder. Split on `,` and keep one shared position into the tokens. When the next token is a number, create a node, build its left subtree from the tokens that follow, then build its right subtree. When the next token is `N`, return null. Walking through the example: `1` becomes the root. Its left call reads `2`. `2`'s left reads `N` and its right reads `N`, so `2` is a leaf. Back at `1`, the right call reads `3`, and so on. Every node's two child calls use exactly the tokens its `ser` call wrote.

A BFS version also works. Write the level order with `N` for each missing child (`1,2,3,N,N,4,5,N,N,N,N`). To rebuild, poll each node and give it the next two tokens as its left and right children.

## Apply it

Easy → hard: **Binary Tree Level Order Traversal**, **Binary Tree Right Side View**, **Serialize and Deserialize Binary Tree**.

## Recap

- Queue + `int size = q.size()` before the inner loop gives exactly one level per outer iteration.
- `ArrayDeque` rejects null: check the root and each child before `offer`.
- Level answers: accumulate inside the `for`, record after it. The last node of a level is `i == size - 1`.
- Serialize with explicit null markers, and deserialize by reading tokens in the same order you wrote them.
