The previous lesson used **comparators** — an *external* rule you hand to `sort`. **Comparable** is the other half: a class's *own* built-in ordering, so `Collections.sort` / `Arrays.sort` / `TreeSet` just work with no comparator at all.

## Two ways to order objects

- **Comparator** (external): `list.sort((a, b) -> ...)` — decide the order at the call site. Great for ad-hoc or multiple orderings.
- **Comparable** (internal / "natural order"): the class implements `Comparable<T>` and defines `compareTo`, becoming sortable by default.

```java
class Person implements Comparable<Person> {
    int id, age;
    Person(int id, int age) { this.id = id; this.age = age; }

    @Override
    public int compareTo(Person other) {
        return Integer.compare(this.age, other.age);   // natural order = by age
    }
}
```

Now `Collections.sort(people)` orders by age with no comparator, and a `TreeSet<Person>` / `TreeMap<Person, …>` keeps them sorted automatically.

@exercise comp-mcq-vs

## compareTo returns the same three signs as a comparator

`this.compareTo(other)`: **negative** → `this` comes first, **positive** → `other` first, **0** → equal. Same convention as `Comparator.compare`. And the same overflow caution applies — use `Integer.compare(a, b)`, not `a - b`.

@exercise comp-fill-skeleton

## When to reach for it

- One obvious, canonical ordering for the type (age, value, timestamp) → make it `Comparable`.
- You need `TreeSet`/`TreeMap` of your own objects → they *require* either `Comparable` or a comparator supplied at construction.
- Multiple or situational orderings → use `Comparator` instead (or in addition — a comparator overrides the natural order at a specific call).

@exercise comp-code-sortbyage
