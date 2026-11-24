package algorithms;

import core.Trace;
import core.TraceBuilder;
import core.TraceEvent;
import core.TraceStep;
import java.util.*;

/**
 * Queue operations simulation (FIFO: First-In, First-Out).
 * Demonstrates enqueue at rear, dequeue from front, with code synchronization.
 */
public class QueueOps {

    public static final String[] SOURCE_CODE = new String[] {
        "public class ArrayQueue {",                          // Line 1
        "    private int front = 0, rear = -1, size = 0;",     // Line 2
        "    public void enqueue(int item) {",                 // Line 3
        "        rear = (rear + 1) % capacity;",               // Line 4
        "        queue[rear] = item;",                         // Line 5
        "        size++;",                                     // Line 6
        "    }",                                               // Line 7
        "    public int dequeue() {",                          // Line 8
        "        if (isEmpty()) throw new NoSuchElementException();", // Line 9
        "        int item = queue[front];",                    // Line 10
        "        front = (front + 1) % capacity;",             // Line 11
        "        size--; return item;",                        // Line 12
        "    }",                                               // Line 13
        "}"                                                    // Line 14
    };

    public static Trace runDemo(int[] initial) {
        if (initial == null || initial.length == 0) initial = new int[]{5, 12, 19};
        List<Integer> queue = new ArrayList<>();
        for (int v : initial) queue.add(v);

        TraceBuilder tb = new TraceBuilder("structure", "queue", "Queue (FIFO Simulation)", "queue", "O(1)", "O(n)");
        tb.setSourceCode(SOURCE_CODE);
        tb.setInitialState("queue", new ArrayList<>(queue));

        Map<String, Object> ptrs = new HashMap<>();
        Map<String, String> highlights = new HashMap<>();
        ptrs.put("front", 0);
        ptrs.put("rear", queue.size() - 1);
        highlights.put("0", "active");
        highlights.put(String.valueOf(queue.size() - 1), "frontier");

        tb.addStep(2, "Queue initialized. FRONT at index 0 (" + queue.get(0) + "), REAR at index " + (queue.size() - 1) + " (" + queue.get(queue.size() - 1) + ").", makeSnapshot(queue, ptrs, highlights));

        // Enqueue operations
        int[] toEnqueue = new int[]{33, 47};
        for (int val : toEnqueue) {
            queue.add(val);
            int rearIdx = queue.size() - 1;
            ptrs.put("rear", rearIdx);
            highlights.put(String.valueOf(rearIdx), "frontier");

            TraceStep sEnq = tb.addStep(5, "ENQUEUE(" + val + "): Inserted at REAR index " + rearIdx + ".", makeSnapshot(queue, ptrs, highlights));
            sEnq.events.add(TraceEvent.pointer("set", "rear", rearIdx, "#0284c7"));
            sEnq.events.add(TraceEvent.insert(rearIdx, val, null, "Enqueued at rear"));
        }

        // Dequeue operations
        for (int k = 0; k < 2; k++) {
            if (!queue.isEmpty()) {
                int removed = queue.remove(0);
                ptrs.put("front", 0);
                ptrs.put("rear", queue.size() - 1);
                highlights.clear();
                if (!queue.isEmpty()) {
                    highlights.put("0", "active");
                    highlights.put(String.valueOf(queue.size() - 1), "frontier");
                }

                TraceStep sDeq = tb.addStep(11, "DEQUEUE(): Removed front element " + removed + ". Next element shifts to FRONT.", makeSnapshot(queue, ptrs, highlights));
                sDeq.events.add(TraceEvent.delete(0, removed));
            }
        }

        tb.setSummary("finalSize", queue.size());
        tb.setSummary("completed", true);

        return tb.build();
    }

    private static Map<String, Object> makeSnapshot(List<Integer> queue, Map<String, Object> ptrs, Map<String, String> highlights) {
        Map<String, Object> map = new HashMap<>();
        map.put("values", new ArrayList<>(queue));
        map.put("pointers", new HashMap<>(ptrs));
        map.put("highlights", new HashMap<>(highlights));
        return map;
    }
}
