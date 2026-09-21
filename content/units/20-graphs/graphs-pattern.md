Graph problems show up in two forms. You get an **edge list**, which you turn into an adjacency list, or a **grid**, where the grid already is the graph (cells are nodes, touching cells are edges). After that it's DFS or BFS with a way to mark what you've visited. This lesson covers the few templates that solve all seven problems in this unit.

## Build an adjacency list

Nodes labeled `0..n-1` → a `List<List<Integer>>`, indexed by node:

```java
List<List<Integer>> adj = new ArrayList<>();
for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
for (int[] e : edges) {
    adj.get(e[0]).add(e[1]);
    adj.get(e[1]).add(e[0]);   // undirected: add BOTH directions
}
```

Labels that are sparse, huge, or not ints (strings, chars) → a `Map`:

```java
Map<Integer, List<Integer>> adj = new HashMap<>();
for (int[] e : edges) {
    adj.computeIfAbsent(e[0], k -> new ArrayList<>()).add(e[1]);
    adj.computeIfAbsent(e[1], k -> new ArrayList<>()).add(e[0]);
}
// reading: isolated nodes were never inserted
for (int next : adj.getOrDefault(node, List.of())) { ... }
```

Edges `[[0,1],[0,2],[1,2]]` with `n = 4`:

```text
  0 ─── 1        adj[0] = [1, 2]
   \   /         adj[1] = [0, 2]
    \ /          adj[2] = [0, 1]
     2     3     adj[3] = []        ← isolated, still has a slot
```

For **directed** edges (`u → v`, e.g. "b is a prerequisite of a"), add only one direction.

@exercise pat-gr-drill-adj

## Grids are implicit graphs

Don't build an adjacency list for a grid. A cell's neighbors come from a `dirs` array plus a bounds check:

```java
int[][] dirs = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};   // down, up, right, left
for (int[] d : dirs) {
    int nr = r + d[0], nc = c + d[1];
    if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;   // off the grid
    // (nr, nc) is a neighbor
}
```

There are two ways to remember which cells you've visited:

| Approach | How | Use when |
| --- | --- | --- |
| **Mark in place** | overwrite the cell (`'1'` → `'0'`, `'O'` → `'S'`) | you may modify the input and don't need the old value again |
| **`boolean[][] seen`** | separate array, same shape | you still need the original values (heights, distances) or two searches share the grid |

## DFS: flood fill

Recursive DFS on a grid is the **flood fill**. Check the cell first, mark it, then recurse in all four directions:

```java
void dfs(char[][] grid, int r, int c) {
    if (r < 0 || r >= grid.length || c < 0 || c >= grid[0].length
            || grid[r][c] != '1') {
        return;                      // off grid, water, or already visited
    }
    grid[r][c] = '0';                // mark BEFORE recursing, or neighbors loop back
    for (int[] d : dirs) dfs(grid, r + d[0], c + d[1]);
}
```

**Counting regions:** scan every cell. Each `'1'` you find is a new region, so add one to the count and flood it so it won't be counted again. Counting 3 islands:

```text
scan finds (0,0) → count=1     after flood:     scan finds (2,2) → count=2 ...
1 1 0 0 0                      0 0 0 0 0
1 1 0 0 0                      0 0 0 0 0
0 0 1 0 0                      0 0 1 0 0
0 0 0 1 1                      0 0 0 1 1
```

**Measuring a region:** have the DFS *return* a size, `0` for a stopped cell and `1 + the four recursive sizes` otherwise. It's the same shape as `node.val + dfs(left) + dfs(right)` on a tree.

@exercise pat-gr-fill-griddfs

@exercise pat-gr-drill-flood

### Iterative DFS (explicit stack)

Recursion goes as deep as the longest path in the search. On a 300×300 grid that's all land, that can be 90,000 frames, which risks a `StackOverflowError`. An `ArrayDeque` used as a stack removes that limit:

```java
Deque<int[]> stack = new ArrayDeque<>();
stack.push(new int[]{r0, c0});
grid[r0][c0] = '0';                          // mark when pushing
while (!stack.isEmpty()) {
    int[] cell = stack.pop();
    for (int[] d : dirs) {
        int nr = cell[0] + d[0], nc = cell[1] + d[1];
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] == '1') {
            grid[nr][nc] = '0';
            stack.push(new int[]{nr, nc});
        }
    }
}
```

Swap `push`/`pop` for `offer`/`poll` and the same loop becomes BFS. The two traversals differ only in the container.

@exercise pat-gr-drill-iterdfs

## BFS: shortest steps, layer by layer

BFS explores in rings: every node 1 step away, then every node 2 steps away, and so on. So the first time BFS reaches a node, it has found the **fewest edges** to get there. Freeze `q.size()` at the top of each round to process exactly one layer:

```java
Deque<Integer> q = new ArrayDeque<>();
boolean[] seen = new boolean[n];
q.offer(start);
seen[start] = true;                     // mark on OFFER
int steps = 0;
while (!q.isEmpty()) {
    int size = q.size();                // this layer only
    for (int i = 0; i < size; i++) {
        int node = q.poll();
        if (node == target) return steps;
        for (int next : adj.get(node)) {
            if (!seen[next]) {
                seen[next] = true;
                q.offer(next);
            }
        }
    }
    steps++;                            // finished a layer
}
return -1;                              // unreachable
```

@exercise pat-gr-mcq-visited

@exercise pat-gr-fill-bfs

## Multi-source BFS

When many cells spread **at the same time** (every rotten orange, every gate), put **all the sources in the queue before the loop starts**. They all begin at layer 0, and their wavefronts grow together. Each cell gets reached first by its nearest source. That's one O(rows·cols) pass, not one BFS per source.

Rotting oranges with two rotten sources (`2` rotten, `1` fresh, `0` empty):

```text
minute 0          minute 1          minute 2          minute 3
2 1 1 1 1         2 2 1 1 1         2 2 2 1 2         2 2 2 2 2
1 1 0 1 1         2 1 0 1 2         2 2 0 2 2         2 2 0 2 2
1 1 1 1 2         1 1 1 2 2         2 1 2 2 2         2 2 2 2 2
queue: (0,0)      new: (0,1) (1,0)  new: 6 cells      new: (0,3) (2,1)
       (2,4)           (1,4) (2,3)                    fresh = 0 → answer 3
```

Count the fresh oranges up front and decrement as they rot. If any are still fresh after the queue empties, they were unreachable, so return `-1`. Walls and Gates is the same idea: seed every gate, then write `dist[cell] = dist[parent] + 1` as each room is first reached.

@exercise pat-gr-drill-nearest

## Reverse the question

Sometimes searching *from* every cell repeats work. Search from the **destination** instead.

- **Pacific Atlantic**: "Can water flow from this cell to the ocean?" asked for every cell re-walks the same paths. Flip it: start at each ocean's border cells and DFS **uphill** (to neighbors with height `>=` the current cell). You get two `boolean[][]` grids, and the answer is every cell marked in both. Here you need `seen` arrays, since the heights must stay intact.
- **Surrounded Regions**: checking whether each `O` region is enclosed is fiddly. Flip it: only `O`s connected to the **border** survive. Flood from every border `O` and mark those cells `'S'`. Then sweep the board: leftover `O` → `X`, and `S` → `O`.

```text
start          mark border-connected    sweep
X X X X        X X X X                  X X X X
X O O X        X O O X                  X X X X
X X O X   →    X X O X             →    X X X X
X O X X        X S X X                  X O X X
```

@exercise pat-gr-mcq-reverse

## BFS over implicit nodes: Word Ladder

Nodes don't have to be cells or integers. In Word Ladder each **word** is a node, and two words are neighbors if they differ by one letter. Comparing every pair of words costs O(N²·L). Generate the neighbors instead: try each position with each of the 26 letters, and keep only the words that are in a `HashSet`.

```java
char[] arr = word.toCharArray();
for (int j = 0; j < arr.length; j++) {
    char orig = arr[j];
    for (char ch = 'a'; ch <= 'z'; ch++) {
        arr[j] = ch;
        String next = new String(arr);
        if (dict.remove(next)) q.offer(next);   // remove = mark visited
    }
    arr[j] = orig;                              // restore before next position
}
```

`hit → hot → dot → dog → cog` is found on the 5th layer. The answer counts words, not edges, so start the level counter at 1. There's also a *wildcard* variant that pre-builds a map from `h*t` → `[hot, hit]` so words sharing a pattern are neighbors. Both run in about O(N·L²).

## Apply it

| Template | Problems |
| --- | --- |
| Grid DFS flood fill (count / measure regions) | Number of Islands, Max Area of Island |
| Multi-source BFS (seed all sources, layers = time/distance) | Rotting Oranges, Walls and Gates |
| Reverse the question (search from the border inward) | Pacific Atlantic Water Flow, Surrounded Regions |
| BFS over generated neighbors | Word Ladder |

## Recap

- Edge list → `List<List<Integer>>` (or `computeIfAbsent` map). For undirected graphs, add both directions.
- Grid → `dirs` array + bounds check. Mark visited in place, or use `boolean[][]` when the values must survive.
- DFS: check, mark, recurse. For huge grids, switch to an `ArrayDeque` stack.
- BFS: mark on offer and freeze `size` per layer. The first time BFS reaches a node is the shortest path in edges.
- Multi-source: put all sources in the queue before the loop.
- When searching from every cell repeats work, search from the destination or border instead.
