Welcome. This course takes you from **zero Java** to solving NeetCode 150 problems, in three arcs:

1. **Fundamentals** — loops, arrays, strings, methods. You'll drill these until your fingers write them without thinking.
2. **Patterns** — one reusable code template per problem category (sliding window, binary search, DFS…).
3. **Problems** — real NeetCode questions, solved by recognizing the pattern and filling in the details.

The philosophy is *muscle memory first*. In an interview you want your brain on the algorithm, not on "how do I loop over a HashMap again?"

## What LeetCode Java looks like

On LeetCode you never write a whole program. You're given a class called `Solution` with one method to fill in:

```java
class Solution {
    public int[] twoSum(int[] nums, int target) {
        // your code here
    }
}
```

Reading that signature:

- `public` — visibility. Always there; don't worry about it yet.
- `int[]` — the **return type**: this method must `return` an array of ints.
- `twoSum` — the method name.
- `(int[] nums, int target)` — the **parameters**: you receive an int array named `nums` and an int named `target`.

@exercise start-mcq-signature

## How this course grades you

Every code exercise here is compiled and run with a **real Java compiler on your machine** — the same `javac` used in production. When you hit *Run & grade*:

1. Your code is compiled. Compiler errors come back with line numbers.
2. It runs against test cases — visible ones you can study, plus hidden ones to keep you honest.
3. You pass when every test passes.

Some exercises are **drills**: you must get them right **3 times in a row**, and they later reappear in the *Review* queue on a spaced-repetition schedule. That's the memorization engine — like flashcards, but you're writing real code.

@exercise start-mcq-drills

## Your first submission

Let's run the full loop once. `System.out.println(...)` prints a line of text. Strings use double quotes in Java — always.

@exercise start-hello

And one in LeetCode style — fill in a method body. `return` hands a value back to the caller.

@exercise start-add

That's the whole workflow: read, write, submit, iterate. Next up: variables and types, where the drilling begins.
