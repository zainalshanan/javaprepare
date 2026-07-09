Arrays & Hashing is the foundation category. The core move: **trade memory for lookups** — put what you've seen into a HashMap/HashSet so the question "have I seen X?" costs O(1) instead of a rescan.

## The template

```java
Map<Integer, Integer> seen = new HashMap<>();   // value -> index (or count)
for (int i = 0; i < nums.length; i++) {
    int need = /* what would complete the answer at i */;
    if (seen.containsKey(need)) {
        // found the pair / answer
    }
    seen.put(nums[i], i);   // record AFTER checking (avoids using i with itself)
}
```

That's Two Sum verbatim — and the same skeleton solves dozens of "find a pair/complement" problems.

## Recognizing the category

- "Find two numbers that..." → complement lookup (map value → index)
- "Does X appear / how many times" → counting idiom
- "Group the ... together" → `computeIfAbsent` grouping with a canonical key
- "Are these the same letters" → count array `int[26]` comparison

The creative step is choosing the **key**. Group Anagrams works because the sorted word (`"eat"` → `"aet"`) is identical for all anagrams — a *canonical form* used as the map key.

@exercise pat-ah-mcq-key

## Drill the shape

@exercise pat-ah-drill-pairs

@exercise pat-ah-drill-complement

Now go apply it — the problems for this unit are on the course page: Two Sum, Contains Duplicate, Valid Anagram, Group Anagrams, Top K Frequent Elements.
