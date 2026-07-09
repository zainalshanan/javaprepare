Three heavyweight tools. Each is a memorize-the-whole-thing template — interviews expect you to produce them fluently.

## Union-Find (Disjoint Set Union)

Answers "are these connected?" and "does adding this edge create a cycle?" in near-O(1):

```java
class UnionFind {
    int[] parent, rank;
    UnionFind(int n) {
        parent = new int[n];
        rank = new int[n];
        for (int i = 0; i < n; i++) parent[i] = i;    // everyone their own root
    }
    int find(int x) {
        if (parent[x] != x) parent[x] = find(parent[x]);   // path compression
        return parent[x];
    }
    boolean union(int a, int b) {
        int ra = find(a), rb = find(b);
        if (ra == rb) return false;               // already connected → cycle!
        if (rank[ra] < rank[rb]) { int t = ra; ra = rb; rb = t; }
        parent[rb] = ra;
        if (rank[ra] == rank[rb]) rank[ra]++;
        return true;
    }
}
```

## Topological sort (Kahn's BFS)

Orders a DAG so every edge points forward — "courses with prerequisites." Repeatedly take nodes with no remaining prerequisites:

```java
int[] indegree = new int[n];
for (int[] e : edges) indegree[e[1]]++;          // edge u -> v
Queue<Integer> q = new LinkedList<>();
for (int i = 0; i < n; i++) if (indegree[i] == 0) q.offer(i);
int processed = 0;
while (!q.isEmpty()) {
    int node = q.poll();
    processed++;
    for (int next : adj.getOrDefault(node, new ArrayList<>())) {
        if (--indegree[next] == 0) q.offer(next);
    }
}
// processed < n  ⟺  the graph has a cycle (Course Schedule's whole answer)
```

## Dijkstra (weighted shortest path, non-negative)

BFS with a PriorityQueue instead of a Queue — always expand the closest unfinalized node:

```java
int[] dist = new int[n];
Arrays.fill(dist, Integer.MAX_VALUE);
dist[src] = 0;
PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> Integer.compare(a[1], b[1]));
pq.offer(new int[]{src, 0});
while (!pq.isEmpty()) {
    int[] cur = pq.poll();
    int node = cur[0], d = cur[1];
    if (d > dist[node]) continue;                 // stale entry — skip
    for (int[] edge : adj.getOrDefault(node, new ArrayList<>())) {   // {next, weight}
        int nd = d + edge[1];
        if (nd < dist[edge[0]]) {
            dist[edge[0]] = nd;
            pq.offer(new int[]{edge[0], nd});
        }
    }
}
```

@exercise pat-ag-mcq-uf

@exercise pat-ag-drill-uf

@exercise pat-ag-drill-topo

Apply it: Course Schedule (topo sort), Network Delay Time (Dijkstra).
