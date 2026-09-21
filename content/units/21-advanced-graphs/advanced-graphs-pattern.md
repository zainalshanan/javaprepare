Two templates handle most "connectivity and ordering" graph problems. **Union-Find** answers "are these two nodes connected?" and "does this edge close a cycle?". **Topological sort** answers "in what order can I do these tasks?" and "is there a circular dependency?". You should be able to write both from memory.

## Union-Find (Disjoint Set Union)

Every node points to a parent. Following the parents leads to the component's **root**, and two nodes are connected exactly when they have the same root.

```java
class UnionFind {
    int[] parent, size;
    int components;

    UnionFind(int n) {
        parent = new int[n];
        size = new int[n];
        components = n;
        for (int i = 0; i < n; i++) { parent[i] = i; size[i] = 1; }   // everyone is a root
    }

    int find(int x) {
        if (parent[x] != x) parent[x] = find(parent[x]);   // path compression
        return parent[x];
    }

    boolean union(int a, int b) {
        int ra = find(a), rb = find(b);
        if (ra == rb) return false;                // already connected → this edge makes a cycle
        if (size[ra] < size[rb]) { int t = ra; ra = rb; rb = t; }
        parent[rb] = ra;                           // attach the smaller tree under the larger
        size[ra] += size[rb];
        components--;
        return true;
    }
}
```

### Path compression, pictured

Without balancing, a bad sequence of unions can build a chain. `find(4)` walks the chain to the root, and as each recursive call returns it points that node **straight at the root**:

```text
before find(4)            after find(4)

      0                          0
      |                    ┌───┬─┴─┬───┐
      1                    1   2   3   4
      |
      2                   parent = [0, 0, 0, 0, 0]
      |
      3                   the next find(4) is one hop
      |
      4

parent = [0, 0, 1, 2, 3]
```

**Union by size** (or rank) stops long chains from forming at all: the smaller tree always goes under the larger root, so tree height stays O(log n). Together, the two tricks make each operation almost O(1) (amortized inverse-Ackermann α(n)).

@exercise pat-ag-fill-uf

@exercise pat-ag-mcq-uf

### Three Union-Find problems

| Problem | The one idea |
| --- | --- |
| **Redundant Connection** | Union edges in input order. The first edge where `union` returns `false` (both ends already connected) is the extra edge. |
| **Connected Components** | Start with `components = n` and subtract one on every successful union. |
| **Graph Valid Tree** | A tree has exactly `n - 1` edges **and** no cycle. Check the edge count first. Then, if any `union` returns `false`, it isn't a tree. With `n - 1` edges and no cycle, the graph must be connected. |

@exercise pat-ag-drill-uf

## Topological sort: Kahn's algorithm (BFS)

A topological order lists the nodes of a directed graph so that every edge `u → v` has `u` before `v`. Think of courses and their prerequisites. Kahn's algorithm keeps taking nodes that have **no remaining incoming edges**:

```java
List<List<Integer>> adj = new ArrayList<>();
for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
int[] indegree = new int[n];
for (int[] e : edges) {              // e = {u, v} meaning u → v
    adj.get(e[0]).add(e[1]);
    indegree[e[1]]++;
}
Deque<Integer> q = new ArrayDeque<>();
for (int i = 0; i < n; i++) if (indegree[i] == 0) q.offer(i);
List<Integer> order = new ArrayList<>();
while (!q.isEmpty()) {
    int u = q.poll();
    order.add(u);
    for (int v : adj.get(u)) {
        if (--indegree[v] == 0) q.offer(v);   // last prerequisite just finished
    }
}
// order.size() < n  ⟺  a cycle blocked some nodes
```

Watch the edge direction. In Course Schedule, `[a, b]` means "take b before a", so the edge is **b → a**.

### Trace: edges 0→1, 0→2, 1→3, 2→3

```text
0 ──► 1 ──► 3
│           ▲
└───► 2 ────┘
```

| step | poll | indegree `[0,1,2,3]` after | queue after | order |
| --- | --- | --- | --- | --- |
| init | — | `[0, 1, 1, 2]` | `[0]` | `[]` |
| 1 | 0 | `[0, 0, 0, 2]` | `[1, 2]` | `[0]` |
| 2 | 1 | `[0, 0, 0, 1]` | `[2]` | `[0, 1]` |
| 3 | 2 | `[0, 0, 0, 0]` | `[3]` | `[0, 1, 2]` |
| 4 | 3 | — | `[]` | `[0, 1, 2, 3]` |

All 4 nodes processed, so there's no cycle. Now add the edge `3 → 1`. Node 1 starts with indegree 2. After 0 and 2 are processed, both 1 and 3 still have indegree 1 (each waiting on the other), and the queue is empty. Only 2 of 4 nodes were processed, so **there's a cycle**. Course Schedule returns `processed == n`, and Course Schedule II returns `order` (or `[]`).

@exercise pat-ag-drill-topo

## DFS three-color: cycle detection and topo order

A plain `visited` boolean doesn't work for **directed** graphs. In the diamond above, DFS reaches 3 through 1, then reaches 3 again through 2. That's not a cycle. You need to tell "finished earlier" apart from "on the current path":

```java
int[] state = new int[n];            // 0 = unvisited, 1 = visiting (on the path), 2 = done
List<Integer> post = new ArrayList<>();

boolean hasCycle(int u) {
    if (state[u] == 1) return true;  // back to a node on the current path → cycle
    if (state[u] == 2) return false; // already fully explored, safe
    state[u] = 1;
    for (int v : adj.get(u)) {
        if (hasCycle(v)) return true;
    }
    state[u] = 2;
    post.add(u);                     // post-order
    return false;
}
// run from every unvisited node; topo order = reverse of post
```

```text
diamond from 0:  visit 0(1) → 1(1) → 3(1) → 3 done(2) → 1 done(2)
                 → 2(1) → sees 3 in state 2: fine → 2 done → 0 done
post = [3, 1, 2, 0]   reversed: [0, 2, 1, 3]  ✓ valid order
```

## Alien Dictionary: build the graph, then sort

The words are sorted in an unknown alphabet. Compare each **adjacent pair** of words. The first position where they differ gives exactly one edge, and nothing after that position tells you anything.

```text
"wrt" vs "wrf"   → t → f
"wrf" vs "er"    → w → e
"er"  vs "ett"   → r → t
"ett" vs "rftt"  → e → r

w → e → r → t → f      topological order: "wertf"
```

Two ways to return `""`:

- **Prefix invalid**: `"abc"` listed before `"ab"`. They have no differing character, but a longer word can't come before its own prefix. Check `a.length() > b.length() && a.startsWith(b)`.
- **Cycle**: the edges contradict each other (`["z","x","z"]` gives z→x and x→z). Kahn's processes fewer letters than exist, or three-color DFS finds a back edge.

Add **every** letter that appears as a node, even letters with no edges, or they'll be missing from the output.

## Apply it

| Template | Problems |
| --- | --- |
| Union-Find (cycle edge / component count / tree check) | Redundant Connection, Number of Connected Components in an Undirected Graph, Graph Valid Tree |
| Kahn's topological sort | Course Schedule, Course Schedule II |
| Build edges from comparisons + topo sort (Kahn's or three-color DFS) | Alien Dictionary |

(Weighted shortest paths, spanning trees, and Eulerian paths are covered in the next lesson.)

## Recap

- `find` with path compression plus union by size makes each operation almost O(1).
- `union` returns `false` when the endpoints are already connected, meaning the edge closes a cycle.
- A tree has `n - 1` edges and no cycle.
- Kahn's: indegree table, queue all zeros, add a neighbor when its indegree hits 0. If processed `< n`, there's a cycle.
- Directed cycle via DFS uses three colors: reaching state 1 (visiting) means a back edge. Topo order is post-order reversed.
- Alien Dictionary: one edge per adjacent word pair (first differing letter). A longer word before its own prefix means `""`.
