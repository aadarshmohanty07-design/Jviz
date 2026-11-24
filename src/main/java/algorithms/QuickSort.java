package algorithms;

import core.Trace;
import core.TraceBuilder;
import core.TraceEvent;
import core.TraceStep;
import java.util.*;

/**
 * Quick Sort algorithm implementation.
 * Chooses a pivot element and partitions the array such that elements smaller than
 * the pivot go left, and greater go right, then recursively sorts partitions.
 */
public class QuickSort {

    public static final String[] SOURCE_CODE = new String[] {
        "public void quickSort(int[] a, int low, int high) {",   // Line 1
        "    if (low < high) {",                                 // Line 2
        "        int pi = partition(a, low, high);",             // Line 3
        "        quickSort(a, low, pi - 1);",                    // Line 4
        "        quickSort(a, pi + 1, high);",                   // Line 5
        "    }",                                                 // Line 6
        "}",                                                     // Line 7
        "private int partition(int[] a, int low, int high) {",   // Line 8
        "    int pivot = a[high];",                              // Line 9
        "    int i = low - 1;",                                  // Line 10
        "    for (int j = low; j < high; j++) {",                // Line 11
        "        if (a[j] < pivot) {",                           // Line 12
        "            i++;",                                      // Line 13
        "            swap(a, i, j);",                            // Line 14
        "        }",                                             // Line 15
        "    }",                                                 // Line 16
        "    swap(a, i + 1, high);",                             // Line 17
        "    return i + 1;",                                     // Line 18
        "}"                                                      // Line 19
    };

    public static Trace run(int[] input) {
        if (input == null || input.length == 0) input = new int[]{10, 80, 30, 90, 40, 50, 70};
        int[] a = input.clone();
        int n = a.length;

        TraceBuilder tb = new TraceBuilder("algorithm", "quickSort", "Quick Sort", "array", "O(n log n)", "O(log n)");
        tb.setSourceCode(SOURCE_CODE);
        tb.setInitialState("array", toList(a));

        Map<String, Object> ptrs = new HashMap<>();
        Map<String, String> highlights = new HashMap<>();

        tb.addStep(2, "Array initialized with " + n + " elements.", makeSnapshot(a, ptrs, highlights));

        int[] metrics = new int[]{0, 0}; // [comparisons, swaps]
        quickSortRec(a, 0, n - 1, tb, ptrs, highlights, metrics);

        for (int k = 0; k < n; k++) highlights.put(String.valueOf(k), "sorted");
        ptrs.clear();
        TraceStep sEnd = tb.addStep(7, "Quick Sort finished! All partitions sorted.", makeSnapshot(a, ptrs, highlights));
        sEnd.events.add(TraceEvent.highlight(range(0, n - 1), "sorted"));

        tb.setSummary("comparisons", metrics[0]);
        tb.setSummary("swaps", metrics[1]);
        tb.setSummary("completed", true);

        return tb.build();
    }

    private static void quickSortRec(int[] a, int low, int high, TraceBuilder tb, Map<String, Object> ptrs, Map<String, String> highlights, int[] metrics) {
        if (low < high) {
            ptrs.put("low", low);
            ptrs.put("high", high);
            TraceStep sRange = tb.addStep(2, "Processing partition range [" + low + ".." + high + "]", makeSnapshot(a, ptrs, highlights));
            sRange.events.add(TraceEvent.pointer("set", "low", low, "#047857"));
            sRange.events.add(TraceEvent.pointer("set", "high", high, "#0284c7"));

            int pi = partition(a, low, high, tb, ptrs, highlights, metrics);
            highlights.put(String.valueOf(pi), "sorted");

            quickSortRec(a, low, pi - 1, tb, ptrs, highlights, metrics);
            quickSortRec(a, pi + 1, high, tb, ptrs, highlights, metrics);
        } else if (low == high) {
            highlights.put(String.valueOf(low), "sorted");
        }
    }

    private static int partition(int[] a, int low, int high, TraceBuilder tb, Map<String, Object> ptrs, Map<String, String> highlights, int[] metrics) {
        int pivot = a[high];
        ptrs.put("pivot", high);
        int i = low - 1;

        TraceStep sPivot = tb.addStep(9, "Selected pivot = " + pivot + " at index " + high, makeSnapshot(a, ptrs, highlights));
        sPivot.events.add(TraceEvent.pointer("set", "pivot", high, "#d97706"));

        for (int j = low; j < high; j++) {
            ptrs.put("j", j);
            if (i >= low) ptrs.put("i", i);
            highlights.put(String.valueOf(j), "active");

            metrics[0]++;
            boolean isSmaller = a[j] < pivot;

            TraceStep sComp = tb.addStep(12, "Comparing a[j=" + j + "] (" + a[j] + ") < pivot (" + pivot + ")", makeSnapshot(a, ptrs, highlights));
            sComp.events.add(TraceEvent.compare(j, high, isSmaller, a[j] + (isSmaller ? " < " : " >= ") + pivot));

            highlights.remove(String.valueOf(j));

            if (isSmaller) {
                i++;
                ptrs.put("i", i);
                metrics[1]++;
                int temp = a[i];
                a[i] = a[j];
                a[j] = temp;

                TraceStep sSwap = tb.addStep(14, "Swapped a[i=" + i + "] and a[j=" + j + "]: " + a[j] + " <-> " + a[i], makeSnapshot(a, ptrs, highlights));
                sSwap.events.add(TraceEvent.swap(i, j, a[i], a[j], "Swap smaller element"));
            }
        }

        metrics[1]++;
        int temp = a[i + 1];
        a[i + 1] = a[high];
        a[high] = temp;

        ptrs.put("pivot", i + 1);
        TraceStep sPivotPlaced = tb.addStep(17, "Placed pivot " + pivot + " into final sorted index " + (i + 1), makeSnapshot(a, ptrs, highlights));
        sPivotPlaced.events.add(TraceEvent.swap(i + 1, high, a[i + 1], a[high], "Place pivot"));

        return i + 1;
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
