Arrays & Hashing is the foundation category. The core move: **trade memory for lookups** — put what you've seen into a HashMap/HashSet so the question "have I seen X?" costs O(1) instead of a rescan. The rest of the unit is a handful of array tricks (prefix products, bucket counts, length prefixes) that show up again and again.

## Template 1: complement lookup

```java
Map<Integer, Integer> seen = new HashMap<>();   // value -> index (or count)
for (int i = 0; i < nums.length; i++) {
    int need = target - nums[i];                 // what would complete the answer at i
    if (seen.containsKey(need)) {
        return new int[]{seen.get(need), i};     // found the pair
    }
    seen.put(nums[i], i);   // record AFTER checking (avoids using i with itself)
}
```

That's Two Sum verbatim. Drop the index and it's Contains Duplicate (`if (!set.add(x)) return true;`).

## Template 2: counting

```java
Map<Integer, Integer> count = new HashMap<>();
for (int x : nums) count.put(x, count.getOrDefault(x, 0) + 1);
// or count.merge(x, 1, Integer::sum);
```

When the keys are lowercase letters, an `int[26]` is faster and simpler than a map:

```java
int[] freq = new int[26];
for (char c : s.toCharArray()) freq[c - 'a']++;
for (char c : t.toCharArray()) freq[c - 'a']--;
// anagrams  <=>  every freq[i] == 0
```

## Template 3: grouping by a canonical key

The creative step is choosing the **key**: something equal for exactly the items that belong together. Two keys work for anagrams.

**Sorted `char[]` key** — O(k log k) per word:

```java
Map<String, List<String>> groups = new HashMap<>();
for (String w : strs) {
    char[] chars = w.toCharArray();
    Arrays.sort(chars);
    String key = new String(chars);            // "eat", "tea", "ate" -> "aet"
    groups.computeIfAbsent(key, k -> new ArrayList<>()).add(w);
}
return new ArrayList<>(groups.values());
```

**`int[26]` count key** — O(k) per word. An `int[]` can't be a map key (arrays use identity `equals`), so turn the counts into a String:

```java
int[] cnt = new int[26];
for (char c : w.toCharArray()) cnt[c - 'a']++;
String key = Arrays.toString(cnt);             // "[1, 0, 0, 0, 1, ...]"
groups.computeIfAbsent(key, k -> new ArrayList<>()).add(w);
```

@exercise pat-ah-mcq-key

## Template 4: bucket sort by frequency (Top K)

A frequency can never exceed `n`, so instead of sorting counts, drop each value into bucket `freq` and read buckets from the top down — O(n):

```java
List<Integer>[] buckets = new List[nums.length + 1];
for (Map.Entry<Integer, Integer> e : count.entrySet()) {
    int f = e.getValue();
    if (buckets[f] == null) buckets[f] = new ArrayList<>();
    buckets[f].add(e.getKey());
}
int[] res = new int[k];
int idx = 0;
for (int f = buckets.length - 1; f >= 0 && idx < k; f--) {
    if (buckets[f] == null) continue;
    for (int val : buckets[f]) if (idx < k) res[idx++] = val;
}
```

For `nums = [1,1,1,2,2,3]`: counts `{1:3, 2:2, 3:1}` → `buckets[3]=[1], buckets[2]=[2], buckets[1]=[3]`. Reading from index 6 down gives `1, 2, 3, ...`.

## Template 5: prefix and suffix passes

"Everything except `i`" = (everything left of `i`) × (everything right of `i`). Two passes, no division:

```java
int n = nums.length;
int[] res = new int[n];
int prefix = 1;
for (int i = 0; i < n; i++) {        // res[i] = product of nums[0..i-1]
    res[i] = prefix;
    prefix *= nums[i];
}
int suffix = 1;
for (int i = n - 1; i >= 0; i--) {   // multiply in product of nums[i+1..n-1]
    res[i] *= suffix;
    suffix *= nums[i];
}
```

| `i` | `nums[i]` | after left pass `res[i]` | `suffix` used | final `res[i]` |
| --- | --- | --- | --- | --- |
| 0 | 1 | 1 | 24 | 24 |
| 1 | 2 | 1 | 12 | 12 |
| 2 | 3 | 2 | 4 | 8 |
| 3 | 4 | 6 | 1 | 6 |

Key detail: write `res[i]` **before** folding `nums[i]` into the running product — that's what excludes `i` itself.

@exercise pat-ah-drill-prefix

## Template 6: start counting only at a sequence start

Longest Consecutive Sequence in O(n): put everything in a HashSet, and only walk upward from numbers that **begin** a run.

```java
Set<Integer> set = new HashSet<>();
for (int x : nums) set.add(x);
int best = 0;
for (int x : set) {
    if (!set.contains(x - 1)) {          // x starts a run — otherwise skip it
        int len = 1;
        while (set.contains(x + len)) len++;
        best = Math.max(best, len);
    }
}
```

Without the `x - 1` check, `[1,2,3,...,n]` rescans the tail from every element: O(n²). With it, each number is walked over exactly once.

## Template 7: length-prefix encoding

To pack a list of arbitrary strings (which may contain any delimiter) into one string, write each string's **length** first, then a separator, then the raw characters:

```java
// encode ["lint", "c#de", ""] -> "4#lint4#c#de0#"
StringBuilder sb = new StringBuilder();
for (String s : strs) sb.append(s.length()).append('#').append(s);

// decode
List<String> out = new ArrayList<>();
int i = 0;
while (i < encoded.length()) {
    int j = encoded.indexOf('#', i);            // end of the length digits
    int len = Integer.parseInt(encoded.substring(i, j));
    out.add(encoded.substring(j + 1, j + 1 + len));
    i = j + 1 + len;                            // jump past the payload
}
```

The decoder never searches *inside* a payload — it jumps over exactly `len` chars — so a `#` in the data is harmless.

## Recognizing the category

- "Find two numbers that..." → complement lookup
- "Does X appear / how many times" → counting (`int[26]` for letters)
- "Group the ... together" → `computeIfAbsent` with a canonical key
- "Top / most frequent k" → count, then bucket by frequency
- "Product/sum of everything except i" → prefix + suffix passes
- "Longest run of consecutive values, O(n)" → HashSet + sequence-start check
- "Validate a grid" (Sudoku) → one `Set` per row/column/box; box index `(r / 3) * 3 + c / 3`

@exercise pat-ah-fill-group

## Drill the shape

@exercise pat-ah-drill-pairs

@exercise pat-ah-drill-complement

## Apply it

| Technique | Problems (easy → hard) |
| --- | --- |
| Complement lookup / seen-set | Contains Duplicate, Two Sum |
| Counting (`int[26]`) | Valid Anagram |
| Canonical key grouping | Group Anagrams |
| Seen-sets per row/col/box | Valid Sudoku |
| Count + bucket sort | Top K Frequent Elements |
| Prefix / suffix passes | Product of Array Except Self |
| Length-prefix encoding | Encode and Decode Strings |
| HashSet + sequence start | Longest Consecutive Sequence |

## Recap

- HashMap/HashSet turns "have I seen X?" into O(1); check before you insert.
- Letters → `int[26]`, index `c - 'a'`; `Arrays.toString(cnt)` makes it a map key.
- Grouping: `map.computeIfAbsent(key, k -> new ArrayList<>()).add(x)`.
- Frequencies ≤ n → bucket array indexed by frequency beats sorting.
- "Except i" → left running product, then right running product.
- Only extend a run from `x` when `!set.contains(x - 1)`.
