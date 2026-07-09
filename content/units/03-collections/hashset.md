`HashSet` = HashMap without the values: a bag of **unique** elements with O(1) `contains`. Reach for it whenever the question is just "have I seen this?"

```java
Set<Integer> set = new HashSet<>();
set.add(x);          // returns false if x was already there — useful!
set.contains(x);     // O(1)
set.remove(x);
set.size();
```

Build one from an array:

```java
Set<Integer> seen = new HashSet<>();
for (int x : nums) seen.add(x);
```

@exercise hs-mcq-addreturn

## Set vs Map vs count array

- Need *existence only* → `HashSet`
- Need *counts or associated data* → `HashMap`
- Keys are lowercase letters / digits → a plain `int[26]` count array beats both

@exercise hs-mcq-choose

## Practice

@exercise hs-has-duplicate

@exercise hs-drill-missing

## Reference drills

Rapid recall of every core HashSet operation. Fill the blank, then write it live.

@exercise hs-ref-fill

@exercise hs-ref-code
