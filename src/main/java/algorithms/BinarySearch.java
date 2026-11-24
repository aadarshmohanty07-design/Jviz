package algorithms;

import core.Trace;
import core.TraceBuilder;
import core.TraceEvent;
import core.TraceStep;
import java.util.*;

/**
 * Binary Search algorithm implementation.
 * Searches a sorted array by repeatedly dividing the search interval in half.
 */
public class BinarySearch {

    public static final String[] SOURCE_CODE = new String[] {
        "public int binarySearch(int[] a, int target) {",     // Line 1
        "    int low = 0, high = a.length - 1;",               // Line 2
        "    while (low <= high) {",                           // Line 3
        "        int mid = low + (high - low) / 2;",           // Line 4
        "        if (a[mid] == target)",                       // Line 5
        "            return mid; // Target found",             // Line 6
        "        if (a[mid] < target)",                        // Line 7
        "            low = mid + 1; // Search right half",     // Line 8
        "        else",                                        // Line 9
        "            high = mid - 1; // Search left half",     // Line 10
        "    }",                                               // Line 11
        "    return -1; // Target not found",                  // Line 12
        "}"                                                    // Line 13
    };

    public static Trace run(int[] input, int target) {
        if (input == null || input.length == 0) input = new int[]{3, 9, 14, 19, 27, 33, 42, 58};
        int[] a = input.clone();
        Arrays.sort(a); // Ensure sorted
        int n = a.length;

        TraceBuilder tb = new TraceBuilder("algorithm", "binarySearch", "Binary Search", "array", "O(log n)", "O(1)");
        tb.setSourceCode(SOURCE_CODE);
        tb.setInitialState("array", toList(a));

        Map<String, Object> ptrs = new HashMap<>();
        Map<String, String> highlights = new HashMap<>();

        int low = 0;
        int high = n - 1;
        ptrs.put("low", low);
        ptrs.put("high", high);

        TraceStep s0 = tb.addStep(2, "Array sorted. Search window initialized to [low=0 .. high=" + high + "] for target = " + target, makeSnapshot(a, ptrs, highlights));
        s0.events.add(TraceEvent.pointer("set", "low", low, "#047857"));
        s0.events.add(TraceEvent.pointer("set", "high", high, "#0284c7"));

        int comparisons = 0;
        int foundIndex = -1;

        while (low <= high) {
            int mid = low + (high - low) / 2;
            ptrs.put("low", low);
            ptrs.put("high", high);
            ptrs.put("mid", mid);
            highlights.put(String.valueOf(mid), "active");

            comparisons++;
            TraceStep sMid = tb.addStep(4, "Calculated midpoint mid = " + mid + " (a[mid] = " + a[mid] + ")", makeSnapshot(a, ptrs, highlights));
            sMid.events.add(TraceEvent.pointer("set", "mid", mid, "#d97706"));

            if (a[mid] == target) {
                foundIndex = mid;
                highlights.put(String.valueOf(mid), "sorted");
                TraceStep sFound = tb.addStep(6, "Target " + target + " matches element at index " + mid + "!", makeSnapshot(a, ptrs, highlights));
                sFound.events.add(TraceEvent.highlight(new int[]{mid}, "sorted"));
                break;
            } else if (a[mid] < target) {
                comparisons++;
                // Discard left half
                for (int k = low; k <= mid; k++) highlights.put(String.valueOf(k), "discarded");
                TraceStep sRight = tb.addStep(8, "a[mid=" + mid + "] (" + a[mid] + ") < " + target + ". Discarding left half; updating low = " + (mid + 1), makeSnapshot(a, ptrs, highlights));
                low = mid + 1;
            } else {
                comparisons++;
                // Discard right half
                for (int k = mid; k <= high; k++) highlights.put(String.valueOf(k), "discarded");
                TraceStep sLeft = tb.addStep(10, "a[mid=" + mid + "] (" + a[mid] + ") > " + target + ". Discarding right half; updating high = " + (mid - 1), makeSnapshot(a, ptrs, highlights));
                high = mid - 1;
            }
            highlights.remove(String.valueOf(mid));
        }

        if (foundIndex == -1) {
            TraceStep sNotFound = tb.addStep(12, "Search interval empty (low > high). Target " + target + " does not exist in array.", makeSnapshot(a, ptrs, highlights));
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
