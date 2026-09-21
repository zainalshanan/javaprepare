The next unit is full of `->`: `computeIfAbsent(k, x -> new ArrayList<>())`, `new PriorityQueue<>((a, b) -> ...)`, `list.removeIf(x -> x < 0)`. That arrow is a **lambda** — a tiny unnamed function you pass as an argument. Learn to read and write them here, and every collection API afterwards will look familiar.

## A lambda is a function you can pass around

```java
x -> x * 2
```

Read it as "given `x`, return `x * 2`". Left of the arrow: parameters. Right: the result. There's no name, no `return` keyword and no types — Java infers them from where the lambda is used.

The forms you'll actually write:

```java
x -> x * 2                     // one parameter: parentheses optional
(a, b) -> a + b                // two or more: parentheses required
() -> new ArrayList<>()        // zero parameters: empty parentheses
(a, b) -> {                    // block body: braces + an explicit return
    int diff = a[1] - b[1];
    return diff;
}
```

One rule trips people up: an **expression body** (no braces) returns its value automatically. A **block body** (`{ ... }`) needs `return` just like a method.

@exercise lam-mcq-forms

## Where do lambdas go? Functional interfaces

A lambda can only appear where Java expects a **functional interface**, meaning an interface with exactly one abstract method. You rarely write one yourself. You just need to recognize the ones that show up as parameter types in the APIs you call:

| Interface | Method it stands for | Lambda shape | Where you meet it |
| --- | --- | --- | --- |
| `Comparator<T>` | `int compare(T a, T b)` | `(a, b) -> Integer.compare(a, b)` | `sort`, `PriorityQueue`, `TreeMap` |
| `Function<T, R>` | `R apply(T t)` | `k -> new ArrayList<>()` | `computeIfAbsent` |
| `Predicate<T>` | `boolean test(T t)` | `x -> x < 0` | `removeIf`, stream `filter` |
| `BiFunction<T, U, R>` | `R apply(T t, U u)` | `(a, b) -> a + b` | `merge`, `compute` |
| `Consumer<T>` | `void accept(T t)` | `x -> System.out.println(x)` | `forEach` |

The lambda *becomes* an implementation of that one method. So `(a, b) -> Integer.compare(a, b)` is a whole `Comparator` object, and `sort` calls its `compare` whenever it needs to order two elements.

```java
Comparator<Integer> desc = (a, b) -> Integer.compare(b, a);   // store it in a variable
Predicate<Integer> isNeg = x -> x < 0;
isNeg.test(-5);        // true — call the one method by its name
```

## Method references: `Class::method`

When a lambda only calls one existing method and passes its arguments straight through, you can name that method with `::` instead:

| Lambda | Method reference | Kind |
| --- | --- | --- |
| `(a, b) -> Integer.sum(a, b)` | `Integer::sum` | static method |
| `s -> s.length()` | `String::length` | instance method, called on the parameter |
| `x -> System.out.println(x)` | `System.out::println` | method on a specific object |
| `() -> new ArrayList<>()` | `ArrayList::new` | constructor |

They mean exactly the same thing, so use whichever reads better. You'll see these three most often:

```java
count.merge(c, 1, Integer::sum);                       // add 1 to the count
words.sort(Comparator.comparingInt(String::length));   // sort by length
list.forEach(System.out::println);                     // print each element
```

A small gotcha: `computeIfAbsent` hands the **key** to its function, so `ArrayList::new` there would try `new ArrayList<>(key)`. For `String` keys that fails to compile. For `Integer` keys it compiles (the key becomes the initial capacity) and throws at runtime on a negative key. Stick with `k -> new ArrayList<>()`.

@exercise lam-fill-methodref

## Capturing variables: "effectively final"

A lambda can read local variables from the surrounding method:

```java
int limit = 10;
list.removeIf(x -> x > limit);    // fine: reads limit
```

But any local variable a lambda uses must be **effectively final**, meaning it is never reassigned anywhere in the method. So this does not compile:

```java
int count = 0;
list.forEach(x -> { if (x > 0) count++; });   // ERROR: count is reassigned
```

The workaround you'll see in real solutions is a one-element array. The *reference* `count` never changes. Only the slot inside the array does:

```java
int[] count = {0};
list.forEach(x -> { if (x > 0) count[0]++; });   // OK
return count[0];
```

(Fields, like `this.total`, have no such restriction. Often the cleanest fix is just a plain `for` loop.)

@exercise lam-mcq-capture

## Preview: where you'll use them next

```java
Arrays.sort(intervals, (a, b) -> Integer.compare(a[0], b[0]));   // Comparator
map.computeIfAbsent(key, k -> new ArrayList<>()).add(val);      // Function
count.merge(word, 1, Integer::sum);                              // BiFunction
list.removeIf(x -> x % 2 == 0);                                  // Predicate
map.forEach((k, v) -> System.out.println(k + "=" + v));          // BiConsumer
PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> Integer.compare(a[1], b[1]));
```

You don't need to understand the collections yet. Just notice that every `->` is one of the shapes above.

@exercise lam-fill-usage

## Practice

@exercise lam-code-sort-second

@exercise lam-code-group-length

## Recap

- `x -> expr` returns `expr` automatically; `(a, b) -> { ...; return v; }` needs `return`.
- A lambda implements a one-method interface: `Comparator`, `Function`, `Predicate`, `BiFunction`, `Consumer`.
- Method refs: `Integer::sum`, `String::length`, `System.out::println`, `ArrayList::new`.
- Captured locals must be effectively final; mutate through `int[] count = {0}` instead.
- Grouping: `computeIfAbsent(k, x -> new ArrayList<>())`, not `ArrayList::new`.
