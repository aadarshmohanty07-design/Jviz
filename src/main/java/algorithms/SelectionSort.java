package algorithms;

import core.Trace;
import core.TraceBuilder;
import core.TraceEvent;
import core.TraceStep;
import java.util.*;

/**
 * Selection Sort algorithm implementation.
 * Divides the input list into a sorted sublist at the front and an unsorted sublist.
 * Repeatedly finds the minimum element from the unsorted sublist and swaps it into place.
 */
public class SelectionSort {

    public static final String[] SOURCE_CODE = new String[] {
        "public void selectionSort(int[] a) {",                 // Line 1
        "    int n = a.length;",                                 // Line 2
        "    for (int i = 0; i < n - 1; i++) {",                 // Line 3
        "        int minIdx = i;",                               // Line 4
        "        for (int j = i + 1; j < n; j++) {",             // Line 5
        "            if (a[j] < a[minIdx]) {",                   // Line 6
        "                minIdx = j;",                           // Line 7
        "            }",                                         // Line 8
        "        }",                                             // Line 9
        "        if (minIdx != i) {",                            // Line 10
        "            int temp = a[i];",                          // Line 11
        "            a[i] = a[minIdx];",                         // Line 12
        "            a[minIdx] = temp;",                         // Line 13
        "        }",                                             // Line 14
        "    }",                                                 // Line 15
        "}"                                                      // Line 16
    };

    public static Trace run(int[] input) {
        if (input == null || input.length == 0) input = new int[]{29, 10, 14, 37, 13};
        int[] a = input.clone();
        int n = a.length;

        TraceBuilder tb = new TraceBuilder("algorithm", "selectionSort", "Selection Sort", "array", "O(n²)", "O(1)");
        tb.setSourceCode(SOURCE_CODE);
        tb.setInitialState("array", toList(a));

        int comparisons = 0;
        int swaps = 0;

        Map<String, Object> ptrs = new HashMap<>();
        Map<String, String> highlights = new HashMap<>();

        TraceStep s0 = tb.addStep(2, "Array initialized with " + n + " elements.", makeSnapshot(a, ptrs, highlights));
        s0.events.add(TraceEvent.highlight(range(0, n - 1), "default"));

        for (int i = 0; i < n - 1; i++) {
            int minIdx = i;
            ptrs.put("i", i);
            ptrs.put("min", minIdx);
            ptrs.remove("j");

            TraceStep sPass = tb.addStep(4, "Pass " + (i + 1) + ": Assume minimum is at index " + i + " (" + a[i] + ")", makeSnapshot(a, ptrs, highlights));
            sPass.events.add(TraceEvent.pointer("set", "i", i, "#047857"));
            sPass.events.add(TraceEvent.pointer("set", "min", minIdx, "#d97706"));

            for (int j = i + 1; j < n; j++) {
                ptrs.put("j", j);
                highlights.put(String.valueOf(j), "active");
                highlights.put(String.valueOf(minIdx), "active");

                comparisons++;
                boolean isSmaller = a[j] < a[minIdx];

                TraceStep sComp = tb.addStep(6, "Comparing a[j=" + j + "] (" + a[j] + ") with current min a[" + minIdx + "] (" + a[minIdx] + ")", makeSnapshot(a, ptrs, highlights));
                sComp.events.add(TraceEvent.pointer("set", "j", j, "#059669"));
                sComp.events.add(TraceEvent.compare(j, minIdx, isSmaller, a[j] + (isSmaller ? " < " : " >= ") + a[minIdx]));

                if (isSmaller) {
                    minIdx = j;
                    ptrs.put("min", minIdx);
                    TraceStep sNewMin = tb.addStep(7, "New minimum found at index " + minIdx + " (" + a[minIdx] + ")", makeSnapshot(a, ptrs, highlights));
                    sNewMin.events.add(TraceEvent.pointer("set", "min", minIdx, "#d97706"));
                }

                highlights.remove(String.valueOf(j));
                highlights.remove(String.valueOf(minIdx));
            }

            if (minIdx != i) {
                swaps++;
                int temp = a[i];
                a[i] = a[minIdx];
                a[minIdx] = temp;

                TraceStep sSwap = tb.addStep(12, "Swapping a[" + i + "] with min a[" + minIdx + "]: " + a[minIdx] + " <-> " + a[i], makeSnapshot(a, ptrs, highlights));
                sSwap.events.add(TraceEvent.swap(i, minIdx, a[i], a[minIdx], "Swap into sorted position"));
            }

            highlights.put(String.valueOf(i), "sorted");
            TraceStep sSorted = tb.addStep(14, "Element at index " + i + " (" + a[i] + ") is now in its sorted position.", makeSnapshot(a, ptrs, highlights));
            sSorted.events.add(TraceEvent.highlight(new int[]{i}, "sorted"));
        }

        highlights.put(String.valueOf(n - 1), "sorted");
        ptrs.clear();
        TraceStep sEnd = tb.addStep(16, "Selection Sort complete! All elements sorted.", makeSnapshot(a, ptrs, highlights));
        sEnd.events.add(TraceEvent.highlight(range(0, n - 1), "sorted"));

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
        for (int v : a) list.add(v);
        return list;
    }

    private static int[] range(int s, int e) {
        if (e < s) return new int[0];
        int[] r = new int[e - s + 1];
        for (int i = 0; i < r.length; i++) r[i] = s + i;
        return r;
    }
}
