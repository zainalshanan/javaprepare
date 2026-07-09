Graph problems arrive in two costumes: an **edge list** (build an adjacency list) or a **grid** (the grid IS the graph — cells are nodes, neighbors are edges). Then it's DFS or BFS with a visited set.

## Build an adjacency list

```java
Map<Integer, List<Integer>> adj = new HashMap<>();
for (int[] e : edges) {
    adj.computeIfAbsent(e[0], k -> new ArrayList<>()).add(e[1]);
    adj.computeIfAbsent(e[1], k -> new ArrayList<>()).add(e[0]);  // undirected: both ways
}
```

## DFS with visited

```java
Set<Integer> visited = new HashSet<>();
private void dfs(int node, Map<Integer, List<Integer>> adj) {
    if (visited.contains(node)) return;
    visited.add(node);
    for (int next : adj.getOrDefault(node, new ArrayList<>())) {
        dfs(next, adj);
    }
}
```

The visited set is what keeps cyclic graphs from looping forever — mark **before** recursing to neighbors.

@exercise pat-gr-mcq-visited

## Grid traversal (islands and friends)

```java
int[][] dirs = {{1,0}, {-1,0}, {0,1}, {0,-1}};   // down, up, right, left

private void dfs(char[][] grid, int r, int c) {
    if (r < 0 || r >= grid.length || c < 0 || c >= grid[0].length
            || grid[r][c] != '1') {
        return;                      // out of bounds or not land: stop
    }
    grid[r][c] = '0';                // mark visited by sinking the cell
    for (int[] d : dirs) {
        dfs(grid, r + d[0], c + d[1]);
    }
}
```

Bounds-check-then-recurse, with the grid itself as the visited set. Count islands = scan all cells, DFS each unvisited '1', count the DFS kickoffs.

@exercise pat-gr-drill-adj

@exercise pat-gr-drill-flood

Apply it: Number of Islands, Max Area of Island.
