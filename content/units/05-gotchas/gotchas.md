Every one of these has cost real candidates real offers. None of them crash loudly: they compile, pass the examples, and quietly produce a Wrong Answer. Run the gauntlet. Most are predict-the-output drills, and they'll resurface in Review so they stay burned in.

## Equality & boxing

`==` on objects compares **references**. That's fine for `int`, `char` and `boolean`, and wrong for `String`, `Integer`, arrays and lists. Boxed `Integer`s make it sneaky: values -128..127 are cached, so `==` looks correct in every small test and breaks on the hidden one. Arrays never compare by value at all, not even as map keys.

@exercise got-equals

@exercise got-fill-cache

@exercise got-fill-array-key

## Overflow & math

`int` tops out at about 2.1 billion (`Integer.MAX_VALUE` = 2³¹ − 1), and overflow wraps silently to negative. A cast only helps if it happens *before* the arithmetic. Java's `%` keeps the sign of the left operand, `>>` keeps the sign bit while `>>>` shifts in zeros, and even `Math.abs` has an overflow edge case.

@exercise got-overflow

@exercise got-fill-overflow

@exercise got-fill-long-mult

@exercise got-mid

@exercise got-fill-abs-min

@exercise got-mod

@exercise got-fill-mod

@exercise got-fill-shift

## Strings & chars

Arrays, Strings and collections spell "size" three different ways. A `char` is secretly a small number, so `'a' + 1` is the `int` 98 until you cast it back. And `+=` on a String copies the whole string every time.

@exercise got-length

@exercise got-fill-char-math

@exercise got-concat

## Collections & arrays

Some lists are read-only (`List.of`) or fixed-size (`Arrays.asList`). You can't remove from a list inside its own for-each. `ArrayDeque` refuses `null`, which matters when you enqueue tree children. Object arrays start out full of `null`.

@exercise got-comod

@exercise got-fill-aslist

@exercise got-fill-deque-null

@exercise got-defaults

## The scorecard

If any of these felt shaky, redo this lesson tomorrow — these bugs don't announce themselves; they cost you 20 minutes of an interview silently.

## Recap

- Objects: `.equals`, never `==` (Integer cache is -128..127). Array keys: encode as `r + "," + c` or `List.of(r, c)`.
- Widen before multiplying: `(long) a * b`. Midpoint: `l + (r - l) / 2`. `Math.abs(Integer.MIN_VALUE)` is still negative.
- Non-negative mod: `Math.floorMod(a, b)` or `((a % b) + b) % b`. Unsigned shift: `>>>`.
- `arr.length`, `s.length()`, `list.size()`; `(char) ('a' + 1)`; build strings with `StringBuilder`.
- `Arrays.asList`/`List.of` → wrap in `new ArrayList<>(...)` before adding; remove with `removeIf`; never `offer(null)` into an `ArrayDeque`.
