A **trie** (prefix tree) stores words one character per level, so words with a common prefix share the same path. It answers "does any stored word start with `pre`?" in O(prefix length), however many words it holds. A HashSet can't do that.

## The node

```java
class TrieNode {
    TrieNode[] children = new TrieNode[26];   // children[c - 'a']
    boolean isEnd = false;                     // a word ends at this node
}
```

## Picture: insert "cat", "car", "cart"

Every node is a 26-slot array, where slot `c - 'a'` holds the child for letter `c`. Only the non-null slots are drawn, and `*` marks `isEnd = true`.

```text
      [ . . c . . . ... ]         root
            │
          [ a . . ... ]           "c"
            │
      [ ... r . t ... ]           "ca"
            │   └───────────────────────┐
            │                           │
      [ ... t ... ] * "car"             [ all null ] * "cat"
            │
          [ all null ] * "cart"
```

- `"ca"` exists as a path but has no `*`, so `startsWith("ca")` is true and `search("ca")` is false.
- `"car"` is a word **and** a prefix of `"cart"`. That's why the end of a word needs its own flag: "this node has no children" can't tell you that `car` was inserted.

## Insert, search, startsWith

All three operations walk down one letter at a time. Insert creates missing nodes as it goes. The two queries return as soon as a node is missing.

```java
class Trie {
    private final TrieNode root = new TrieNode();

    public void insert(String word) {
        TrieNode node = root;
        for (char c : word.toCharArray()) {
            int i = c - 'a';
            if (node.children[i] == null) node.children[i] = new TrieNode();  // create
            node = node.children[i];
        }
        node.isEnd = true;                                   // mark the word
    }

    private TrieNode walk(String s) {                        // null if the path breaks
        TrieNode node = root;
        for (char c : s.toCharArray()) {
            node = node.children[c - 'a'];
            if (node == null) return null;
        }
        return node;
    }

    public boolean search(String word)       { TrieNode n = walk(word); return n != null && n.isEnd; }
    public boolean startsWith(String prefix) { return walk(prefix) != null; }
}
```

Every operation is O(length of the string).

@exercise pat-trie-fill-walk

@exercise pat-trie-mcq-why

@exercise pat-trie-drill-mini

## Wildcards: `.` means "try every child"

In Add and Search Words, `.` matches any single letter. A single walk can only follow one child, so search becomes a DFS over (position in the word, current node):

```java
private boolean dfs(String word, int i, TrieNode node) {
    if (i == word.length()) return node.isEnd;              // used every char: is it a word?
    char c = word.charAt(i);
    if (c == '.') {
        for (TrieNode child : node.children) {              // any child could match
            if (child != null && dfs(word, i + 1, child)) return true;
        }
        return false;
    }
    TrieNode child = node.children[c - 'a'];                // a normal letter: one path
    return child != null && dfs(word, i + 1, child);
}
```

A letter costs one step. Each `.` branches into at most 26 children, and a branch ends as soon as it hits a null child.

@exercise pat-trie-fill-wild

## Trie + grid backtracking: Word Search II

To find many words on a letter grid, you could run Word Search once per word. That repeats the same prefix exploration for every word. Instead, put all the words into one trie, then run **one** backtracking DFS from each cell that moves through the grid and the trie together. Store the whole word at its end node (`String word` instead of `boolean isEnd`), so when you reach it you can add it directly.

The key lines of the DFS:

```java
char ch = board[r][c];
if (ch == '#' || node.children[ch - 'a'] == null) return;   // visited, or no word continues → prune
node = node.children[ch - 'a'];
if (node.word != null) {
    res.add(node.word);
    node.word = null;            // found: clear it so another path can't add it again
}
board[r][c] = '#';               // choose: mark visited
// explore the 4 neighbours with `node`
board[r][c] = ch;                // un-choose: restore
```

Two kinds of pruning make this fast:

1. **Null child → stop.** If no stored word continues with this letter, abandon the path right away.
2. **Clear found words.** Setting `word = null` stops duplicates. You can go further and delete a leaf node once its word is found, so branches with nothing left to find aren't walked again.

## Apply it

Easy → hard: **Implement Trie (Prefix Tree)**, **Design Add and Search Words Data Structure**, **Word Search II**.

## Recap

- Node = `TrieNode[26] children` + `isEnd`. Index with `c - 'a'`.
- Insert creates missing children. Search and startsWith follow the same walk and stop at a null.
- `search` needs `isEnd` at the last node; `startsWith` only needs the path to exist.
- `.` wildcard: DFS on (index, node), trying every non-null child.
- Many words on a grid: build one trie, backtrack across the grid, prune on a null child, and null out found words.
