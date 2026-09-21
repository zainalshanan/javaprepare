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

## What Java operations cost

A single innocent-looking call can hide a loop. These are the ones that decide whether your "O(n)" solution really is O(n):

| Operation | Cost | Watch out for |
| --- | --- | --- |
| `arr[i]`, `list.get(i)`, `list.set(i, v)` | O(1) | |
| `list.add(x)` (at the end) | O(1) amortized | occasional resize copies, averaged out |
| `list.add(0, x)`, `list.remove(0)` | **O(n)** | shifts every element; use `ArrayDeque` for the front |
| `list.contains(x)`, `list.indexOf(x)` | **O(n)** | a scan; use a `HashSet` for lookups |
| `HashMap` / `HashSet` get, put, contains, remove | O(1) average | |
| `TreeMap` / `TreeSet` put, get, floorKey, ceiling | O(log n) | |
| `PriorityQueue` offer, poll | O(log n) | `peek` is O(1) |
| `ArrayDeque` push, pop, offer, poll | O(1) | |
| `s += c` inside a loop | **O(n²) total** | every `+=` copies the string; use `StringBuilder` |
| `sb.append(c)` | O(1) amortized | |
| `s.substring(i, j)`, `s.equals(t)`, `new ArrayList<>(list)` | O(length) | copies or scans |
| `Arrays.sort`, `Collections.sort` | O(n log n) | |

So `for (...) if (list.contains(x))` is O(n²), not O(n). Swapping the list for a `HashSet` fixes it.

## Space complexity

Same idea for extra memory. A HashSet of all n elements = O(n) space; two pointer variables = O(1). Recursion costs stack space equal to its depth.

@exercise bigo-mcq-space

## The classic trade

Two Sum brute force: O(n²) time, O(1) space. Two Sum with a HashMap: O(n) time, O(n) space. **Buying time with memory** is the most common optimization move on LeetCode — if your first idea is nested loops, ask "what lookup would make the inner loop O(1)?"

@exercise bigo-mcq-trade

Now do it yourself. The brute force for the next drill is two nested loops checking every pair `i < j`. That's O(n²). Replace the inner loop with a map lookup.

@exercise bigo-code-count-pairs

## Recap

- Read constraints first: n ≤ 10⁵ rules out O(n²).
- Drop constants; sequential steps add (take the max); nested loops multiply; halving is log n.
- Hidden O(n): `list.contains`, `list.remove(0)`, `substring`, and `s +=` in a loop (O(n²) total).
- O(1) average: `HashMap`/`HashSet`. O(log n): `TreeMap`, `PriorityQueue` offer/poll.
- Nested loop searching for something? Replace the inner loop with a HashMap/HashSet lookup.
