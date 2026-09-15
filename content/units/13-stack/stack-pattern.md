Stack problems come in two main flavors: **matching** (brackets, expressions, undo) and **monotonic stacks** (next greater element, temperatures, histograms). Both live on the same `ArrayDeque`: `push`, `pop`, `peek`, `isEmpty`.

## Matching-pairs template

```java
Map<Character, Character> pairs = Map.of(')', '(', ']', '[', '}', '{');
Deque<Character> stack = new ArrayDeque<>();
for (char c : s.toCharArray()) {
    if (!pairs.containsKey(c)) stack.push(c);                     // opener
    else if (stack.isEmpty() || stack.pop() != pairs.get(c)) return false;  // closer must match top
}
return stack.isEmpty();                                           // no unclosed openers
```

The most recent unclosed opener must be closed first — that's last-in-first-out, i.e. a stack.

## Min Stack: remember the min at every level

A stack can't search, but each entry can carry the minimum **as of when it was pushed**:

```java
Deque<int[]> stack = new ArrayDeque<>();          // {value, minSoFar}
void push(int x) {
    int min = stack.isEmpty() ? x : Math.min(x, stack.peek()[1]);
    stack.push(new int[]{x, min});
}
int getMin() { return stack.peek()[1]; }          // O(1)
```

Popping automatically "rewinds" to the previous minimum. (Equivalent: two stacks, one of values and one of running minimums.)

## Evaluating Reverse Polish Notation

Operands wait on the stack; an operator pops two, computes, pushes the result.

```java
Deque<Integer> st = new ArrayDeque<>();
for (String tok : tokens) {
    switch (tok) {
        case "+" -> st.push(st.pop() + st.pop());
        case "*" -> st.push(st.pop() * st.pop());
        case "-" -> { int b = st.pop(), a = st.pop(); st.push(a - b); }   // order matters
        case "/" -> { int b = st.pop(), a = st.pop(); st.push(a / b); }
        default  -> st.push(Integer.parseInt(tok));
    }
}
return st.pop();
```

The first pop is the **right** operand. `["4","13","5","/","+"]` → push 4, 13, 5 → `/` pops 5 then 13 → push `13/5 = 2` → `+` → `4 + 2 = 6`.

@exercise pat-st-fill-rpn

## Monotonic stack template

Keeps the stack sorted (here: decreasing temperatures from bottom to top). Each new element **pops everything it beats** — and for each popped element, the new one is its answer:

```java
Deque<Integer> stack = new ArrayDeque<>();   // stores INDICES
int[] res = new int[n];
for (int i = 0; i < n; i++) {
    while (!stack.isEmpty() && temps[i] > temps[stack.peek()]) {
        int idx = stack.pop();
        res[idx] = i - idx;                  // days waited
    }
    stack.push(i);
}
```

Trace Daily Temperatures `[73, 74, 75, 71, 69, 72, 76, 73]` (stack shown bottom → top as `index:temp`):

| `i` | `temps[i]` | popped (answer set) | pushed | stack after |
| --- | --- | --- | --- | --- |
| 0 | 73 | — | 0 | `0:73` |
| 1 | 74 | 0 → `res[0]=1` | 1 | `1:74` |
| 2 | 75 | 1 → `res[1]=1` | 2 | `2:75` |
| 3 | 71 | — | 3 | `2:75, 3:71` |
| 4 | 69 | — | 4 | `2:75, 3:71, 4:69` |
| 5 | 72 | 4 → `res[4]=1`, 3 → `res[3]=2` | 5 | `2:75, 5:72` |
| 6 | 76 | 5 → `res[5]=1`, 2 → `res[2]=4` | 6 | `6:76` |
| 7 | 73 | — | 7 | `6:76, 7:73` |

Leftovers (6, 7) never see a warmer day and keep 0. Answer `[1, 1, 4, 2, 1, 1, 0, 0]`.

Push indices, not values — you need the position for distances and widths. Every index is pushed once and popped at most once: O(n) despite the nested while.

@exercise pat-st-mcq-mono

@exercise pat-st-fill-mono

## Largest Rectangle in Histogram: index stack + sentinel

Keep bar indices with **increasing** heights. When a shorter bar arrives, each taller bar popped has found its right boundary (`i`), and its left boundary is whatever is now below it on the stack.

```java
Deque<Integer> st = new ArrayDeque<>();
int best = 0;
for (int i = 0; i <= h.length; i++) {
    int cur = (i == h.length) ? 0 : h[i];        // sentinel height 0 flushes the stack at the end
    while (!st.isEmpty() && cur < h[st.peek()]) {
        int height = h[st.pop()];
        int left = st.isEmpty() ? -1 : st.peek(); // first shorter bar to the left
        best = Math.max(best, height * (i - left - 1));
    }
    st.push(i);
}
```

For `[2, 1, 5, 6, 2, 3]`: at `i=4` (height 2) we pop 6 (width `4-2-1 = 1`, area 6) and then 5 (width `4-1-1 = 2`, area **10**). The sentinel at `i=6` flushes the rest.

## Car Fleet: sort, compute times, merge

Sort cars by starting position, **closest to target first**. A car that would arrive no later than the fleet ahead of it catches up and merges.

```java
int n = position.length;
int[][] cars = new int[n][2];
for (int i = 0; i < n; i++) cars[i] = new int[]{position[i], speed[i]};
Arrays.sort(cars, (a, b) -> b[0] - a[0]);                  // nearest target first
Deque<Double> fleets = new ArrayDeque<>();                  // arrival time of each fleet
for (int[] c : cars) {
    double time = (double) (target - c[0]) / c[1];
    if (fleets.isEmpty() || time > fleets.peek()) fleets.push(time);   // slower → new fleet
    // else: catches the fleet ahead and merges (don't push)
}
return fleets.size();
```

Only the top matters, so a single `double lastTime` works too.

## Generate Parentheses: a stack you don't store

Generate Parentheses is really **backtracking** (full treatment in the Backtracking unit): build the string char by char, tracking `open` and `close` counts the way a stack's depth would.

```java
void build(StringBuilder sb, int open, int close, int n, List<String> res) {
    if (sb.length() == 2 * n) { res.add(sb.toString()); return; }
    if (open < n)     { sb.append('('); build(sb, open + 1, close, n, res); sb.deleteCharAt(sb.length() - 1); }
    if (close < open) { sb.append(')'); build(sb, open, close + 1, n, res); sb.deleteCharAt(sb.length() - 1); }
}
```

`close < open` is the "stack isn't empty" check — you may only close what's open.

## Drill the shapes

@exercise pat-st-drill-dedup

@exercise pat-st-drill-nge

@exercise pat-st-drill-prevsmaller

## Apply it

| Technique | Problems (easy → hard) |
| --- | --- |
| Matching pairs | Valid Parentheses |
| Stack of (value, min) pairs | Min Stack |
| Operand stack | Evaluate Reverse Polish Notation |
| Open/close counts (backtracking) | Generate Parentheses |
| Monotonic stack (next greater) | Daily Temperatures |
| Sort + stack of arrival times | Car Fleet |
| Increasing index stack + sentinel | Largest Rectangle in Histogram |

## Recap

- `Deque<T> st = new ArrayDeque<>()` — never `Stack` or `LinkedList`.
- Matching: push openers; a closer must match `pop()`; end with `isEmpty()`.
- Min stack: push `{val, min(val, peek()[1])}`.
- RPN: first pop is the right operand (`a - b`, `a / b`).
- Monotonic: store indices; `while (cur beats top) pop & answer`; O(n) amortized.
- Histogram: increasing stack, width `i - left - 1`, sentinel 0 at the end.
