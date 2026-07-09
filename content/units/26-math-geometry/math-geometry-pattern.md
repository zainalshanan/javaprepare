A grab-bag category, but a few moves cover most of it.

## Digit manipulation

```java
// peel digits (Reverse Integer, Palindrome Number)
while (x != 0) {
    int digit = x % 10;
    x /= 10;
    reversed = reversed * 10 + digit;
}
```

Watch the overflow: reversing 1534236469 exceeds int. Either build in a `long` and range-check, or check `reversed > (Integer.MAX_VALUE - digit) / 10` *before* multiplying.

## GCD — Euclid's algorithm

```java
private int gcd(int a, int b) {
    return b == 0 ? a : gcd(b, a % b);
}
```

One line, worth memorizing verbatim.

@exercise pat-mg-drill-gcd

## Matrix rotation

Rotate an n×n matrix 90° clockwise **in place**: transpose (mirror across the diagonal), then reverse each row:

```java
for (int i = 0; i < n; i++)
    for (int j = i + 1; j < n; j++) {           // j starts at i+1: swap once!
        int t = m[i][j]; m[i][j] = m[j][i]; m[j][i] = t;
    }
for (int[] row : m)
    for (int l = 0, r = n - 1; l < r; l++, r--) {
        int t = row[l]; row[l] = row[r]; row[r] = t;
    }
```

(Counter-clockwise = transpose then reverse each *column* — or reverse rows first.)

@exercise pat-mg-mcq-rotate

@exercise pat-mg-drill-rev

Apply it: Rotate Image, Reverse Integer.
