package algorithms;

import core.Trace;
import core.TraceBuilder;
import core.TraceEvent;
import core.TraceStep;
import java.util.*;

/**
 * Bubble Sort algorithm implementation.
 * Iteratively steps through the list, compares adjacent elements,
 * and swaps them if they are in the wrong order.
 * Emits full trace steps with code line synchronization and snapshots.
 */
public class BubbleSort {

    public static final String[] SOURCE_CODE = new String[] {
        "public void bubbleSort(int[] a) {",                 // Line 1
        "    int n = a.length;",                              // Line 2
        "    for (int i = 0; i < n - 1; i++) {",              // Line 3
        "        for (int j = 0; j < n - i - 1; j++) {",      // Line 4
        "            if (a[j] > a[j + 1]) {",                 // Line 5
        "                int temp = a[j];",                   // Line 6
        "                a[j] = a[j + 1];",                   // Line 7
        "                a[j + 1] = temp;",                   // Line 8
        "            }",                                      // Line 9
        "        }",                                          // Line 10
        "    }",                                              // Line 11
        "}"                                                   // Line 12
    };

    public static Trace run(int[] input) {
        if (input == null || input.length == 0) {
            input = new int[]{5, 2, 9, 1, 5, 6};
        }
        int[] a = input.clone();
        int n = a.length;

        TraceBuilder tb = new TraceBuilder(
            "algorithm",
            "bubbleSort",
            "Bubble Sort",
            "array",
            "O(n²)",
            "O(1)"
        );
        tb.setSourceCode(SOURCE_CODE);
        tb.setInitialState("array", toList(a));

        int comparisons = 0;
        int swaps = 0;

        // Step 0: Initialization
        Map<String, Object> ptrs = new HashMap<>();
        Map<String, String> highlights = new HashMap<>();
        TraceStep step0 = tb.addStep(2, "Array initialized with " + n + " elements.", makeSnapshot(a, ptrs, highlights));
        step0.events.add(TraceEvent.highlight(range(0, n - 1), "default"));

        for (int i = 0; i < n - 1; i++) {
            ptrs.put("i", i);
            ptrs.remove("j");
            TraceStep stepOuter = tb.addStep(3, "Outer loop: pass " + (i + 1) + " (i = " + i + ")", makeSnapshot(a, ptrs, highlights));
            stepOuter.events.add(TraceEvent.pointer("set", "i", i, "#047857"));

            for (int j = 0; j < n - i - 1; j++) {
                ptrs.put("j", j);
                highlights.put(String.valueOf(j), "active");
                highlights.put(String.valueOf(j + 1), "active");

                comparisons++;
                boolean needSwap = a[j] > a[j + 1];

                TraceStep stepComp = tb.addStep(
                    5,
                    "Comparing a[" + j + "] (" + a[j] + ") and a[" + (j + 1) + "] (" + a[j + 1] + ")",
                    makeSnapshot(a, ptrs, highlights)
                );
                stepComp.events.add(TraceEvent.pointer("set", "j", j, "#059669"));
                stepComp.events.add(TraceEvent.compare(j, j + 1, needSwap, a[j] + (needSwap ? " > " : " <= ") + a[j + 1]));
                stepComp.events.add(TraceEvent.highlight(new int[]{j, j + 1}, "active"));

                if (needSwap) {
                    swaps++;
                    int temp = a[j];
                    a[j] = a[j + 1];
                    a[j + 1] = temp;

                    TraceStep stepSwap = tb.addStep(
                        7,
                        "Swapped a[" + j + "] and a[" + (j + 1) + "]: " + a[j + 1] + " <-> " + a[j],
                        makeSnapshot(a, ptrs, highlights)
                    );
                    stepSwap.events.add(TraceEvent.swap(j, j + 1, a[j], a[j + 1], "Swap values"));
                }

                highlights.remove(String.valueOf(j));
                highlights.remove(String.valueOf(j + 1));
            }

            // The element at n - i - 1 has bubbled up into its sorted position
            highlights.put(String.valueOf(n - i - 1), "sorted");
            TraceStep stepPassEnd = tb.addStep(
                10,
                "Pass " + (i + 1) + " complete: element at index " + (n - i - 1) + " (" + a[n - i - 1] + ") is sorted.",
                makeSnapshot(a, ptrs, highlights)
            );
            stepPassEnd.events.add(TraceEvent.highlight(new int[]{n - i - 1}, "sorted"));
        }

        // Final step: mark all remaining as sorted
        for (int k = 0; k < n; k++) {
            highlights.put(String.valueOf(k), "sorted");
        }
        ptrs.clear();
        TraceStep finalStep = tb.addStep(12, "Bubble sort finished. Array is fully sorted!", makeSnapshot(a, ptrs, highlights));
        finalStep.events.add(TraceEvent.highlight(range(0, n - 1), "sorted"));

        tb.setSummary("comparisons", comparisons);
        tb.setSummary("swaps", swaps);
        tb.setSummary("completed", true);

        return tb.build();
    }

    private static Map<String, Object> makeSnapshot(int[] a, Map<String, Object> ptrs, Map<String, String> highlights) {
        Map<String, Object> map = new HashMap<>();
        map.put("values", toList(a));
        map.put("pointers", new HashMap<>(ptrs));
        map.put("highlights", new HashMap<>(highlights));
        return map;
    }

    private static List<Integer> toList(int[] a) {
        List<Integer> list = new ArrayList<>(a.length);
        for (int val : a) list.add(val);
        return list;
    }

    private static int[] range(int start, int end) {
        if (end < start) return new int[0];
        int[] r = new int[end - start + 1];
        for (int i = 0; i < r.length; i++) r[i] = start + i;
        return r;
    }
}
