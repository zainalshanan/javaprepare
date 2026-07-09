Bit problems look scary and are actually the smallest toolkit in the course. Eight expressions cover the category:

```java
x & 1            // is the lowest bit set? (odd check)
x >> 1           // shift right = divide by 2
x << 1           // shift left = multiply by 2
x & (x - 1)      // clear the LOWEST set bit  ← the star of the show
x | (1 << i)     // set bit i
x & ~(1 << i)    // clear bit i
(x >> i) & 1     // read bit i
x ^ y            // XOR
```

## XOR: the self-canceling operator

- `a ^ a = 0` — anything XOR itself vanishes
- `a ^ 0 = a`
- order doesn't matter (commutative + associative)

So XOR-ing a whole array cancels every value that appears twice, leaving the one that appears once — Single Number in three lines:

```java
int single = 0;
for (int x : nums) single ^= x;
return single;
```

@exercise pat-bit-mcq-xor

## Counting bits

`x & (x - 1)` removes exactly one set bit. Loop until zero, counting:

```java
int count = 0;
while (x != 0) {
    x &= (x - 1);
    count++;
}
```

Java bonus: `Integer.bitCount(x)` does this natively (fine to mention, but interviewers want the manual loop once).

@exercise pat-bit-drill-count

@exercise pat-bit-drill-pow2

Apply it: Single Number, Number of 1 Bits.
