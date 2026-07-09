Linked list problems reuse three moves. Learn them as finger patterns and every problem in the category becomes assembly work.

## Move 1: reverse

```java
ListNode prev = null, curr = head;
while (curr != null) {
    ListNode next = curr.next;   // save
    curr.next = prev;            // flip
    prev = curr;                 // advance prev
    curr = next;                 // advance curr
}
// prev is the new head
```

Save → flip → advance ×2. Four lines, in exactly this order.

## Move 2: the dummy head

When building or splicing lists, a throwaway starter node kills all the "is this the first node?" special cases:

```java
ListNode dummy = new ListNode(0);
ListNode tail = dummy;
while (/* elements remain */) {
    tail.next = /* next node */;
    tail = tail.next;
}
return dummy.next;    // the real head
```

## Move 3: fast & slow pointers

```java
ListNode slow = head, fast = head;
while (fast != null && fast.next != null) {
    slow = slow.next;
    fast = fast.next.next;
}
// slow = middle. If fast ever == slow while looping: there's a cycle.
```

The condition `fast != null && fast.next != null` — in that order — is what prevents NullPointerExceptions.

@exercise pat-ll-mcq-order

@exercise pat-ll-drill-middle

@exercise pat-ll-drill-remove

Apply it: Reverse Linked List, Merge Two Sorted Lists, Linked List Cycle, Reorder List (which uses all three moves at once!).
