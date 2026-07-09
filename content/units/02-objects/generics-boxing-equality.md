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

Rule: **primitives with `==`, objects with `.equals()`.** For `Integer`, `==` "works" for small values (-128..127 are cached) and silently breaks for big ones — never rely on it.

@exercise gen-mcq-equals

@exercise gen-fill-safe

That's all the OOP theory you need. Next unit: the collections themselves.
