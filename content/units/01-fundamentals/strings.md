String problems are a huge NeetCode category, and Java strings have sharp edges. Learn these cold.

## The essential methods

```java
s.length();              // WITH parentheses (unlike arrays)
s.charAt(i);             // char at index i
s.substring(1, 4);       // indices [1, 4) — end exclusive
s.contains("ab");
s.indexOf("x");          // first index, or -1
s.equals(other);         // ALWAYS use equals, never == (details in Unit 2)
s.toCharArray();         // char[] — great for editing
s.split(" ");            // String[] pieces
s.toLowerCase();
s.trim();                // strip leading/trailing whitespace
```

Strings are **immutable**: no method changes `s`; they all return a *new* string.

@exercise str-mcq-substring

## char ↔ int arithmetic (extremely common)

Chars are secretly numbers, which enables the letter-index trick used in most string problems:

```java
char c = 'd';
int idx = c - 'a';           // 3 — position in the alphabet (0..25)
char back = (char) ('a' + 3); // 'd'

int digit = '7' - '0';        // 7 — char digit to real int
Character.isDigit(c);  Character.isLetter(c);
Character.toLowerCase(c);
```

`c - 'a'` is how you index into a 26-slot count array — the backbone of anagram problems.

@exercise str-fill-charmath

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

@exercise str-ref-access-fill

@exercise str-ref-access-code

@exercise str-ref-search-fill

@exercise str-ref-search-code

@exercise str-ref-sb-fill

@exercise str-ref-sb-code
