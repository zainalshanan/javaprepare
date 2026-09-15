Three pieces of "reading knowledge" you need before collections: generics, autoboxing, and Java's two kinds of equality.

## Generics: the angle brackets

Collections hold *objects*, and the `<...>` says which kind:

```java
List<Integer> nums;              // a list of Integers
Map<String, Integer> counts;     // String keys → Integer values
List<List<Integer>> groups;      // a list of lists — common for results
```

You can't write `List<int>` — primitives don't fit in generics. Instead, each primitive has an object **wrapper**: `int → Integer`, `char → Character`, `boolean → Boolean`, `long → Long`, `double → Double`.

@exercise gen-mcq-wrapper

## Autoboxing

Java converts between `int` and `Integer` automatically most of the time:

```java
List<Integer> list = new ArrayList<>();
list.add(5);          // int auto-boxes to Integer
int x = list.get(0);  // Integer auto-unboxes to int
```

The trap: an `Integer` can be `null` (e.g., `map.get(missingKey)`), and unboxing `null` throws a `NullPointerException`.

@exercise gen-mcq-nullunbox

## == vs .equals — the #1 Java gotcha

- `==` compares **references** — "are these the *same object*?"
- `.equals()` compares **contents** — "do these hold the same value?"

```java
String a = "hello";
String b = new String("hello");
a == b;        // false! different objects
a.equals(b);   // true — same characters
```

Rule: **primitives with `==`, objects with `.equals()`.**

@exercise gen-mcq-equals

## The Integer cache trap

`Integer` is an object too, so `==` between two `Integer`s compares references. Java caches the boxed values **-128 to 127**, so small numbers happen to share one object, and the bug hides in every small test:

```java
Integer a = 127, b = 127;
a == b;           // true  — both point at the cached 127
Integer c = 128, d = 128;
c == d;           // false — two separate objects
c.equals(d);      // true
int e = 128;
c == e;           // true  — one side is a primitive, so c unboxes
```

This shows up as "passes the examples, fails a hidden test" when comparing two map counts: `map1.get(ch) == map2.get(ch)`. Use `.equals`, or unbox into `int` variables first.

@exercise gen-fill-integer-cache

@exercise gen-fill-safe

@exercise gen-code-boxing-bug

That's all the equality theory you need. Next: making your own classes work as keys.

## Recap

- Generics need wrappers: `List<Integer>`, `Map<Character, Integer>`.
- Unboxing `null` throws NPE; read maps with `getOrDefault(key, 0)` or guard with `containsKey`.
- Primitives `==`; objects (String, Integer, lists) `.equals()`.
- `Integer == Integer` is only "true" inside the -128..127 cache. Use `.equals` or compare `int`s.
