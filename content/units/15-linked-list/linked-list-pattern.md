Linked list problems reuse a handful of moves. Learn them as finger patterns and every problem in the category becomes assembly work. Draw boxes and arrows — every bug is a lost or crossed arrow.

## Move 1: reverse

```java
ListNode prev = null, curr = head;
while (curr != null) {
    ListNode next = curr.next;   // 1. save
    curr.next = prev;            // 2. flip
    prev = curr;                 // 3. advance prev
    curr = next;                 // 4. advance curr
}
return prev;                     // prev is the new head
```

Reversing `1 → 2 → 3`, one iteration at a time:

```text
start          prev          curr
               null          [1] → [2] → [3] → null

iter 1
 1. save       prev          curr   next
               null          [1] → [2] → [3] → null
 2. flip       null ← [1]           [2] → [3] → null
 3-4. advance         prev          curr
               null ← [1]           [2] → [3] → null

iter 2
 1. save              prev          curr   next
               null ← [1]           [2] → [3] → null
 2. flip       null ← [1] ← [2]            [3] → null
 3-4. advance               prev           curr
               null ← [1] ← [2]            [3] → null

iter 3
 1-2. flip     null ← [1] ← [2] ← [3]            null
 3-4. advance                     prev            curr
               null ← [1] ← [2] ← [3]            null     → loop ends, return prev
```

Save → flip → advance ×2. Four lines, in exactly this order: flip before save and `[2] → [3]` is unreachable.

@exercise pat-ll-mcq-order

@exercise pat-ll-fill-reverse

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

Merging `1 → 4` and `2 → 3`:

```text
 dummy → (nothing yet)                   tail = dummy
 dummy → [1]                             tail = [1]      took 1 from list A
 dummy → [1] → [2]                       tail = [2]      took 2 from list B
 dummy → [1] → [2] → [3]                 tail = [3]      took 3 from list B
 dummy → [1] → [2] → [3] → [4]           B empty: tail.next = rest of A
 return dummy.next  =  [1]
```

Deleting also becomes uniform — splice by stepping around the node, even if it's the head:

```text
 before:  dummy → [1] → [2] → [3]        cur = dummy,  cur.next is the victim [1]
 splice:  dummy ──────→ [2] → [3]        cur.next = cur.next.next
```

## Move 3: fast & slow pointers

```java
ListNode slow = head, fast = head;
while (fast != null && fast.next != null) {
    slow = slow.next;
    fast = fast.next.next;
}
// slow = middle (second middle for even lengths)
```

The condition `fast != null && fast.next != null` — in that order — is what prevents NullPointerExceptions.

**Cycle detection** is the same loop with one check: if there's a cycle, fast laps slow and they meet; if not, fast hits `null`.

```java
while (fast != null && fast.next != null) {
    slow = slow.next;
    fast = fast.next.next;
    if (slow == fast) return true;   // compare references, not values
}
return false;
```

## Move 4: a gap of n

Remove Nth Node From End: move `fast` n steps ahead, then move both until `fast` is on the last node. `slow` now sits just **before** the target.

```java
ListNode dummy = new ListNode(0, head);
ListNode slow = dummy, fast = dummy;
for (int i = 0; i < n; i++) fast = fast.next;     // open a gap of n
while (fast.next != null) { slow = slow.next; fast = fast.next; }
slow.next = slow.next.next;                        // splice out the nth from end
return dummy.next;
```

```text
 n = 2:   dummy → [1] → [2] → [3] → [4] → [5]
                                slow         fast      gap of 2 kept; slow.next = [4] is removed
```

Starting both at `dummy` handles removing the head (n = length).

## Combining moves

**Reorder List** (`1,2,3,4,5` → `1,5,2,4,3`) = find middle + reverse second half + merge alternately:

```java
// 1. middle: slow ends on the last node of the first half
ListNode slow = head, fast = head.next;
while (fast != null && fast.next != null) { slow = slow.next; fast = fast.next.next; }
// 2. reverse the second half, cut the lists apart
ListNode second = reverse(slow.next);
slow.next = null;
// 3. weave
ListNode first = head;
while (second != null) {
    ListNode n1 = first.next, n2 = second.next;
    first.next = second;
    second.next = n1;
    first = n1;
    second = n2;
}
```

```text
 1 → 2 → 3        5 → 4           (after steps 1–2)
 1 → 5 → 2 → 4 → 3                (after weaving)
```

**Add Two Numbers** (digits stored in reverse) = dummy head + a carry:

```java
ListNode dummy = new ListNode(0), tail = dummy;
int carry = 0;
while (l1 != null || l2 != null || carry != 0) {     // carry != 0 catches a final 1
    int sum = carry;
    if (l1 != null) { sum += l1.val; l1 = l1.next; }
    if (l2 != null) { sum += l2.val; l2 = l2.next; }
    carry = sum / 10;
    tail.next = new ListNode(sum % 10);
    tail = tail.next;
}
return dummy.next;
```

**Reverse Nodes in k-Group** = check k nodes exist, reverse exactly those k, reconnect, repeat. Keep `groupPrev` (the node before the group) on a dummy:

```java
ListNode dummy = new ListNode(0, head), groupPrev = dummy;
while (true) {
    ListNode kth = groupPrev;
    for (int i = 0; i < k && kth != null; i++) kth = kth.next;
    if (kth == null) break;                        // fewer than k left: stop
    ListNode groupNext = kth.next;
    ListNode prev = groupNext, curr = groupPrev.next;   // reverse, pointing the tail at groupNext
    while (curr != groupNext) {
        ListNode next = curr.next; curr.next = prev; prev = curr; curr = next;
    }
    ListNode oldFirst = groupPrev.next;            // now the group's last node
    groupPrev.next = kth;                          // kth is the group's new first node
    groupPrev = oldFirst;
}
return dummy.next;
```

## Floyd's cycle on an array: Find the Duplicate Number

`nums` has `n + 1` values in `1..n`. Read each index as a node and `nums[i]` as its `next` pointer: `i → nums[i]`. Every value is a valid index, so you can follow pointers forever — and two indices pointing at the same value means two arrows into one node: **the entrance to a cycle is the duplicate**.

```text
 nums = [1, 3, 4, 2, 2]
 node:   0 → 1 → 3 → 2 → 4
                     ↑   │
                     └───┘          node 2 has two incoming arrows (from 3 and 4)
```

```java
int slow = nums[0], fast = nums[nums[0]];
while (slow != fast) { slow = nums[slow]; fast = nums[nums[fast]]; }   // phase 1: meet inside the cycle
slow = 0;
while (slow != fast) { slow = nums[slow]; fast = nums[fast]; }         // phase 2: same speed
return slow;                                                            // they meet at the entrance
```

Phase 2 works because the distance from the start to the cycle entrance equals the distance from the meeting point to the entrance (modulo the cycle length). O(n) time, O(1) space, array untouched.

## Merge k lists: a heap of heads

Put each list's head in a `PriorityQueue` ordered by value; repeatedly take the smallest and push its successor.

```java
PriorityQueue<ListNode> pq = new PriorityQueue<>((a, b) -> a.val - b.val);
for (ListNode node : lists) if (node != null) pq.offer(node);
ListNode dummy = new ListNode(0), tail = dummy;
while (!pq.isEmpty()) {
    ListNode min = pq.poll();
    tail.next = min;
    tail = min;
    if (min.next != null) pq.offer(min.next);
}
return dummy.next;
```

The heap never holds more than k nodes: O(N log k) for N total nodes.

## LRU Cache: HashMap + doubly linked list

Need O(1) lookup **and** O(1) "move to most-recent" **and** O(1) "evict least-recent". A HashMap gives lookup; a doubly linked list gives O(1) unlink/insert given a node. Sentinel `head`/`tail` nodes remove every null check:

```text
   map: key → node

   head ⇄ [k3|v3] ⇄ [k1|v1] ⇄ [k2|v2] ⇄ tail
   (sentinel)  most recent       least recent  (sentinel)

   get(k2):  unlink [k2], insert right after head
   head ⇄ [k2|v2] ⇄ [k3|v3] ⇄ [k1|v1] ⇄ tail

   put over capacity:  evict tail.prev  ([k1]) and map.remove(k1)
```

```java
class Node { int key, val; Node prev, next; Node(int k, int v) { key = k; val = v; } }
Node head = new Node(0, 0), tail = new Node(0, 0);   // head.next = tail; tail.prev = head;

void remove(Node n)    { n.prev.next = n.next; n.next.prev = n.prev; }
void addFront(Node n)  { n.next = head.next; n.prev = head; head.next.prev = n; head.next = n; }
```

The node stores its `key` so eviction can also delete the map entry. Shortcut in real code: `LinkedHashMap` with `accessOrder = true` and an overridden `removeEldestEntry` is an LRU cache in ~5 lines — but interviewers usually want the manual version.

## Drill the shapes

@exercise pat-ll-drill-middle

@exercise pat-ll-drill-remove

@exercise pat-ll-drill-kth

## Apply it

| Technique | Problems (easy → hard) |
| --- | --- |
| Reverse | Reverse Linked List |
| Dummy head | Merge Two Sorted Lists |
| Fast & slow | Linked List Cycle |
| Gap of n + dummy | Remove Nth Node From End of List |
| Dummy head + carry | Add Two Numbers |
| Middle + reverse + merge | Reorder List |
| Floyd's cycle on an array | Find the Duplicate Number |
| HashMap + doubly linked list | LRU Cache |
| Dummy head + heap | Merge k Sorted Lists |
| Reverse in groups | Reverse Nodes in k-Group |

## Recap

- Reverse: `next = curr.next; curr.next = prev; prev = curr; curr = next;`.
- Building or deleting → `dummy`, return `dummy.next`.
- `while (fast != null && fast.next != null)`: middle, or `slow == fast` → cycle.
- nth from end: start both at dummy, advance fast n, then move together.
- Merge k: `PriorityQueue<ListNode>` by `val`; LRU: HashMap + sentinel doubly linked list.
