package algorithms;

import core.Trace;
import core.TraceBuilder;
import core.TraceEvent;
import core.TraceStep;
import java.util.*;

/**
 * Stack operations simulation (LIFO: Last-In, First-Out).
 * Demonstrates push, pop, and top pointer movements with code synchronization.
 */
public class StackOps {

    public static final String[] SOURCE_CODE = new String[] {
        "public class ArrayStack {",                          // Line 1
        "    private int[] stack = new int[capacity];",       // Line 2
        "    private int top = -1;",                          // Line 3
        "    public void push(int val) {",                    // Line 4
        "        stack[++top] = val;",                        // Line 5
        "    }",                                              // Line 6
        "    public int pop() {",                             // Line 7
        "        if (isEmpty()) throw new EmptyStackException();", // Line 8
        "        return stack[top--];",                       // Line 9
        "    }",                                              // Line 10
        "}"                                                   // Line 11
    };

    public static Trace runDemo(int[] initial) {
        if (initial == null || initial.length == 0) initial = new int[]{10, 20, 30};
        List<Integer> stack = new ArrayList<>();
        for (int v : initial) stack.add(v);

        TraceBuilder tb = new TraceBuilder("structure", "stack", "Stack (LIFO Simulation)", "stack", "O(1)", "O(n)");
        tb.setSourceCode(SOURCE_CODE);
        tb.setInitialState("stack", new ArrayList<>(stack));

        Map<String, Object> ptrs = new HashMap<>();
        Map<String, String> highlights = new HashMap<>();
        int top = stack.size() - 1;
        ptrs.put("top", top);
        highlights.put(String.valueOf(top), "active");

        tb.addStep(3, "Stack initialized with " + stack.size() + " elements. Top pointer at index " + top + " (" + stack.get(top) + ").", makeSnapshot(stack, ptrs, highlights));

        // Demonstration sequence: push 45, push 99, pop, push 77, pop, pop
        int[] toPush = new int[]{45, 99, 77};
        for (int pVal : toPush) {
            stack.add(pVal);
            top = stack.size() - 1;
            ptrs.put("top", top);
            highlights.clear();
            highlights.put(String.valueOf(top), "active");

            TraceStep sPush = tb.addStep(5, "PUSH(" + pVal + "): Element pushed onto top of stack. Top is now " + top + ".", makeSnapshot(stack, ptrs, highlights));
            sPush.events.add(TraceEvent.pointer("set", "top", top, "#059669"));
            sPush.events.add(TraceEvent.insert(top, pVal, null, "Pushed element"));
        }

        // Pop twice
        for (int k = 0; k < 2; k++) {
            if (!stack.isEmpty()) {
                int popped = stack.remove(stack.size() - 1);
                top = stack.size() - 1;
                ptrs.put("top", top);
                highlights.clear();
                if (top >= 0) highlights.put(String.valueOf(top), "active");

                TraceStep sPop = tb.addStep(9, "POP(): Popped top element " + popped + ". Top pointer retreated to " + (top >= 0 ? top : "EMPTY") + ".", makeSnapshot(stack, ptrs, highlights));
                sPop.events.add(TraceEvent.delete(top + 1, popped));
                if (top >= 0) {
                    sPop.events.add(TraceEvent.pointer("set", "top", top, "#059669"));
                } else {
                    sPop.events.add(TraceEvent.pointer("remove", "top", null, null));
                }
            }
        }

        tb.setSummary("finalSize", stack.size());
        tb.setSummary("completed", true);

        return tb.build();
    }

    private static Map<String, Object> makeSnapshot(List<Integer> stack, Map<String, Object> ptrs, Map<String, String> highlights) {
        Map<String, Object> map = new HashMap<>();
        map.put("values", new ArrayList<>(stack));
        map.put("pointers", new HashMap<>(ptrs));
        map.put("highlights", new HashMap<>(highlights));
        return map;
    }
}
