Before any algorithm, your fingers need to produce the *scaffolding* without thinking. This lesson is a **redoable drill deck** — come back and repeat it until the boilerplate flows automatically. Every exercise here is a drill: get it right 3 times in a row to master it, and it'll resurface in Review to keep it sharp.

## The two shapes

**Shape 1 — a runnable program** (what you write in this course's "write a program" exercises, and in any local Java file):

```java
public class Main {
    public static void main(String[] args) {
        System.out.println("hello");
    }
}
```

Every standalone Java program needs a class and a `public static void main(String[] args)` entry point — that exact phrase is the door the JVM walks through to start your code.

**Shape 2 — a LeetCode solution** (what you write for the *problems* here): no `main`, just a method inside a `Solution` class.

```java
class Solution {
    public int add(int a, int b) {
        return a + b;
    }
}
```

@exercise boiler-mcq-shape

## Imports

Collections (`List`, `Map`, `Set`, `Deque`, `PriorityQueue`…) live in `java.util`. One line unlocks all of them:

```java
import java.util.*;
```

LeetCode adds this for you; in your own files (and this course's problem editors) it's already imported. When in doubt, put it at the very top.

## Printing & debugging

```java
System.out.println(x);   // print x and a newline
System.out.print(x);     // no newline
System.out.println("l=" + l + " r=" + r);   // glue values with +
```

`System.out.println` is your debugger — sprinkle it inside a solution to watch variables, and this course captures that output next to your test results.

## Drill the scaffold

Recall it first (fill the blanks), then write it from a blank editor. Repeat until it's muscle memory.

@exercise boiler-fill-main

@exercise boiler-write-main

@exercise boiler-fill-solution

@exercise boiler-write-solution
