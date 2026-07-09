Big-O describes how work grows with input size. Interviewers always ask for it, and it decides *which* solution you should even attempt.

## The ladder

From fastest-growing acceptable input to slowest:

| Complexity | Name | Typical shape | ~Max n on LeetCode |
|---|---|---|---|
| O(1) | constant | map lookup, math formula | any |
| O(log n) | logarithmic | binary search | any |
| O(n) | linear | one pass | ~10⁷ |
| O(n log n) | linearithmic | sort, heap of everything | ~10⁶ |
| O(n²) | quadratic | nested loops over the input | ~10⁴ |
| O(2ⁿ) | exponential | all subsets | ~20 |
| O(n!) | factorial | all permutations | ~10 |

The **constraints tell you the answer**: if n ≤ 10⁵, an O(n²) solution (10¹⁰ steps) will time out — the problem is *forcing* you toward O(n log n) or better. Read constraints first, always.

@exercise bigo-mcq-constraints

## Rules of thumb

- Drop constants and lower-order terms: O(2n + 10) = O(n); O(n² + n) = O(n²).
- Sequential steps add — take the max: a sort O(n log n) then a scan O(n) = O(n log n).
- Nested loops multiply: n outer × n inner = O(n²).
- A loop that halves each time is O(log n).

```java
for (int i = 0; i < n; i++)        // O(n)
    for (int j = i + 1; j < n; j++)  // still O(n²) — the triangle is n²/2
        ;
```

@exercise bigo-mcq-classify

## Space complexity

Same idea for extra memory. A HashSet of all n elements = O(n) space; two pointer variables = O(1). Recursion costs stack space equal to its depth.

@exercise bigo-mcq-space

## The classic trade

Two Sum brute force: O(n²) time, O(1) space. Two Sum with a HashMap: O(n) time, O(n) space. **Buying time with memory** is the most common optimization move on LeetCode — if your first idea is nested loops, ask "what lookup would make the inner loop O(1)?"

@exercise bigo-mcq-trade
