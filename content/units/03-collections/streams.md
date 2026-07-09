Streams give you concise one-liners for aggregating and converting collections. They're **optional** — every stream has a plain-loop equivalent, and in an interview a clear loop is never wrong — but the conversions especially save real keystrokes on LeetCode.

## Aggregating an int[]

```java
import java.util.*;

Arrays.stream(nums).sum();              // total
Arrays.stream(nums).max().getAsInt();   // maximum (getAsInt: OptionalInt -> int)
Arrays.stream(nums).min().getAsInt();
Arrays.stream(nums).filter(x -> x > 0).count();   // how many positives (returns long)
Arrays.stream(nums).filter(x -> x % 2 == 0).sum(); // sum of evens
```

`Arrays.stream(int[])` gives an `IntStream` with primitive-friendly `sum`/`max`/`filter`. Note `max()`/`min()` return an `OptionalInt` (the array could be empty), so you unwrap with `getAsInt()`.

@exercise streams-mcq-what

@exercise streams-fill-aggregate

@exercise streams-code-sumpos

## Converting between int[] and List<Integer>

This is where streams genuinely beat the loop — the boxing conversions are fiddly by hand:

```java
import java.util.*;
import java.util.stream.*;

// List<Integer> -> int[]
int[] arr = list.stream().mapToInt(i -> i).toArray();

// int[] -> List<Integer>
List<Integer> boxed = Arrays.stream(nums).boxed().collect(Collectors.toList());
```

`mapToInt(i -> i)` unboxes `Integer` → `int`; `boxed()` does the reverse. `Collectors.toList()` needs `import java.util.stream.*;`.

@exercise streams-fill-convert

@exercise streams-code-tolist
