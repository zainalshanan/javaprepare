Backtracking tries every possibility by building a candidate one choice at a time, then **undoing** each choice after exploring it. Subsets, permutations, combination sums, word search on a grid, and N-Queens all use the same three steps: choose → explore → un-choose.

## The template

```java
List<List<Integer>> res = new ArrayList<>();

private void backtrack(int start, List<Integer> path, int[] nums) {
    res.add(new ArrayList<>(path));          // record a COPY of the current state
    for (int i = start; i < nums.length; i++) {
        path.add(nums[i]);                   // 1. choose
        backtrack(i + 1, path, nums);        // 2. explore
        path.remove(path.size() - 1);        // 3. un-choose
    }
}
// kick off: backtrack(0, new ArrayList<>(), nums);
```

## The recursion tree for subsets([1, 2, 3])

Each node below is one call to `backtrack`, labelled with `path` at the moment of that call. Following an edge down means choose + explore. Returning back up that edge is the un-choose. `✓` marks where a result is recorded; for subsets that's every node.

```text
                          [] ✓
          ┌─────────────────┼─────────────────┐
         +1                +2                +3
        [1] ✓             [2] ✓             [3] ✓
    ┌─────┴─────┐           │
   +2          +3          +3
 [1,2] ✓     [1,3] ✓     [2,3] ✓
    │
   +3
[1,2,3] ✓
```

`path` is **one** list, shared by every call. In call order it goes through these states:

`[]` → `[1]` → `[1,2]` → `[1,2,3]` → `[1,2]` → `[1]` → `[1,3]` → `[1]` → `[]` → `[2]` → `[2,3]` → `[2]` → `[]` → `[3]` → `[]`

That gives 8 records, which is 2³. `start` means each call only looks *forward* in the array, so `[2,1]` is never built. Two details matter every time:

1. **Copy on record:** `res.add(new ArrayList<>(path))`. If you add `path` itself, every entry in `res` points at the same list, and that list ends up empty.
2. **Undo after recursing:** every `add` needs a matching `remove`. Otherwise one branch's choices leak into the next branch.

@exercise pat-bt-mcq-undo

## Subsets vs combinations vs permutations

| | Subsets | Combinations (size k, or sum to target) | Permutations |
| --- | --- | --- | --- |
| loop starts at | `start` | `start` | `0` |
| skip rule | none | none | `if (used[i]) continue;` |
| recurse with | `i + 1` | `i + 1` (or `i` if reuse is allowed) | depth + 1, with `used[i] = true` |
| record when | every call | `path.size() == k` / `remaining == 0` | `path.size() == nums.length` |

A `start` index means "only look forward," so order doesn't matter: that's subsets and combinations. A `used[]` array means "anything not already taken," so order matters: that's permutations.

```java
private void permute(List<Integer> path, boolean[] used, int[] nums) {
    if (path.size() == nums.length) { res.add(new ArrayList<>(path)); return; }
    for (int i = 0; i < nums.length; i++) {
        if (used[i]) continue;
        used[i] = true;                    // choose: two pieces of state
        path.add(nums[i]);
        permute(path, used, nums);
        path.remove(path.size() - 1);      // un-choose: undo both
        used[i] = false;
    }
}
```

@exercise pat-bt-fill-perm

@exercise pat-bt-drill-combos

## Reuse allowed: recurse with `i`, not `i + 1`

Combination Sum lets you pick the same number more than once. Only one thing changes: the recursive call stays on `i` instead of moving to `i + 1`.

```java
private void combo(int start, int remaining, List<Integer> path, int[] nums) {
    if (remaining == 0) { res.add(new ArrayList<>(path)); return; }
    if (remaining < 0) return;                       // overshot → dead end
    for (int i = start; i < nums.length; i++) {
        path.add(nums[i]);
        combo(i, remaining - nums[i], path, nums);   // i: nums[i] may be chosen again
        path.remove(path.size() - 1);
    }
}
```

You still need `start`. Without it, `[2,3,2]` and `[3,2,2]` would show up as separate copies of `[2,2,3]`.

@exercise pat-bt-mcq-reuse

## Duplicates in the input: sort, then skip at the same depth

Take `nums = [1,2,2]`, already sorted. The two 2s would grow identical branches. Keep the **first** copy at each depth and prune later copies that are **siblings** (in the same loop):

```text
                           []
          ┌─────────────────┼─────────────────┐
         +1                +2                +2
         [1]               [2]            ✗ pruned
    ┌─────┴─────┐           │
   +2          +2          +2
  [1,2]     ✗ pruned      [2,2]
    │
   +2
 [1,2,2]
```

Both pruned branches are a second 2 sitting next to an identical sibling in the same loop. Anything they could build, the first 2 already built. The `+2` under `[2]` is **not** pruned. It's the first candidate in its own loop (`i == start`), and it's how you get `[2,2]`.

```java
Arrays.sort(nums);                                        // duplicates become neighbours
// ...
for (int i = start; i < nums.length; i++) {
    if (i > start && nums[i] == nums[i - 1]) continue;    // same value, same depth → skip
    path.add(nums[i]);
    backtrack(i + 1, path, nums);
    path.remove(path.size() - 1);
}
```

The result is `[] [1] [1,2] [1,2,2] [2] [2,2]`, with no repeats. Combination Sum II uses the same skip together with a `remaining` target and `i + 1`.

@exercise pat-bt-fill-dup

## Beyond lists of numbers

The same three steps work with other kinds of state.

**Grid (Word Search).** The state is which cells are on the current path. Mark a cell in place, and restore it on the way out:

```java
char tmp = board[r][c];
board[r][c] = '#';                                   // choose: mark visited
boolean found = dfs(r + 1, c, i + 1) || dfs(r - 1, c, i + 1)
             || dfs(r, c + 1, i + 1) || dfs(r, c - 1, i + 1);
board[r][c] = tmp;                                   // un-choose: restore
```

**Palindrome Partitioning.** The choice is where the next piece ends:

```java
for (int end = start + 1; end <= s.length(); end++) {
    if (!isPalindrome(s, start, end - 1)) continue;  // prune pieces that aren't palindromes
    path.add(s.substring(start, end));
    backtrack(end, path, s);                         // partition the rest
    path.remove(path.size() - 1);
}
```

**Phone letters.** Each recursion level handles one digit and branches over that digit's letters, with a `StringBuilder` as the path:

```java
for (char c : MAP[digits.charAt(i) - '0'].toCharArray()) {
    sb.append(c);
    backtrack(i + 1, sb);
    sb.deleteCharAt(sb.length() - 1);
}
```

@exercise pat-bt-drill-binary

**N-Queens.** Place one queen per row; the choice is which column. A queen at `(r, c)` attacks its whole column, its `↘` diagonal (every cell with the same `r - c`), and its `↙` anti-diagonal (every cell with the same `r + c`):

```text
    r + c            r - c
   0 1 2 3         0 -1 -2 -3
   1 2 3 4         1  0 -1 -2
   2 3 4 5         2  1  0 -1
   3 4 5 6         3  2  1  0
```

```java
for (int c = 0; c < n; c++) {
    if (cols.contains(c) || diag.contains(r - c) || anti.contains(r + c)) continue;
    cols.add(c); diag.add(r - c); anti.add(r + c); board[r][c] = 'Q';           // choose
    place(r + 1);                                                              // explore
    cols.remove(c); diag.remove(r - c); anti.remove(r + c); board[r][c] = '.'; // un-choose
}
```

Boolean arrays work in place of the sets and are faster: size `n` for columns, and size `2n` for both diagonals, indexing the `↘` diagonal as `r - c + n` so the index never goes negative.

## Apply it

Easy → hard: **Subsets**, **Permutations**, **Combination Sum**, **Letter Combinations of a Phone Number**, **Subsets II**, **Combination Sum II**, **Palindrome Partitioning**, **Word Search**, **N-Queens**.

## Recap

- Choose → explore → un-choose. Every mutation gets a matching undo.
- Record with `res.add(new ArrayList<>(path))`, a copy.
- `start` for subsets and combinations; `used[]` + loop from 0 for permutations.
- Reuse allowed → recurse with `i`; each element used once → `i + 1`.
- Duplicate values: sort, then `if (i > start && nums[i] == nums[i-1]) continue;`.
- Grid: mark the cell `'#'`, recurse, restore. N-Queens: track columns, `r - c`, and `r + c`.
