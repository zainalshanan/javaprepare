import java.util.*;

/** Serializes Java values to JSON for the Node grader. */
public class Ser {
    public static String ser(Object o) {
        StringBuilder sb = new StringBuilder();
        write(sb, o);
        return sb.toString();
    }

    static void write(StringBuilder sb, Object o) {
        if (o == null) { sb.append("null"); return; }
        if (o instanceof String) { writeString(sb, (String) o); return; }
        if (o instanceof Character) { writeString(sb, String.valueOf(((Character) o).charValue())); return; }
        if (o instanceof Double || o instanceof Float) {
            double d = ((Number) o).doubleValue();
            sb.append(Double.isFinite(d) ? Double.toString(d) : "null");
            return;
        }
        if (o instanceof Number || o instanceof Boolean) { sb.append(o.toString()); return; }
        if (o instanceof int[]) {
            int[] a = (int[]) o;
            sb.append('[');
            for (int i = 0; i < a.length; i++) { if (i > 0) sb.append(','); sb.append(a[i]); }
            sb.append(']');
            return;
        }
        if (o instanceof long[]) {
            long[] a = (long[]) o;
            sb.append('[');
            for (int i = 0; i < a.length; i++) { if (i > 0) sb.append(','); sb.append(a[i]); }
            sb.append(']');
            return;
        }
        if (o instanceof double[]) {
            double[] a = (double[]) o;
            sb.append('[');
            for (int i = 0; i < a.length; i++) { if (i > 0) sb.append(','); write(sb, a[i]); }
            sb.append(']');
            return;
        }
        if (o instanceof boolean[]) {
            boolean[] a = (boolean[]) o;
            sb.append('[');
            for (int i = 0; i < a.length; i++) { if (i > 0) sb.append(','); sb.append(a[i]); }
            sb.append(']');
            return;
        }
        if (o instanceof char[]) {
            char[] a = (char[]) o;
            sb.append('[');
            for (int i = 0; i < a.length; i++) { if (i > 0) sb.append(','); writeString(sb, String.valueOf(a[i])); }
            sb.append(']');
            return;
        }
        if (o instanceof Object[]) {
            Object[] a = (Object[]) o;
            sb.append('[');
            for (int i = 0; i < a.length; i++) { if (i > 0) sb.append(','); write(sb, a[i]); }
            sb.append(']');
            return;
        }
        if (o instanceof List) {
            List<?> l = (List<?>) o;
            sb.append('[');
            boolean first = true;
            for (Object x : l) { if (!first) sb.append(','); first = false; write(sb, x); }
            sb.append(']');
            return;
        }
        if (o instanceof ListNode) {
            ListNode n = (ListNode) o;
            sb.append('[');
            int guard = 0;
            boolean first = true;
            while (n != null) {
                if (++guard > 100000) { sb.append(",\"...CYCLE_OR_TOO_LONG\""); break; }
                if (!first) sb.append(',');
                first = false;
                sb.append(n.val);
                n = n.next;
            }
            sb.append(']');
            return;
        }
        if (o instanceof TreeNode) {
            // Level-order with nulls, trailing nulls trimmed (LeetCode format).
            List<Object> out = new ArrayList<>();
            Queue<TreeNode> q = new LinkedList<>();
            q.offer((TreeNode) o);
            while (!q.isEmpty()) {
                TreeNode node = q.poll();
                if (node == null) { out.add(null); continue; }
                out.add(node.val);
                q.offer(node.left);
                q.offer(node.right);
            }
            while (!out.isEmpty() && out.get(out.size() - 1) == null) out.remove(out.size() - 1);
            write(sb, out);
            return;
        }
        throw new RuntimeException("Grader cannot serialize type: " + o.getClass().getName());
    }

    static void writeString(StringBuilder sb, String s) {
        sb.append('"');
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            switch (c) {
                case '"': sb.append("\\\""); break;
                case '\\': sb.append("\\\\"); break;
                case '\n': sb.append("\\n"); break;
                case '\r': sb.append("\\r"); break;
                case '\t': sb.append("\\t"); break;
                default:
                    if (c < 0x20) sb.append(String.format("\\u%04x", (int) c));
                    else sb.append(c);
            }
        }
        sb.append('"');
    }
}
