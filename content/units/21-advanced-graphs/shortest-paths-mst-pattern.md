When edges have **weights** (prices, travel times, distances), counting hops with BFS isn't enough. This lesson covers the weighted templates: Dijkstra for shortest paths, Bellman-Ford when the number of edges is capped, Prim for minimum spanning trees, and Hierholzer for a path that uses every edge exactly once.

## Weighted adjacency list

Each entry now stores a pair, `{neighbor, weight}`, as an `int[]`:

```java
List<List<int[]>> adj = new ArrayList<>();
for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
for (int[] e : edges) {                       // e = {u, v, w}
    adj.get(e[0]).add(new int[]{e[1], e[2]});
    // undirected? also: adj.get(e[1]).add(new int[]{e[0], e[2]});
}
```

If nodes are 1-indexed (Network Delay Time), either size the list `n + 1` or use a `Map<Integer, List<int[]>>` with `computeIfAbsent`.

@exercise pat-sp-drill-wadj

## Dijkstra: BFS with a min-heap

BFS uses a queue because every edge costs 1. With different weights, always expand the **closest node not yet finalized**, which means a `PriorityQueue` ordered by distance:

```java
int[] dist = new int[n];
Arrays.fill(dist, Integer.MAX_VALUE);
dist[src] = 0;
PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> Integer.compare(a[0], b[0]));  // {dist, node}
pq.offer(new int[]{0, src});
while (!pq.isEmpty()) {
    int[] cur = pq.poll();
    int d = cur[0], u = cur[1];
    if (d > dist[u]) continue;                 // stale entry: u was already reached more cheaply
    for (int[] e : adj.get(u)) {               // e = {v, w}
        int nd = d + e[1];
        if (nd < dist[e[0]]) {
            dist[e[0]] = nd;
            pq.offer(new int[]{nd, e[0]});
        }
    }
}
```

Java's `PriorityQueue` can't lower an existing entry's priority. So when a distance improves, you push a **new** entry and leave the old one in the heap. The `d > dist[u]` check throws away the old copies when they come out. This is called **lazy deletion**.

### Trace

```text
  0 ──5──► 1 ──1──► 3
  │        ▲        ▲
  1        2        │
  ▼        │        │
  2 ───────┘        │
  │                 │
  └────────5────────┘
```

Edges: 0→1 (5), 0→2 (1), 2→1 (2), 1→3 (1), 2→3 (5).

| poll `{d, node}` | stale? | relaxations | `dist` after | heap after |
| --- | --- | --- | --- | --- |
| (start) | — | — | `[0, ∞, ∞, ∞]` | `{0,0}` |
| `{0, 0}` | no | 1 ← 5, 2 ← 1 | `[0, 5, 1, ∞]` | `{1,2} {5,1}` |
| `{1, 2}` | no | 1 ← 3 (beats 5), 3 ← 6 | `[0, 3, 1, 6]` | `{3,1} {5,1} {6,3}` |
| `{3, 1}` | no | 3 ← 4 (beats 6) | `[0, 3, 1, 4]` | `{4,3} {5,1} {6,3}` |
| `{4, 3}` | no | — | `[0, 3, 1, 4]` | `{5,1} {6,3}` |
| `{5, 1}` | **yes** (5 > 3) | skipped | | `{6,3}` |
| `{6, 3}` | **yes** (6 > 4) | skipped | | empty |

O((V + E) log V). **Weights must be non-negative.** The algorithm relies on a popped distance never improving later, and a negative edge could break that.

Network Delay Time is this template followed by `max(dist)`, or `-1` if any node is still ∞.

@exercise pat-sp-fill-dijkstra

@exercise pat-sp-drill-dijkstra

### Variant: the path cost is the maximum, not the sum

In **Swim in Rising Water**, a path costs its **highest** cell, since you need to wait until the water covers it. Dijkstra still works if you change how costs combine: push `max(curCost, grid[nr][nc])` instead of `d + w`. The first time you pop the bottom-right cell, its cost is the answer. That works because `max` never decreases along a path, just as sums with non-negative weights don't.

```java
pq.offer(new int[]{Math.max(t, grid[nr][nc]), nr, nc});   // {ceiling, r, c}
```

(Another approach: binary search on time `t`, and for each `t` check with BFS whether the exit can be reached using cells `<= t`. That's O(n² log n) as well.)

## Bellman-Ford: at most k+1 edges

**Cheapest Flights Within K Stops** caps the number of edges: k stops means at most k + 1 flights. Dijkstra only tracks the cheapest cost and ignores how many edges a path used. Bellman-Ford handles the cap directly, because after round `i`, `dist` holds the cheapest costs using **at most `i` edges**:

```java
int[] dist = new int[n];
Arrays.fill(dist, Integer.MAX_VALUE);
dist[src] = 0;
for (int round = 0; round <= k; round++) {        // k + 1 rounds
    int[] tmp = dist.clone();                     // write here, read from last round
    for (int[] f : flights) {                     // f = {u, v, price}
        if (dist[f[0]] != Integer.MAX_VALUE && dist[f[0]] + f[2] < tmp[f[1]]) {
            tmp[f[1]] = dist[f[0]] + f[2];
        }
    }
    dist = tmp;
}
return dist[dst] == Integer.MAX_VALUE ? -1 : dist[dst];
```

**Why the copy matters.** Flights 0→1 ($100), 1→2 ($100), 0→2 ($500), with `k = 0` (one round, so direct flights only):

| edge relaxed | in place: `dist` | with copy: reads `dist`, writes `tmp` |
| --- | --- | --- |
| 0→1 | `[0, 100, ∞]` | `tmp = [0, 100, ∞]` |
| 1→2 | `[0, 100, 200]` ← uses the 100 set a moment ago | `dist[1]` is still ∞ → skip |
| 0→2 | 500 > 200, no change | `tmp = [0, 100, 500]` |
| **answer** | 200 ✗ (two flights) | **500 ✓** |

In place, a single round chained two edges. The snapshot stops that. Cost is O((k + 1) · E).

@exercise pat-sp-mcq-bfcopy

## Prim's algorithm: minimum spanning tree

A **minimum spanning tree** connects all nodes with the smallest possible total edge weight. Prim's grows one tree from any start node, always adding the **cheapest edge that reaches a node not yet in the tree**. It looks a lot like Dijkstra, except the heap stores the cost of a single edge, not a path total.

**Min Cost to Connect All Points** is a complete graph: every pair of points is an edge with weight = Manhattan distance. Don't build the n² edges up front. Compute each distance when you need it:

```java
boolean[] inTree = new boolean[n];
PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> Integer.compare(a[0], b[0]));  // {cost, node}
pq.offer(new int[]{0, 0});
int total = 0, added = 0;
while (added < n) {
    int[] top = pq.poll();
    int cost = top[0], u = top[1];
    if (inTree[u]) continue;                  // stale: u was already added more cheaply
    inTree[u] = true;
    total += cost;
    added++;
    for (int v = 0; v < n; v++) {
        if (!inTree[v]) {
            int d = Math.abs(points[u][0] - points[v][0]) + Math.abs(points[u][1] - points[v][1]);
            pq.offer(new int[]{d, v});
        }
    }
}
return total;
```

```text
points: A(0,0) B(2,2) C(3,10) D(5,2) E(7,0)

start A → cheapest edge out: A–B 4      tree {A,B}        total 4
          cheapest: B–D 3               tree {A,B,D}      total 7
          cheapest: D–E 4               tree {A,B,D,E}    total 11
          cheapest: B–C 9               all 5 nodes       total 20
```

This is O(n² log n). For dense graphs there's an O(n²) version with no heap: keep a `minDist[]` array and scan it for the smallest value each round. Kruskal's algorithm (sort all edges, then union-find) also works but has to sort all n² edges.

## Hierholzer's algorithm: use every edge once

**Reconstruct Itinerary** asks for a path that uses **every ticket exactly once**, which is an Eulerian path, and it must be the lexically smallest one. Always taking the smallest destination can get you stuck early:

```text
tickets: JFK→KUL, JFK→NRT, NRT→JFK
greedy: JFK → KUL → stuck, with 2 tickets left ✗
```

Hierholzer's fix: run DFS, and add an airport to the route **only after all of its outgoing tickets are used** (post-order). Dead ends get added first. Reverse the list at the end.

```java
Map<String, PriorityQueue<String>> adj = new HashMap<>();   // min-heap = smallest destination first
for (List<String> t : tickets) {
    adj.computeIfAbsent(t.get(0), k -> new PriorityQueue<>()).add(t.get(1));
}
List<String> route = new ArrayList<>();
dfs("JFK", adj, route);
Collections.reverse(route);

void dfs(String from, Map<String, PriorityQueue<String>> adj, List<String> route) {
    PriorityQueue<String> dests = adj.get(from);
    while (dests != null && !dests.isEmpty()) {
        dfs(dests.poll(), adj, route);        // poll = use the ticket
    }
    route.add(from);                          // post-order
}
```

```text
dfs(JFK)
  poll KUL → dfs(KUL)                 no tickets → route [KUL]
  poll NRT → dfs(NRT)
               poll JFK → dfs(JFK)    no tickets left → route [KUL, JFK]
             NRT finished             → route [KUL, JFK, NRT]
JFK finished                          → route [KUL, JFK, NRT, JFK]
reverse → [JFK, NRT, JFK, KUL] ✓
```

The dead end (KUL) was added first, so after reversing it ends up last. That's the only place a dead end can go. O(E log E) for the heaps. You can also write it iteratively with an `ArrayDeque` stack: peek, push the next destination if there is one, otherwise pop the airport into the route.

## Apply it

| Template | Problems |
| --- | --- |
| Dijkstra (sum of weights) | Network Delay Time |
| Dijkstra (max along path) | Swim in Rising Water |
| Bellman-Ford with k + 1 rounds and a copy | Cheapest Flights Within K Stops |
| Prim's MST, distances computed on the fly | Min Cost to Connect All Points |
| Hierholzer's (post-order + reverse) | Reconstruct Itinerary |

(Union-Find and topological sort problems are in the previous lesson.)

## Recap

- Weighted adjacency: `List<List<int[]>>` of `{neighbor, weight}`.
- Dijkstra: min-heap of `{dist, node}`, skip stale entries with `if (d > dist[u]) continue`. Weights must be non-negative.
- Swim in Rising Water: same loop, but combine costs with `max` instead of `+`.
- Bellman-Ford with an edge limit: k + 1 rounds, read `dist` and write `tmp = dist.clone()`.
- Prim: heap of `{edgeCost, node}` plus an `inTree[]` array; stop after adding n nodes.
- Hierholzer: `PriorityQueue<String>` per airport, add to the route after the DFS loop, reverse at the end.
