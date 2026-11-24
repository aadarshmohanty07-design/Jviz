package algorithms;

import core.Trace;
import core.TraceBuilder;
import core.TraceEvent;
import core.TraceStep;
import java.util.*;

/**
 * Linear Search algorithm implementation.
 * Sequentially checks each element of the list until a match is found or the whole list has been searched.
 */
public class LinearSearch {

    public static final String[] SOURCE_CODE = new String[] {
        "public int linearSearch(int[] a, int target) {",     // Line 1
        "    int n = a.length;",                               // Line 2
        "    for (int i = 0; i < n; i++) {",                   // Line 3
        "        if (a[i] == target) {",                       // Line 4
        "            return i; // Found target",               // Line 5
        "        }",                                           // Line 6
        "    }",                                               // Line 7
        "    return -1; // Not found",                         // Line 8
        "}"                                                    // Line 9
    };

    public static Trace run(int[] input, int target) {
        if (input == null || input.length == 0) input = new int[]{15, 8, 42, 4, 16, 23};
        int[] a = input.clone();
        int n = a.length;

        TraceBuilder tb = new TraceBuilder("algorithm", "linearSearch", "Linear Search", "array", "O(n)", "O(1)");
        tb.setSourceCode(SOURCE_CODE);
        tb.setInitialState("array", toList(a));

        Map<String, Object> ptrs = new HashMap<>();
        Map<String, String> highlights = new HashMap<>();

        TraceStep s0 = tb.addStep(2, "Searching for target = " + target + " across " + n + " elements.", makeSnapshot(a, ptrs, highlights));

        int comparisons = 0;
        int foundIndex = -1;

        for (int i = 0; i < n; i++) {
            comparisons++;
            ptrs.put("i", i);
            highlights.put(String.valueOf(i), "active");

            boolean matches = (a[i] == target);

            TraceStep sCheck = tb.addStep(4, "Checking a[i=" + i + "] (" + a[i] + ") == target (" + target + ")", makeSnapshot(a, ptrs, highlights));
            sCheck.events.add(TraceEvent.pointer("set", "i", i, "#059669"));
            sCheck.events.add(TraceEvent.compare(i, -1, matches, a[i] + (matches ? " == " : " != ") + target));

            if (matches) {
                foundIndex = i;
                highlights.put(String.valueOf(i), "sorted");
                TraceStep sFound = tb.addStep(5, "Target " + target + " found at index " + i + "!", makeSnapshot(a, ptrs, highlights));
                sFound.events.add(TraceEvent.highlight(new int[]{i}, "sorted"));
                break;
            } else {
                highlights.put(String.valueOf(i), "visited");
            }
        }

        if (foundIndex == -1) {
            TraceStep sNotFound = tb.addStep(8, "Target " + target + " was not found in array.", makeSnapshot(a, ptrs, highlights));
        }

        tb.setSummary("comparisons", comparisons);
        tb.setSummary("foundIndex", foundIndex);
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
}
