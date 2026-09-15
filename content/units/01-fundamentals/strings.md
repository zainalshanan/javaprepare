String problems are a huge NeetCode category, and Java strings have sharp edges. Learn these cold.

## The essential methods

```java
s.length();              // WITH parentheses (unlike arrays)
s.charAt(i);             // char at index i
s.substring(1, 4);       // indices [1, 4) — end exclusive
s.contains("ab");
s.indexOf("x");          // first index, or -1
s.equals(other);         // ALWAYS use equals, never ==
s.toCharArray();         // char[] — great for editing
s.split(" ");            // String[] pieces
s.toLowerCase();
s.trim();                // strip leading/trailing whitespace
```

Strings are **immutable**: no method changes `s`; they all return a *new* string.

Why never `==`? Like arrays, a `String` variable is a reference. `==` asks "same object?", which can be false for two strings with identical text. `equals` compares the characters. (Unit 2 digs deeper.)

@exercise str-mcq-substring

## char ↔ int arithmetic (extremely common)

Chars are secretly numbers, which enables the letter-index trick used in most string problems:

```java
char c = 'd';
int idx = c - 'a';           // 3 — position in the alphabet (0..25)
char back = (char) ('a' + 3); // 'd'

int digit = '7' - '0';        // 7 — char digit to real int
```

`c - 'a'` is how you index into a 26-slot count array — the backbone of anagram problems:

```java
int[] counts = new int[26];
for (char ch : s.toCharArray()) {
    counts[ch - 'a']++;      // 'a' → slot 0, 'z' → slot 25
}
```

The flip side of "chars are numbers": `'a' + 1` is the **int** `98`, not `"b"` and not `"a1"`.

@exercise str-fill-charmath

@exercise str-predict-surprises

## Character helpers

```java
Character.isDigit(c);          // '0'..'9'
Character.isLetter(c);         // a-z, A-Z (and other alphabets)
Character.isLetterOrDigit(c);  // skip punctuation and spaces
Character.toLowerCase(c);      // 'A' → 'a' (returns a char)
```

These are the cleaning step in Valid Palindrome-style problems: skip what isn't alphanumeric, compare case-insensitively.

@exercise str-normalize

## Converting between numbers and strings

```java
int n = Integer.parseInt("-42");     // String → int (throws on "abc")
String s = String.valueOf(42);       // int → "42" (works for char, double, ... too)
String t = "" + 42;                  // also works, less explicit

String[] parts = {"a", "b", "c"};
String joined = String.join(",", parts);   // "a,b,c" — the inverse of split
```

@exercise str-sum-csv

## Sorted characters as a key

Two strings are anagrams exactly when their sorted characters match. Sorting a string takes three steps, because strings are immutable:

```java
char[] chars = s.toCharArray();   // "tea" → ['t','e','a']
Arrays.sort(chars);               // ['a','e','t']
String key = new String(chars);   // "aet"
```

`"eat"`, `"tea"`, and `"ate"` all produce the key `"aet"` — which is exactly how Group Anagrams buckets them in a map.

@exercise str-drill-anagram-key

## StringBuilder — building strings in loops

`result += ch` in a loop copies the whole string every time — O(n²). The fix is **StringBuilder**, and interviewers notice when you don't use it:

```java
StringBuilder sb = new StringBuilder();
sb.append('x');       // char
sb.append("yz");      // string
sb.append(42);        // int
sb.length();
sb.deleteCharAt(sb.length() - 1);  // remove last — key for backtracking
sb.reverse();
String done = sb.toString();       // final answer
```

@exercise str-mcq-sbwhy

## Practice

@exercise str-count-vowels

@exercise str-drill-reverse

@exercise str-drill-counts

## Reference drills

Rapid recall of the string and StringBuilder operations. Fill the blank, then write it live — repeat until automatic.

@exercise str-fill-convert

@exercise str-ref-access-fill

@exercise str-ref-access-code

@exercise str-ref-search-fill

@exercise str-ref-search-code

@exercise str-ref-sb-fill

@exercise str-ref-sb-code

## Recap

- `s.length()`, `s.charAt(i)`, `s.substring(a, b)` is `[a, b)`; compare with `s.equals(t)`, never `==`.
- Letter counts: `int[] cnt = new int[26]; cnt[c - 'a']++;` — and `'7' - '0' == 7`.
- `Integer.parseInt("42")`, `String.valueOf(42)`, `String.join(",", parts)`.
- `Character.isLetterOrDigit(c)`, `Character.isDigit(c)`, `Character.toLowerCase(c)`.
- Anagram key: `char[] cs = s.toCharArray(); Arrays.sort(cs); String key = new String(cs);`
- Build in loops with `StringBuilder`: `append`, `deleteCharAt(sb.length() - 1)`, `toString()`.
