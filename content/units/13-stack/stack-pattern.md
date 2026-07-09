Stack problems come in two flavors: **matching** (brackets, undo) and **monotonic stacks** (next greater element, temperatures). Both live on the same `ArrayDeque`.

## Matching template

```java
Deque<Character> stack = new ArrayDeque<>();
for (char c : s.toCharArray()) {
    if (/* c opens something */) stack.push(c);
    else {
        if (stack.isEmpty() || /* stack top doesn't match c */) return false;
        stack.pop();
    }
}
return stack.isEmpty();
```

## Monotonic stack template

Keeps the stack sorted (say, decreasing). Each new element **pops everything it beats** — and for each popped element, the new one is its answer:

```java
Deque<Integer> stack = new ArrayDeque<>();   // stores INDICES
for (int i = 0; i < n; i++) {
    while (!stack.isEmpty() && nums[i] > nums[stack.peek()]) {
        int idx = stack.pop();
        // nums[i] is the "next greater element" for idx
        res[idx] = i - idx;   // e.g., distance, for Daily Temperatures
    }
    stack.push(i);
}
```

Push indices, not values — you almost always need the position. Every index is pushed once and popped at most once: O(n) despite the nested while.

@exercise pat-st-mcq-mono

@exercise pat-st-drill-dedup

@exercise pat-st-drill-nge

Apply it: Valid Parentheses, Min Stack, Daily Temperatures.
