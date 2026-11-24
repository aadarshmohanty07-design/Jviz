package algorithms;

import core.Trace;
import core.TraceBuilder;
import core.TraceEvent;
import core.TraceStep;
import java.util.*;

/**
 * Insertion Sort algorithm implementation.
 * Iteratively inserts each element into its proper position within the sorted prefix.
 */
public class InsertionSort {

    public static final String[] SOURCE_CODE = new String[] {
        "public void insertionSort(int[] a) {",               // Line 1
        "    int n = a.length;",                               // Line 2
        "    for (int i = 1; i < n; i++) {",                   // Line 3
        "        int key = a[i];",                             // Line 4
        "        int j = i - 1;",                              // Line 5
        "        while (j >= 0 && a[j] > key) {",              // Line 6
        "            a[j + 1] = a[j];",                        // Line 7
        "            j = j - 1;",                              // Line 8
        "        }",                                           // Line 9
        "        a[j + 1] = key;",                             // Line 10
        "    }",                                               // Line 11
        "}"                                                    // Line 12
    };

    public static Trace run(int[] input) {
        if (input == null || input.length == 0) input = new int[]{12, 11, 13, 5, 6};
        int[] a = input.clone();
        int n = a.length;

        TraceBuilder tb = new TraceBuilder("algorithm", "insertionSort", "Insertion Sort", "array", "O(n²)", "O(1)");
        tb.setSourceCode(SOURCE_CODE);
        tb.setInitialState("array", toList(a));

        int comparisons = 0;
        int shifts = 0;

        Map<String, Object> ptrs = new HashMap<>();
        Map<String, String> highlights = new HashMap<>();
        highlights.put("0", "sorted");

        TraceStep s0 = tb.addStep(2, "Array initialized. First element a[0] is trivially sorted.", makeSnapshot(a, ptrs, highlights));
        s0.events.add(TraceEvent.highlight(new int[]{0}, "sorted"));

        for (int i = 1; i < n; i++) {
            int key = a[i];
            int j = i - 1;
            ptrs.put("i", i);
            ptrs.put("key", key);
            ptrs.put("j", j);

            TraceStep sPick = tb.addStep(4, "Picked key = " + key + " at index " + i + " to insert into sorted prefix.", makeSnapshot(a, ptrs, highlights));
            sPick.events.add(TraceEvent.pointer("set", "key", i, "#d97706"));

            while (j >= 0) {
                comparisons++;
                highlights.put(String.valueOf(j), "active");
                boolean needsShift = a[j] > key;

                TraceStep sComp = tb.addStep(6, "Comparing prefix element a[" + j + "] (" + a[j] + ") > key (" + key + ")", makeSnapshot(a, ptrs, highlights));
                sComp.events.add(TraceEvent.compare(j, j + 1, needsShift, a[j] + (needsShift ? " > " : " <= ") + key));

                highlights.remove(String.valueOf(j));

                if (!needsShift) {
                    break;
                }

                shifts++;
                a[j + 1] = a[j];
                TraceStep sShift = tb.addStep(7, "Shifted a[" + j + "] (" + a[j] + ") to index " + (j + 1), makeSnapshot(a, ptrs, highlights));
                sShift.events.add(TraceEvent.move(j, j + 1, a[j], "Shift element right"));

                j--;
                ptrs.put("j", j);
            }

            a[j + 1] = key;
            for (int k = 0; k <= i; k++) highlights.put(String.valueOf(k), "sorted");

            TraceStep sPlace = tb.addStep(10, "Inserted key (" + key + ") at index " + (j + 1), makeSnapshot(a, ptrs, highlights));
            sPlace.events.add(TraceEvent.insert(j + 1, key, null, "Inserted key"));
        }

        ptrs.clear();
        TraceStep sEnd = tb.addStep(12, "Insertion Sort finished! Prefix expanded to full array.", makeSnapshot(a, ptrs, highlights));
        sEnd.events.add(TraceEvent.highlight(range(0, n - 1), "sorted"));

        tb.setSummary("comparisons", comparisons);
        tb.setSummary("shifts", shifts);
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
