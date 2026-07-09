import java.util.*;

/** Harness helpers: build ListNode / TreeNode structures from LeetCode-style arrays. */
public class H {
    public static ListNode list(int[] vals) {
        ListNode dummy = new ListNode(0);
        ListNode tail = dummy;
        for (int v : vals) {
            tail.next = new ListNode(v);
            tail = tail.next;
        }
        return dummy.next;
    }

    /** pos = index the tail links back to, or -1 for no cycle. */
    public static ListNode listWithCycle(int[] vals, int pos) {
        ListNode head = list(vals);
        if (pos < 0 || head == null) return head;
        ListNode tail = head, target = head;
        while (tail.next != null) tail = tail.next;
        for (int i = 0; i < pos; i++) target = target.next;
        tail.next = target;
        return head;
    }

    /** Build a tree from a level-order array with nulls, LeetCode style. */
    public static TreeNode tree(Integer[] vals) {
        if (vals.length == 0 || vals[0] == null) return null;
        TreeNode root = new TreeNode(vals[0]);
        Queue<TreeNode> q = new LinkedList<>();
        q.offer(root);
        int i = 1;
        while (!q.isEmpty() && i < vals.length) {
            TreeNode node = q.poll();
            if (i < vals.length) {
                Integer v = vals[i++];
                if (v != null) { node.left = new TreeNode(v); q.offer(node.left); }
            }
            if (i < vals.length) {
                Integer v = vals[i++];
                if (v != null) { node.right = new TreeNode(v); q.offer(node.right); }
            }
        }
        return root;
    }
}
