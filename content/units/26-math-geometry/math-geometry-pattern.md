This unit is a grab bag, but each problem comes down to one move you can memorize: matrix index tricks, digit peeling with overflow guards, or fast exponentiation.

## Rotate Image: transpose, then reverse each row

To rotate 90° clockwise in place, mirror the matrix across its main diagonal, then flip each row:

```text
original      transpose       reverse each row
1 2 3         1 4 7           7 4 1
4 5 6   →     2 5 8     →     8 5 2
7 8 9         3 6 9           9 6 3
```

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

(Counter-clockwise: transpose, then reverse each *column*.)

@exercise pat-mg-mcq-rotate

## Spiral Matrix: four shrinking boundaries

```text
          left         right
 top  →    1 →  2 →  3 →  4
                          ↓
           5 →  6 →  7    8
           ↑              ↓
bottom →   9 ← 10 ← 11 ← 12

ring 1: top row → , right col ↓ , bottom row ← , left col ↑   (then shrink all four)
ring 2: top=1, bottom=1, left=1, right=2 → 6 7
```

```java
int top = 0, bottom = rows - 1, left = 0, right = cols - 1;
while (top <= bottom && left <= right) {
    for (int c = left; c <= right; c++) res.add(m[top][c]);
    top++;
    for (int r = top; r <= bottom; r++) res.add(m[r][right]);
    right--;
    if (top <= bottom) {                         // a single row may be left
        for (int c = right; c >= left; c--) res.add(m[bottom][c]);
        bottom--;
    }
    if (left <= right) {                         // a single column may be left
        for (int r = bottom; r >= top; r--) res.add(m[r][left]);
        left++;
    }
}
```

## Set Matrix Zeroes in O(1) space

If you zero cells as you scan, the new zeros look like original ones and spread. So mark first, then apply. Instead of extra arrays, use **row 0 and column 0 as the marker arrays**. `m[0][c] == 0` means "zero column c", and `m[r][0] == 0` means "zero row r". Row 0 and column 0 would both want to use `m[0][0]` as their marker. Give `m[0][0]` to column 0, and keep a separate boolean for row 0:

```java
boolean row0 = false;
for (int r = 0; r < rows; r++)
    for (int c = 0; c < cols; c++)
        if (m[r][c] == 0) {
            m[0][c] = 0;                 // mark column c
            if (r == 0) row0 = true; else m[r][0] = 0;   // mark row r
        }
for (int r = 1; r < rows; r++)           // interior, using the markers
    for (int c = 1; c < cols; c++)
        if (m[0][c] == 0 || m[r][0] == 0) m[r][c] = 0;
if (m[0][0] == 0) for (int r = 0; r < rows; r++) m[r][0] = 0;   // column 0
if (row0) for (int c = 0; c < cols; c++) m[0][c] = 0;           // row 0 LAST
```

Handle row 0 last. Zeroing it earlier would wipe out the column markers you still need.

@exercise pat-mg-mcq-zeroes

## Digits: Plus One, Reverse Integer, Happy Number

**Plus One**: add the carry starting from the last digit. A digit below 9 just increments, and you're done. A 9 becomes 0 and the carry moves left. Only an all-9s number gets longer:

```java
for (int i = d.length - 1; i >= 0; i--) {
    if (d[i] < 9) { d[i]++; return d; }
    d[i] = 0;
}
int[] res = new int[d.length + 1];   // 999 → 1000
res[0] = 1;
return res;
```

**Reverse Integer**: peel digits with `% 10` and `/ 10`. Java's `%` keeps the sign, so negatives work without special handling. Check for overflow **before** `rev * 10`, because once it overflows, the damage is done:

```java
int rev = 0;
while (x != 0) {
    int d = x % 10;
    x /= 10;
    if (rev > Integer.MAX_VALUE / 10 || rev < Integer.MIN_VALUE / 10) return 0;
    rev = rev * 10 + d;
}
```

(When `rev` is exactly `MAX_VALUE / 10`, a 32-bit input can only leave a final digit of 1 or 2, so it can't overflow. The simple check is enough.)

**Happy Number**: `n → sum of squares of digits` is a function, so repeating it either reaches 1 or loops forever. It's cycle detection, the same as a linked list with a cycle. You can use a `HashSet` of seen values, or fast/slow pointers with O(1) space:

```java
int slow = n, fast = next(n);
while (fast != 1 && slow != fast) {
    slow = next(slow);
    fast = next(next(fast));
}
return fast == 1;
```

## Pow(x, n): fast exponentiation

x¹⁰ = x⁸ · x², and 10 in binary is `1010`. Each loop iteration squares the base and halves the exponent. When the exponent's low bit is 1, multiply the current base into the result:

| `N` (binary) | low bit | `result` | `x` after squaring |
| --- | --- | --- | --- |
| 1010 | 0 | 1 | 2² = 4 |
| 101 | 1 | 1·4 = 4 | 4² = 16 |
| 10 | 0 | 4 | 16² = 256 |
| 1 | 1 | 4·256 = **1024** | — |

```java
long N = n;                 // -Integer.MIN_VALUE doesn't fit in int!
if (N < 0) { x = 1 / x; N = -N; }
double result = 1;
while (N > 0) {
    if ((N & 1) == 1) result *= x;
    x *= x;
    N >>= 1;
}
return result;
```

That's O(log n) multiplications instead of n.

@exercise pat-mg-fill-pow

## Multiply Strings: positions `i+j` and `i+j+1`

An m-digit number times an n-digit number has at most m+n digits. Digit `i` of `num1` times digit `j` of `num2` puts its ones digit at index `i+j+1` and its carry at index `i+j`. Work from right to left:

```text
"23" × "45"     pos = [0, 0, 0, 0]   (m+n = 4)
 i j   product  +pos[i+j+1]  → pos
 1 1   3×5=15   15           [0, 0, 1, 5]
 1 0   3×4=12   12+1=13      [0, 1, 3, 5]
 0 1   2×5=10   10+3=13      [0, 2, 3, 5]
 0 0   2×4=8    8+2=10       [1, 0, 3, 5]  → "1035"
```

```java
int sum = (a.charAt(i) - '0') * (b.charAt(j) - '0') + pos[i + j + 1];
pos[i + j + 1] = sum % 10;
pos[i + j] += sum / 10;
```

Skip leading zeros when you build the string, but return `"0"` if every digit is zero.

## Detect Squares: count points, try diagonals

Store a count for every point, in a `HashMap` keyed by `(x, y)`. For a query `(px, py)`, every stored point `(x, y)` with `|x - px| == |y - py| != 0` is a possible **opposite corner**. That fixes the other two corners at `(px, y)` and `(x, py)`:

```text
(px, y) ●───────● (x, y)      diagonal: same distance in x and y
        │       │
(px,py) ◎───────● (x, py)
```

Add `count(px, y) * count(x, py)` for each diagonal, and count each stored copy of a duplicate point separately. Adding a point is O(1). A query is O(number of distinct points).

@exercise pat-mg-drill-gcd

@exercise pat-mg-drill-rev

## Apply it

- **Digits:** Plus One (Easy), Happy Number (Easy) → Reverse Integer
- **Matrix indices:** Rotate Image, Spiral Matrix, Set Matrix Zeroes
- **Arithmetic by hand:** Pow(x, n), Multiply Strings
- **Counting geometry:** Detect Squares

(Euclid's GCD, `gcd(a, b) = b == 0 ? a : gcd(b, a % b)`, isn't used by any problem here, but it's worth knowing.)

## Recap

- Rotate clockwise = transpose (`j` from `i+1`), then reverse each row.
- Spiral: loop while `top <= bottom && left <= right`, and guard the bottom and left passes.
- Zeroes in O(1) space: use row 0 and column 0 as markers, plus a `row0` flag. Apply to row 0 last.
- Overflow: check `rev > MAX_VALUE / 10` before `rev * 10`. For pow, widen `n` to `long`.
- Multiply strings: `pos[i+j+1]` holds the ones digit, `pos[i+j]` gets the carry.
