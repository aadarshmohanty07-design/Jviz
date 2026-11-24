package algorithms;

import core.Trace;
import core.TraceBuilder;
import core.TraceEvent;
import core.TraceStep;
import java.util.*;

/**
 * Merge Sort algorithm implementation.
 * Divides array into halves, recursively sorts them, and merges the sorted halves.
 */
public class MergeSort {

    public static final String[] SOURCE_CODE = new String[] {
        "public void mergeSort(int[] a, int l, int r) {",     // Line 1
        "    if (l < r) {",                                    // Line 2
        "        int m = l + (r - l) / 2;",                    // Line 3
        "        mergeSort(a, l, m);",                         // Line 4
        "        mergeSort(a, m + 1, r);",                     // Line 5
        "        merge(a, l, m, r);",                          // Line 6
        "    }",                                               // Line 7
        "}",                                                   // Line 8
        "private void merge(int[] a, int l, int m, int r) {",  // Line 9
        "    int[] temp = new int[r - l + 1];",                // Line 10
        "    int i = l, j = m + 1, k = 0;",                    // Line 11
        "    while (i <= m && j <= r)",                        // Line 12
        "        temp[k++] = (a[i] <= a[j]) ? a[i++] : a[j++];",// Line 13
        "    while (i <= m) temp[k++] = a[i++];",              // Line 14
        "    while (j <= r) temp[k++] = a[j++];",              // Line 15
        "    for (k = 0; k < temp.length; k++) a[l + k] = temp[k];", // Line 16
        "}"                                                    // Line 17
    };

    public static Trace run(int[] input) {
        if (input == null || input.length == 0) input = new int[]{38, 27, 43, 3, 9, 82, 10};
        int[] a = input.clone();
        int n = a.length;

        TraceBuilder tb = new TraceBuilder("algorithm", "mergeSort", "Merge Sort", "array", "O(n log n)", "O(n)");
        tb.setSourceCode(SOURCE_CODE);
        tb.setInitialState("array", toList(a));

        Map<String, Object> ptrs = new HashMap<>();
        Map<String, String> highlights = new HashMap<>();

        tb.addStep(2, "Array initialized with " + n + " elements.", makeSnapshot(a, ptrs, highlights));

        int[] metrics = new int[]{0, 0}; // [comparisons, merges]
        mergeSortRec(a, 0, n - 1, tb, ptrs, highlights, metrics);

        for (int k = 0; k < n; k++) highlights.put(String.valueOf(k), "sorted");
        ptrs.clear();
        TraceStep sEnd = tb.addStep(8, "Merge Sort completed! Array fully sorted.", makeSnapshot(a, ptrs, highlights));
        sEnd.events.add(TraceEvent.highlight(range(0, n - 1), "sorted"));

        tb.setSummary("comparisons", metrics[0]);
        tb.setSummary("merges", metrics[1]);
        tb.setSummary("completed", true);

        return tb.build();
    }

    private static void mergeSortRec(int[] a, int l, int r, TraceBuilder tb, Map<String, Object> ptrs, Map<String, String> highlights, int[] metrics) {
        if (l < r) {
            int m = l + (r - l) / 2;
            ptrs.put("l", l);
            ptrs.put("m", m);
            ptrs.put("r", r);

            TraceStep sSplit = tb.addStep(3, "Subarray [" + l + ".." + r + "] divided at midpoint m = " + m, makeSnapshot(a, ptrs, highlights));
            sSplit.events.add(TraceEvent.pointer("set", "l", l, "#047857"));
            sSplit.events.add(TraceEvent.pointer("set", "m", m, "#d97706"));
            sSplit.events.add(TraceEvent.pointer("set", "r", r, "#0284c7"));

            mergeSortRec(a, l, m, tb, ptrs, highlights, metrics);
            mergeSortRec(a, m + 1, r, tb, ptrs, highlights, metrics);
            merge(a, l, m, r, tb, ptrs, highlights, metrics);
        }
    }

    private static void merge(int[] a, int l, int m, int r, TraceBuilder tb, Map<String, Object> ptrs, Map<String, String> highlights, int[] metrics) {
        metrics[1]++;
        int[] temp = new int[r - l + 1];
        int i = l, j = m + 1, k = 0;

        for (int idx = l; idx <= r; idx++) highlights.put(String.valueOf(idx), "active");
        ptrs.put("i", i);
        ptrs.put("j", j);

        TraceStep sMergeStart = tb.addStep(9, "Merging sorted subarrays [" + l + ".." + m + "] and [" + (m + 1) + ".." + r + "]", makeSnapshot(a, ptrs, highlights));

        while (i <= m && j <= r) {
            metrics[0]++;
            ptrs.put("i", i);
            ptrs.put("j", j);
            boolean takeLeft = a[i] <= a[j];

            TraceStep sComp = tb.addStep(12, "Comparing a[i=" + i + "] (" + a[i] + ") and a[j=" + j + "] (" + a[j] + ")", makeSnapshot(a, ptrs, highlights));
            sComp.events.add(TraceEvent.compare(i, j, takeLeft, a[i] + (takeLeft ? " <= " : " > ") + a[j]));

            if (takeLeft) {
                temp[k++] = a[i++];
            } else {
                temp[k++] = a[j++];
            }
        }

        while (i <= m) temp[k++] = a[i++];
        while (j <= r) temp[k++] = a[j++];

        // Copy back to original array
        for (int p = 0; p < temp.length; p++) {
            a[l + p] = temp[p];
            highlights.put(String.valueOf(l + p), "sorted");
        }

        TraceStep sMerged = tb.addStep(16, "Subarray [" + l + ".." + r + "] merged in sorted order.", makeSnapshot(a, ptrs, highlights));
        sMerged.events.add(TraceEvent.highlight(range(l, r), "sorted"));
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
