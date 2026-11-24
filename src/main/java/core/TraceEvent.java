package core;

import java.util.Arrays;

/**
 * Granular micro-event in the trace animation stream.
 */
public class TraceEvent {
    public String type;        // "compare", "swap", "move", "insert", "delete", "pointer", "highlight", "edgeHighlight", etc.
    public int[] indices;      // Element indices affected
    public Object[] values;    // Values before/after or swapped
    public String[] nodes;     // Node identifiers (for graph / tree)
    public String name;        // Name of pointer ("i", "j", "head", "tail", "top", "front", "rear")
    public String action;      // For pointer: "set", "move", "remove"
    public Object target;      // Target index or node identifier
    public String color;       // Optional color hex or theme token
    public String role;        // Semantic highlight role: "active", "visited", "sorted", "frontier", "path", "discarded"
    public String note;        // Human-readable narrative note
    public Boolean result;     // Result of boolean test or comparison
    public Integer from;       // Source index or node
    public Integer to;         // Destination index or node
    public Object extra;       // Custom structure-specific payload

    public TraceEvent() {}

    public static TraceEvent compare(int i, int j, boolean result, String note) {
        TraceEvent e = new TraceEvent();
        e.type = "compare";
        e.indices = new int[]{i, j};
        e.result = result;
        e.note = note;
        return e;
    }

    public static TraceEvent swap(int i, int j, Object val1, Object val2, String note) {
        TraceEvent e = new TraceEvent();
        e.type = "swap";
        e.indices = new int[]{i, j};
        e.values = new Object[]{val1, val2};
        e.note = note;
        return e;
    }

    public static TraceEvent move(int from, int to, Object val, String note) {
        TraceEvent e = new TraceEvent();
        e.type = "move";
        e.from = from;
        e.to = to;
        e.values = new Object[]{val};
        e.note = note;
        return e;
    }

    public static TraceEvent pointer(String action, String name, Object target, String color) {
        TraceEvent e = new TraceEvent();
        e.type = "pointer";
        e.action = action;
        e.name = name;
        e.target = target;
        e.color = color;
        return e;
    }

    public static TraceEvent highlight(int[] indices, String role) {
        TraceEvent e = new TraceEvent();
        e.type = "highlight";
        e.indices = indices;
        e.role = role;
        return e;
    }

    public static TraceEvent nodeHighlight(String[] nodes, String role) {
        TraceEvent e = new TraceEvent();
        e.type = "highlight";
        e.nodes = nodes;
        e.role = role;
        return e;
    }

    public static TraceEvent edgeHighlight(String u, String v, String role, boolean directed) {
        TraceEvent e = new TraceEvent();
        e.type = "edgeHighlight";
        e.nodes = new String[]{u, v};
        e.role = role;
        e.extra = directed;
        return e;
    }
}
