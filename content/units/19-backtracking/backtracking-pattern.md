Backtracking explores every possibility by building candidates step by step and **undoing** each step after exploring it. Subsets, permutations, combination sums, N-Queens — one template.

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

Choose → explore → un-choose. The `start` index prevents revisiting earlier elements (for subsets/combinations); permutations instead track a `used[]` array and always loop from 0.

Two non-negotiable details:

1. **Copy on record**: `new ArrayList<>(path)` — `path` keeps mutating after you add it.
2. **Undo after recursing**: the remove restores `path` for the next loop iteration. Forget it and states bleed into each other.

@exercise pat-bt-mcq-undo

## Variations at a glance

- **Subsets**: record at every node (the template above).
- **Combinations summing to target**: record only when the remaining target hits 0; allow reuse by recursing with `i` instead of `i + 1`.
- **Permutations**: loop from 0 with a `used[]` boolean array; record when `path.size() == nums.length`.

@exercise pat-bt-drill-binary

@exercise pat-bt-drill-combos

Apply it: Subsets, Combination Sum, Permutations.
