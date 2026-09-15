Bit problems look scary, but this is the smallest toolkit in the course: seven operators and about five identities.

## The operators

Worked on 8 bits with `a = 12` (`00001100`) and `b = 10` (`00001010`). Java `int`s have 32 bits, but the pattern is the same:

| op | meaning | example | result |
| --- | --- | --- | --- |
| `&` | 1 if **both** bits are 1 | `a & b` | `00001000` = 8 |
| `\|` | 1 if **either** bit is 1 | `a \| b` | `00001110` = 14 |
| `^` | 1 if the bits **differ** | `a ^ b` | `00000110` = 6 |
| `~` | flip every bit | `~a` | `11110011` (as a Java int: -13) |
| `<<` | shift left, fill with 0 (×2 per step) | `a << 2` | `00110000` = 48 |
| `>>` | shift right, **copy the sign bit** in | `a >> 2` | `00000011` = 3 |
| `>>>` | shift right, **fill with 0** | `a >>> 2` | `00000011` = 3 |

The everyday expressions:

```java
n & 1            // lowest bit (1 = odd)
(n >> i) & 1     // read bit i
n | (1 << i)     // set bit i
n & ~(1 << i)    // clear bit i
n & (n - 1)      // clear the LOWEST set bit
```

## Two's complement in one paragraph

A Java `int` is 32 bits, and bit 31 counts as −2³¹ instead of +2³¹. So `0111…1` is `Integer.MAX_VALUE`, `1000…0` is `Integer.MIN_VALUE`, and all 1s is `-1`. To negate a number, flip its bits and add one: `-x == ~x + 1`. Addition works the same way on the bit pattern whether a number is positive or negative. That's why the "add without `+`" trick below works for negatives with no extra code.

## `>>` vs `>>>` on a negative number

```text
-8          = 11111111 11111111 11111111 11111000
-8 >> 1     = 11111111 11111111 11111111 11111100   = -4          (sign bit copied in)
-8 >>> 1    = 01111111 11111111 11111111 11111100   = 2147483644  (zero copied in)
```

This matters whenever you loop by shifting. `while (n != 0) { ...; n >>= 1; }` **never ends** for a negative `n`, because the 1s keep filling in from the left until `n` is stuck at `-1`. For Number of 1 Bits and Reverse Bits, do one of these:

- shift with `>>>`, which eventually reaches 0, or
- loop exactly 32 times, or
- use `n &= (n - 1)`, which removes one set bit per step and reaches 0 for any input.

@exercise pat-bit-mcq-shift

## `n & (n - 1)`: clear the lowest set bit

```text
n       = 0110 1100
n - 1   = 0110 1011    (lowest 1 becomes 0, the bits below it become 1)
n&(n-1) = 0110 1000
```

Count set bits by looping until zero. A power of two has exactly one set bit, so `n > 0 && (n & (n - 1)) == 0` tests for it.

## XOR: the self-canceling operator

- `a ^ a = 0` and `a ^ 0 = a`
- order doesn't matter (XOR is commutative and associative)

**Single Number**: XOR every element together. The pairs cancel and the single one is left.

**Missing Number**: XOR every index `0..n` with every value. Each number that's present appears twice and cancels. The missing number appears once, so it's what remains:

```java
int x = nums.length;                        // index n has no slot, so start with it
for (int i = 0; i < nums.length; i++) x ^= i ^ nums[i];
return x;
```

@exercise pat-bit-mcq-xor

## Counting Bits: a bit DP

`i >> 1` is `i` without its lowest bit, and you've already computed its answer:

```java
bits[i] = bits[i >> 1] + (i & 1);
```

| i | binary | `i >> 1` | `i & 1` | `bits[i]` |
| --- | --- | --- | --- | --- |
| 1 | 0001 | 0 | 1 | 0 + 1 = 1 |
| 2 | 0010 | 1 | 0 | 1 + 0 = 1 |
| 3 | 0011 | 1 | 1 | 1 + 1 = 2 |
| 4 | 0100 | 2 | 0 | 1 + 0 = 1 |
| 5 | 0101 | 2 | 1 | 1 + 1 = 2 |
| 6 | 0110 | 3 | 0 | 2 + 0 = 2 |
| 7 | 0111 | 3 | 1 | 2 + 1 = 3 |

## Reverse Bits

Shift a bit out of the bottom of `n` and push it into the bottom of `result`, 32 times:

```java
for (int i = 0; i < 32; i++) {
    result = (result << 1) | (n & 1);
    n >>>= 1;
}
```

## Sum of Two Integers: add without `+`

`a ^ b` adds the bits but ignores carries. `(a & b) << 1` gives the carries, each moved one column left. Add the carries back in the same way until there aren't any:

```java
while (b != 0) {
    int carry = (a & b) << 1;
    a = a ^ b;
    b = carry;
}
return a;
```

| step | `a` | `b` (carry) |
| --- | --- | --- |
| start | 0101 (5) | 0011 (3) |
| 1 | 0110 | 0010 |
| 2 | 0100 | 0100 |
| 3 | 0000 | 1000 |
| 4 | **1000 (8)** | 0000 → stop |

With negatives, a carry can shift out past bit 31, where Java simply drops it. The 32-bit two's-complement result is still correct, so the loop always ends.

@exercise pat-bit-fill-tricks

@exercise pat-bit-drill-count

@exercise pat-bit-drill-pow2

## Apply it

- **XOR cancellation:** Single Number → Missing Number
- **Bit counting / shifting:** Number of 1 Bits → Counting Bits → Reverse Bits
- **Carry arithmetic:** Sum of Two Integers (Medium)

## Recap

- `n & (n - 1)` clears the lowest set bit. `(n >> i) & 1` reads bit i.
- `>>` copies the sign bit in and `>>>` fills with 0. Shift loops on negatives need `>>>` or exactly 32 iterations.
- XOR: `a ^ a = 0`, so pairs cancel (Single Number, Missing Number).
- Counting Bits DP: `bits[i] = bits[i >> 1] + (i & 1)`.
- Add: `carry = (a & b) << 1; a ^= b; b = carry;` until `b == 0`. Two's complement: `-x == ~x + 1`.
