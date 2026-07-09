A **trie** (prefix tree) stores words character-by-character down a tree of 26-slot arrays. It answers "does any word start with this prefix?" in O(prefix length) — impossible for a HashSet.

## The node

```java
class TrieNode {
    TrieNode[] children = new TrieNode[26];   // one slot per letter
    boolean isEnd = false;                     // a word stops here
}
```

## The walk (insert and search are the same walk)

```java
TrieNode node = root;
for (char c : word.toCharArray()) {
    int i = c - 'a';                    // letter → slot
    // INSERT: create missing nodes    // SEARCH: missing node = not found
    if (node.children[i] == null) node.children[i] = new TrieNode();
    node = node.children[i];
}
node.isEnd = true;   // insert marks the end; search checks it
```

The only difference between `search` (whole word) and `startsWith` (prefix): search additionally requires `isEnd` at the final node.

@exercise pat-trie-fill-walk

@exercise pat-trie-mcq-why

@exercise pat-trie-drill-mini

Apply it: Implement Trie (Prefix Tree) — you'll build the whole class.
